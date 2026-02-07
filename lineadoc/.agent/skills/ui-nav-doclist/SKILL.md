---
name: ui-nav-doclist
description: 階層化されたサイドバーナビゲーション（プロジェクト一覧・ドキュメント一覧）の実装スキル。
allowed-tools: [file_edit]
meta:
  domain: frontend
  role: ui-component
  tech_stack: react, supabase, zustand
  phase: 2
  estimated_time: 50min
  dependencies: [data-api-fetch, ui-layout-app]
---

# Skill: ui-nav-doclist

## 概要
階層化されたサイドバーナビゲーション（プロジェクト一覧・ドキュメント一覧）の実装スキル。

## 役割
1.  **Project List View**:
    - チームごとのプロジェクト表示。
    - 検索・フィルタリング。
    - 新規プロジェクト作成への導線。
2.  **Project Detail View (Document List)**:
    - プロジェクト内のドキュメント一覧表示。
    - ドキュメントの選択、追加、削除、**複製 (Duplicate)**、**名前変更 (Rename)**。
    - 各アイテムの右側に表示される「...」(MoreHorizontal) ボタンからのアクションメニュー。
    - プロジェクト設定へのアクセス。

## 実装詳細
- **コンポーネント**: `SidebarContainer` 内で `ProjectNavigator` と `DocumentNavigator` を条件付きレンダリングする。
- **データソース**: `useProjectStore` (プロジェクト/チーム) と `useDocumentStore` (ドキュメント) を組み合わせる。
- **フィルタリング**:
    - チームによるフィルタ。
    - プロジェクト内のドキュメント検索。
- **UX**:
    - プロジェクト選択時は、ドキュメントリストへ遷移するアニメーション等が望ましい。
    - 各アイテムはクリックしやすく、アクティブ状態が明確であること。

# このスキルでやること

サイドバーに文書一覧を表示し、文書の選択・削除・新規作成ができるコンポーネントを実装する。

# 設計思想

## 機能要件

1. **文書一覧表示**: Supabaseから取得した文書をリスト表示
2. **文書選択**: クリックで該当文書をエディタに読み込み
3. **文書操作**: 「...」メニュー（MoreHorizontal）から削除、複製、名前変更を実行。
4. **文書複製**: 既存文書のコピーを生成し、タイトルに「 (コピー)」を付与。
5. **新規作成 (Template Selection)**:
    - 単なる「新規作成」ではなく、**テンプレート選択画面（カード形式）**を表示する。
    - テンプレートごとに「初期Markdown」と「品質設定」が適用される。
6. **リアルタイム更新**: 他のタブでの変更を反映（オプション）

## UIデザイン

```
┌─────────────────────┐
│  [+ 新規ドキュメント] │
├─────────────────────┤
│  🔍 検索...          │
├─────────────────────┤
│  ドキュメント (5)    │
│                     │
│  📄 プロジェクト計画 │  ← 選択中（ハイライト）
│     更新: 2分前      │
│                     │
│  📄 議事録 01/30    │
│     更新: 1時間前    │
│                     │
│  📄 要件定義書      │
│     更新: 昨日       │
│                     │
└─────────────────────┘
```

# 作成するファイル

## `src/stores/documentStore.ts`

```typescript
import { create } from 'zustand';

interface Document {
  id: string;
  title: string;
  updated_at: string;
}

interface DocumentStore {
  documents: Document[];
  currentDocumentId: string | null;
  isLoading: boolean;
  
  setDocuments: (docs: Document[]) => void;
  setCurrentDocumentId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  removeDocument: (id: string) => void;
}

export const useDocumentStore = create<DocumentStore>((set) => ({
  documents: [],
  currentDocumentId: null,
  isLoading: false,
  
  setDocuments: (documents) => set({ documents }),
  setCurrentDocumentId: (currentDocumentId) => set({ currentDocumentId }),
  setLoading: (isLoading) => set({ isLoading }),
  removeDocument: (id) => set((state) => ({
    documents: state.documents.filter((d) => d.id !== id),
  })),
}));
```

