# 11_PROPOSE_AND_REVIEW_UI_SPEC

## 目的
AIの提案を差分として表示し、ユーザーが個別に承認/却下できるインターフェースの設計。

## 画面構成
- **Monaco**: Decoration API + Gutter ボタン。
- **BlockNote**: Suggestion Card + フローティングボタン。

## 状態管理
`pendingDiffs: DiffItem[]` を Zustand ストアで管理。
