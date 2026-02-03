/**
 * SplitEditorLayout.tsx
 * 
 * エディタモードに応じてレイアウトを切り替える
 * - Rich モード: BlockNoteエディタのみ（全画面）
 * - Code モード: Monaco + リアルタイムプレビュー（左右分割）
 * 
 * Monaco側では既存のDiff表示・自動採番機能を維持
 * 
 * @skill preview-ui-split
 */

'use client';

import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { Eye, Edit3 } from 'lucide-react';
import { useEditorStore } from '@/stores/editorStore';
import { MonacoWrapper, MonacoWrapperHandle } from './MonacoWrapper';
import { BlockNoteEditorPane, BlockNoteEditorHandle } from './BlockNoteEditorPane';
import { EditorModeSwitcher } from './EditorModeSwitcher';
import { PreviewPane } from '../preview/PreviewPane';
import { QualityPanel } from '../quality/QualityPanel';
import { useQualityStore } from '@/stores/qualityStore';
import matter from 'gray-matter';
import yaml from 'js-yaml';
import { useDebounce } from 'use-debounce';

interface SplitEditorLayoutProps {
    className?: string;
    /** 保存済みの比較対象 (履歴比較: 青追加/赤削除) */
    compareWith?: string;
    /** 最後に保存した内容 (編集中比較: 緑変更) */
    savedMarkdown?: string;
    /** 上書き表示するコンテンツ（履歴閲覧用） */
    overrideContent?: string;
    /** 保存時のコールバック */
    onSave?: () => void;
    /** エディタの強制再マウント用キー (履歴IDなどを渡す) */
    editorKey?: string;
}

/**
 * モバイル表示のタブ種別
 */
type MobileView = 'editor' | 'preview';

