---
name: editor-ui-switcher
description: 「リッチ編集」と「ソースコード」を切り替えるタブUIを実装する。
allowed-tools: [file_edit]
meta:
  domain: frontend
  role: ui-component
  tech_stack: react, tailwind-css, zustand
  day: 3
  estimated_time: 30min
  dependencies: [editor-comp-monaco]
---

# このスキルでやること

エディタのモード（`rich` / `code`）を切り替えるタブUIを作成する。
切替時には `editor-sync-handler` と連携して、データの同期を行う。

# 設計思想

## モード切替方式の採用理由

> 「BlockNoteとMonacoを同時編集可能にしない」

Split View同時編集を避ける理由：
- カーソル位置の同期が困難
- 無限ループ（Update→Change→Update...）の制御が複雑
- 実装工数が2倍以上

**モード切替方式**：「書く時はBlockNote」「微調整はMonaco」と分けることで、UXも自然で実装もシンプル。

## UIデザイン

```
┌─────────────────────────────────────────┐
│  [📝 リッチ編集]  [</> ソースコード]     │  ← タブバー
├─────────────────────────────────────────┤
│                                         │
│  エディタ本体（mode に応じて切替）        │
│                                         │
└─────────────────────────────────────────┘
```

# 作成するファイル

## `src/components/_features/editor/EditorModeSwitcher.tsx`

```tsx
'use client';

import { FileCode2, FileText } from 'lucide-react';
import { useEditorStore, EditorMode } from '@/stores/editorStore';
import { syncBeforeModeChange } from '@/lib/editor/editorSync';

interface EditorModeSwitcherProps {
  className?: string;
}

export function EditorModeSwitcher({ className }: EditorModeSwitcherProps) {
  const { mode, setMode } = useEditorStore();

  const handleModeChange = async (newMode: EditorMode) => {
    if (mode === newMode) return;
    
    // 切替前に現在のモードのデータを同期
    await syncBeforeModeChange();
    
    // モード切替
    setMode(newMode);
  };

  return (
    <div className={`flex border-b border-slate-200 ${className}`}>
      <button
        onClick={() => handleModeChange('rich')}
        className={`
          flex items-center gap-2 px-4 py-2 text-sm font-medium
          transition-colors duration-150
          ${mode === 'rich'
            ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/50'
            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }
        `}
      >
        <FileText className="w-4 h-4" />
        リッチ編集
      </button>
      
      <button
        onClick={() => handleModeChange('code')}
        className={`
          flex items-center gap-2 px-4 py-2 text-sm font-medium
          transition-colors duration-150
          ${mode === 'code'
            ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/50'
            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }
        `}
      >
        <FileCode2 className="w-4 h-4" />
        ソースコード
      </button>
    </div>
  );
}
```

# SplitEditorLayoutへの統合

```tsx
// src/components/_features/editor/SplitEditorLayout.tsx

import { EditorModeSwitcher } from './EditorModeSwitcher';

export function SplitEditorLayout() {
  return (
    <div className="flex flex-col h-full">
      {/* モード切替タブ */}
      <EditorModeSwitcher />
      
      {/* 本体 */}
      <div className="flex-1 flex ...">
        {/* 左ペイン: エディタ */}
        {/* 右ペイン: プレビュー */}
      </div>
    </div>
  );
}
```

# アクセシビリティ

```tsx
<button
  role="tab"
  aria-selected={mode === 'rich'}
  aria-controls="editor-panel"
  ...
>
```

# スタイリングルール（ui-component-basic準拠）

| 要素 | スタイル |
|------|---------|
| アクティブタブ | `text-teal-600`, `border-teal-600`, `bg-teal-50/50` |
| 非アクティブタブ | `text-slate-500`, `hover:text-slate-700` |
| アイコン | `lucide-react` 使用、`w-4 h-4` |
| トランジション | `transition-colors duration-150` |

# 禁止事項

- **同期処理なしでのモード切替**: 必ず `syncBeforeModeChange()` を先に呼ぶ。
- **ブラウザネイティブのタブUI使用**: 独自スタイルのボタンを使用。
- **モード状態をローカルに持つ**: すべて `editorStore.mode` で管理。

# ユーザー体験

## 切替時のフィードバック

```tsx
const [isTransitioning, setIsTransitioning] = useState(false);

const handleModeChange = async (newMode: EditorMode) => {
  setIsTransitioning(true);
  await syncBeforeModeChange();
  setMode(newMode);
  setIsTransitioning(false);
};

// ボタンにローディング状態を表示
{isTransitioning && <Spinner className="w-4 h-4" />}
```

# 完了条件

- [ ] `EditorModeSwitcher.tsx` が作成されている
- [ ] `rich` / `code` の切替が動作する
- [ ] 切替時に `syncBeforeModeChange()` が呼ばれる
- [ ] アクティブタブのスタイルが正しく適用される
- [ ] アイコン（lucide-react）が表示される

# 次のスキル

- `editor-sync-handler`: `syncBeforeModeChange()` の実装
