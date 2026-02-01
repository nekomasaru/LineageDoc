---
name: linea-visualization
description: 変更履歴（Linea）のタイムライン表示やDiff可視化の実装、グラフ描画ロジック。
allowed-tools: [file_edit]
meta:
  domain: frontend
  role: visualization
  tech_stack: tailwind-svg
---

# このスキルでやること

**LineaDoc: AI-Powered Document Lineage** におけるDAG（有向非巡回グラフ）の可視化、タイムライン表示、およびインタラクションの実装を行う。

# Core Implementation Logic

## 1. グラフレイアウト (Chronological Root-to-Leaf)
`linea-utils.ts` 内の `calculateGraphLayout` 関数で計算する。

- **Y軸**: 時間順（最新が上）。`events` 配列のインデックスがそのまま `yIndex` となる。
- **X軸 (Column)**:
  - 親ノードと同じ列を優先的に使用（メインラインの維持）。
  - 分岐が発生した場合、新しい Column ID を割り振る。
  - `LEFT_MARGIN` + `column` * `COL_WIDTH` で描画座標を決定。

## 2. レンダリング構造 (Layering)

3層構造で描画し、視認性と操作性を両立する。

1. **SVG Layer (z-10, Background)**
   - `pointer-events-none`
   - ノード（円）とリンク（ベジェ曲線）を描画。
   - リンクパス: `M exec L parent`（ベジェ曲線で滑らかに結合）。

2. **List Layer (z-20, Middle)**
   - 右側のリスト表示エリア。
   - 各行がクリック可能で、選択中のイベントをハイライト。
   - `padding-left` をグラフ幅分確保して配置。

3. **Comment Overlay Layer (z-30, Top)**
   - `pointer-events-none` (コンテナ), `pointer-events-auto` (子要素)。
   - グラフ上のコメントテキストを表示。
   - **機能**:
     - ホバーで全コメントをツールチップ表示 (`title`属性)。
     - クリックで編集モーダル (`InputModal`) を起動。
     - 長いコメントは自動で省略表示（12文字制限）。

# UI Components Specification

- **Node**: 半径10pxの円。選択時は青、通常は白。
- **Link**: グレーのストローク幅2px。
- **Branch Indicator**: 分岐点はAmber色で区別。
- **Version Label**: ノード右側に `v1`, `v2` 等を表示。
- **Diff Label**: 選択中のバージョンと親バージョンの差分を表示。

# データ連携

- `useLinea` フックから `events` を取得。
- `types.ts` の `LayoutNode`, `LayoutLink` 型を使用。
- コメント更新は `updateEventSummary` を介して行う。
