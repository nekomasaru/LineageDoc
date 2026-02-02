---
name: ui-layout-app
description: サイドバーとメインエリアを持つアプリケーションシェルを構築する。
allowed-tools: [file_edit]
meta:
  domain: frontend
  role: layout-component
  tech_stack: react, tailwind-css
  phase: 2
  estimated_time: 45min
  dependencies: [editor-ui-switcher]
---

# このスキルでやること

アプリケーション全体のレイアウト（シェル）を構築する。
サイドバー（文書一覧）とメインエリア（エディタ）を持つ2カラムレイアウトを実装する。

# 設計思想

## レイアウト構成

┌──────────────────────────────────────────────────────────┐
│  Header（ロゴ、ユーザーメニュー、モード切替）             │
├────┬────────────┬────────────────────────────────────────┤
│ R  │            │                                        │
│ a  │ Linea      │              Main Area                 │
│ i  │ Panel      │                                        │
│ l  │ (History)  │  ┌──────────────────────────────────┐  │
│ N  │            │  │  SplitEditorLayout               │  │
│ a  │            │  │  (Editor + Live Diff)            │  │
│ v  │            │  └──────────────────────────────────┘  │
│    │            │                                        │
└────┴────────────┴────────────────────────────────────────┘
```

## レスポンシブ対応

| 画面幅 | サイドバー |
|--------|-----------|
| `lg` (1024px+) | 常時表示（240px固定） |
| `md` (768px-1023px) | 折りたたみ可能 |
| `< md` | ハンバーガーメニュー |

# 作成するファイル

## `src/components/_layout/AppShell.tsx`

```tsx
'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/_shared/Logo';
import { Sidebar } from './Sidebar';
import { UserMenu } from './UserMenu';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 flex-shrink-0">
        {/* Left: ハンバーガー + ロゴ */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 text-slate-500 hover:text-slate-700"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Logo className="h-8" />
          <span className="font-semibold text-slate-800">LineaDoc</span>
        </div>

        {/* Right: ユーザーメニュー */}
        <UserMenu />
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`
            w-60 bg-white border-r border-slate-200 flex-shrink-0
            lg:block
            ${sidebarOpen ? 'block absolute inset-y-14 left-0 z-30' : 'hidden'}
          `}
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/20 z-20"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
```

## `src/components/_layout/Sidebar.tsx`

```tsx
'use client';

import { FileText, Plus, Settings, History } from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  return (
    <div className="h-full flex flex-col">
      {/* 新規作成ボタン */}
      <div className="p-3">
        <button className="w-full flex items-center gap-2 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
          <Plus className="w-4 h-4" />
          新規ドキュメント
        </button>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 px-3 py-2">
        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
          ドキュメント
        </div>
        
        {/* 文書リスト（ui-nav-doclist で実装） */}
        <div className="space-y-1">
          {/* プレースホルダー */}
          <a
            href="#"
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <FileText className="w-4 h-4" />
            <span className="truncate">文書タイトル</span>
          </a>
        </div>
      </nav>

      {/* フッター */}
      <div className="p-3 border-t border-slate-100">
        <a
          href="#"
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg"
        >
          <Settings className="w-4 h-4" />
          設定
        </a>
      </div>
    </div>
  );
}
```

## `src/components/_layout/UserMenu.tsx`

```tsx
'use client';

import { useState } from 'react';
import { User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function UserMenu() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) {
    return (
      <a
        href="/login"
        className="text-sm text-teal-600 hover:text-teal-700"
      >
        ログイン
      </a>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800"
      >
        <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-teal-600" />
        </div>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
            <div className="px-4 py-2 text-sm text-slate-500 border-b border-slate-100">
              {user.email}
            </div>
            <button
              onClick={signOut}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              <LogOut className="w-4 h-4" />
              ログアウト
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

# app/layout.tsx での使用

```tsx
import { AppShell } from '@/components/_layout/AppShell';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
```

# スタイリングルール（ui-component-basic準拠）

| 要素 | スタイル |
|------|---------|
| Header背景 | `bg-white`, `border-slate-200` |
| RailNav背景 | `bg-cyan-900` |
| プライマリボタン | `bg-cyan-600`, `hover:bg-cyan-700` |
| テキスト | `text-slate-600`, `text-slate-800` |

# 禁止事項

- **サイドバーの固定px幅のみ**: レスポンシブ対応必須。
- **z-indexの乱用**: モーダルは `z-50`、サイドバーオーバーレイは `z-20-30` 程度。
- **スクロールの漏れ**: `overflow-hidden` を適切に設定。

# 完了条件

- [ ] `AppShell.tsx` が作成されている
- [ ] `Sidebar.tsx` が作成されている
- [ ] `UserMenu.tsx` が作成されている
- [ ] レスポンシブ対応（モバイルでハンバーガーメニュー）
- [ ] ユーザーメニューのドロップダウンが動作する

# 次のスキル

- `ui-nav-doclist`: サイドバーに文書一覧を表示
