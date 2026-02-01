---
name: preview-pane
description: Markdownを公文書スタイル（A4・明朝体）でレンダリングする機能の実装。
allowed-tools: [file_edit]
meta:
  domain: frontend
  role: preview-render
  tech_stack: react-markdown
---

# このスキルでやること

Markdownコンテンツを、印刷可能な文書スタイルでレンダリングするコンポーネントを作成・修正する。

# 実装済みコンポーネント

- **パス**: `lineage-doc/src/components/_features/preview/PreviewPane.tsx`
- **主要機能**:
  - `react-markdown` と `remark-gfm` によるレンダリング。
  - 各HTML要素への `data-line` 属性付与（行番号ベース同期用）。
  - A4サイズ（210mm x 297mm）のスタイル再現。
  - プレビュー側のスクロールを検知し、エディタ側へ通知する機能。

# 実行手順

1. **公文書スタイリング**:
   - スタイル修正は `globals.css` またはコンポーネント内のインラインスタイルで行う。
   - `prose` クラスを使用してフォントや余白を制御する。

2. **同期ロジック**:
   - 行番号ベースの同期を維持するため、カスタムコンポーネントによる `data-line` の付与を継続すること。

# コード例（現在の実装）

```tsx
<article className="prose prose-slate max-w-none leading-loose text-justify">
  <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
    {content}
  </ReactMarkdown>
</article>
```
