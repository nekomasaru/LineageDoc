---
name: editor-pane
description: Monaco Editorの実装、設定変更、イベントハンドリング。
allowed-tools: [file_edit]
meta:
  domain: frontend
  role: editor-logic
  tech_stack: monaco-react
---

# このスキルでやること

`@monaco-editor/react` のラッパーコンポーネントと、それに関連するロジックを実装する。

# 実装済みコンポーネント

- **パス**: `lineage-doc/src/components/_features/editor/MonacoWrapper.tsx`
- **主要機能**:
  - `forwardRef` による外部制御:
    - `scrollToLine(line)`: 指定行へのスクロール。
    - `setValue(value)`: 外部からのコンテンツ更新。
    - `hasFocus()`: エディタのフォーカス状態確認（キーボード操作制御用）。
  - `onVisibleLineChange` による表示行の通知。
  - **2段階の差分ハイライト**:
    - 保存済み変更（比較対象：`compareWith`）: 青色 (`diff-added-line` 等)。
    - 未保存の変更（比較対象：`activeBase`）: 緑色 (`diff-active-line` 等)。
    - 未保存の削除: 黄色/オレンジ (`diff-active-removed-line` 等)。
    - リアルタイム更新: `onDidChangeModelContent` を監視して即時反映。
  - **Editor UX**:
    - **自動採番**: `# ` + Space で `markdown-utils` を呼び出し、見出し番号を挿入（タイトル行除外）。
    - **スクロール同期**: `revealLine(line, 0)` で画面上端に合わせる。
    - **レイアウト**: `glyphMargin: true` で差分領域確保。
  - **AI 集約・同期**:
    - **選択内容の同期**: `onDidChangeCursorSelection` (Monaco) や `onSelectionChange` (BlockNote) を監視し、`appStore.aiContext` に選択テキストを同期。
    - **反映アクション**: `replaceSelection(text)` を実装。AIの提案を現在の選択範囲に即座に上書き反映する仕組みを提供。
  - **フロントマターの保護**:
    - `SplitEditorLayout` において、`gray-matter` を使用してドキュメントを「メタデータ（Attributes）」と「本文（Markdown）」に分離。
    - エディタ側には原則として本文のみを渡し、保存時に結合するフローを採用することで、リッチエディタ（BlockNote）とのデータ整合性を確保。

# 実行手順

1. **コンポーネント修正**:
   - `MonacoWrapper.tsx` を修正する際は、既存のスクロール同期ロジック（`isScrollingFromExternalRef`）を壊さないように注意する。
   - `useEffect` の依存配列に注意し、エディタ内容変更時にも差分計算が走るようにする（`updateDiffDecorations` 等の切り出し）。

2. **データ同期**:
   - 入力変更は `onChange` で親コンポーネントへ通知する。
   - 外部からの値変更は `setValue` を通すか、`value` プロップの変更を検知する。

# 禁止事項

- 単純な `<textarea>` タグの使用。
- エディタのインスタンスを `ref` 以外で直接DOM操作すること。
- 無限ループを考慮しない安易なスクロールイベントの追加。
- 差分計算を重い処理（メインスレッドブロック）にしないこと。現在は `diff` ライブラリを使用。
