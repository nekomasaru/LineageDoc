---
name: editor-sync-handler
description: モード切替時に最新のMarkdownを再パース・再描画する同期処理を実装する。
allowed-tools: [file_edit]
meta:
  domain: frontend
  role: data-sync
  tech_stack: zustand, "@blocknote/core"
  day: 3
  estimated_time: 50min
  dependencies: [editor-ui-switcher]
---

# このスキルでやること

モード切替（Rich ↔ Code）時に、現在のエディタの内容を確実にMarkdown文字列として同期し、切替先のエディタに正しく反映する処理を実装する。

# 設計思想

## なぜ同期処理が必要か

```
[Rich モード]                    [Code モード]
  BlockNote                        Monaco
     ↓                               ↓
  Blocks (JSON)                  Markdown (string)
     ↓                               ↓
     └─────── editorStore.markdown ───┘
                    ↑
               Single Source of Truth
```

**問題**: BlockNoteはBlocks形式で状態を持つ。Monacoに切り替える前に、Blocksを Markdownに変換してストアを更新する必要がある。

**解決**: モード切替時に必ず `syncBeforeModeChange()` を呼び、データを同期。

# 作成するファイル

## `src/lib/editor/editorSync.ts`

```typescript
import { useEditorStore } from '@/stores/editorStore';
import { blocksToMarkdown } from './blocksToMarkdown';
import { markdownToBlocks } from './markdownToBlocks';

// BlockNoteエディタインスタンスへの参照（グローバル）
let blockNoteEditorRef: any = null;

/**
 * BlockNoteエディタインスタンスを登録する
 * BlockNoteEditorPane の初期化時に呼び出す
 */
export function registerBlockNoteEditor(editor: any) {
  blockNoteEditorRef = editor;
}

/**
 * BlockNoteエディタインスタンスの登録を解除する
 * BlockNoteEditorPane のアンマウント時に呼び出す
 */
export function unregisterBlockNoteEditor() {
  blockNoteEditorRef = null;
}

/**
 * モード切替前の同期処理
 * 現在のモードのエディタからデータを取得し、ストアを更新する
 */
export async function syncBeforeModeChange(): Promise<void> {
  const { mode } = useEditorStore.getState();
  
  if (mode === 'rich' && blockNoteEditorRef) {
    // Rich → Code: BlockNoteの内容をMarkdownに変換
    try {
      const blocks = blockNoteEditorRef.document;
      const markdown = await blocksToMarkdown(blocks, blockNoteEditorRef);
      useEditorStore.getState().setMarkdown(markdown);
      console.log('[Sync] Rich → Code: Markdown synced');
    } catch (error) {
      console.error('[Sync] Failed to sync from BlockNote:', error);
    }
  }
  
  // Code → Rich の場合:
  // Monacoは常にストアと同期しているため、追加処理は不要
  // BlockNoteEditorPane の useEffect でストアのmarkdownを読み取る
}

/**
 * モード切替後の処理（必要に応じて）
 * 切替先のエディタにフォーカスを当てるなど
 */
export function onModeChanged(newMode: 'rich' | 'code'): void {
  console.log(`[Sync] Mode changed to: ${newMode}`);
  // 切替先エディタへのフォーカスは各コンポーネントで行う
}
```

# BlockNoteEditorPaneでの使用

```tsx
// src/components/_features/editor/BlockNoteEditorPane.tsx

import { registerBlockNoteEditor, unregisterBlockNoteEditor } from '@/lib/editor/editorSync';

export function BlockNoteEditorPane({ className }: BlockNoteEditorPaneProps) {
  const editor = useCreateBlockNote({});
  
  // エディタインスタンスを登録
  useEffect(() => {
    if (editor) {
      registerBlockNoteEditor(editor);
    }
    return () => {
      unregisterBlockNoteEditor();
    };
  }, [editor]);
  
  // ... 残りの実装
}
```

# EditorModeSwitcherでの使用

```tsx
// src/components/_features/editor/EditorModeSwitcher.tsx

import { syncBeforeModeChange } from '@/lib/editor/editorSync';

const handleModeChange = async (newMode: EditorMode) => {
  if (mode === newMode) return;
  
  // 1. 同期処理
  await syncBeforeModeChange();
  
  // 2. モード切替
  setMode(newMode);
};
```

# 同期フロー図

```
┌─────────────────────────────────────────────────────────┐
│ ユーザーが「ソースコード」タブをクリック                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ syncBeforeModeChange() が呼ばれる                        │
│   └─ mode === 'rich' なので BlockNote → Markdown 変換   │
│   └─ editorStore.setMarkdown(markdown)                  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ setMode('code') でモード変更                             │
│   └─ BlockNoteEditorPane が非表示に (mode !== 'rich')   │
│   └─ MonacoEditorPane が表示に (mode === 'code')        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ MonacoEditorPane の useEffect が発火                     │
│   └─ editorStore.markdown を取得                        │
│   └─ editor.setValue(markdown)                          │
└─────────────────────────────────────────────────────────┘
```

# エラーハンドリング

```typescript
export async function syncBeforeModeChange(): Promise<boolean> {
  try {
    // ... 同期処理
    return true; // 成功
  } catch (error) {
    console.error('[Sync] Error:', error);
    
    // ユーザーに通知
    // toast.error('データの同期に失敗しました。もう一度お試しください。');
    
    return false; // 失敗
  }
}

// 呼び出し側
const handleModeChange = async (newMode: EditorMode) => {
  const success = await syncBeforeModeChange();
  if (!success) {
    // 切替をキャンセル
    return;
  }
  setMode(newMode);
};
```

# 禁止事項

- **同期処理をスキップしてモード切替**: データ消失の原因。必ず `await syncBeforeModeChange()` を先に呼ぶ。
- **BlockNoteインスタンスへの直接アクセス**: `registerBlockNoteEditor` 経由でのみアクセス。
- **同期失敗時の無視**: エラー時はユーザーに通知し、切替をキャンセル。

# テスト方法

1. Rich モードで文章を編集
2. Code モードに切替
3. Monaco に同じ内容が表示されることを確認
4. Code モードで編集
5. Rich モードに切替
6. BlockNote に同じ内容が表示されることを確認

# 完了条件

- [ ] `src/lib/editor/editorSync.ts` が作成されている
- [ ] `syncBeforeModeChange()` が動作する
- [ ] `registerBlockNoteEditor()` / `unregisterBlockNoteEditor()` が動作する
- [ ] Rich → Code 切替時にデータが失われない
- [ ] Code → Rich 切替時にデータが失われない
- [ ] エラー時に適切にハンドリングされる

# 次のスキル

- `preview-css-engine`: プレビューのリアルタイム更新
