---
name: preview-css-engine
description: 既存のCSSプレビュー機能をストアのMarkdown変更に反応するよう改修する。
allowed-tools: [file_edit]
meta:
  domain: frontend
  role: preview-render
  tech_stack: react-markdown, zustand
  day: 3
  estimated_time: 40min
  dependencies: [editor-sync-handler]
---

# このスキルでやること

既存の `PreviewPane` コンポーネントを `editorStore` と連動させ、Markdown変更時にリアルタイムでプレビューを更新する。

# 設計思想

## 組織OSアーキテクチャにおける位置づけ

```
入力層（エディタ）
    ↓ markdown を更新
┌─────────────────────────────┐
│  editorStore.markdown       │
└─────────────────────────────┘
    ↓ 自動的にリアクティブ
出力層（プレビュー）
    ← PreviewPane が再レンダリング
```

## 既存実装の活用

`preview-pane` スキルで定義された `PreviewPane.tsx` は以下の機能を持つ：
- `react-markdown` + `remark-gfm` によるレンダリング
- A4サイズスタイル
- ズーム機能
- スクロール同期

これらを**維持しつつ**、ストア連動を追加する。

# 修正するファイル

## `src/components/_features/preview/PreviewPane.tsx`

### Before（props経由）

```tsx
interface PreviewPaneProps {
  content: string; // 親から渡される
}

export function PreviewPane({ content }: PreviewPaneProps) {
  // ...
}
```

### After（ストア経由）

```tsx
import { useEditorStore } from '@/stores/editorStore';

interface PreviewPaneProps {
  className?: string;
}

export function PreviewPane({ className }: PreviewPaneProps) {
  const { markdown } = useEditorStore();
  
  return (
    <div className={className}>
      <article className="prose prose-slate max-w-none ...">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {markdown}
        </ReactMarkdown>
      </article>
    </div>
  );
}
```

# パフォーマンス最適化

## 問題: 高頻度の再レンダリング

BlockNote編集中は `setMarkdown` が頻繁に呼ばれる（Debounce後でも500ms毎）。
`react-markdown` のレンダリングは比較的重いため、最適化が必要。

## 解決策1: useMemo

```tsx
const renderedContent = useMemo(() => (
  <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
    {markdown}
  </ReactMarkdown>
), [markdown]);
```

## 解決策2: React.memo

```tsx
export const PreviewPane = memo(function PreviewPane({ className }: PreviewPaneProps) {
  // ...
});
```

## 解決策3: useDeferredValue（React 18+）

```tsx
import { useDeferredValue } from 'react';

export function PreviewPane({ className }: PreviewPaneProps) {
  const { markdown } = useEditorStore();
  const deferredMarkdown = useDeferredValue(markdown);
  
  return (
    <ReactMarkdown>
      {deferredMarkdown}
    </ReactMarkdown>
  );
}
```

# SplitEditorLayoutでの使用

```tsx
// src/components/_features/editor/SplitEditorLayout.tsx

import { PreviewPane } from '../preview/PreviewPane';

export function SplitEditorLayout() {
  // ストアから直接取得するため、propsは不要
  return (
    <div className="flex-1 flex">
      {/* 左ペイン: エディタ */}
      <div className="w-1/2 ...">
        {/* Monaco / BlockNote */}
      </div>
      
      {/* 右ペイン: プレビュー */}
      <div className="w-1/2 bg-slate-100 ...">
        <PreviewPane />  {/* ← content prop 不要 */}
      </div>
    </div>
  );
}
```

# スクロール同期の維持

既存のスクロール同期ロジック（`data-line` 属性、`scrollToLine`）は維持する。

```tsx
// 行番号ベースの同期用
const components = {
  h1: ({ node, ...props }) => <h1 data-line={getLineNumber(node)} {...props} />,
  h2: ({ node, ...props }) => <h2 data-line={getLineNumber(node)} {...props} />,
  // ...
};
```

# 公文書スタイルの確認

プレビューは「公文書スタイル」でレンダリングする必要がある：

```css
/* globals.css */
.prose {
  font-family: 'Noto Sans JP', serif;
  line-height: 1.8;
  text-align: justify;
}

/* A4サイズ */
.preview-paper {
  width: 210mm;
  min-height: 297mm;
  padding: 25mm 20mm;
  background: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}
```

# 禁止事項

- **親コンポーネントからの content prop 依存**: すべて `editorStore` 経由で取得。
- **パフォーマンス最適化の省略**: `useMemo` または `React.memo` を必ず使用。
- **スクロール同期ロジックの破壊**: 既存の `data-line` 属性付与を維持。

# テスト方法

1. BlockNote / Monaco で文章を編集
2. 右ペインのプレビューがリアルタイムで更新されることを確認
3. 大きな文書（1000行以上）でもスムーズに動作することを確認
4. ズーム機能が動作することを確認

# 完了条件

- [ ] `PreviewPane` が `editorStore.markdown` を直接参照している
- [ ] Markdown変更時にプレビューが自動更新される
- [ ] パフォーマンス最適化（useMemo/memo）が適用されている
- [ ] 公文書スタイル（A4、Noto Sans JP）が維持されている
- [ ] スクロール同期が動作する

# 次のスキル（Week 1完了後）

- `db-schema-init`: Supabase接続の準備
- `api-client-save`: 保存処理の実装
