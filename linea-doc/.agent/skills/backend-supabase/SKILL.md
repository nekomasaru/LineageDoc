---
name: backend-supabase
description: Supabaseのテーブル設計、RLS設定、マイグレーションSQLの作成。
allowed-tools: [file_edit]
meta:
  domain: backend
  role: database
  tech_stack: supabase-postgresql
---

# このスキルでやること

**LineaDoc (Organizational Knowledge OS)** の **「Storage Layer (脳)」** を構築する。
散在する情報を知識としてつなぎ、長期的な資産として蓄積するためのデータベース構造を定義し、それを構築するためのSQLを作成する。

# 実行手順

1. **スキーマ設計**:
   - `02_TECH_SPEC.md` のデータモデルに基づき、PostgreSQLのテーブル定義（DDL）を作成する。
   - 必須項目: `id` (uuid), `created_at` (timestamptz), `updated_at` (timestamptz).

2. **セキュリティ設定 (Zero Trust RLS)**:
   - 公的機関・組織向けツールのため、セキュリティは最優先事項（Strict Governance）。
   - 「適切な権限を持つユーザーしかデータに触れられない」ポリシーを必ずSQLに含める。
   - `ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;`

3. **出力形式**:
   - ユーザーがSupabaseのSQL Editorに貼り付けるだけで済む「完全なSQLファイル」 (`supabase/migrations/xxxx_init.sql`) を提供する。

# 具体例 (documentsテーブル)

```sql
create table documents (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text default '',
  user_id uuid references auth.users not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS Policy
create policy "Individuals can view their own documents."
on documents for select using (auth.uid() = user_id);
```
