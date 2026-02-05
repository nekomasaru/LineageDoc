/**
 * SplitEditorLayout.tsx
 * 
 * エディタモードに応じてレイアウトを切り替える
 * - Rich モード: BlockNoteエディタのみ（全画面）
 * - Code モード: Monaco + リアルタイムプレビュー（左右分割）
 * 
 * 縦方向のスペースを最大化するため、品質チェックパネルはRightContextPanelへ移動。
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
import { PreviewPane } from '../preview/PreviewPane';
import { useQualityStore } from '@/stores/qualityStore';
import matter from 'gray-matter';
import yaml from 'js-yaml';
import { useDebounce } from 'use-debounce';
import { useAppStore } from '@/stores/appStore';
import { useDocumentStore } from '@/stores/documentStore';
import { useProjectStore } from '@/stores/projectStore';
import { Project, Team } from '@/lib/types';

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
    onAiMention?: (action?: string) => void;
    /** 比較対象のラベル (例: "Comparing with v2") */
    compareLabel?: string;
    /** ブランチ作成モードフラグ */
    isBranching?: boolean;
    /** 選択中の履歴が最新かどうか */
    isLatestHistory?: boolean;
    /** AI提案の反映 */
    onApplyAiContent?: (content: string) => void;
}

export interface SplitEditorLayoutHandle {
    applyAiContent: (content: string) => void;
}

/**
 * モバイル表示のタブ種別
 */
type MobileView = 'editor' | 'preview';

import { forwardRef, useImperativeHandle } from 'react';

