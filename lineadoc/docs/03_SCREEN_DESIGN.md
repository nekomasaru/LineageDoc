# LineaDoc: UI/UX & Screen Design Specification

## Overview
ユーザー体験の向上を目指し、アプリケーションの構造を「チームとプロジェクトを中心とした階層型ナビゲーション」に再構築します。

## Core Concept: Project-Centric Navigation
従来のフラットなドキュメントリストを廃止し、組織的な情報管理を実現します。

**Hierarchy:**
1.  **Team**: 論理的な組織単位（例：開発チーム、マーケティング部）。
2.  **Project**: 目的を持った作業単位（例：プロダクトドキュメント、議事録）。
3.  **Document**: 実際のコンテンツ。

---

## 1. Global Navigation (RailNav)
画面左端の固定ナビゲーションバー（幅48px）。

| Icon | Label | Behavior |
| :--- | :--- | :--- |
| **App Logo** | Home | サイドバーを「**プロジェクト一覧**」ビューに切り替える。現在のコンテキストをリセット。 |
| (Spacer) | | |
| **GitBranch** | History | **ドキュメント選択時のみ有効**。サイドバー（またはパネル）に選択中ドキュメントの「履歴 (Linea)」を表示。 |
| **Info** | Attributes | **ドキュメント選択時のみ有効**。サイドバー（またはパネル）に「属性情報 (Project/Doc Info)」を表示。 |
| (Spacer) | | |
| **Settings** | Settings | チーム管理、アプリケーション設定モーダルを開く。 |
| **Help** | Help | ヘルプモーダルを開く。 |

---

## 2. Sidebar Views
RailNavの選択やコンテキストに応じて切り替わるメインナビゲーションエリア（幅256px）。

### A. Project List View (Home)
アプリ起動時やロゴクリック時に表示される最上位ビュー。

- **Header**:
    - **Team Selector**: ドロップダウンで表示するチームを切り替え。
    - **Create Project Button**: 新規プロジェクト作成モーダルを開く。
- **Content**:
    - **Project Cards**: プロジェクト名、タグ、目的（概要）を表示したカードのリスト。
    - **Grouping**: チームごとにグルーピング表示も検討。
- **Action**:
    - プロジェクトをクリック -> **Project Detail View** へ遷移。

### B. Project Detail View
特定のプロジェクト内に入った状態。

- **Header**:
    - **Back Button (<)**: プロジェクト一覧へ戻る。
    - **Project Name**: 現在のプロジェクト名。
    - **Project Menu**: プロジェクト属性編集（名前、メンバー、タグ）へのアクセス。
- **Search/Filter**:
    - プロジェクト内ドキュメントの検索ボックス。
    - タグフィルタ。
- **Content**:
    - **Document List**: ドキュメントのリスト。作成日時や更新日時でソート。
- **Footer**:
    - **Create Document Button**: このプロジェクト内に新規ドキュメントを作成。
- **Action**:
    - ドキュメントをクリック -> メインエリアにエディタを表示し、**Document Context** を有効化。

### C. Context Panels (Attributes / History)
RailNavから呼び出される補助パネル（またはSidebarのオーバーレイ）。

- **History Panel**:
    - 選択中ドキュメントのLinea履歴（グラフ+リスト）を表示。
    - バージョン比較、分岐作成、復元などの操作。
- **Attributes Panel**:
    - **Project Info**: 所属チーム名、プロジェクト名、メンバー、共通タグ（Read-onlyまたは編集可）。
    - **Document Info**: ドキュメントステータス、個別タグ。

---

## 3. Modals

### Create Project Modal
- **Team**: 所属チームを選択（必須）。
- **Name**: プロジェクト名（必須）。
- **Description**: プロジェクトの目的・概要。
- **Tags**: 初期タグ。

### Create Document Modal
- **Name**: ドキュメント名（必須）。
- **Project**: 現在開いているプロジェクトが自動選択される（変更不可）。

---

## 4. Main Area (Editor)
- **Header**:
    - パンくずリスト風表示: `Team / Project / Document`
    - タイトル編集。
    - バージョンバッジ。
- **Body**:
    - BlockNote (Rich Text) または Monaco (Code) エディタ。
    - Split View (Diff比較時)。
