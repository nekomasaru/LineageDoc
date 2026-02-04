---
name: data-integration
description: UIとバックエンドをつなぐServer Actions (CRUD) の実装。
allowed-tools: [file_edit]
meta:
  domain: backend
  role: api-connection
  tech_stack: nextjs-server-actions
---

# このスキルでやること

クライアントサイド（Monaco Editorなど）から、セキュアにデータを保存・読み込みするロジックを実装する。

# 実行手順

1. **Server Actionsの実装**:
   - `/app/_actions/document.ts` などに、データベース操作関数を作成する。
   - クライアントコンポーネントで直接DBを叩かない（セキュリティリスク回避）。
   - 必ず `zod` を使って入力値のバリデーションを行う。

2. **UIへの接続**:
   - データの読み込み: Server Component で `await` して取得し、Propsとして渡す。
   - データの書き込み: `useTransition` フックなどを使い、UIをブロックせずに保存する。

3. **型安全性**:
   - Supabaseから生成された型定義 (`Database` 型) を使用し、`any` を排除する。

# コード例

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveDocument(id: string, content: string) {
  const supabase = createClient()
  await supabase.from('documents').update({ content }).eq('id', id)
  revalidatePath(`/editor/${id}`)
}
```
