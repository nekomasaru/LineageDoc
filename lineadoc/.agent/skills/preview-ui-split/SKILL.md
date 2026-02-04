---
name: preview-ui-split
description: コードエディタ（Monaco）使用時のみ左右分割表示を行う。リッチ編集時はエディタのみ表示。
allowed-tools: [file_edit]
meta:
  domain: frontend
  role: layout-component
  tech_stack: react, tailwind-css
  phase: 1
  estimated_time: 30min
  dependencies: [editor-state-store, editor-comp-monaco, editor-comp-blocknote]
---

# このスキルでやること

エディタモードに応じてレイアウトを切り替える `SplitEditorLayout` を実装する。

# 設計思想（UX方針変更 2026-02）

## モードによるレイアウト切り替え

| モード | レイアウト | プレビュー |
|--------|-----------|-----------|
| `rich` (BlockNote) | エディタのみ全画面 | ボタンからモーダル |
| `code` (Monaco) | 左右分割（エディタ + プレビュー） | 常時表示 |

### なぜ分けるか

1. **BlockNote**: WYSIWYGで見た目が整っているため、プレビュー不要。
2. **Monaco（Markdown）**: ソースを書いているので、結果確認のためプレビュー必要。

# レイアウト図

```
【rich モード】
┌─────────────────────────────────┐
│      BlockNote エディタ          │
│          （全画面）              │
│                                 │
│   [プレビュー/出力] ボタン → モーダル
└─────────────────────────────────┘

【code モード】
┌───────────────┬───────────────┐
│   Monaco      │   プレビュー   │
│   エディタ     │   (リアルタイム)│
│               │               │
└───────────────┴───────────────┘
```

# コード実装

## `src/components/_features/editor/SplitEditorLayout.tsx`

```tsx
'use client';

import { useState } from 'react';
import { Eye } from 'lucide-react';
import { useEditorStore } from '@/stores/editorStore';
import { MonacoEditorPane } from './MonacoEditorPane';
import { BlockNoteEditorPane } from './BlockNoteEditorPane';
import { EditorModeSwitcher } from './EditorModeSwitcher';
import { PreviewPane } from '../preview/PreviewPane';
import { PreviewModal } from '../preview/PreviewModal';

export function SplitEditorLayout({ className = '' }: { className?: string }) {
  const { markdown, mode } = useEditorStore();
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* モード切替タブ + プレビューボタン */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white">
        <EditorModeSwitcher />
        
        {/* リッチモード時のみプレビューボタン表示 */}
        {mode === 'rich' && (
          <button
            onClick={() => setShowPreviewModal(true)}
            className="flex items-center gap-2 px-4 py-2 mr-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
          >
            <Eye className="w-4 h-4" />
            プレビュー/出力
          </button>
        )}
      </div>

      {/* メインエリア */}
      <div className="flex-1 flex overflow-hidden">
        {mode === 'rich' ? (
          // リッチモード: エディタのみ（全画面）
          <div className="flex-1 bg-white">
            <BlockNoteEditorPane className="h-full" />
          </div>
        ) : (
          // コードモード: 左右分割
          <>
            <div className="w-1/2 border-r border-slate-200 bg-white">
              <MonacoEditorPane className="h-full" />
            </div>
            <div className="w-1/2 bg-slate-100">
              <PreviewPane content={markdown} />
            </div>
          </>
        )}
      </div>

      {/* プレビューモーダル */}
      <PreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
      />
    </div>
  );
}
```

# モバイル対応

```tsx
// モバイルでは常にエディタのみ表示
// プレビューはモーダルで確認

<div className="flex-1 flex overflow-hidden">
  {mode === 'rich' ? (
    <BlockNoteEditorPane className="h-full w-full" />
  ) : (
    <>
      {/* デスクトップ: 分割 */}
      <div className="hidden md:block md:w-1/2 border-r ...">
        <MonacoEditorPane />
      </div>
      <div className="hidden md:block md:w-1/2 ...">
        <PreviewPane content={markdown} />
      </div>
      
      {/* モバイル: エディタのみ */}
      <div className="md:hidden w-full">
        <MonacoEditorPane />
      </div>
    </>
  )}
</div>
```

# 禁止事項

- **リッチモードでの常時分割**: BlockNoteには不要。
- **プレビューモーダルのコードモード中表示**: 既に右側にプレビューがあるため混乱を招く。

# 完了条件

- [ ] `SplitEditorLayout.tsx` がモード別レイアウトを実装
- [ ] リッチモード → エディタのみ + プレビューボタン
- [ ] コードモード → 左右分割（エディタ + プレビュー）
- [ ] プレビューモーダルが開閉する

# 次のスキル

- `preview-pane`: モーダル版プレビューの実装
