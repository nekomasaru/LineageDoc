---
name: ui-component-basic
description: 基本的なUIコンポーネント（モーダル、ボタン、共通パーツ）の実装・運用ルール。
allowed-tools: [file_edit]
meta:
  domain: frontend
  role: ui-foundation
  tech_stack: tailwind-custom-components
---

# このスキルでやること

**LineaDoc (Organizational Knowledge OS)** のUI一貫性を保つためのコンポーネント作成と使用ガイドライン。
「厳格なガバナンス (Strict Governance)」と「おもてなし (Omotenashi)」を両立する。

# UI原則

1. **No Browser Native Dialogs**:
   - `alert()`, `confirm()`, `prompt()` は使用禁止。
   - 必ず `src/components/_shared/` 内のモーダルコンポーネントを使用する。

2. **Tailwind CSS Utility First**:
   - `globals.css` への独自クラス追加は最小限にする。
   - コンポーネント内でTailwindクラスを完結させる。

3. **Color Palette**:
   - Primary: Teal Blue (`bg-cyan-600`, `text-cyan-600`) - LineaDocのメインブランドカラー (#0891B2)。
   - Accent: Cyan/Slate (`text-cyan-500`, `bg-cyan-50`, `bg-slate-900`)
   - Warning: Amber (`text-amber-500`)
   - Danger: Rose (`text-rose-500`)
   - Text: Slate (`text-slate-800` for headings, `text-slate-600` for body)

# 共通コンポーネント (src/components/_shared/)

新しい機能を追加する際は、既存の共通コンポーネントを優先して使用する。

## 1. InputModal (入力モーダル)
ユーザーからのテキスト入力を受け付ける場合に使用。
```tsx
<InputModal
  isOpen={isOpen}
  onClose={close}
  onConfirm={(val) => handle(val)}
  title="タイトル"
  label="ラベル"
  defaultValue="初期値"
  confirmText="保存"
/>
```

## 2. ConfirmModal (確認モーダル)
削除やリセットなどの破壊的アクションの確認に使用。
```tsx
<ConfirmModal
  isOpen={isOpen}
  onClose={close}
  onConfirm={performAction}
  title="確認"
  message="本当に実行しますか？"
  variant="danger" // 'danger' | 'warning' | 'info'
/>
```

## 3. Generic Modals
- `AlertDialog`: シンプルな通知用。
- `BranchCommentModal`: 分岐作成専用（特殊ロジック含む）。

# 実装パターン

- **アイコン**: `lucide-react` を使用。
- **Z-Index**:
  - モーダル: `z-50`
  - オーバーレイ: `z-40` (backdrop)
  - ツールチップ/ポップオーバー: `z-50`以上

# 外部ライブラリ導入時の注意

1. **shadcn/ui の導入**:
   - shadcn/ui を導入する場合は、MITライセンスに基づき、適切なライセンス表記（クレジット）をドキュメントや「About」ページ等に含めること。
   - コンポーネント自体にライセンスコメントが含まれている場合は、それを削除しないこと。
