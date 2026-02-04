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
import { Group as PanelGroup, Panel, Separator } from 'react-resizable-panels';
import { ResizeHandle } from '@/components/_shared/ResizeHandle';
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
    /** AIメンショントリガー */
    onAiMention?: () => void;
    /** 比較対象のラベル (例: "Comparing with v2") */
    compareLabel?: string;
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
    onAiMention,
    compareLabel,
}: SplitEditorLayoutProps) {
    console.log('[SplitEditorLayout] compareLabel:', compareLabel);
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

    // ズームロジック一時停止 (ライブラリバージョン不整合のため)
    // const [isEditorZoomed, setIsEditorZoomed] = useState(false);
    // const [isQualityZoomed, setIsQualityZoomed] = useState(false);
    // const editorPanelRef = useRef<any>(null);
    // const qualityPanelRef = useRef<any>(null);

    // Zoom toggles removed for now

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

            {/* メインエリアと品質パネルを垂直方向に分割 */}
            <PanelGroup orientation="vertical" className="flex-1 overflow-hidden">
                <Panel
                    defaultSize={80}
                    minSize={20}
                    className="flex flex-col relative overflow-hidden"
                >
                    {/* エディタズームボタン (Richモード時など) - 一時非表示 */}
                    {/* <div className="absolute right-4 top-2 z-10 opacity-0 hover:opacity-100 transition-opacity">...</div> */}

                    <div className="flex-1 flex overflow-hidden">
                        {mode === 'rich' ? (
                            // リッチモード: BlockNoteエディタのみ（全画面）
                            <div className="flex-1 bg-white">
                                <BlockNoteEditorPane
                                    key={editorKey}
                                    handleRef={blockNoteRef}
                                    className="h-full"
                                    overrideContent={isReadOnly ? effectiveContent : undefined}
                                    onChange={handleEditorChange}
                                    onAiMention={onAiMention}
                                />
                            </div>
                        ) : (
                            // コードモード: Monaco + プレビュー（左右分割）
                            <PanelGroup orientation="horizontal" className="flex-1 overflow-hidden">
                                <Panel
                                    defaultSize={50}
                                    minSize={10}
                                    className={`
                                        border-r border-slate-200 bg-white relative
                                        ${mobileView === 'editor' ? 'flex-1' : 'hidden md:block'}
                                    `}
                                >
                                    <MonacoWrapper
                                        key={editorKey}
                                        ref={monacoRef}
                                        value={monacoValue}
                                        onChange={isReadOnly ? () => { } : handleMonacoChange}
                                        onSave={handleInternalSave}
                                        compareWith={compareWith}
                                        activeBase={savedMarkdown}
                                        readOnly={isReadOnly}
                                        issues={issues}
                                        onAiMention={onAiMention}
                                    />
                                    {compareLabel && (
                                        <div className="absolute top-2 right-4 z-50 px-2 py-1 bg-cyan-100 text-cyan-800 text-xs rounded border border-cyan-200 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
                                            {compareLabel}
                                        </div>
                                    )}
                                </Panel>

                                <Separator className="hidden md:flex w-2 -ml-1 z-50 bg-transparent hover:bg-cyan-400 transition-colors cursor-col-resize group items-center justify-center">
                                    <div className="w-px h-8 bg-slate-300 group-hover:bg-cyan-100 transition-colors" />
                                </Separator>

                                <Panel
                                    defaultSize={50}
                                    minSize={10}
                                    className={`
                                        bg-slate-100
                                        ${mobileView === 'preview' ? 'flex-1' : 'hidden md:block'}
                                    `}
                                >
                                    <PreviewPane content={effectiveContent} />
                                </Panel>
                            </PanelGroup>
                        )}
                    </div>
                </Panel>

                <ResizeHandle direction="vertical" />

                <Panel
                    defaultSize={20}
                    minSize={3.5} // 1行(h-8)分を残せる最小サイズ
                    className="bg-white flex flex-col"
                >
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <QualityPanel
                            onIssueClick={(issue) => {
                                // ... (既存のクリック処理)
                                if (mode === 'code') {
                                    if (monacoRef.current && typeof issue.line === 'number') {
                                        monacoRef.current.moveCursorTo(issue.line);
                                    }
                                } else {
                                    // Rich (BlockNote): 行の内容を取得して検索・移動
                                    if (blockNoteRef.current && fullMarkdown && typeof issue.line === 'number') {
                                        const lines = fullMarkdown.split('\n');
                                        const targetLineIndex = issue.line - 1;
                                        if (targetLineIndex >= 0 && targetLineIndex < lines.length) {
                                            const lineContent = lines[targetLineIndex];
                                            if (lineContent.trim()) blockNoteRef.current.focusBlockByContent(lineContent);
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </Panel>
            </PanelGroup >
        </div >
    );
}
