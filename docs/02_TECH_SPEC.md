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
```

## Implementation Details

- **Scroll Sync**: 行番号ベースの双方向同期。
  - Monaco: `revealLineInCenter` 使用。
  - Preview: 各要素に `data-line` を付与し、`scrollIntoView` で同期。
  - 無限ループ防止のため、外部からのスクロール入力を検知するフラグ（`isScrollingFromExternalRef`）を使用。
