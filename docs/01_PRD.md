# LineageDoc PRD

## Product Concept

**LineageDoc**: 文書作成の「プロセス」と「変更履歴」を可視化するエディタ。

## User Value

- **Fearless Editing**: 「どこを変えたかわからなくなる」恐怖を取り除く。
- **Context Preservation**: 「なぜこの文言にしたか」をAIとの対話履歴として残す。

## Implementation Status (Phase 1)

1. **Split Pane Interface** [DONE]
   - 左：Markdownエディタ（Monaco Editor）
   - 右：文書スタイルプレビュー（A4縦・Noto Sans JP）
   - **双方向スクロール同期**（行番号ベース）実装済み。

2. **Visual Lineage** [NEXT]
   - エディタ上で、AIの修正提案などの「差分」を視覚化する機能。

3. **Supabase Integration** [TODO]
   - データ保存・管理機能。

## UI Design Guidelines

- 色調：Slate-50（背景）、Slate-900（文字）、Blue-700（信頼/アクション）
- フォント：
  - エディタ：Consolas, Monaco, monospace
  - プレビュー：Noto Sans JP (A4 Paper Style)
