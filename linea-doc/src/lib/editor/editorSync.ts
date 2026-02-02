/**
 * editorSync.ts
 * 
 * モード切替時のデータ同期処理
 * BlockNote ↔ Monaco 間でデータを確実に受け渡す
 * 
 * @skill editor-sync-handler
 */

import { useEditorStore } from '@/stores/editorStore';
import { blocksToMarkdown } from './blocksToMarkdown';

// BlockNoteエディタインスタンスへの参照（グローバル）
let blockNoteEditorRef: any = null;

/**
 * BlockNoteエディタインスタンスを登録する
 * BlockNoteEditorPane の初期化時に呼び出す
 */
export function registerBlockNoteEditor(editor: any): void {
    blockNoteEditorRef = editor;
    console.log('[Sync] BlockNote editor registered');
}

/**
 * BlockNoteエディタインスタンスの登録を解除する
 * BlockNoteEditorPane のアンマウント時に呼び出す
 */
export function unregisterBlockNoteEditor(): void {
    blockNoteEditorRef = null;
    console.log('[Sync] BlockNote editor unregistered');
}

/**
 * BlockNoteエディタインスタンスを取得する
 */
export function getBlockNoteEditor(): any {
    return blockNoteEditorRef;
}

/**
 * モード切替前の同期処理
 * 現在のモードのエディタからデータを取得し、ストアを更新する
 * 
 * @returns 同期成功したかどうか
 * 
 * @example
 * ```tsx
 * const success = await syncBeforeModeChange();
 * if (success) {
 *   setMode('code');
 * }
 * ```
 */
export async function syncBeforeModeChange(): Promise<boolean> {
    const { mode } = useEditorStore.getState();

    if (mode === 'rich' && blockNoteEditorRef) {
        // 読み取り専用（履歴閲覧中など）の場合は同期をスキップ
        // BlockNoteEditorPaneで isEditable = !isReadOnly と設定されている
        if (blockNoteEditorRef.isEditable === false) {
            console.log('[Sync] Skipped: BlockNote is read-only');
            return true;
        }

        // Rich → Code: BlockNoteの内容をMarkdownに変換
        try {
            const blocks = blockNoteEditorRef.document;
            const markdown = await blocksToMarkdown(blocks, blockNoteEditorRef);
            useEditorStore.getState().setMarkdown(markdown);
            console.log('[Sync] Rich → Code: Markdown synced');
            return true;
        } catch (error) {
            console.error('[Sync] Failed to sync from BlockNote:', error);
            return false;
        }
    }

    // Code → Rich の場合:
    // Monacoは常にストアと同期しているため、追加処理は不要
    // BlockNoteEditorPane の useEffect でストアのmarkdownを読み取る
    console.log('[Sync] Code → Rich: No sync needed (store is source of truth)');
    return true;
}

/**
 * 強制的にBlockNoteの内容をストアに同期する
 * 保存前などに使用
 */
export async function forceSync(): Promise<boolean> {
    const { mode } = useEditorStore.getState();

    if (mode === 'rich' && blockNoteEditorRef) {
        try {
            const blocks = blockNoteEditorRef.document;
            const markdown = await blocksToMarkdown(blocks, blockNoteEditorRef);
            useEditorStore.getState().setMarkdown(markdown);
            return true;
        } catch (error) {
            console.error('[Sync] Force sync failed:', error);
            return false;
        }
    }

    return true;
}
