# LineaDoc PRD: AI-Powered Document Lineage

## 概要

**LineaDoc**: **AI-Powered Document Lineage** — 文書作成の「プロセス」と「変更履歴」を可視化するエディタ。

## User Value

- **Fearless Editing**: 「どこを変えたかわからなくなる」恐怖を取り除く。
- **Context Preservation**: 「なぜこの文言にしたか」をAIとの対話履歴として残す。

## Implementation Status (Phase 1)

1. **Split Pane Interface** [DONE]
   - 左：Markdownエディタ（Monaco Editor）
   - 右：文書スタイルプレビュー（A4縦・Noto Sans JP）
   - **双方向スクロール同期**（行番号ベース）実装済み。

2. **Visual Lineage & AI Collaboration** [DONE]
   - **Sibling Branching**: 最新の記述を維持したままAIが別案を提案する並列分岐ロジック。
   - **DAG可視化**: SVGとHTMLを組み合わせた履歴ツリー表示。

3. **Template & Governance** [DONE]
   - **カード型テンプレート選択**: 業務に応じた初期構成の自動注入。
   - **MDSCHEMA**: 文書構造のリアルタイムバリデーション（正規表現サポート済み）。
   - **Legal & Settings**: 統合設定モーダルとライセンス表示機能。

4. **Hotkeys & Efficiency** [DONE]
   - **カスタムホットキー**: 編集モード・ワークモードの瞬時切り替え（Ctrl+E, Ctrl+M）。
   - **永続化設定**: ブラウザを閉じても設定を維持。

5. **Supabase Integration** [TODO]
   - データ保存・管理・マルチデバイス同期。

## UI Design Guidelines

- 色調：Slate-50（背景）、Slate-900（文字）、Blue-700（信頼/アクション）
- フォント：
  - エディタ：Consolas, Monaco, monospace
  - プレビュー：Noto Sans JP (A4 Paper Style)

## Success Metrics & Risk Management

### 1. 成功指標 (Success Metrics)
- **相互運用性**: `mammoth.js` で見出し構造が 80% 再現され、`Pandoc` 出力が公式形式を 90% 再現すること。
- **AI品質**: `Visual Auditing` における誤検知率（偽陽性）が 20% 以下であること。
- **UX**: AIによるマージ提案の採用率が 60% 以上であること。

### 2. リスク管理 (Risk Management)
- **段階的評価 (Go/No-Go)**: 各フェーズ終了時に精度とコストを評価し、期待値に届かない場合は機能を縮退（簡略化）または研究課題化する。
- **フェイルセーフ**: AI解析が失敗・不安定な場合でも、`mammoth.js` によるクリーンインポートと手動編集という「確実な手段」を常に提供する。
