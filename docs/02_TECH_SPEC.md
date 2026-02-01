# LineageDoc Technical Specification

## Tech Stack

- Frontend: Next.js 16.1.6 (App Router)
- Language: TypeScript 5
- Styling: Tailwind CSS 4
- Package Manager: npm
- Key Libraries:
  - `@monaco-editor/react`: ^4.7.0
  - `react-markdown`: ^10.1.0
  - `remark-gfm`: ^4.0.1

## Directory Structure (Current)

```
/lineage-doc
  /src
    /app
      page.tsx        # メインレイアウト & 相互スクロール同期
      layout.tsx      # Noto Sans JP フォント設定
      globals.css     # CSS変数 & Typography (prose) スタイル
    /components
      /_features
        /editor
          MonacoWrapper.tsx  # Monaco制御
        /preview
          PreviewPane.tsx   # Markdownレンダリング & data-line付与
```

## Data Models (MVP)

### Document

```typescript
interface Document {
  id: string;        // UUID
  title: string;
  rawContent: string; // Markdown text
  createdAt: string; // ISO8601
  updatedAt: string; // ISO8601
}

interface LineageEvent {
  id: string;
  parentId: string | null; // 親ノードID（DAG構造）
  timestamp: string;
  type: 'user_edit' | 'ai_suggestion' | 'save';
  content: string;
  summary?: string;
  version?: number;
}
```

## Implementation Details

- **Scroll Sync**: 行番号ベースの双方向同期。
  - Monaco: `revealLine(line, 0)` で画面上端に表示。
  - Preview: 各要素に `data-line` を付与し、`scrollTop` 制御で画面上端（offset -40px）に表示。
  - 同期時にプレビュー側で一時的なハイライト演出を行う。
  - 無限ループ防止のため、外部からのスクロール入力を検知するフラグ（`isScrollingFromExternalRef`）を使用。

- **Editor UX**:
  - Auto Numbering: `# ` 入力時に見出し番号を自動挿入（タイトル行除外）。
  - Diff Highlight: 保存済み/未保存の変更を色分け表示。

- **Preview UX**:
  - Zoom: 10%〜300% の拡大縮小（Ctrl+Wheel / UIボタン）。
  - Layout: A4用紙スタイル（Noto Sans JP）。
