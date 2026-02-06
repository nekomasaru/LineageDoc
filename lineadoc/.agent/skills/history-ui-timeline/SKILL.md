---
name: history-ui-timeline
description: Supabaseのversionsテーブルから履歴を取得し表示するUIを作成する。
allowed-tools: [file_edit]
meta:
  domain: frontend
  role: ui-component
  tech_stack: react, tailwind-css, supabase
  phase: 2
  estimated_time: 50min
  dependencies: [api-client-save]
---

# このスキルでやること

文書の変更履歴（`versions` テーブル）をタイムライン形式で表示するUIコンポーネントを作成する。
過去バージョンの内容プレビュー、バージョン間のDiff表示、バージョン復元機能を提供する。

# 設計思想

## LineaDocのコアバリュー

> 「変更履歴の完全追跡（リネージ）」

リネージ（Lineage）= 系譜。文書がどのように変化してきたかを視覚的に理解できるUIを提供する。

## UIレイアウト

```
┌─────────────────────────────────────────────────────┐
│  📜 履歴 (12件)                          [✕ 閉じる] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ● v12 - 2026/02/03 10:30                          │
│  │   自動保存                                       │
│  │   [プレビュー] [復元]                            │
│  │                                                 │
│  ● v11 - 2026/02/03 09:15                          │
│  │   「目的」セクションを追加                        │
│  │   [プレビュー] [復元]                            │
│  │                                                 │
│  ● v10 - 2026/02/02 18:00                          │
│  │   初稿作成                                       │
│      [プレビュー] [復元]                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

# 作成するファイル

## `src/lib/api/versionApi.ts`

```typescript
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';

type Version = Database['public']['Tables']['versions']['Row'];

/**
 * 文書のバージョン履歴を取得する
 */
export async function fetchVersionHistory(documentId: string): Promise<Version[]> {
  const { data, error } = await supabase
    .from('versions')
    .select('*')
    .eq('document_id', documentId)
    .order('version_number', { ascending: false });
  
  if (error) {
    console.error('Fetch version history failed:', error);
    return [];
  }
  
  return data ?? [];
}

/**
 * 特定バージョンの内容を取得する
 */
export async function fetchVersionContent(versionId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('versions')
    .select('content')
    .eq('id', versionId)
    .single();
  
  if (error) {
    console.error('Fetch version content failed:', error);
    return null;
  }
  
  return data?.content ?? null;
}
```

## `src/components/_features/lineage/HistoryTimeline.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { X, History, Eye, RotateCcw } from 'lucide-react';
import { fetchVersionHistory } from '@/lib/api/versionApi';
import { formatDistanceToNow, format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface Version {
  id: string;
  version_number: number;
  content: string;
  created_at: string;
  commit_message: string | null;
  isMilestone?: boolean;   // [NEW] マイルストーンフラグ
  aiSummary?: string;      // [NEW] AIによる自動解説
}

interface HistoryTimelineProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
  onPreview?: (version: Version) => void;
  onRestore?: (version: Version) => void;
}

