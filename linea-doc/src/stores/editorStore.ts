/**
 * editorStore.ts
 * 
 * エディタ状態管理ストア（Zustand）
 * Markdown本文と編集モード（WYSIWYG/Code）を管理する
 * 
 * @skill editor-state-store
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * 編集モード
 * - 'rich': BlockNote (WYSIWYG)
 * - 'code': Monaco Editor
 */
export type EditorMode = 'rich' | 'code';

/**
 * エディタストアの状態インターフェース
 */
interface EditorState {
    // ===== 状態 =====
    /** 現在のMarkdown本文 */
    markdown: string;
    /** 編集モード */
    mode: EditorMode;
    /** 未保存の変更があるか */
    isDirty: boolean;
    /** 最後に保存した日時 */
    lastSavedAt: Date | null;
    /** 保存済みのMarkdown（差分比較用） */
    savedMarkdown: string;

    // ===== アクション =====
    /** Markdown本文を更新 */
    setMarkdown: (markdown: string) => void;
    /** 編集モードを切り替え */
    setMode: (mode: EditorMode) => void;
    /** 保存完了をマーク */
    markAsSaved: () => void;
    /** 新規ドキュメントとして初期化 */
    resetDocument: (initialContent?: string) => void;
    /** ドキュメントを読み込み */
    loadDocument: (content: string) => void;
}

/**
 * デフォルトのMarkdown内容
 */
const DEFAULT_MARKDOWN = `# 見出し1

ここに文書を入力してください。

## 見出し2

本文テキスト...
`;

/**
 * エディタストア
 * 
 * 使用例:
 * ```tsx
 * const { markdown, setMarkdown, mode, setMode } = useEditorStore();
 * ```
 */
export const useEditorStore = create<EditorState>()(
    devtools(
        (set, get) => ({
            // ===== 初期状態 =====
            markdown: DEFAULT_MARKDOWN,
            mode: 'rich',
            isDirty: false,
            lastSavedAt: null,
            savedMarkdown: DEFAULT_MARKDOWN,

            // ===== アクション =====

            /**
             * Markdown本文を更新
             * savedMarkdownとの差分でisDirtyを判定
             */
            setMarkdown: (markdown) => {
                const { savedMarkdown } = get();
                set({
                    markdown,
                    isDirty: markdown !== savedMarkdown,
                });
            },

            /**
             * 編集モードを切り替え
             */
            setMode: (mode) => {
                set({ mode });
            },

            /**
             * 保存完了をマーク
             * savedMarkdownを更新し、isDirtyをfalseに
             */
            markAsSaved: () => {
                const { markdown } = get();
                set({
                    savedMarkdown: markdown,
                    isDirty: false,
                    lastSavedAt: new Date(),
                });
            },

            /**
             * 新規ドキュメントとして初期化
             */
            resetDocument: (initialContent = DEFAULT_MARKDOWN) => {
                set({
                    markdown: initialContent,
                    savedMarkdown: initialContent,
                    isDirty: false,
                    lastSavedAt: null,
                    mode: 'rich',
                });
            },

            /**
             * ドキュメントを読み込み
             * 読み込み直後はdirty状態にしない
             */
            loadDocument: (content: string) => {
                set({
                    markdown: content,
                    savedMarkdown: content,
                    isDirty: false,
                    mode: 'rich',
                });
            },
        }),
        { name: 'editor-store' }
    )
);

/**
 * セレクタヘルパー（パフォーマンス最適化用）
 */
export const selectMarkdown = (state: EditorState) => state.markdown;
export const selectMode = (state: EditorState) => state.mode;
export const selectIsDirty = (state: EditorState) => state.isDirty;
