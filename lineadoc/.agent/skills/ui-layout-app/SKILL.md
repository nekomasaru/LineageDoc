---
name: ui-layout-app
description: LineaDocのアプリケーションレイアウト（Dashboard & Editor）を構築・管理するスキル。
allowed-tools: [file_edit]
meta:
  domain: frontend
  role: layout-engine
  tech_stack: react, tailwind
  phase: 5
  estimated_time: 45min
  dependencies: [ui-component-basic]
---

# このスキルでやること

「Focus & Context」哲学に基づく「Hub & Spoke」レイアウトを構築する。
全画面を使用するダッシュボード（Hub）と、執筆に集中するためのエディタ画面（Spoke）を作成する。

# レイアウト構成

## 1. Hub Layout (Dashboard)

```
┌─────────────────────────────────────────────────────────────┐
│ Header: [Logo] [Team Selector]                   [Settings] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [ Team Tabs ]                                              │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │ Project  │  │ Project  │  │ Project  │                   │
│  │ Card     │  │ Card     │  │ Card     │                   │
│  └──────────┘  └──────────┘  └──────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- **コンテナ**: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` (中央寄せ)
- **グリッド**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`

## 2. Spoke Layout (Editor)

```
┌─────────────────────────────────────────────────────────────┐
│ Header: [Breadcrumbs]          [Save][Export][Import] [Tabs]│
├──────────────────────────────────────┬─┬────────────────────┤
│                                      │ │                    │
│                                      │R│   Context Panel    │
│            Main Editor               │e│                    │
│              (Flex-1)                │s│   - History        │
│                                      │i│   - Attributes     │
│                                      │z│   - Graph          │
│                                      │e│   - Governance     │
│                                      │ │                    │
└──────────────────────────────────────┴─┴────────────────────┘
```

- **コンテナ**: `h-screen flex flex-col`
- **Main**: `flex-1 flex overflow-hidden`
- **Right Panel**: `width: 300px` (Resizable)

# コンポーネント実装

## `src/layout/SpokeLayout.tsx`

```tsx
<div className="h-screen flex flex-col bg-white">
  {/* Global Header */}
  <header className="h-14 border-b border-slate-200 flex items-center px-4 justify-between shrink-0">
    <Breadcrumbs />
    <div className="flex items-center gap-2">
      <PanelToggle button="history" />
      <PanelToggle button="attributes" />
      <SettingsButton />
    </div>
  </header>

  <main className="flex-1 flex overflow-hidden">
    {/* Main Editor Area */}
    <div className="flex-1 overflow-hidden relative">
      {children}
    </div>

    {/* Right Context Panel (Resizable) */}
    <PanelGroup direction="horizontal" autoSaveId="spoke-layout">
        <PanelResizeHandle />
        <Panel defaultSize={20} minSize={15} maxSize={40} collapsible>
            {/* Context Tabs (History/Attributes) */}
        </Panel>
    </PanelGroup>
  </main>
</div>
```

# スタイリングルール

| 要素 | スタイル |
|------|---------|
| **ヘッダー** | `h-14 bg-white border-b border-slate-200` |
| **ダッシュボード背景** | `bg-slate-50` |
| **カード** | `bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow` |
| **右パネル** | `bg-slate-50 border-l border-slate-200` |
| **パンくず** | `text-slate-500 hover:text-cyan-700` |

# 禁止事項

- **左サイドバーの復活**: ナビゲーションは全てヘッダーまたはダッシュボードに集約する。
- **固定幅レイアウト**: 必ずレスポンシブ（Flex/Grid）で構築する。
- **モーダル乱用**: コンテキスト情報は可能な限り右パネルに表示し、フローを中断させない。