## `src/components/_layout/DocumentList.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { FileText, Trash2, MoreVertical, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useDocumentStore } from '@/stores/documentStore';
import { fetchDocumentList, deleteDocument } from '@/lib/api/documentApi';
import { ConfirmModal } from '@/components/_shared/ConfirmModal';

export function DocumentList() {
  const { documents, currentDocumentId, isLoading, setDocuments, setCurrentDocumentId, setLoading, removeDocument } = useDocumentStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // 文書一覧を取得
  useEffect(() => {
    const loadDocuments = async () => {
      setLoading(true);
      const docs = await fetchDocumentList();
      setDocuments(docs);
      setLoading(false);
    };
    loadDocuments();
  }, []);

  // 検索フィルタ
  const filteredDocs = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 文書選択
  const handleSelect = (id: string) => {
    setCurrentDocumentId(id);
    // ここでeditorStoreにも文書内容をロードする処理を追加
  };

  // 削除確認
  const handleDeleteConfirm = async () => {
    if (deleteTarget) {
      const success = await deleteDocument(deleteTarget);
      if (success) {
        removeDocument(deleteTarget);
        if (currentDocumentId === deleteTarget) {
          setCurrentDocumentId(null);
        }
      }
      setDeleteTarget(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 検索 */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* ヘッダー */}
      <div className="px-4 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
        ドキュメント ({filteredDocs.length})
      </div>

      {/* リスト */}
      <div className="flex-1 overflow-y-auto px-2">
        {isLoading ? (
          <div className="text-center py-8 text-slate-400 text-sm">読み込み中...</div>
        ) : filteredDocs.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            {searchQuery ? '見つかりません' : 'ドキュメントがありません'}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className={`
                  group relative flex items-start gap-2 px-3 py-2 rounded-lg cursor-pointer
                  ${currentDocumentId === doc.id
                    ? 'bg-teal-50 text-teal-700'
                    : 'hover:bg-slate-100 text-slate-600'
                  }
                `}
                onClick={() => handleSelect(doc.id)}
              >
                <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{doc.title}</div>
                </div>

                {/* メニューボタン（三点リーダー） */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleRename(doc.id)}>名前の変更</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicate(doc.id)}>複製</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDeleteTarget(doc.id)} className="text-red-600">削除</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 削除確認モーダル */}
      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="ドキュメントを削除"
        message="このドキュメントを削除しますか？この操作は取り消せません。"
        variant="danger"
      />
    </div>
  );
}
```

# Sidebarへの統合

```tsx
// src/components/_layout/Sidebar.tsx

import { DocumentList } from './DocumentList';

export function Sidebar({ onClose }: SidebarProps) {
  return (
    <div className="h-full flex flex-col">
      {/* 新規作成ボタン */}
      <div className="p-3">
        <button className="w-full flex items-center gap-2 px-3 py-2 bg-teal-600 text-white rounded-lg">
          新規ドキュメント
        </button>
      </div>

      {/* 文書リスト */}
      <DocumentList />
    </div>
  );
}
```

# 禁止事項

- **全件取得のパフォーマンス問題**: 大量の文書がある場合はページネーションを実装。
- **削除確認のスキップ**: 必ずConfirmModalを表示。
- **選択中文書の削除後の状態未処理**: `currentDocumentId`をnullにリセット。
- **固定幅の指定**: 親コンポーネントが `ResizablePanel` であるため、`w-72` などの固定幅を指定してはならない。必ず `w-full` を使用すること。

# 完了条件

- [ ] `documentStore.ts` が作成されている
- [ ] `DocumentList.tsx` が作成されている
- [ ] 文書一覧が表示される
- [ ] 検索フィルタが動作する
- [ ] 文書選択でエディタが更新される
- [ ] 削除が動作する（確認モーダル付き）

# 次のスキル

- `history-ui-timeline`: 選択中文書の履歴表示
