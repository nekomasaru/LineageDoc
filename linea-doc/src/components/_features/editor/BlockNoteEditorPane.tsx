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

import { useEffect, useRef, useCallback, useState, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { useEditorStore } from '@/stores/editorStore';
import {
    registerBlockNoteEditor,
    unregisterBlockNoteEditor
} from '@/lib/editor/editorSync';
import { translateSlashMenuItems, filterJapaneseSlashMenuItems } from '@/lib/blockNote/japaneseSlashMenu';
import matter from 'gray-matter';

// BlockNoteを動的にインポート（SSR回避）
import dynamic from 'next/dynamic';

export interface BlockNoteEditorHandle {
    focusBlockByContent: (content: string) => void;
}

interface BlockNoteEditorPaneProps {
    className?: string;
    /** 上書き表示するコンテンツ（履歴閲覧用・編集不可になる） */
    overrideContent?: string;
    /** 変更時のコールバック */
    onChange?: (markdown: string) => void;
    /** エディタ操作用ハンドルを受け取るRef */
    handleRef?: React.Ref<BlockNoteEditorHandle>;
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

// 実際のエディタコンポーネント（クライアントサイドのみ）
function BlockNoteEditorInner({ className = '', overrideContent, onChange, handleRef }: BlockNoteEditorPaneProps) {
    // BlockNote関連のコンポーネントを動的に保持
    const [BlockNoteComponents, setBlockNoteComponents] = useState<{
        useCreateBlockNote: any;
        BlockNoteView: any;
        SuggestionMenuController: any;
        getDefaultReactSlashMenuItems: any;
    } | null>(null);

    const { markdown, mode, setMarkdown } = useEditorStore();

    // 初期化フラグ
    const isInitializedRef = useRef(false);
    // 内部更新フラグ（ユーザー操作による更新中）
    const isInternalUpdateRef = useRef(false);
    // 外部更新フラグ（ストアからの同期中） - refは非同期コールバック内での判定用
    const isRemoteUpdateRef = useRef(false);
    // 同期中ステート - UI制御（ReadOnly強制）用
    const [isSyncing, setIsSyncing] = useState(false);

    // 最後のMarkdown値
    const lastMarkdownRef = useRef(markdown);
    // エディタインスタンス
    const editorInstanceRef = useRef<any>(null);

    // BlockNoteを動的にロード
    useEffect(() => {
        const loadBlockNote = async () => {
            try {
                const [reactModule, mantineModule] = await Promise.all([
                    import('@blocknote/react'),
                    import('@blocknote/mantine'),
                ]);
                // CSSもインポート
                // @ts-ignore
                await import('@blocknote/mantine/style.css');

                setBlockNoteComponents({
                    useCreateBlockNote: reactModule.useCreateBlockNote,
                    BlockNoteView: mantineModule.BlockNoteView,
                    SuggestionMenuController: reactModule.SuggestionMenuController,
                    getDefaultReactSlashMenuItems: reactModule.getDefaultReactSlashMenuItems,
                });
            } catch (error) {
                console.error('[BlockNote] Failed to load:', error);
            }
        };

        loadBlockNote();
    }, []);

    // overrideContentがある合はそれを使用、なければストアのmarkdown
    const fullMarkdown = overrideContent !== undefined ? overrideContent : markdown;
    const isReadOnly = overrideContent !== undefined;

    // Frontmatterを剥がして本文のみをBlockNoteに渡す
    const bodyContent = useMemo(() => {
        try {
            const { content } = matter(fullMarkdown);
            return content;
        } catch (e) {
            return fullMarkdown;
        }
    }, [fullMarkdown]);

    // Rich モード以外では表示しない
    if (mode !== 'rich') {
        return null;
    }

    // BlockNoteがまだロードされていない場合
    if (!BlockNoteComponents) {
        return <BlockNoteLoading />;
    }


    return (
        <BlockNoteEditorCore
            className={className}
            BlockNoteComponents={BlockNoteComponents}
            markdown={bodyContent}
            setMarkdown={onChange || setMarkdown}
            isInitializedRef={isInitializedRef}
            isInternalUpdateRef={isInternalUpdateRef}
            isRemoteUpdateRef={isRemoteUpdateRef}
            lastMarkdownRef={lastMarkdownRef}
            editorInstanceRef={editorInstanceRef}
            isReadOnly={isReadOnly}
            isSyncing={isSyncing}
            setIsSyncing={setIsSyncing}
            handleRef={handleRef}
        />
    );
}

// SSRを無効にしてエクスポート
function BlockNoteEditorCore({
    className,
    BlockNoteComponents,
    markdown,
    setMarkdown,
    isInitializedRef,
    isInternalUpdateRef,
    isRemoteUpdateRef,
    lastMarkdownRef,
    editorInstanceRef,
    isReadOnly,
    isSyncing,
    setIsSyncing,
    handleRef,
}: {
    className: string;
    BlockNoteComponents: {
        useCreateBlockNote: any;
        BlockNoteView: any;
        SuggestionMenuController: any;
        getDefaultReactSlashMenuItems: any;
    };
    markdown: string;
    setMarkdown: (md: string) => void;
    isInitializedRef: React.MutableRefObject<boolean>;
    isInternalUpdateRef: React.MutableRefObject<boolean>;
    isRemoteUpdateRef: React.MutableRefObject<boolean>;
    lastMarkdownRef: React.MutableRefObject<string>;
    editorInstanceRef: React.MutableRefObject<any>;
    isReadOnly: boolean;
    isSyncing: boolean;
    setIsSyncing: (syncing: boolean) => void;
    handleRef?: React.Ref<BlockNoteEditorHandle>;
}) {
    const {
        useCreateBlockNote,
        BlockNoteView,
        SuggestionMenuController,
        getDefaultReactSlashMenuItems,
    } = BlockNoteComponents;

    // BlockNoteエディタインスタンスを作成
    const editor = useCreateBlockNote({});

    // エディタインスタンスを保存
    useEffect(() => {
        editorInstanceRef.current = editor;
    }, [editor, editorInstanceRef]);

    // テキスト内容からブロックを特定してフォーカスする機能
    useImperativeHandle(handleRef, () => ({
        focusBlockByContent: (targetContent: string) => {
            const editor = editorInstanceRef.current;
            console.log('[BlockNote] focusBlockByContent called with:', targetContent);
            if (!editor) {
                console.warn('[BlockNote] Editor instance not found');
                return;
            }

            // シンプルな正規化（空白除去など）
            const normalize = (s: string) => s.trim().replace(/\s+/g, '');
            const target = normalize(targetContent);

            if (!target) return;

            // 全ブロックを走査
            for (const block of editor.document) {
                // ブロックのテキスト内容を取得
                let blockText = '';
                if (Array.isArray(block.content)) {
                    blockText = block.content.map((c: any) => c.text).join('');
                } else if (typeof block.content === 'string') {
                    blockText = block.content;
                }

                const normalizedBlock = normalize(blockText);

                if (normalizedBlock.length > 0 && normalizedBlock.includes(target)) {
                    console.log('[BlockNote] Match found! Focusing block:', block.id);

                    // 1. カーソルをセット (とりあえず末尾に)
                    editor.setTextCursorPosition(block, 'end');
                    editor.focus();

                    // 2. DOM要素を取得してスクロール (BlockNoteは通常 data-id={block.id} を持つ)
                    setTimeout(() => {
                        const blockElem = document.querySelector(`[data-id="${block.id}"]`) as HTMLElement;
                        if (blockElem) {
                            blockElem.scrollIntoView({ behavior: 'smooth', block: 'center' });

                            // 3. 確実なハイライトのためにオーバーレイを作成して被せる
                            // エディタの再レンダリングに影響されないよう、body直下に配置
                            const rect = blockElem.getBoundingClientRect();
                            const overlay = document.createElement('div');
                            overlay.style.position = 'fixed';
                            overlay.style.top = `${rect.top}px`;
                            overlay.style.left = `${rect.left}px`;
                            overlay.style.width = `${rect.width}px`;
                            overlay.style.height = `${rect.height}px`;
                            overlay.style.backgroundColor = 'rgba(254, 249, 195, 0.5)'; // yellow-100 with opacity
                            overlay.style.pointerEvents = 'none'; // クリック透過
                            overlay.style.zIndex = '9999';
                            overlay.style.transition = 'opacity 1s ease-out';

                            document.body.appendChild(overlay);

                            // フェードアウトして削除
                            setTimeout(() => {
                                overlay.style.opacity = '0';
                                setTimeout(() => {
                                    document.body.removeChild(overlay);
                                }, 1000);
                            }, 1500);

                        } else {
                            console.warn('[BlockNote] DOM element not found for block:', block.id);
                        }
                    }, 100); // エディタのフォーカス処理待ち (少し長めに)

                    break;
                }
            }
        }
    }), [handleRef]);

    // 読み取り専用設定
    // 同期中(isSyncing)も強制的にReadOnlyにする（イベント発火防止）
    useEffect(() => {
        if (editor) {
            editor.isEditable = !isReadOnly && !isSyncing;
        }
    }, [editor, isReadOnly, isSyncing]);

    /**
     * エディタインスタンスを同期システムに登録
     */
    useEffect(() => {
        if (editor) {
            registerBlockNoteEditor(editor);
        }
        return () => {
            unregisterBlockNoteEditor();
        };
    }, [editor]);

    /**
     * エディタ変更時のデバウンスハンドラ
     * ※ useEffect より先に定義して参照できるようにする
     */
    const debouncedUpdate = useDebouncedCallback(
        async () => {
            // 読み取り専用時、または外部からの同期中は更新をストアに反映しない
            if (!editor || isReadOnly || isRemoteUpdateRef.current || isSyncing) return;

            isInternalUpdateRef.current = true;

            try {
                const { blocksToMarkdown } = await import('@/lib/editor/blocksToMarkdown');
                const md = await blocksToMarkdown(editor.document, editor);
                lastMarkdownRef.current = md;
                setMarkdown(md);
            } catch (error) {
                console.error('[BlockNote] Failed to convert blocks:', error);
            }

            isInternalUpdateRef.current = false;
        },
        500
    );

    /**
     * コンテンツの同期（初回ロード または overrideContent/markdownの変更時）
     */
    useEffect(() => {
        if (!editor) return;

        const syncContent = async () => {
            // 内部更新中はスキップ（自分自身の変更による再レンダリング防止）
            if (isInternalUpdateRef.current) return;

            // 内容が同じならスキップ
            // ただし初期化直後は確実に同期させる
            if (markdown === lastMarkdownRef.current && isInitializedRef.current) return;

            // 同期開始前に保留中の更新を破棄
            debouncedUpdate.cancel();

            // 外部からの更新（同期）を開始
            isRemoteUpdateRef.current = true;
            setIsSyncing(true); // ステート更新でReadOnly化

            try {
                const { markdownToBlocks } = await import('@/lib/editor/markdownToBlocks');
                const blocks = await markdownToBlocks(markdown, editor);

                // ブロックを置換（これにより onChange が発火する可能性があるが、ReadOnlyなので防げる）
                editor.replaceBlocks(editor.document, blocks);

                isInitializedRef.current = true;
                lastMarkdownRef.current = markdown;
            } catch (error) {
                console.error('[BlockNote] Failed to sync content:', error);
            } finally {
                // 同期完了後、少し待ってからフラグを解除
                setTimeout(() => {
                    isRemoteUpdateRef.current = false;
                    setIsSyncing(false); // 編集可能に戻す
                }, 100);
            }
        };

        syncContent();

        return () => {
            debouncedUpdate.cancel();
        };
    }, [editor, markdown, isInitializedRef, isInternalUpdateRef, isRemoteUpdateRef, lastMarkdownRef, debouncedUpdate, setIsSyncing]);

    /**
     * エディタ内容変更時のハンドラ
     */
    const handleChange = useCallback(() => {
        // 即時ガード: 読み取り専用や同期中は一切処理しない
        if (isReadOnly || isSyncing) return;

        // 同期中はデバウンスすら不要かもしれないが、念のため呼んでデバウンス内部で弾く
        debouncedUpdate();
    }, [debouncedUpdate, isReadOnly, isSyncing]);

    /**
     * 日本語化されたスラッシュメニュー項目を取得
     */
    const getJapaneseSlashMenuItems = useCallback(
        async (query: string) => {
            const defaultItems = getDefaultReactSlashMenuItems(editor);
            const japaneseItems = translateSlashMenuItems(defaultItems);
            return filterJapaneseSlashMenuItems(japaneseItems, query);
        },
        [editor, getDefaultReactSlashMenuItems]
    );

    return (
        <div className={`h-full w-full overflow-auto ${className} ${isReadOnly ? 'bg-slate-50' : ''}`}>
            {isReadOnly && (
                <div className="sticky top-0 left-0 right-0 bg-yellow-100 px-4 py-2 text-xs text-yellow-800 border-b border-yellow-200 z-10 flex items-center justify-center">
                    過去のバージョンを表示中（読み取り専用）
                </div>
            )}
            {/* ローディング表示（同期中も表示して操作を防ぐ） */}
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
            </BlockNoteView>
        </div>
    );
}

// SSRを無効にしてエクスポート
// SSRを無効にしてエクスポート
export const BlockNoteEditorPane = dynamic(
    () => Promise.resolve(BlockNoteEditorInner),
    {
        ssr: false,
        loading: () => <BlockNoteLoading />,
    }
);
