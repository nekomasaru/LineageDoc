/**
 * BlockNoteEditorPane.tsx
 * 
 * BlockNote (WYSIWYG) エディタコンポーネント
 * mode === 'rich' の時のみ表示される
 * スラッシュコマンドは日本語化済み
 * 
 * @skill editor-comp-blocknote
 */

'use client';

import { useEffect, useRef, useCallback, useState, useMemo, useImperativeHandle } from 'react';
import dynamic from 'next/dynamic';
import { useDebouncedCallback } from 'use-debounce';
import { useEditorStore } from '@/stores/editorStore';
import { useAppStore } from '@/stores/appStore';
import {
    registerBlockNoteEditor,
    unregisterBlockNoteEditor
} from '@/lib/editor/editorSync';
import { translateSlashMenuItems, filterJapaneseSlashMenuItems } from '@/lib/blockNote/japaneseSlashMenu';
import { useCreateBlockNote, SuggestionMenuController, getDefaultReactSlashMenuItems } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import {
    Sparkles,
    Zap,
    Type,
    MessageSquare,
    FileText,
    BrainCircuit,
    CheckSquare,
    LineChart,
    AlertCircle,
    Layout
} from 'lucide-react';

// CSSは global.css で一括読み込みに変更

export interface BlockNoteEditorHandle {
    focusBlockByContent: (content: string, occurrenceIndex?: number) => void;
    replaceSelection: (text: string) => void;
}

interface BlockNoteEditorPaneProps {
    className?: string;
    /** 上書き表示するコンテンツ（履歴閲覧用・編集不可になる） */
    overrideContent?: string;
    /** 変更時のコールバック */
    onChange?: (markdown: string) => void;
    /** エディタ操作用ハンドルを受け取るRef */
    handleRef?: React.Ref<BlockNoteEditorHandle>;
    /** AIメンショントリガー */
    onAiMention?: (action?: string) => void;
    /** 明示的に渡すMarkdown（ストアのmarkdownを直接参照するのをやめ、このpropを優先する） */
    markdown?: string;
}

// ローディング用コンポーネント
function BlockNoteLoading() {
    return (
        <div className="h-full flex items-center justify-center bg-slate-50">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-slate-400">エディタを読み込み中...</p>
            </div>
        </div>
    );
}

/**
 * 内部エディタコンポーネント
 */
