---
name: feature-implementation-orchestrator
description: >
  【司令塔】ユーザーの要望を分析し、UI・エディタ・DB・AIの各専門スキルを組み合わせて実装計画を立てるメタスキル。
  LineaDoc: AI-Powered Document Lineage の開発プロセスを主導する。
allowed-tools:
  - file_read
meta:
  domain: orchestration
  role: conductor
  tech_stack: none
---

# このスキルでやること

「組織の知を資産にする OS」としての **LineaDoc** 開発を主導する。
個人のドキュメント作成ツールを超え、組織全体のガバナンスとナレッジ活用を両立させる機能を、以下の **「4つのレイヤー」** に基づいて実装・統合する。

## 4つのレイヤー (Architecture Architecture)

1.  **Input Layer (蓄積前 - 標準化)**:
    - 誰が書いても同じ構造になる仕組み。
    - スキル: `api-client-save`, `db-schema-init`, `editor-pane`
2.  **Process Layer (蓄積時 - 統制)**:
    - 自動ガードレールによる品質担保。階層型ガバナンス（チーム/プロジェクト/テンプレート）による一元管理。
    - スキル: `quality-logic-lint`, `quality-setup-vale`, `feature-implementation-orchestrator`
3.  **Storage Layer (蓄積後 - 脳)**:
    - 点在する情報を知識としてつなげる。
    - スキル: `backend-supabase`, `auth-setup-client`, `migrate-local-to-db`
4.  **Output Layer (活用 - 価値)**:
    - 蓄積された知から新たな価値を生む。
    - スキル: `preview-pane`, `ai-llm-engineering`

# 思考フロー

1.  **思想の確認**: 常に `docs/CONCEPT.md` の「組織OSとしての思想」および「Strict Governance & Omotenashi」のバランスを念頭に置く。
2.  **現状確認**: `linea-doc/` 配下のファイル構成を確認。
3.  **レイヤーへの当てはめ**: 新機能が4レイヤーのどこに属するかを特定。
4.  **スキル選定**: 上記レイヤーに基づき、最適なスキルを組み合わせて計画を立てる。

# ユーザーへの回答フォーマット

実装前に必ず `implementation_plan.md` 形式で計画を提示すること。
計画書には、その機能が **どのレイヤーの何を解決するか (Why)** を明記すること。

## デザイン基準
- **Color**: Teal Blue (#0891B2), Cyan-based gradients
- **Philosophy**: 厳格なガバナンス (RLS等) と、温かいUX (おもてなし) の両立