export const SplitEditorLayout = forwardRef<SplitEditorLayoutHandle, SplitEditorLayoutProps>(({
    className = '',
    compareWith,
    savedMarkdown,
    overrideContent,
    onSave,
    editorKey,
    onAiMention,
    compareLabel,
    isBranching = false,
    isLatestHistory = true,
    onApplyAiContent,
}, ref) => {
    const { markdown, mode, setMarkdown } = useEditorStore();
    const { aiContext } = useAppStore();

    useImperativeHandle(ref, () => ({
        applyAiContent: (content: string) => {
            if (mode === 'code' && monacoRef.current) {
                monacoRef.current.replaceSelection(content);
            } else if (mode === 'rich' && blockNoteRef.current) {
                blockNoteRef.current.replaceSelection(content);
            }
        }
    }));
    const [mobileView, setMobileView] = useState<MobileView>('editor');
    const [targetLine, setTargetLine] = useState<number | undefined>(undefined);
    const monacoRef = useRef<MonacoWrapperHandle>(null);
    const blockNoteRef = useRef<BlockNoteEditorHandle>(null);

    // overrideContentがある場合はそれを使用、なければストアのmarkdown
    const fullMarkdown = overrideContent !== undefined ? overrideContent : markdown;
    // 履歴閲覧中(overrideContentあり)でも、ブランチ作成中なら編集可能にする
    const isReadOnly = overrideContent !== undefined && !isBranching;

    // バナーを表示するかどうか: 履歴閲覧中 かつ 最新ではない場合
    const showReadOnlyBanner = isReadOnly && !isLatestHistory;

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

    // 比較用ベースからもFrontmatterを剥がす
    const effectiveCompareWith = useMemo(() => {
        if (!compareWith) return undefined;
        try {
            return matter(compareWith).content;
        } catch {
            return compareWith;
        }
    }, [compareWith]);

    const effectiveSavedMarkdown = useMemo(() => {
        if (!savedMarkdown) return undefined;
        try {
            return matter(savedMarkdown).content;
        } catch {
            return savedMarkdown;
        }
    }, [savedMarkdown]);

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

    // Monacoからのスクロール/カーソル移動通知を受け取る
    const handleMonacoVisibleLineChange = useCallback((line: number) => {
        setTargetLine(line);
    }, []);

    // 品質チェックの自動実行 (デバウンス処理)
    const { runValidation, issues, highlightedIssue } = useQualityStore();
    const [debouncedMarkdown] = useDebounce(markdown, 2000);

    const { currentDocumentId } = useAppStore();
    const { documents } = useDocumentStore();
    const currentDoc = useMemo(() => documents.find(d => d.id === currentDocumentId), [documents, currentDocumentId]);

    const { teams, projects } = useProjectStore();

    useEffect(() => {
        if (!isReadOnly && currentDoc) {
            // Get Hierarchical Governance Settings
            const project = projects.find((p: Project) => p.id === currentDoc.projectId);
            const team = project ? teams.find((t: Team) => t.id === project.teamId) : null;

            // Merge Logic: Team < Project < Document
            const mdSchema = currentDoc.mdSchema || project?.governance?.mdSchema || team?.governance?.mdSchema;

            const textlintConfig = {
                ...team?.governance?.textlintConfig,
                ...project?.governance?.textlintConfig,
                ...currentDoc.textlintConfig
            };

            const customDictionary = [
                ...(team?.governance?.customDictionary || []),
                ...(project?.governance?.customDictionary || []),
                ...(currentDoc.attributes?.customDictionary || []) // Backwards compatibility or doc-specific
            ];

            try {
                const { data } = matter(debouncedMarkdown);
                runValidation(debouncedMarkdown, data, mdSchema, textlintConfig, customDictionary);
            } catch (e) {
                runValidation(debouncedMarkdown, {}, mdSchema, textlintConfig, customDictionary);
            }
        }
    }, [debouncedMarkdown, isReadOnly, runValidation, currentDoc, teams, projects]);

    // ナビゲーション処理（QualityPanelからのジャンプ）
    useEffect(() => {
        if (highlightedIssue && highlightedIssue.line) {
            if (mode === 'code') {
                if (monacoRef.current) {
                    monacoRef.current.moveCursorTo(highlightedIssue.line);
                }
            } else {
                // Rich (BlockNote): 行の内容を取得して検索・移動
                if (blockNoteRef.current && fullMarkdown) {
                    const lines = fullMarkdown.split('\n');
                    const targetLineIndex = highlightedIssue.line - 1;
                    if (targetLineIndex >= 0 && targetLineIndex < lines.length) {
                        const lineContent = lines[targetLineIndex];
                        if (lineContent.trim()) {
                            // 同一内容がその行より前に何回出現したかを数える（重複対応）
                            const occurrences = lines.slice(0, targetLineIndex)
                                .filter(l => l.trim() === lineContent.trim()).length;
                            blockNoteRef.current.focusBlockByContent(lineContent, occurrences);
                        } else {
                            // 空行の場合は、直前の空でない行を探して移動（付近を表示するため）
                            for (let i = targetLineIndex - 1; i >= 0; i--) {
                                if (lines[i].trim()) {
                                    const occurrences = lines.slice(0, i)
                                        .filter(l => l.trim() === lines[i].trim()).length;
                                    blockNoteRef.current.focusBlockByContent(lines[i], occurrences);
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }
    }, [highlightedIssue, mode, fullMarkdown]);


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

            {/* コードモード用のモバイルタブ */}
            {mode === 'code' && (
                <div className="md:hidden flex border-b border-slate-200 bg-white shrink-0">
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

            {/* メインエリア（全画面） - 垂直分割を廃止して最大化 */}
            <div className="flex-1 flex flex-col overflow-hidden relative bg-white">
                {showReadOnlyBanner && (
                    <div className="bg-yellow-50 flex items-center justify-center px-4 py-1.5 text-[10px] text-yellow-700 border-b border-yellow-100 z-50 shrink-0">
                        <span className="font-bold mr-1 tracking-tighter">過去のバージョンを閲覧中</span>
                        <span>（編集不可）</span>
                    </div>
                )}
                <div className="flex-1 overflow-hidden relative flex">
                    {mode === 'rich' ? (
                        // リッチモード: BlockNoteエディタのみ（全画面）
                        <div className="flex-1 overflow-hidden h-full relative">
                            <BlockNoteEditorPane
                                key={editorKey}
                                handleRef={blockNoteRef}
                                className="h-full"
                                markdown={effectiveContent}
                                overrideContent={isReadOnly ? effectiveContent : undefined}
                                onChange={handleEditorChange}
                                onAiMention={onAiMention}
                            />
                        </div>
                    ) : (
                        // コードモード: Monaco + プレビュー（左右分割）
                        <PanelGroup orientation="horizontal" className="flex-1 h-full overflow-hidden">
                            <Panel
                                defaultSize="50"
                                minSize="10"
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
                                    onVisibleLineChange={handleMonacoVisibleLineChange}
                                    onSave={handleInternalSave}
                                    compareWith={effectiveCompareWith}
                                    activeBase={effectiveSavedMarkdown}
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
                                defaultSize="50"
                                minSize="10"
                                className={`
                                bg-slate-100
                                ${mobileView === 'preview' ? 'flex-1' : 'hidden md:block'}
                            `}
                            >
                                <PreviewPane
                                    content={effectiveContent}
                                    targetLine={targetLine}
                                />
                            </Panel>
                        </PanelGroup>
                    )}
                </div>
            </div>
        </div>
    );
});
