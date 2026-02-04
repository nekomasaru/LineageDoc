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
import {
    registerBlockNoteEditor,
    unregisterBlockNoteEditor
} from '@/lib/editor/editorSync';
import { translateSlashMenuItems, filterJapaneseSlashMenuItems } from '@/lib/blockNote/japaneseSlashMenu';
import { useCreateBlockNote, SuggestionMenuController, getDefaultReactSlashMenuItems } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';

// CSSは global.css で一括読み込みに変更

export interface BlockNoteEditorHandle {
    focusBlockByContent: (content: string, occurrenceIndex?: number) => void;
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
    onAiMention?: () => void;
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
function BlockNoteEditorInner({ className = '', overrideContent, onChange, handleRef, onAiMention }: BlockNoteEditorPaneProps) {
    const { markdown, mode, setMarkdown } = useEditorStore();

    // エディタインスタンスを作成
    const editor = useCreateBlockNote();

    // 初期化フラグ
    const isInitializedRef = useRef(false);
    // 内部更新フラグ（ユーザー操作による更新中）
    const isInternalUpdateRef = useRef(false);
    // 外部更新フラグ（ストアからの同期中）
    const isRemoteUpdateRef = useRef(false);
    // 同期中ステート
    const [isSyncing, setIsSyncing] = useState(false);
    // 最後のMarkdown値
    const lastMarkdownRef = useRef(markdown);

    // overrideContentがある合はそれを使用、なければストアのmarkdown
    const fullMarkdown = overrideContent !== undefined ? overrideContent : markdown;
    const isReadOnly = overrideContent !== undefined;

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
                        document.querySelector(`#${targetBlock.id}`)
                    ) as HTMLElement;

                    if (blockElem) {
                        blockElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 100);
            } else {
                console.warn('[BlockNote] Could not find block data for content:', targetContent);
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
            if (markdown === lastMarkdownRef.current && isInitializedRef.current) return;

            debouncedUpdate.cancel();
            isRemoteUpdateRef.current = true;
            setIsSyncing(true);

            try {
                const { markdownToBlocks } = await import('@/lib/editor/markdownToBlocks');
                const blocks = await markdownToBlocks(markdown, editor);
                editor.replaceBlocks(editor.document, blocks);
                isInitializedRef.current = true;
                lastMarkdownRef.current = markdown;
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
    }, [editor, markdown, debouncedUpdate]);

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
            return [
                {
                    title: "AI Assistant",
                    onItemClick: () => onAiMention?.(),
                    aliases: ["ai", "gpt"],
                    group: "AI",
                    icon: <div className="w-5 h-5 bg-purple-100 text-purple-600 rounded flex items-center justify-center font-bold text-xs">AI</div>,
                    subtext: "AIに指示を出してブランチを作成"
                }
            ].filter((item) => item.title.toLowerCase().includes(query.toLowerCase()));
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