export function HistoryTimeline({
  documentId,
  isOpen,
  onClose,
  onPreview,
  onRestore,
}: HistoryTimelineProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (isOpen && documentId) {
      setIsLoading(true);
      fetchVersionHistory(documentId).then((data) => {
        setVersions(data);
        setIsLoading(false);
      });
    }
  }, [isOpen, documentId]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-lg border-l border-slate-200 z-40 flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-teal-600" />
          <h2 className="font-medium text-slate-800">
            履歴 ({versions.length}件)
          </h2>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {/* タイムライン */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="text-center text-slate-400 py-8">読み込み中...</div>
        ) : versions.length === 0 ? (
          <div className="text-center text-slate-400 py-8">履歴がありません</div>
        ) : (
          <div className="relative">
            {/* 縦線 */}
            <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-200" />
            
            {/* バージョンリスト */}
            <div className="space-y-4">
              {versions.map((version, index) => (
                <div key={version.id} className="relative pl-6">
                  {/* ドット */}
                  <div
                    className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 ${
                      index === 0
                        ? 'bg-teal-600 border-teal-600'
                        : 'bg-white border-slate-300'
                    }`}
                  />
                  
                  {/* コンテンツ */}
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-slate-700">
                        v{version.version_number}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatDistanceToNow(new Date(version.created_at), {
                          addSuffix: true,
                          locale: ja,
                        })}
                      </span>
                    </div>
                    
                    <p className="text-sm text-slate-600 mb-2">
                      {version.commit_message || '変更なし'}
                    </p>
                    
                    <p className="text-xs text-slate-400 mb-2">
                      {format(new Date(version.created_at), 'yyyy/MM/dd HH:mm', { locale: ja })}
                    </p>

                    {/* AI Summary Card */}
                    {version.aiSummary && (
                      <div className="mb-3 px-3 py-2 bg-purple-50 border-l-2 border-purple-400 rounded-r-md text-[11px] text-purple-900 animate-in fade-in slide-in-from-left-2">
                        ✨ {version.aiSummary}
                      </div>
                    )}
                    
                    {/* アクションボタン */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => onPreview?.(version)}
                        className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700"
                      >
                        <Eye className="w-3 h-3" />
                        プレビュー
                      </button>
                      {index !== 0 && (
                        <button
                          onClick={() => onRestore?.(version)}
                          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
                        >
                          <RotateCcw className="w-3 h-3" />
                          復元
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

# 復元機能の実装

```tsx
const handleRestore = async (version: Version) => {
  // ConfirmModal を使用して注意喚起を表示
  // message: `選択したバージョン (v${version.version_number}) を最新として復元しますか？\n現在の最新状態の上に、このバージョンの内容で新しい履歴が追加されます。`
  
  // ストアを更新
  useEditorStore.getState().setMarkdown(version.content);
  
  // 新しいバージョンとして保存（復元も履歴に残す）
  await saveCurrentDocument(documentId, title, `v${version.version_number}から復元`);
  
  toast.success('復元しました');
  onClose();
};
```

# 履歴のクリア（リセット）

1. **確認**: `ConfirmModal` を `variant="danger"` で表示。
2. **メッセージ**: `このドキュメントのすべての履歴を消去しますか？\n消去後は現在の内容が「v1」として新しく保存されます。この操作は取り消せません。`
3. **実行**: 既存の `versions` を全削除し、現在のエディタ内容を `v1` として新規作成する。

# インタラクティブなコメント編集

履歴ツリー（SVGグラフ）上に表示されるコメントラベルをクリックした際、`BranchCommentModal` を `mode="edit"` で開き、過去の履歴サマリーを事後編集できるように実装すること。

# Diff表示（オプション）

```tsx
import { diffLines } from 'diff';

function DiffView({ oldContent, newContent }: { oldContent: string; newContent: string }) {
  const diff = diffLines(oldContent, newContent);
  
  return (
    <pre className="text-xs font-mono overflow-x-auto">
      {diff.map((part, i) => (
        <span
          key={i}
          className={
            part.added ? 'bg-green-100 text-green-800' :
            part.removed ? 'bg-red-100 text-red-800' :
            'text-slate-600'
          }
        >
          {part.value}
        </span>
      ))}
    </pre>
  );
}
```

# 禁止事項

- **最新バージョンの復元ボタン表示**: 最新（index === 0）には復元ボタンを表示しない。
- **復元・消去確認のスキップ**: 必ず `ConfirmModal` を表示してユーザーに確認を促す。
- **無限スクロールなしで全件取得**: 大量の履歴がある場合はページネーションを実装。
- **アクセシビリティの無視**: タイムラインはスクリーンリーダー対応が必要。

# 完了条件

- [ ] `versionApi.ts` が作成されている
- [ ] `HistoryTimeline.tsx` が作成されている
- [ ] バージョン一覧がタイムライン形式で表示される
- [ ] プレビューボタンが動作する
- [ ] 復元ボタンが動作する（確認ダイアログ付き）
- [ ] ローディング状態が表示される

# 次のスキル

- `migrate-local-to-db`: LocalStorageデータの移行（最終スキル）
