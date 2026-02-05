# LineaDoc: UI/UX & Screen Design Specification

## Overview
ユーザー体験を「書くことへの集中 (Focus)」と「必要な文脈へのアクセス (Context)」に最適化するため、「Hub & Spoke」型のナビゲーション構造を採用します。
常設の左サイドバーを廃止し、コンテンツ領域を最大化します。

## Core Concept: Hub & Spoke Navigation
画面を「管理・探索 (Hub)」と「執筆・作業 (Spoke)」の2つのモードに明確に分けます。

1.  **Hub (Dashboard)**: チームやプロジェクトを俯瞰し、目的のドキュメントを探す場所。
2.  **Spoke (Editor)**: ドキュメントを開き、執筆や編集を行う場所。

---

## 1. Hub View (Dashboard)
アプリケーションのホーム画面。組織全体を俯瞰し、プロジェクトへアクセスします。

### Layout Structure
- **Team Tabs**:
    - 画面上部または左上に配置。所属チーム（例：開発チーム、マーケティング部）を切り替えるタブ。
- **Project Grid**:
    - 選択されたチーム内のプロジェクトをカード形式でグリッド表示。
    - **Project Card**:
        - プロジェクト名、アイコン。
        - ステータス（進行中、完了など）。
        - 最終更新日、ドキュメント数。
        - メンバーアバター（数名分）。
- **Project Detail (Zoom-in)**:
    - プロジェクトカードをクリックすると展開（または画面遷移）。
    - **Document List**:
        - テーブル形式またはリスト形式。
        - カラム: タイトル、ステータス、更新日時、作成者。
        - 検索・フィルタリング機能。

---

## 2. Spoke View (Editor)
ドキュメントを開いた状態。執筆に集中できるクリーンなUI。

### A. Header (Global Navigation)
- **Breadcrumbs**:
    - `Home(Dashboard) > Team A > Project X > Document Title`
    - 階層構造を表示し、上位階層への戻り導線を確保。
- **Document Title**:
    - パンくずリストの末尾、またはその下段に配置。インライン編集可能。
- **Toolbar (Right)**:
    - **Actions**:
        - **Save**: 手動保存ボタン（Ctrl+S対応）。履歴に変更がない場合はスキップし、メタデータのみ更新。
        - **Export**: <Upload /> アイコン。MD/TXT/JSON形式での書き出し。
        - **Import**: <Download /> アイコン。MD/TXTファイルの取り込み。
    - **Editor Mode Toggle**: `Rich (WYSIWYG)` と `Code (Markdown)` の切り替え。
    - **Context Toggles**: `History`, `Attributes`, `Graph`, `Quality (Governance)`, `Assistant` (✨アイコン) の各右パネル開閉ボタン。
    - **Settings**: アプリケーション設定へのアクセス。
    - **Save Status**: 保存状態のインジケーター。

### B. Main Area (Canvas)
- **Editor**:
    - 画面中央に配置。
    - BlockNote (Rich Text) または Monaco (Code) エディタ。
    - レスポンシブに幅を調整（読みやすい行長を維持）。

### C. Right Context Panel (Inspector)
ヘッダーのトグルボタンで開閉する、コンテキスト情報の表示領域。

- **History Tab (Linea)**:
    - リネージグラフ（Gitツリー風）とバージョンリスト。
    - 60pxの広幅マージンにより、複雑な分岐も視認性を維持。
    - 過去バージョンの閲覧、比較、復元、ブランチ作成。
    - **Interactive History**:
        - **Branching**: 過去イベント選択後、「ブランチ作成」で理由入力モーダルが表示され、初の保存時に記録される。
        - **Restoration**: 過去バージョンを最新化する際は、専用の `ConfirmModal` で警告を表示。
        - **Comment Edit**: 木構造のコメントラベルをクリックして直接編集可能。
        - **Clear History**: 履歴全体のクリア時には「v1リセット」を伴う警告モーダルを表示。
- **Attributes Tab**:
    - `FrontmatterForm` を格納。
    - ドキュメント属性（タグ、ステータス、優先度）の編集。
- **Quality Tab (Governance)**:
    - MDSCHEMA/Textlintによる校正結果の表示。
    - 公文書ガイドラインへの準拠チェック。
- **LineaDoc AI Tab (✨)**:
    - **Selection Context**: 現在選択中のテキストプレビューを表示。
    - **Command Bar**: 横スクロール形式のクイックアクション（公用文、要約、論理性チェック等）。
    - **Chat UI**: 「LineaDoc AI エージェント」としての吹き出し形式の対話画面。
    - **Direct Apply**: AIの提案テキストをエディタへ直接反映するボタン。
- **Graph Tab**:
    - 関連ドキュメントのネットワークグラフ表示。

### D. LineaDoc AI Integration
- **@Mention**: エディタ内で `@` と入力すると「LineaDoc AI エージェント」のおすすめメニューが起動。
- **Draft Generation**: 指示内容に基づき、新しいブランチ（案）を自動生成。

---

## 3. Transition & Interaction
- **Dashboard -> Editor**:
    - ドキュメントクリックでエディタへ遷移（Spokeへ移動）。
- **Editor -> Dashboard**:
    - パンくずリストの「Home」または「Project名」クリックでダッシュボードへ戻る（Hubへ移動）。
- **Panel Interaction**:
    - 右パネルは執筆の邪魔にならないよう、オーバーレイではなく**リサイズ（コンテンツ領域の幅縮小）**または**オーバーレイ（モバイル時）**を選択可能にする。

---

## 4. Modals
- **Create Project Modal**: Dashboardから呼び出し。
- **Create Document Modal**: Project Detailから呼び出し。
- **Export Modal**: 出力形式（MD, TXT, JSON）の選択。
- **Import Dialog**: ローカルファイル（MD, TXT）の取り込み。
- **AI Instruction Modal**: AIへの執筆指示とブランチ戦略（続き作成/別案作成）の選択。
- **Settings Modal**: Headerから呼び出し。
