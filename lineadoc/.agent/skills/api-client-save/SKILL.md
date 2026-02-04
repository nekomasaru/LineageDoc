---
name: api-client-save
description: ストア内のMarkdownをSupabaseへUpsertする処理を実装する。
allowed-tools: [file_edit]
meta:
  domain: backend
  role: api-client
  tech_stack: "@supabase/supabase-js, zustand"
  day: 4
  estimated_time: 45min
  dependencies: [db-schema-init]
---

# このスキルでやること

`editorStore` 内のMarkdownをSupabaseの `documents` テーブルに保存する処理を実装する。
保存時には `versions` テーブルにも履歴を追加し、リネージ（変更履歴追跡）を実現する。

# 設計思想

## 保存フロー

```
editorStore.markdown
    ↓ saveDocument()
┌─────────────────────────────────────┐
│  Supabase                           │
│    1. documents テーブルに UPSERT    │
│    2. versions テーブルに INSERT     │
└─────────────────────────────────────┘
    ↓
editorStore.markAsSaved()
```

## Upsert vs Insert

- **新規文書**: `INSERT` → `id` が自動生成される
- **既存文書**: `UPDATE` → 既存の `id` を使用

Supabaseの `upsert` を使用することで、両方を1つの処理で実現。

# 作成するファイル

## `src/lib/api/documentApi.ts`

```typescript
import { supabase } from '@/lib/supabase';
import { useEditorStore } from '@/stores/editorStore';
import { Database } from '@/lib/database.types';

type Document = Database['public']['Tables']['documents']['Row'];
type DocumentInsert = Database['public']['Tables']['documents']['Insert'];

interface SaveDocumentParams {
  id?: string; // 既存文書の場合は指定
  title: string;
  content: string;
  commitMessage?: string;
}

interface SaveDocumentResult {
  success: boolean;
  document?: Document;
  error?: string;
}

/**
 * 文書を保存する（新規作成または更新）
 */
export async function saveDocument(params: SaveDocumentParams): Promise<SaveDocumentResult> {
  const { id, title, content, commitMessage } = params;
  
  try {
    // 1. documents テーブルに UPSERT
    const documentData: DocumentInsert = {
      ...(id && { id }), // 既存の場合はIDを指定
      title,
      content,
    };
    
    const { data: document, error: docError } = await supabase
      .from('documents')
      .upsert(documentData)
      .select()
      .single();
    
    if (docError) throw docError;
    if (!document) throw new Error('Document not returned');
    
    // 2. versions テーブルに履歴を追加
    const { data: latestVersion } = await supabase
      .from('versions')
      .select('version_number')
      .eq('document_id', document.id)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();
    
    const nextVersionNumber = (latestVersion?.version_number ?? 0) + 1;
    
    const { error: versionError } = await supabase
      .from('versions')
      .insert({
        document_id: document.id,
        version_number: nextVersionNumber,
        content,
        commit_message: commitMessage,
      });
    
    if (versionError) {
      console.error('Failed to create version:', versionError);
      // バージョン作成失敗はログのみ（文書は保存済み）
    }
    
    return { success: true, document };
    
  } catch (error) {
    console.error('Save document failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * editorStore と連携した保存処理
 */
export async function saveCurrentDocument(
  documentId?: string,
  title?: string,
  commitMessage?: string
): Promise<SaveDocumentResult> {
  const { markdown, markAsSaved } = useEditorStore.getState();
  
  const result = await saveDocument({
    id: documentId,
    title: title ?? '無題のドキュメント',
    content: markdown,
    commitMessage,
  });
  
  if (result.success) {
    markAsSaved();
  }
  
  return result;
}
```

## `src/lib/api/documentApi.ts` （続き：取得処理）

```typescript
/**
 * 文書を取得する
 */
export async function fetchDocument(id: string): Promise<Document | null> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();
  
  if (error) {
    console.error('Fetch document failed:', error);
    return null;
  }
  
  return data;
}

/**
 * 文書一覧を取得する
 */
export async function fetchDocumentList(): Promise<Document[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('id, title, updated_at, created_at')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });
  
  if (error) {
    console.error('Fetch document list failed:', error);
    return [];
  }
  
  return data ?? [];
}

/**
 * 文書を削除する（ソフトデリート）
 */
export async function deleteDocument(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('documents')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  
  if (error) {
    console.error('Delete document failed:', error);
    return false;
  }
  
  return true;
}
```

# 使用例

## 保存ボタンからの呼び出し

```tsx
import { saveCurrentDocument } from '@/lib/api/documentApi';

function SaveButton({ documentId }: { documentId?: string }) {
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSave = async () => {
    setIsSaving(true);
    const result = await saveCurrentDocument(documentId);
    setIsSaving(false);
    
    if (result.success) {
      toast.success('保存しました');
    } else {
      toast.error(`保存に失敗しました: ${result.error}`);
    }
  };
  
  return (
    <button onClick={handleSave} disabled={isSaving}>
      {isSaving ? '保存中...' : '保存'}
    </button>
  );
}
```

## 文書読み込み

```tsx
import { fetchDocument } from '@/lib/api/documentApi';
import { useEditorStore } from '@/stores/editorStore';

async function loadDocument(id: string) {
  const doc = await fetchDocument(id);
  if (doc) {
    useEditorStore.getState().setMarkdown(doc.content);
    useEditorStore.getState().markAsSaved(); // 読み込み直後はダーティでない
  }
}
```

# エラーハンドリング

```typescript
// オフライン検出
if (!navigator.onLine) {
  return {
    success: false,
    error: 'オフラインです。インターネット接続を確認してください。',
  };
}

// 認証エラー
if (error.code === 'PGRST301') {
  return {
    success: false,
    error: 'ログインが必要です。',
  };
}
```

# 禁止事項

- **ストアを介さない保存**: 必ず `editorStore.markdown` から取得する。
- **markAsSaved() の呼び忘れ**: 保存成功時に必ず呼ぶ。
- **ハードデリート**: 必ず `deleted_at` によるソフトデリートを使用。
- **バージョン作成の省略**: 保存ごとに必ず `versions` にレコードを追加。

# 完了条件

- [ ] `src/lib/api/documentApi.ts` が作成されている
- [ ] `saveDocument()` が動作する
- [ ] `saveCurrentDocument()` がストアと連携する
- [ ] `fetchDocument()` / `fetchDocumentList()` が動作する
- [ ] `deleteDocument()` がソフトデリートを行う
- [ ] 保存時に `versions` テーブルにレコードが追加される

# 次のスキル

- `api-hook-autosave`: 自動保存フックの実装
