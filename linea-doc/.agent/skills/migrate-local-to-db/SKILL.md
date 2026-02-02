---
name: migrate-local-to-db
description: 既存のLocalStorageデータを読み出し、Supabaseへ一括アップロードする。
allowed-tools: [file_edit]
meta:
  domain: migration
  role: data-migration
  tech_stack: supabase, localStorage
  phase: 2
  estimated_time: 60min
  dependencies: [api-client-save]
---

# このスキルでやること

既存のLineaDocがLocalStorageに保存しているドキュメントデータを、Supabaseの `documents` テーブルに移行する一括アップロード機能を実装する。

# 設計思想

## なぜ移行が必要か

- 既存ユーザーのデータを失わない
- LocalStorage（ブラウザ依存）からクラウド（Supabase）への移行
- 一度きりの処理だが、ユーザーが安心して実行できるUIが必要

## 移行フロー

```
┌─────────────────────────────────────────┐
│  LocalStorage                           │
│    - documents[]                        │
│    - lineageData{}                      │
└───────────────┬─────────────────────────┘
                │ migrateLocalData()
                ↓
┌─────────────────────────────────────────┐
│  Supabase                               │
│    - documents テーブル                  │
│    - versions テーブル（初期バージョン）  │
└─────────────────────────────────────────┘
                │
                ↓
┌─────────────────────────────────────────┐
│  LocalStorage クリア（オプション）        │
└─────────────────────────────────────────┘
```

# 作成するファイル

## `src/lib/migration/localStorageMigration.ts`

```typescript
import { supabase } from '@/lib/supabase';

interface LocalDocument {
  id?: string;
  title: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
  parentId?: string;
  branchName?: string;
}

interface MigrationResult {
  success: boolean;
  migratedCount: number;
  skippedCount: number;
  errors: string[];
}

const LOCAL_STORAGE_KEY = 'lineadoc_documents';

/**
 * LocalStorageからドキュメントデータを読み出す
 */
export function getLocalDocuments(): LocalDocument[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to read localStorage:', error);
    return [];
  }
}

/**
 * LocalStorageにドキュメントデータが存在するかチェック
 */
export function hasLocalData(): boolean {
  return getLocalDocuments().length > 0;
}

/**
 * LocalStorageのデータをSupabaseに移行する
 */
export async function migrateLocalToSupabase(): Promise<MigrationResult> {
  const localDocs = getLocalDocuments();
  const result: MigrationResult = {
    success: true,
    migratedCount: 0,
    skippedCount: 0,
    errors: [],
  };
  
  if (localDocs.length === 0) {
    return result;
  }
  
  // 現在のユーザーを取得
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    result.success = false;
    result.errors.push('ログインが必要です');
    return result;
  }
  
  for (const doc of localDocs) {
    try {
      // 1. documents テーブルに INSERT
      const { data: newDoc, error: docError } = await supabase
        .from('documents')
        .insert({
          title: doc.title || '無題のドキュメント（移行）',
          content: doc.content || '',
          created_by: user.id,
          parent_id: doc.parentId || null,
          branch_name: doc.branchName || null,
        })
        .select()
        .single();
      
      if (docError) {
        result.errors.push(`"${doc.title}": ${docError.message}`);
        result.skippedCount++;
        continue;
      }
      
      // 2. 初期バージョンを versions テーブルに INSERT
      const { error: versionError } = await supabase
        .from('versions')
        .insert({
          document_id: newDoc.id,
          version_number: 1,
          content: doc.content || '',
          commit_message: 'LocalStorageからの移行',
        });
      
      if (versionError) {
        console.warn(`Version creation failed for ${newDoc.id}:`, versionError);
        // バージョン作成失敗は警告のみ（文書は作成済み）
      }
      
      result.migratedCount++;
      
    } catch (error) {
      result.errors.push(`"${doc.title}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.skippedCount++;
    }
  }
  
  result.success = result.errors.length === 0;
  return result;
}

/**
 * 移行完了後にLocalStorageをクリアする
 */
export function clearLocalData(): void {
  localStorage.removeItem(LOCAL_STORAGE_KEY);
  // 関連データもクリア
  localStorage.removeItem('lineadoc_lineage');
  localStorage.removeItem('lineadoc_settings');
}

