---
name: editor-state-store
description: Zustandを用いてMarkdown本文と編集モード（WYSIWYG/Code）を管理するストアを作成する。
allowed-tools: [file_edit]
meta:
  domain: frontend
  role: state-management
  tech_stack: zustand
  day: 1
  estimated_time: 40min
  dependencies: []
---

# このスキルでやること

ハイブリッドエディタ（Monaco + BlockNote）の状態を一元管理するZustandストアを作成する。
このストアが「Single Source of Truth」となり、エディタ・プレビュー・同期ロジックのすべてがこのストアを参照する。

# 設計思想

## 組織OSアーキテクチャにおける位置づけ

```
入力層（エディタ）
    ↓ 書く
┌─────────────────────────────┐
│  editor-state-store        │  ← このスキル
│  - markdown: string        │
│  - mode: 'rich' | 'code'   │
│  - isDirty: boolean        │
│  - lastSavedAt: Date | null│
└─────────────────────────────┘
    ↓ 参照
処理層・蓄積層・出力層
```

## なぜZustandか

- **軽量**: Reduxより学習コストが低く、ボイラープレートが少ない
- **React外からもアクセス可能**: `useStore.getState()` でどこからでも取得可能
- **DevTools対応**: デバッグが容易

# 作成するファイル

## `src/stores/editorStore.ts`

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type EditorMode = 'rich' | 'code';

interface EditorState {
  // === 状態 ===
  markdown: string;
  mode: EditorMode;
  isDirty: boolean;
  lastSavedAt: Date | null;
  
  // === 比較用（Diff表示） ===
  savedMarkdown: string; // 最後に保存されたMarkdown（未保存Diff用）
  
  // === アクション ===
  setMarkdown: (markdown: string) => void;
  setMode: (mode: EditorMode) => void;
  markAsSaved: () => void;
  resetDirty: () => void;
}

export const useEditorStore = create<EditorState>()(
  devtools(
    (set, get) => ({
      // 初期状態
      markdown: '',
      mode: 'rich',
      isDirty: false,
      lastSavedAt: null,
      savedMarkdown: '',

      // Markdown更新
      setMarkdown: (markdown) => {
        const current = get();
        set({
          markdown,
          isDirty: markdown !== current.savedMarkdown,
        });
      },

      // モード切替
      setMode: (mode) => set({ mode }),

      // 保存完了時
      markAsSaved: () => {
        const current = get();
        set({
          savedMarkdown: current.markdown,
          isDirty: false,
          lastSavedAt: new Date(),
        });
      },

      // ダーティフラグのみリセット
      resetDirty: () => set({ isDirty: false }),
    }),
    { name: 'editor-store' }
  )
);
```

# 使用例

## コンポーネントでの使用

```tsx
import { useEditorStore } from '@/stores/editorStore';

function EditorComponent() {
  const { markdown, setMarkdown, mode, isDirty } = useEditorStore();

  return (
    <div>
      {isDirty && <span className="text-amber-500">未保存</span>}
      {/* エディタ本体 */}
    </div>
  );
}
```

## React外からのアクセス（保存処理など）

```typescript
import { useEditorStore } from '@/stores/editorStore';

async function saveDocument() {
  const { markdown, markAsSaved } = useEditorStore.getState();
  await api.save(markdown);
  markAsSaved();
}
```

# 禁止事項

- **複数のMarkdown状態を持たない**: MonacoとBlockNoteで別々のstateを管理してはならない。すべて `editorStore.markdown` を参照する。
- **直接DOMから値を取得しない**: `editor.getValue()` ではなく、ストア経由で取得する。
- **モード切替時に状態を破棄しない**: 切替前に必ず最新のMarkdownをストアに反映してから切り替える。

# 完了条件

- [ ] `src/stores/editorStore.ts` が作成されている
- [ ] `useEditorStore` フックがエクスポートされている
- [ ] `markdown`, `mode`, `isDirty`, `setMarkdown`, `setMode`, `markAsSaved` が動作する
- [ ] DevToolsでストアの状態変化が確認できる

# 次のスキル

このストアを使用するコンポーネント:
- `editor-comp-monaco`: Monacoエディタがこのストアと連動
- `editor-comp-blocknote`: BlockNoteがこのストアと連動
- `preview-css-engine`: プレビューがこのストアのmarkdownを参照
