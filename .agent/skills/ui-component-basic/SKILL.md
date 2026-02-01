---
name: ui-component-basic
description: 基本的なUIコンポーネント（ボタン、カード、レイアウト）の実装・修正。
allowed-tools: [file_edit]
meta:
  domain: frontend
  role: ui-foundation
  tech_stack: tailwind-shadcn
---

# このスキルでやること

Pure Tailwind CSS または shadcn/ui を用いて、LineageDocのUIパーツを作成する。

# 実行手順

1. **要件判断**:
   - 複雑なインタラクション（モーダル、ポップオーバー等）が必要 → `shadcn/ui` のコードを生成する。
   - 単純な装飾のみ → HTML要素に直接 Tailwind クラスを付与する。

2. **スタイリングルール**:
   - 色: `slate-900` (文字), `slate-50` (背景), `blue-700` (アクション) を基本とする。
   - 余白: 4の倍数 (`p-4`, `m-8`) を厳守する。
   - アイコン: 必ず `lucide-react` を使用する。

# 具体例

## OK: Tailwind Button

```tsx
<button className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 transition-colors">
  送信
</button>
```

## OK: Shadcn Button

```tsx
import { Button } from "@/components/ui/button"

<Button variant="outline">キャンセル</Button>
```

# 禁止事項

- `style={{ ... }}` タグでのインラインスタイル記述（動的な値を除く）。
- `globals.css` への独自クラス追加（Utility Firstを徹底する）。
