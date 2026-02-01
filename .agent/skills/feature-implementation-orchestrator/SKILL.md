---
name: feature-implementation-orchestrator
description: >
  【司令塔】ユーザーの要望を分析し、UI・エディタ・DB・AIの各専門スキルを組み合わせて実装計画を立てるメタスキル。
  開発プロセスの最初に必ず呼び出される。
allowed-tools:
  - file_read
meta:
  domain: orchestration
  role: conductor
  tech_stack: none
---

# このスキルでやること

複雑な機能要件を具体的なタスクに分解して各専門スキルに委譲する。常に `lineage-doc/` ディレクトリ配下のリソースを対象とする。

# 思考フロー

1. **現状確認**: projectRoot (`lineage-doc/`) 配下のファイル構成を確認。
2. **要件分析**: ユーザーの要望を具体化。
3. **スキル選定**:
   - エディタ周り → `editor-pane`
   - プレビュー周り → `preview-pane`
   - UI全体・レイアウト → `ui-component-basic`
   - DB/API → `backend-supabase`, `data-integration`, `ai-llm-engineering`

# ユーザーへの回答フォーマット

実装前に必ず `implementation_plan.md` 形式で計画を提示し、承認を得ること。

## 実装計画の例
1. **実装対象**: `lineage-doc/src/app/page.tsx` の修正
2. **使用スキル**: `editor-pane` を使用してスクロール挙動を調整
3. **検証**: `npm run dev` での動作確認