/**
 * LocalStorageデータをバックアップ（JSONダウンロード）
 */
export function downloadLocalBackup(): void {
  const localDocs = getLocalDocuments();
  const blob = new Blob([JSON.stringify(localDocs, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `lineadoc_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
}
```

## `src/components/_features/migration/MigrationPanel.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Upload, Download, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import {
  hasLocalData,
  getLocalDocuments,
  migrateLocalToSupabase,
  clearLocalData,
  downloadLocalBackup,
} from '@/lib/migration/localStorageMigration';

export function MigrationPanel() {
  const [localCount, setLocalCount] = useState(0);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{
    success: boolean;
    migratedCount: number;
    errors: string[];
  } | null>(null);
  
  useEffect(() => {
    setLocalCount(getLocalDocuments().length);
  }, []);
  
  if (localCount === 0) {
    return null; // 移行データがなければ表示しない
  }
  
  const handleMigrate = async () => {
    setIsMigrating(true);
    const result = await migrateLocalToSupabase();
    setMigrationResult(result);
    setIsMigrating(false);
    
    if (result.success) {
      setLocalCount(0);
    }
  };
  
  const handleBackup = () => {
    downloadLocalBackup();
  };
  
  const handleClear = () => {
    if (confirm('LocalStorageのデータを削除しますか？この操作は取り消せません。')) {
      clearLocalData();
      setLocalCount(0);
    }
  };
  
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-amber-800">
            ローカルデータの移行
          </h3>
          <p className="text-sm text-amber-700 mt-1">
            ブラウザに保存された {localCount} 件のドキュメントがあります。
            クラウドに移行することで、他のデバイスからもアクセスできるようになります。
          </p>
          
          {migrationResult && (
            <div className={`mt-3 p-2 rounded ${
              migrationResult.success ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {migrationResult.success ? (
                <p className="text-sm text-green-700 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  {migrationResult.migratedCount} 件の移行が完了しました
                </p>
              ) : (
                <div className="text-sm text-red-700">
                  <p>一部のドキュメントの移行に失敗しました:</p>
                  <ul className="list-disc list-inside mt-1">
                    {migrationResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleMigrate}
              disabled={isMigrating}
              className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 text-white text-sm rounded hover:bg-teal-700 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {isMigrating ? '移行中...' : '移行する'}
            </button>
            
            <button
              onClick={handleBackup}
              className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 text-slate-600 text-sm rounded hover:bg-slate-50"
            >
              <Download className="w-4 h-4" />
              バックアップ
            </button>
            
            <button
              onClick={handleClear}
              className="flex items-center gap-1 px-3 py-1.5 text-red-600 text-sm hover:bg-red-50 rounded"
            >
              <Trash2 className="w-4 h-4" />
              削除のみ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

# 使用例

```tsx
// ダッシュボードページなどで表示
import { MigrationPanel } from '@/components/_features/migration/MigrationPanel';

function DashboardPage() {
  return (
    <div>
      {/* 移行が必要な場合のみ表示される */}
      <MigrationPanel />
      
      {/* 通常のダッシュボードコンテンツ */}
      <DocumentList />
    </div>
  );
}
```

# セキュリティ考慮

- **認証必須**: ログイン済みユーザーのみ移行可能
- **ユーザー紐付け**: `created_by` に現在のユーザーIDを設定
- **バックアップ推奨**: 移行前にJSONダウンロードを推奨

# 禁止事項

- **確認なしでのLocalStorageクリア**: 必ずconfirmダイアログを表示
- **エラー時の無視**: 失敗したドキュメントを明示
- **二重移行**: 一度移行したデータを再度移行しない仕組みを検討

# 完了条件

- [ ] `localStorageMigration.ts` が作成されている
- [ ] `MigrationPanel.tsx` が作成されている
- [ ] LocalStorageからSupabaseへの移行が動作する
- [ ] バックアップダウンロードが動作する
- [ ] エラーハンドリングが適切に機能する
- [ ] 移行完了後にパネルが非表示になる

# 全スキル完了！

これで全17スキルの作成が完了しました。
Week 1（Day 1-5）のハイブリッドエディタ完成に向けて、順番に実装を進めてください。
