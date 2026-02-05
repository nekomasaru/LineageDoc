---
name: app-ux-modes
description: LineaDocの新しい「Hub & Spoke」ナビゲーションとワークモード定義。
allowed-tools: [file_edit]
meta:
  domain: frontend
  role: ux-pattern
  tech_stack: react, zustand
  phase: 2
  estimated_time: 45min
  dependencies: [ui-layout-app, app-store]
---

# このスキルでやること

LineaDocの新しいUXモデル「Hub & Spoke」に基づき、アプリケーションの主要モードと画面遷移を定義する。

# 設計思想: Focus & Context

従来のフラットなモード切替ではなく、階層的なナビゲーション構造を採用する。

## 1. ナビゲーションモード (マクロ)

| モード | 役割 | 画面構成 |
|--------|------|----------|
| **Hub (Dashboard)** | **探索と管理**。チーム・プロジェクトを俯瞰し、ドキュメントを探す。 | ダッシュボード (カードグリッド/リスト) |
| **Spoke (Editor)** | **執筆と作業**。特定のドキュメントを開き、集中して作業する。 | エディタ + 右コンテキストパネル |

## 2. ワークモード (ミクロ: Spoke内)

エディタ画面内での表示形式の切り替え。

| モード | 目的 | メインエリア | 右パネル |
|--------|------|-------------|-------------|
| **Write** | 執筆・履歴管理 | エディタ (BlockNote / Monaco) | Linea / Attributes (開閉可) |
| **Proof** | 出力確認 | 印刷プレビュー (A4) | テンプレート設定 |

---

# 画面遷移イメージ

```mermaid
graph TD
    Hub[Hub: Dashboard] -->|Click Doc| Spoke[Spoke: Editor]
    Spoke -->|Click Breadcrumb| Hub
    
    subgraph Spoke Modes
        Write -->|Toggle| Proof
        Proof -->|Toggle| Write
    subgraph Spoke Modes
        Write -->|Toggle| Proof
        Proof -->|Toggle| Write
    end
```

# ワークフロー詳細

## 1. 新規ドキュメント作成フロー

1. **テンプレート選択 (Card UI)**:
    - 「ナレッジ」「議事録」「日報」などのカードから選択。
    - 各テンプレートには「初期Markdown構成（見出し等）」と「推奨品質設定（MDSchema/Textlint）」が紐付いている。
2. **プロジェクト設定**:
    - テンプレートの品質設定をプロジェクト単位でオーバーライド可能（ただし管理者がロックした項目は変更不可）。

## 2. AIコラボレーションフロー

1. **指示出し (Instruction)**:
    - ユーザーが最新履歴（Latest）を表示中にAIへ指示を出す。
2. **兄弟ブランチ作成 (Sibling Branching)**:
    - システムは自動的に**「一つ前の履歴」**から分岐を作成する。
    - 現在の作業（Latest）を温存しつつ、AIが並行世界の案（Sibling）を作成して作業を進める。
3. **マージ (Merge)**:
    - ユーザーはAIの成果物を確認し、手動またはAI支援を受けてメインラインに統合する。
    - チームメンバーも並行してブランチ側を編集可能（コラボレーション）。

# 実装方法

# 実装方法

## ストア拡張: `appStore.ts`

```typescript
import { create } from 'zustand';

// マクロモードはURLルーティングで管理するため、ストアには持たない (Next.js App Router)
// /dashboard -> Hub
// /doc/[id]  -> Spoke

export type WorkMode = 'write' | 'proof';
export type RightPanelTab = 'history' | 'attributes' | 'graph' | null;

interface AppState {
  // **Hub (Dashboard)**: チーム・プロジェクト・ドキュメントを一覧し、進入経路を提供する「ハブ」画面。
  // **Spoke (Editor)**: 選択されたドキュメントの編集に集中する「スポーク」画面。
  // **Template Selection**: 新規作成時のメタデータ初期化（Markdown + Schema）を伴うマルチステップ対話。
  // Spoke内のワークモード
  workMode: WorkMode;
  setWorkMode: (mode: WorkMode) => void;
  
  // 右パネルの状態
  rightPanelTab: RightPanelTab;
  setRightPanelTab: (tab: RightPanelTab) => void;
  toggleRightPanel: (tab: RightPanelTab) => void;
}
```

## コンポーネント構成

### Hub (Dashboard)
`src/app/page.tsx` (または `src/app/dashboard/page.tsx`)
- `TeamTabs`: チーム切り替え
- `ProjectGrid`: プロジェクトカード
- `ProjectDialog`: プロジェクト作成

### Spoke (Editor)
`src/app/doc/[id]/page.tsx` (または `src/components/_layout/SpokeLayout.tsx`)
- `Header`: パンくずリスト、タイトル、設定ボタン
- `MainArea`: `SplitEditorLayout` (Write) または `ProofView` (Proof)
- `RightPanel`: `LineaPanel` (History), `FrontmatterForm` (Attributes)

# 設定とカスタマイズ: `settingsStore.ts`

LineaDocでは、ユーザーの作業効率を最大化するため、永続化された設定（LocalStorage）と動的なホットキー管理を採用する。

- **カスタマイズ性**: `SettingsModal` を通じて、各アクションのキー組み合わせを変更可能。
- **UIフィードバック**: ショートカット実行時は、UI要素に反映される。

# ショートカットキー (デフォルト)

| アクション | デフォルトキー | 目的 |
|----------|--------------|------|
| **エディタ切替** | `Ctrl + E` | リッチ編集 (BlockNote) とソースコード (Monaco) のトグル |
| **ワークモード切替** | `Ctrl + M` | Write (執筆) と Proof (出力プレビュー) のトグル |

> [!NOTE]
> ホットキーは `useHotkeys` フックによってグローバルに解決される。入力中（input, textarea, [contenteditable]）は競合を防ぐため、システムショートカットを除き動作しないよう設計されている。

# 禁止事項

- **モード切替でのデータ損失**: ページ遷移が発生する場合でも、オートセーブやローカルステートの同期を確実に行う。
- **深い階層**: ダッシュボードから2クリック以内でエディタに到達できるようにする。

# 完了条件

- [ ] `appStore.ts` が新しいモード定義に対応している。
- [ ] ダッシュボードとエディタのレイアウトが分離されている。
- [ ] 右パネルが開閉可能で、コンテンツがリサイズされる。
