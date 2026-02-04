---
name: app-ux-modes
description: LineaDocの3つのワークモード（執筆・校正・履歴）を切り替えるUXパターンと画面遷移の定義。
allowed-tools: [file_edit]
meta:
  domain: frontend
  role: ux-pattern
  tech_stack: react, zustand
  phase: 2
  estimated_time: 45min
  dependencies: [ui-layout-app, editor-state-store]
---

# このスキルでやること

LineaDocのアプリケーション全体で使用する「3つのワークモード」を定義し、UIパターンを統一する。

# 設計思想

## 2つのワークモード

ユーザーの作業フェーズに応じて、メインレイアウトを切り替える。履歴（Linea）は執筆モードに統合される。

| モード | 目的 | メインエリア | 左パネル |
|--------|------|-------------|-------------|
| **Write** | 執筆と履歴管理 | エディタ + Linea (Live Diff) | LineaPanel (履歴ツリー) |
| **Proof** | 出力確認・印刷設定 | 印刷プレビュー | テンプレート選択 |

## 画面遷移イメージ

```
┌─────────────────────────────────────────────────────────────┐
│  Header: [LineaDoc]  [Write✓] [Proof] [Lineage]   [👤 User] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                      【メインエリア】                        │
│                                                             │
│   Write モード   → BlockNote / Monaco エディタ              │
│   Proof モード   → A4プレビュー + テンプレート選択           │
│   Lineage モード → ツリービュー + Diffビュー                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

# 実装方法

## ストア拡張: `appStore.ts`

```typescript
import { create } from 'zustand';

export type WorkMode = 'write' | 'proof';

interface AppState {
  workMode: WorkMode;
  setWorkMode: (mode: WorkMode) => void;
  
  // サイドバー
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  workMode: 'write',
  setWorkMode: (mode) => set({ workMode: mode }),
  
  isSidebarOpen: true,
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
}));
```

## モード切替UI: `WorkModeTabs.tsx`

```tsx
'use client';

import { Edit3, Eye, GitBranch } from 'lucide-react';
import { useAppStore, WorkMode } from '@/stores/appStore';

const MODES: { id: WorkMode; label: string; icon: typeof Edit3 }[] = [
  { id: 'write', label: '執筆', icon: Edit3 },
  { id: 'proof', label: '出力', icon: Eye },
  { id: 'lineage', label: '履歴', icon: GitBranch },
];

export function WorkModeTabs() {
  const { workMode, setWorkMode } = useAppStore();

  return (
    <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
      {MODES.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setWorkMode(id)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
            transition-colors duration-150
            ${workMode === id
              ? 'bg-white text-teal-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
            }
          `}
        >
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
```

## メインビュー切り替え: `MainArea.tsx`

```tsx
'use client';

import { useAppStore } from '@/stores/appStore';
import { SplitEditorLayout } from '@/components/_features/editor/SplitEditorLayout';
import { ProofView } from '@/components/_features/proof/ProofView';
import { LineageView } from '@/components/_features/lineage/LineageView';

export function MainArea() {
  const { workMode } = useAppStore();

  switch (workMode) {
    case 'write':
      return <SplitEditorLayout />;
    case 'proof':
      return <ProofView />;
    case 'lineage':
      return <LineageView />;
    default:
      return <SplitEditorLayout />;
  }
}
```

# ショートカットキー

| キー | アクション |
|------|----------|
| `Ctrl + 1` | Write モードへ |
| `Ctrl + 2` | Proof モードへ |
| `Ctrl + 3` | Lineage モードへ |
| `Ctrl + B` | サイドバー開閉 |

# 禁止事項

- **モード切替でデータを失う**: 常にストアを経由し、切替前に同期する。
- **3つ以上のモードを追加**: 複雑になりすぎるため、当面は3つに固定。

# 完了条件

- [ ] `appStore.ts` が作成されている
- [ ] `WorkModeTabs.tsx` が作成されている
- [ ] `MainArea.tsx` がモード別ビューを切り替える
- [ ] ショートカットキーが動作する

# 次のスキル

- `lineage-visualization`: Lineageモードの詳細実装
