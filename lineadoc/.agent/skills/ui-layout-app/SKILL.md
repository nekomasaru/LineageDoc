---
name# Skill: ui-layout-app
## 概要
LineaDocのアプリケーションレイアウト（AppShell）を構築・管理するスキル。
左端のRailNav、可変幅のSidebar、メインコンテンツエリアの3カラム構成を基本とする。

## 構成要素

### 1. RailNav (Global Navigation)
- **役割**: コンテキストの切り替えとグローバルアクション。
- **主要アイテム**:
    - `Logo`: プロジェクト一覧（ホーム）に戻る。
    - `History`: 選択中ドキュメントの履歴パネルを表示（ドキュメント選択時のみ）。
    - `Attributes`: 選択中ドキュメント・プロジェクトの属性パネルを表示。
    - `Settings`: チーム・アプリ設定。

### 2. Sidebar (Resizable Panel)
- **役割**: 階層ナビゲーション。
- **表示モード**:
    - `ProjectList`: チームごとのプロジェクト一覧表示。
    - `ProjectDetail`: 特定プロジェクト内のドキュメント一覧表示。
    - `Metadata/History`: 属性や履歴の詳細パネル（オーバーレイまたは置換）。

### 3. Main Content
- **役割**: ドキュメント編集、または初期状態のダッシュボード。
- **ヘッダー**: パンくずリスト、タイトル、ステータス、モード切替。

## 実装ルール
- `react-resizable-panels` を使用してリサイズ可能にする。
- ナビゲーションの状態（現在のビューモード、選択中ID）は `useAppStore` または `useProjectStore` で管理する。
- 画面遷移はスムーズに行い、ユーザーが現在地（チーム/プロジェクト階層）を見失わないようにする。
  dependencies: [editor-ui-switcher]
---

# このスキルでやること

アプリケーション全体のレイアウト（シェル）を構築する。
`react-resizable-panels` を使用して、ユーザーが自由に幅を調整できる3カラム（または2カラム）レイアウトを実装する。

# 設計思想

## レイアウト構成

```
┌────┬──────────────┬─┬────────────────────────────────────┐
│    │              │ │                                    │
│ R  │              │R│                                    │
│ a  │  Sidebar     │e│           Main Area                │
│ i  │  (Panel)     │s│           (Panel)                  │
│ l  │              │i│                                    │
│ N  │  - Documents │z│  ┌──────────────────────────────┐  │
│ a  │  - Metadata  │e│  │  SplitEditorLayout           │  │
│ v  │  - History   │ │  │  (Editor / Diff / Graph)     │  │
│    │              │ │  └──────────────────────────────┘  │
│    │              │ │                                    │
└────┴──────────────┴─┴────────────────────────────────────┘
```

## レスポンシブ & リサイズ仕様

- **ライブラリ**: `react-resizable-panels` を使用。
- **構成**:
  - **RailNav**: 左端固定 (48px)。
  - **Sidebar Panel**: リサイズ可能 (default: 25-30%, min: 15%)。
  - **ResizeHandle**: ドラッグ可能な境界線。
  - **Main Panel**: 残りの領域すべて。
- **永続化**: `localStorage` にパネルサイズを保存し、次回起動時に復元する。
  - パネルID: `sidebar-panel-main` (バージョン管理などでキャッシュリセット可能にする)

# 作成・修正するファイル

## `src/app/page.tsx` (Layout Root)

メインページ (`page.tsx`) 自体がレイアウト機能を持つ。
`PanelGroup`, `Panel`, `ResizeHandle` を組み合わせて構築する。

```tsx
<div className="h-screen flex bg-slate-50">
  <RailNav />
  
  <div className="flex-1 flex flex-col overflow-hidden">
    <header /> {/* Header */}
    
    <main className="flex-1 overflow-hidden relative">
      <PanelGroup orientation="horizontal">
        
        {/* Sidebar Panel */}
        <Panel id="sidebar-panel-main" defaultSize={25} minSize={15} collapsible>
           {/* DocumentNavigator / FrontmatterForm / LineaPanel */}
           {/* ※中身のコンポーネントは w-full でなければならない (w-72固定などは禁止) */}
        </Panel>

        <ResizeHandle />

        {/* Main Panel */}
        <Panel>
           {/* Editor / Graph */}
        </Panel>

      </PanelGroup>
    </main>
  </div>
</div>
```

## `src/components/_shared/ResizeHandle.tsx`

`react-resizable-panels` の `Separator` をラップした視覚的ハンドル。

```tsx
export const ResizeHandle = forwardRef<HTMLDivElement, ResizeHandleProps>(
    ({ className = '', id, direction = 'horizontal', ...props }, ref) => {
        return (
            <Separator
                id={id}
                elementRef={ref} // 重要: リサイズ動作に必須
                {...props}
                className="..."
            >
                {/* ハンドルの見た目 */}
            </Separator>
        );
    }
);
```

# 禁止事項

- **子コンポーネントでの固定幅指定**: サイドバーに入れるコンポーネント（DocumentNavigatorなど）に `w-72` などの固定幅を指定してはならない。必ず `w-full` を使用し、親パネルのサイズに従わせる。
- **IDの頻繁な変更**: パネルIDが変わるとサイズ設定がリセットされるため、意図的なリセット以外では変更しない。

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