export function SplitEditorLayout({
    className = '',
    compareWith,
    savedMarkdown,
    overrideContent,
    onSave,
    editorKey,
}: SplitEditorLayoutProps) {
    const { markdown, mode, setMarkdown } = useEditorStore();
    const [mobileView, setMobileView] = useState<MobileView>('editor');
    const monacoRef = useRef<MonacoWrapperHandle>(null);
    const blockNoteRef = useRef<BlockNoteEditorHandle>(null);

    // overrideContentがある合はそれを使用、なければストアのmarkdown
    const fullMarkdown = overrideContent !== undefined ? overrideContent : markdown;
    const isReadOnly = overrideContent !== undefined;

    // Frontmatterと本文を分離する
    const { data: frontmatter, content: body } = useMemo(() => {
        try {
            return matter(fullMarkdown);
        } catch (e) {
            console.error('[SplitEditorLayout] Parse error:', e);
            return { data: {}, content: fullMarkdown };
        }
    }, [fullMarkdown]);

    // エディタに渡すのは本文（body）のみ
    const effectiveContent = body;

    // Monaco用の表示値: 履歴閲覧時はバックスラッシュの表示ズレを補正する
    const monacoValue = useMemo(() => {
        if (isReadOnly && effectiveContent) {
            return effectiveContent.replace(/\\\\/g, '\\');
        }
        return effectiveContent;
    }, [effectiveContent, isReadOnly]);

    // エディタの変更をMarkdown全量に変換して保存する
    const handleEditorChange = useCallback((newBody: string) => {
        if (isReadOnly) return;

        try {
            // エディタからの入力(newBody)に万が一YAMLが含まれていても、ここで再度ストリップする
            const { content: cleanBody } = matter(newBody);

            // 現在のメタデータを反映（YAML形式にダンプ）
            let newMarkdown = '';
            if (Object.keys(frontmatter).length > 0) {
                const yamlStr = yaml.dump(frontmatter);
                newMarkdown = `---\n${yamlStr}---\n${cleanBody}`;
            } else {
                newMarkdown = cleanBody;
            }

            if (newMarkdown !== markdown) {
                setMarkdown(newMarkdown);
            }
        } catch (e) {
            console.error('[SplitEditorLayout] Recombine error:', e);
            setMarkdown(newBody);
        }
    }, [frontmatter, isReadOnly, markdown, setMarkdown]);

    // Monaco用のonChange
    const handleMonacoChange = (value: string) => {
        handleEditorChange(value);
    };

    // 品質チェックの自動実行 (デバウンス処理)
    const { runValidation, issues } = useQualityStore();
    const [debouncedMarkdown] = useDebounce(markdown, 2000);

    useEffect(() => {
        if (!isReadOnly) {
            try {
                const { data } = matter(debouncedMarkdown);
                runValidation(debouncedMarkdown, data);
            } catch (e) {
                // Frontmatterが壊れている場合も、本文のみでチェック
                runValidation(debouncedMarkdown, {});
            }
        }
    }, [debouncedMarkdown, isReadOnly, runValidation]);

    // 保存ハンドラ
    const handleInternalSave = () => {
        if (onSave) {
            onSave();
        } else {
            console.log('[SplitEditorLayout] Save triggered (no handler)');
        }
    };

    return (
        <div className={`flex flex-col h-full ${className}`}>
            {/* ヘッダー: モード切替 */}
            <div className="border-b border-slate-200 bg-white">
                <EditorModeSwitcher />
            </div>

            {/* コードモード用のモバイルタブ */}
            {mode === 'code' && (
                <div className="md:hidden flex border-b border-slate-200 bg-white">
                    <button
                        onClick={() => setMobileView('editor')}
                        className={`
              flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium
              transition-colors duration-150
              ${mobileView === 'editor'
                                ? 'text-cyan-600 border-b-2 border-cyan-600 bg-cyan-50/50'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }
            `}
                    >
                        <Edit3 className="w-4 h-4" />
                        編集
                    </button>
                    <button
                        onClick={() => setMobileView('preview')}
                        className={`
              flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium
              transition-colors duration-150
              ${mobileView === 'preview'
                                ? 'text-cyan-600 border-b-2 border-cyan-600 bg-cyan-50/50'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }
            `}
                    >
                        <Eye className="w-4 h-4" />
                        プレビュー
                    </button>
                </div>
            )}

            {/* メインエリア */}
            <div className="flex-1 flex overflow-hidden">
                {mode === 'rich' ? (
                    // リッチモード: BlockNoteエディタのみ（全画面）
                    // key属性により、ID変更時(履歴切替時)に完全に再作成される
                    <div className="flex-1 bg-white">
                        <BlockNoteEditorPane
                            key={editorKey}
                            handleRef={blockNoteRef}
                            className="h-full"
                            overrideContent={isReadOnly ? effectiveContent : undefined}
                            onChange={handleEditorChange}
                        />
                    </div>
                ) : (
                    // コードモード: Monaco + プレビュー（左右分割）
                    <>
                        {/* Monaco エディタ（Diff表示・自動採番対応） */}
                        <div
                            className={`
                md:w-1/2 md:border-r border-slate-200 bg-white
                ${mobileView === 'editor' ? 'flex-1' : 'hidden md:block'}
              `}
                        >
                            <MonacoWrapper
                                key={editorKey}
                                ref={monacoRef}
                                value={monacoValue} // 補正済みの値を渡す
                                onChange={isReadOnly ? () => { } : handleMonacoChange} // 読み取り専用時は更新を無視
                                onSave={handleInternalSave}
                                compareWith={compareWith}
                                activeBase={savedMarkdown}
                                readOnly={isReadOnly}
                                issues={issues}
                            />
                        </div>

                        {/* プレビュー */}
                        <div
                            className={`
                md:w-1/2 bg-slate-100
                ${mobileView === 'preview' ? 'flex-1' : 'hidden md:block'}
              `}
                        >
                            <PreviewPane content={effectiveContent} /> {/* プレビューは正しいMarkdownとして処理させる */}
                        </div>
                    </>
                )}
            </div>

            {/* 品質パネル (ガバナンス) */}
            <QualityPanel
                onIssueClick={(issue) => {
                    console.log('[SplitEditorLayout] Issue clicked:', issue);
                    if (!issue.line) {
                        console.log('[SplitEditorLayout] Issue has no line number');
                        return;
                    }

                    if (mode === 'code') {
                        // Monaco: 行番号で直接ジャンプ
                        if (monacoRef.current) {
                            monacoRef.current.moveCursorTo(issue.line);
                        }
                    } else {
                        // Rich (BlockNote): 行の内容を取得して検索・移動
                        console.log('[SplitEditorLayout] Mode is rich. blockNoteRef:', blockNoteRef.current);
                        console.log('[SplitEditorLayout] fullMarkdown length:', fullMarkdown?.length);

                        if (blockNoteRef.current && fullMarkdown) {
                            const lines = fullMarkdown.split('\n');
                            const targetLineIndex = issue.line - 1;
                            console.log('[SplitEditorLayout] Target line index:', targetLineIndex);

                            if (targetLineIndex >= 0 && targetLineIndex < lines.length) {
                                const lineContent = lines[targetLineIndex];
                                console.log('[SplitEditorLayout] Line content:', lineContent);

                                // Frontmatterの行などはBlockNoteに存在しないので、
                                // ヒットしない可能性があるが、focusBlockByContent側で無視されるだけなのでOK
                                if (lineContent.trim()) {
                                    blockNoteRef.current.focusBlockByContent(lineContent);
                                } else {
                                    console.log('[SplitEditorLayout] Line content is empty/whitespace');
                                }
                            } else {
                                console.log('[SplitEditorLayout] Target line index out of bounds');
                            }
                        } else {
                            console.warn('[SplitEditorLayout] blockNoteRef or fullMarkdown is missing');
                        }
                    }
                }}
            />
        </div>
    );
}