function BlockNoteEditorInner({ className = '', overrideContent, onChange, handleRef, onAiMention, markdown: propsMarkdown }: BlockNoteEditorPaneProps) {
    const { markdown: storeMarkdown, mode, setMarkdown } = useEditorStore();

    // エディタインスタンスを作成
    const editor = useCreateBlockNote();

    // 優先順位: 1. overrideContent (履歴閲覧) 2. propsMarkdown (明示的渡し) 3. storeMarkdown (全量)
    const markdownValue = overrideContent !== undefined ? overrideContent : (propsMarkdown !== undefined ? propsMarkdown : storeMarkdown);
    const isReadOnly = overrideContent !== undefined;

    // 初期化フラグ
    const isInitializedRef = useRef(false);
    // 内部更新フラグ（ユーザー操作による更新中）
    const isInternalUpdateRef = useRef(false);
    // 外部更新フラグ（ストアからの同期中）
    const isRemoteUpdateRef = useRef(false);
    // 同期中ステート
    const [isSyncing, setIsSyncing] = useState(false);
    // 最後のMarkdown値
    const lastMarkdownRef = useRef(markdownValue);

    // ハンドル機能の提供
    useImperativeHandle(handleRef, () => ({
        focusBlockByContent: (targetContent: string, occurrenceIndex: number = 0) => {
            console.log('[BlockNote] focusBlockByContent requested:', targetContent, 'occurrence:', occurrenceIndex);
            if (!editor) return;

            const normalize = (s: string) => s.trim().replace(/\s+/g, ' ');
            const target = normalize(targetContent);
            if (!target) return;

            // 全てのブロックをフラットに取得・検索するためのコンテキスト
            const state = { count: 0 };

            const findBlockRecursively = (blocks: any[]): any | null => {
                for (const block of blocks) {
                    let blockText = '';
                    if (Array.isArray(block.content)) {
                        blockText = block.content.map((c: any) => c.text).join('');
                    } else if (typeof block.content === 'string') {
                        blockText = block.content;
                    }

                    const normalizedBlock = normalize(blockText);

                    // 1. まず現在のブロックが対象を含んでいるか
                    if (normalizedBlock && (normalizedBlock.includes(target) || target.includes(normalizedBlock))) {
                        if (state.count === occurrenceIndex) {
                            return block;
                        }
                        state.count++;
                    }

                    // 2. 子要素を再帰的に検索
                    if (block.children && block.children.length > 0) {
                        const found = findBlockRecursively(block.children);
                        if (found) return found;
                    }
                }
                return null;
            };

            const targetBlock = findBlockRecursively(editor.document);

            if (targetBlock) {
                console.log('[BlockNote] Found target block:', targetBlock.id);
                // 選択位置のみセットし、フォーカスは強制しない
                editor.setTextCursorPosition(targetBlock, 'end');

                setTimeout(() => {
                    const blockElem = (
                        document.querySelector(`[data-id="${targetBlock.id}"]`) ||
                        document.querySelector(`[data-block-id="${targetBlock.id}"]`) ||
                        document.querySelector(`[id="${targetBlock.id}"]`)
                    ) as HTMLElement;

                    if (blockElem) {
                        blockElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 100);
            } else {
                console.warn('[BlockNote] Could not find block data for content:', targetContent);
            }
        },
        replaceSelection: (text: string) => {
            if (editor) {
                const selection = editor.getSelection();
                if (selection && selection.blocks.length > 0) {
                    editor.updateBlock(selection.blocks[0], {
                        content: text
                    });
                    if (selection.blocks.length > 1) {
                        editor.removeBlocks(selection.blocks.slice(1));
                    }
                } else {
                    // Fallback: Insert at the end of the document
                    editor.insertBlocks(
                        [{ content: text }],
                        editor.document[editor.document.length - 1],
                        "after"
                    );
                }
            }
        }
    }), [editor]);

    // 読み取り専用・同期中の制御
    useEffect(() => {
        if (editor) {
            editor.isEditable = !isReadOnly && !isSyncing;
        }
    }, [editor, isReadOnly, isSyncing]);

    // 同期システムへの登録
    useEffect(() => {
        if (editor) registerBlockNoteEditor(editor);
        return () => unregisterBlockNoteEditor();
    }, [editor]);

    // AI Assistant Selection Sync
    useEffect(() => {
        if (!editor || isReadOnly) return;

        const handleSelectionChange = () => {
            const selection = editor.getSelection();
            const nativeSelection = window.getSelection();

            if (selection && selection.blocks.length > 0 && nativeSelection && !nativeSelection.isCollapsed) {
                // Get selected text from blocks
                const selectedText = selection.blocks
                    .map((block: any) => {
                        if (Array.isArray(block.content)) {
                            return block.content.map((c: any) => c.text).join('');
                        }
                        return typeof block.content === 'string' ? block.content : '';
                    })
                    .join('\n');

                if (selectedText.trim()) {
                    useAppStore.getState().setAiContext({
                        selectedText: selectedText.trim(),
                        source: 'blocknote',
                        range: selection
                    });

                    // Calculate tooltip position using native selection
                    const range = nativeSelection.getRangeAt(0);
                    const rect = range.getBoundingClientRect();

                    if (rect.width > 0) {
                        useAppStore.getState().setAiSelectionTooltip({
                            isVisible: true,
                            x: rect.left + rect.width / 2,
                            y: rect.top
                        });
                    }
                }
            } else {
                // Hide tooltip if selection is empty or collapsed
                useAppStore.getState().setAiSelectionTooltip({ isVisible: false });
            }
        };

        const unsubscribe = editor.onSelectionChange(handleSelectionChange);
        return () => unsubscribe();
    }, [editor, isReadOnly]);

    // Markdownへの変換（デバウンス）
    const debouncedUpdate = useDebouncedCallback(
        async () => {
            if (!editor || isReadOnly || isRemoteUpdateRef.current || isSyncing) return;
            isInternalUpdateRef.current = true;
            try {
                const { blocksToMarkdown } = await import('@/lib/editor/blocksToMarkdown');
                const md = await blocksToMarkdown(editor.document, editor);
                lastMarkdownRef.current = md;
                if (onChange) onChange(md);
                else setMarkdown(md);
            } catch (error) {
                console.error('[BlockNote] Failed to convert blocks:', error);
            }
            isInternalUpdateRef.current = false;
        },
        500
    );

    // ストアからの内容同期
    useEffect(() => {
        if (!editor) return;

        const syncContent = async () => {
            if (isInternalUpdateRef.current) return;
            if (markdownValue === lastMarkdownRef.current && isInitializedRef.current) return;

            debouncedUpdate.cancel();
            isRemoteUpdateRef.current = true;
            setIsSyncing(true);

            try {
                const { markdownToBlocks } = await import('@/lib/editor/markdownToBlocks');
                const blocks = await markdownToBlocks(markdownValue, editor);
                editor.replaceBlocks(editor.document, blocks);
                isInitializedRef.current = true;
                lastMarkdownRef.current = markdownValue;
            } catch (error) {
                console.error('[BlockNote] Failed to sync content:', error);
            } finally {
                setTimeout(() => {
                    isRemoteUpdateRef.current = false;
                    setIsSyncing(false);
                }, 100);
            }
        };

        syncContent();
        return () => debouncedUpdate.cancel();
    }, [editor, markdownValue, debouncedUpdate]);

    // 変更検知
    const handleChange = useCallback(() => {
        if (isReadOnly || isSyncing) return;
        debouncedUpdate();
    }, [debouncedUpdate, isReadOnly, isSyncing]);

    // スラッシュメニュー項目（日本語化）
    const getJapaneseSlashMenuItems = useCallback(
        async (query: string) => {
            const defaultItems = getDefaultReactSlashMenuItems(editor);
            const japaneseItems = translateSlashMenuItems(defaultItems);
            return filterJapaneseSlashMenuItems(japaneseItems, query);
        },
        [editor]
    );

    // @メンションメニュー項目
    const getMentionMenuItems = useCallback(
        async (query: string) => {
            const aiItems = [
                {
                    title: "LineaDoc AI エージェント",
                    onItemClick: () => onAiMention?.(),
                    aliases: ["ai", "gpt", "linea", "agent"],
                    group: "AI",
                    icon: <div className="w-5 h-5 bg-purple-100 text-purple-600 rounded flex items-center justify-center font-bold text-xs">AI</div>,
                    subtext: "AIに指示を出してブランチを作成"
                },
                {
                    title: "要約する (/summarize)",
                    onItemClick: () => onAiMention?.('summarize'),
                    aliases: ["summarize", "yo"],
                    group: "AI - 編集",
                    icon: <Sparkles size={16} className="text-indigo-500" />,
                    subtext: "選択範囲の要点を整理"
                },
                {
                    title: "公用文磨き上げ (/formal)",
                    onItemClick: () => onAiMention?.('official_polish'),
                    aliases: ["formal", "official"],
                    group: "AI - 編集",
                    icon: <Zap size={16} className="text-purple-500" />,
                    subtext: "公用文書ルールに基づき磨き上げ"
                },
                {
                    title: "やさしい日本語 (/plain)",
                    onItemClick: () => onAiMention?.('plainJapanese'),
                    aliases: ["plain", "easy"],
                    group: "AI - 編集",
                    icon: <Type size={16} className="text-orange-500" />,
                    subtext: "市民にわかりやすい言葉に変換"
                },
                {
                    title: "答弁案作成 (/qa)",
                    onItemClick: () => onAiMention?.('qa'),
                    aliases: ["qa", "faq"],
                    group: "AI - 生成",
                    icon: <MessageSquare size={16} className="text-blue-500" />,
                    subtext: "資料から想定問答集を作成"
                },
                {
                    title: "通知・案内案 (/notice)",
                    onItemClick: () => onAiMention?.('notice_draft'),
                    aliases: ["notice", "mail"],
                    group: "AI - 生成",
                    icon: <FileText size={16} className="text-blue-600" />,
                    subtext: "標準的な公文書形式でドラフト生成"
                },
                {
                    title: "構成案作成 (/outline)",
                    onItemClick: () => onAiMention?.('outline_draft'),
                    aliases: ["outline", "draft"],
                    group: "AI - 生成",
                    icon: <BrainCircuit size={16} className="text-indigo-600" />,
                    subtext: "施策やプロジェクトの骨子を作成"
                },
                {
                    title: "アジェンダ作成 (/agenda)",
                    onItemClick: () => onAiMention?.('agenda_draft'),
                    aliases: ["agenda", "meeting"],
                    group: "AI - 生成",
                    icon: <Layout size={16} className="text-emerald-500" />,
                    subtext: "会議の次第やアジェンダを生成"
                },
                {
                    title: "ToDo抽出 (/todo)",
                    onItemClick: () => onAiMention?.('todo_extract'),
                    aliases: ["todo", "task"],
                    group: "AI - 分析",
                    icon: <CheckSquare size={16} className="text-slate-500" />,
                    subtext: "今後の対応事項をリスト化"
                },
                {
                    title: "論点・要点整理 (/points)",
                    onItemClick: () => onAiMention?.('points_extract'),
                    aliases: ["points", "key"],
                    group: "AI - 分析",
                    icon: <LineChart size={16} className="text-slate-500" />,
                    subtext: "重要な論点を箇条書きで抽出"
                },
                {
                    title: "論理チェック (/consistency)",
                    onItemClick: () => onAiMention?.('consistency_check'),
                    aliases: ["consistency", "check"],
                    group: "AI - 分析",
                    icon: <AlertCircle size={16} className="text-red-500" />,
                    subtext: "全体の矛盾や齟齬をチェック"
                }
            ];
            return aiItems.filter((item) =>
                item.title.toLowerCase().includes(query.toLowerCase()) ||
                item.aliases.some(a => a.toLowerCase().includes(query.toLowerCase()))
            );
        },
        [onAiMention]
    );

    if (mode !== 'rich') return null;

    return (
        <div className={`h-full w-full overflow-auto relative ${className} ${isReadOnly ? 'bg-slate-50' : ''}`}>
            {isSyncing && !isReadOnly && (
                <div className="absolute inset-0 bg-white/50 z-20 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                </div>
            )}
            <BlockNoteView
                editor={editor}
                onChange={handleChange}
                theme="light"
                className="min-h-full"
                slashMenu={false}
            >
                {!isReadOnly && !isSyncing && (
                    <SuggestionMenuController
                        triggerCharacter="/"
                        getItems={getJapaneseSlashMenuItems}
                    />
                )}
                {!isReadOnly && !isSyncing && (
                    <SuggestionMenuController
                        triggerCharacter="@"
                        getItems={getMentionMenuItems}
                    />
                )}
            </BlockNoteView>
        </div>
    );
}

/**
 * SSR非対応のためdynamicインポートでエクスポート
 */
export const BlockNoteEditorPane = dynamic(
    () => Promise.resolve(BlockNoteEditorInner),
    {
        ssr: false,
        loading: () => <BlockNoteLoading />,
    }
);
