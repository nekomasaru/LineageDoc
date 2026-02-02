---
name: db-schema-init
description: documents/versionsテーブルを作成し、型定義を生成する。
allowed-tools: [file_edit, run_command]
meta:
  domain: backend
  role: database-schema
  tech_stack: supabase-cli
  day: 4
  estimated_time: 45min
  dependencies: [editor-sync-handler]
---

# このスキルでやること

Supabase上に文書管理用のテーブル（`documents`, `versions`）を作成し、Row Level Security（RLS）を設定する。
また、TypeScriptの型定義を自動生成する。

# 設計思想

## 組織OSアーキテクチャにおける位置づけ

```
入力層（エディタ）→ 処理層（検証）
                     ↓
┌─────────────────────────────────────┐
│  蓄積層（Supabase）                  │  ← このスキル
│    - documents テーブル              │
│    - versions テーブル               │
│    - RLS ポリシー                    │
└─────────────────────────────────────┘
                     ↓
出力層（AIエージェント）
```

## LineaDocのコアバリュー: リネージ（変更履歴追跡）

文書の変更履歴を完全に追跡するため、`versions` テーブルで全バージョンを保持する。

# Supabase CLI セットアップ

```bash
# インストール（Windows）
scoop install supabase

# または npm
npm install -g supabase

# ログイン
supabase login

# プロジェクトリンク
supabase link --project-ref <project-id>
```

# 作成するファイル

## `supabase/migrations/001_create_documents.sql`

```sql
-- ==========================================
-- documents テーブル
-- ==========================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '無題のドキュメント',
  content TEXT NOT NULL DEFAULT '',
  
  -- メタデータ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- 分岐（ブランチ）機能用
  parent_id UUID REFERENCES documents(id),
  branch_name TEXT,
  
  -- ソフトデリート
  deleted_at TIMESTAMPTZ
);

-- インデックス
CREATE INDEX idx_documents_created_by ON documents(created_by);
CREATE INDEX idx_documents_parent_id ON documents(parent_id);
CREATE INDEX idx_documents_updated_at ON documents(updated_at DESC);

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ==========================================
-- versions テーブル（履歴管理）
-- ==========================================
CREATE TABLE IF NOT EXISTS versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  
  -- バージョン情報
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  
  -- 変更メタデータ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  commit_message TEXT,
  
  -- 一意制約
  UNIQUE(document_id, version_number)
);

-- インデックス
CREATE INDEX idx_versions_document_id ON versions(document_id);
CREATE INDEX idx_versions_created_at ON versions(created_at DESC);

-- ==========================================
-- Row Level Security (RLS)
-- ==========================================

-- documents テーブル
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- 自分が作成した文書のみ閲覧可能
CREATE POLICY "Users can view own documents"
  ON documents
  FOR SELECT
  USING (auth.uid() = created_by);

-- 自分が作成した文書のみ編集可能
CREATE POLICY "Users can update own documents"
  ON documents
  FOR UPDATE
  USING (auth.uid() = created_by);

-- 認証済みユーザーは文書を作成可能
CREATE POLICY "Authenticated users can create documents"
  ON documents
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 自分が作成した文書のみ削除可能
CREATE POLICY "Users can delete own documents"
  ON documents
  FOR DELETE
  USING (auth.uid() = created_by);

-- versions テーブル
ALTER TABLE versions ENABLE ROW LEVEL SECURITY;

-- 文書の所有者のみバージョン履歴を閲覧可能
CREATE POLICY "Users can view versions of own documents"
  ON versions
  FOR SELECT
  USING (
    document_id IN (
      SELECT id FROM documents WHERE created_by = auth.uid()
    )
  );

-- 文書の所有者のみバージョンを作成可能
CREATE POLICY "Users can create versions for own documents"
  ON versions
  FOR INSERT
  WITH CHECK (
    document_id IN (
      SELECT id FROM documents WHERE created_by = auth.uid()
    )
  );
```

# TypeScript 型定義の生成

```bash
# Supabase CLI で型定義を生成
supabase gen types typescript --project-id <project-id> > src/lib/database.types.ts
```

## 生成される型定義の例

```typescript
// src/lib/database.types.ts
export interface Database {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string;
          title: string;
          content: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          parent_id: string | null;
          branch_name: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          title?: string;
          content?: string;
          // ...
        };
        Update: {
          title?: string;
          content?: string;
          // ...
        };
      };
      versions: {
        Row: {
          id: string;
          document_id: string;
          version_number: number;
          content: string;
          created_at: string;
          created_by: string | null;
          commit_message: string | null;
        };
        // ...
      };
    };
  };
}
```

# マイグレーション実行

```bash
# ローカルで適用（開発環境）
supabase db push

# リモートに適用（本番環境）
supabase db push --linked
```

# Supabaseクライアントの型付け

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

# 禁止事項

- **RLSなしでの本番運用**: 必ずRLSを有効にし、ポリシーを設定する。
- **型定義の手動作成**: 必ず `supabase gen types` で自動生成する。
- **ハードデリート**: `deleted_at` によるソフトデリートを使用する。
- **マイグレーションの直接編集**: 新しいマイグレーションファイルを作成する。

# 完了条件

- [ ] `supabase/migrations/001_create_documents.sql` が作成されている
- [ ] `documents` テーブルが作成されている
- [ ] `versions` テーブルが作成されている
- [ ] RLSポリシーが設定されている
- [ ] `src/lib/database.types.ts` が生成されている
- [ ] Supabaseクライアントが型付けされている

# 次のスキル

- `api-client-save`: このスキーマを使った保存処理の実装
