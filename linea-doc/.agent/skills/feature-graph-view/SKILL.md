---
name: feature-graph-view
description: ドキュメント、プロジェクト、タグの相関関係を可視化する「Graph View」機能の実装仕様。
allowed-tools: [file_edit, run_command]
meta:
  domain: visualization
  role: frontend-feature
  tech_stack: react-force-graph-2d, d3
  phase: 4
  estimated_time: 60min
  dependencies: [documentStore]
---

# このスキルでやること

LineageDoc内の「Knowledge Network（水平方向のつながり）」を可視化するため、GraphRAGスタイルのネットワークグラフを実装する。

# 設計思想

- **全体俯瞰**: ワークスペース全体のドキュメント構造を一目で理解できる
- **発見**: 孤立しているドキュメントや、中心となっているプロジェクトを発見する
- **ナビゲーション**: ノードをクリックして直接ドキュメントにアクセスする

# 実装仕様

## 1. グラフデータ構造 (`src/lib/graph-utils.ts`)

`documentStore` のフラットなドキュメントリストから、NodeとLinkを生成する。

### Nodes
- **Document Node**:
  - ID: `doc-{id}`
  - Label: `doc.title`
  - Color: Teal (`#0d9488`)
  - Size: 8 (default)
- **Project Node**:
  - ID: `prj-{name}`
  - Label: `{name}`
  - Color: Indigo (`#6366f1`)
  - Size: 12
- **Tag Node**:
  - ID: `tag-{name}`
  - Label: `#{name}`
  - Color: Amber (`#f59e0b`)
  - Size: 6

### Links
- `belongs_to_project`: Doc -> Project
- `has_tag`: Doc -> Tag
- `references`: Doc -> Doc (frontmatter.references)

## 2. UIコンポーネント (`src/components/_features/graph/NetworkGraph.tsx`)

- ライブラリ: `react-force-graph-2d` (Canvas描画でパフォーマンス重視)
- 機能:
  - ズーム/パン
  - ノードクリック: ドキュメントを開く / フィルタリング
  - ノードホバー: ラベル強調
- レイアウト:
  - 左サイドバー: ドキュメント詳細/リスト (`DocumentNavigator`)
  - メインエリア: グラフ (`NetworkGraph`)

## 3. ページ統合 (`src/app/page.tsx`)

- `RailNav` に「グラフ」アイコン (`Share2`) を追加
- Layout Integration:
  - グラフもメインのリサイズパネル内に配置する (`PanelGroup` 内の右パネルとして)。
  - 左サイドバーは `DocumentNavigator` を表示（エディタ時と共有）。
  - 右パネルで `SplitEditorLayout` と `NetworkGraph` を切り替える。
  - これにより、グラフ表示時もサイドバーのリサイズが可能になる。

```tsx
<PanelGroup>
  <Panel id="sidebar">
     <DocumentNavigator />
  </Panel>
  <ResizeHandle />
  <Panel>
     {activeNav === 'graph' ? <NetworkGraph /> : <SplitEditorLayout />}
  </Panel>
</PanelGroup>
```

# ファイル構成

```
src/
├── lib/
│   └── graph-utils.ts       # データ変換ロジック
├── components/
│   └── _features/
│       └── graph/
│           └── NetworkGraph.tsx  # グラフ描画コンポーネント
```

# 依存ライブラリ

```bash
npm install react-force-graph-2d
```
