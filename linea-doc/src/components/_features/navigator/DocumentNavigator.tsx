/**
 * DocumentNavigator.tsx
 * 
 * メタデータ（タグ・プロジェクト）に基づくドキュメントナビゲーション
 * 旧 ProjectExplorer を置き換えるフラット + フィルタリング構成
 */

'use client';

import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Tag, Folder, FileText, Plus, Search, X, Hash, LayoutGrid, Trash2 } from 'lucide-react';
import { useDocumentStore, selectFilteredDocuments, selectUniqueProjects, selectUniqueTags } from '@/stores/documentStore';
import { useAppStore } from '@/stores/appStore';
import { useEditorStore } from '@/stores/editorStore';

export function DocumentNavigator() {
    const {
        documents,
        filterProject,
        filterTag,
        searchQuery,
        addDocument,
        deleteDocument,
        setFilterProject,
        setFilterTag,
        setSearchQuery
    } = useDocumentStore();

    const { currentDocumentId, setCurrentDocument } = useAppStore();
    const { loadDocument } = useEditorStore();

    // フィルタリング済みドキュメント
    const filteredDocs = useDocumentStore(useShallow(selectFilteredDocuments));
    // ユニークなプロジェクトとタグ
    const projects = useDocumentStore(useShallow(selectUniqueProjects));
    const tags = useDocumentStore(useShallow(selectUniqueTags));

    const handleCreateDocument = () => {
        const title = prompt('新しいドキュメントの名前を入力してください');
        if (title) {
            // 現在のフィルタ状態を引き継いだ初期コンテンツを作成することも可能だが
            // 一旦はシンプルに作成
            const newDoc = addDocument(title);
            handleSelectDocument(newDoc.id, newDoc.title, newDoc.content);
        }
    };

    const handleSelectDocument = (id: string, title: string, content: string) => {
        setCurrentDocument(id, title);
        loadDocument(content);
    };

    const handleDeleteDocument = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('このドキュメントを削除しますか？')) {
            deleteDocument(id);
            if (currentDocumentId === id) {
                setCurrentDocument(null);
            }
        }
    };

    return (
        // Force hydration sync
        <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200 w-full shrink-0">
            {/* 上部: 検索 & アクティブフィルタ */}
            <div className="p-3 border-b border-slate-200 bg-white space-y-3">
                {/* 検索バー */}
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="タイトルや本文を検索..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-8 py-1.5 text-sm bg-slate-100 border-none rounded-md focus:ring-2 focus:ring-cyan-500 transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* アクティブフィルタ表示 */}
                {(filterProject || filterTag) && (
                    <div className="flex flex-wrap gap-1.5">
                        {filterProject && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-100 text-cyan-700 text-xs rounded-full font-medium">
                                <Folder className="w-3 h-3" />
                                {filterProject}
                                <button onClick={() => setFilterProject(null)} className="hover:text-cyan-900"><X className="w-3 h-3" /></button>
                            </span>
                        )}
                        {filterTag && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium">
                                <Tag className="w-3 h-3" />
                                {filterTag}
                                <button onClick={() => setFilterTag(null)} className="hover:text-indigo-900"><X className="w-3 h-3" /></button>
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* フィルタ未選択時はカテゴリ一覧を表示 */}
                {!filterProject && !filterTag && !searchQuery ? (
                    <div className="p-2 space-y-4">
                        {/* プロジェクト一覧 */}
                        <div>
                            <h3 className="px-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                                プロジェクト (Project)
                            </h3>
                            {projects.length === 0 ? (
                                <p className="px-2 text-xs text-slate-400 italic">プロジェクト分類なし</p>
                            ) : (
                                <div className="space-y-0.5">
                                    {projects.map(prj => (
                                        <button
                                            key={prj}
                                            onClick={() => setFilterProject(prj)}
                                            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200 rounded-md text-left transition-colors"
                                        >
                                            <Folder className="w-4 h-4 text-cyan-600 opacity-70" />
                                            {prj}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* タグクラウド */}
                        <div>
                            <h3 className="px-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                                タグ (Tags)
                            </h3>
                            {tags.length === 0 ? (
                                <p className="px-2 text-xs text-slate-400 italic">タグなし</p>
                            ) : (
                                <div className="flex flex-wrap gap-1.5 px-2">
                                    {tags.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => setFilterTag(tag)}
                                            className="px-2 py-1 text-xs bg-white border border-slate-200 text-slate-600 rounded-md hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                                        >
                                            #{tag}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="pt-4 px-2">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">全ドキュメント</h3>
                            <button
                                onClick={() => setSearchQuery(' ')} // 空白で全件表示ハック
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200 rounded-md text-left transition-colors"
                            >
                                <LayoutGrid className="w-4 h-4 text-slate-400" />
                                すべて表示 ({documents.length})
                            </button>
                        </div>
                    </div>
                ) : (
                    /* フィルタ適用時はドキュメントリストを表示 */
                    <div className="py-2">
                        {filteredDocs.length === 0 ? (
                            <div className="px-4 py-8 text-center text-slate-400 text-sm">
                                <p>該当するドキュメントが<br />見つかりません</p>
                                <button
                                    onClick={() => { setFilterProject(null); setFilterTag(null); setSearchQuery(''); }}
                                    className="mt-2 text-cyan-600 hover:underline text-xs"
                                >
                                    フィルタを解除
                                </button>
                            </div>
                        ) : (
                            filteredDocs.map(doc => (
                                <div
                                    key={doc.id}
                                    onClick={() => handleSelectDocument(doc.id, doc.title, doc.content)}
                                    className={`
                                        group relative flex flex-col gap-1 py-2 px-4 cursor-pointer border-l-2
                                        ${currentDocumentId === doc.id
                                            ? 'bg-cyan-50 border-cyan-500'
                                            : 'border-transparent hover:bg-slate-100'
                                        }
                                    `}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <FileText className={`w-3.5 h-3.5 shrink-0 ${currentDocumentId === doc.id ? 'text-cyan-600' : 'text-slate-400'}`} />
                                            <span className={`text-sm font-medium truncate ${currentDocumentId === doc.id ? 'text-cyan-900' : 'text-slate-700'}`}>
                                                {doc.title}
                                            </span>
                                        </div>
                                    </div>

                                    {/* メタデータバッジ */}
                                    <div className="flex flex-wrap gap-1 ml-5.5">
                                        {doc.frontmatter.project && (
                                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200 truncate max-w-[80px]">
                                                {doc.frontmatter.project}
                                            </span>
                                        )}
                                        {Array.isArray(doc.frontmatter.tags) && doc.frontmatter.tags.slice(0, 2).map(tag => (
                                            <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-400 rounded border border-indigo-100">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>

                                    <button
                                        onClick={(e) => handleDeleteDocument(e, doc.id)}
                                        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 hover:text-red-600 rounded transition-opacity"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* フッター: 新規作成 */}
            <div className="p-3 border-t border-slate-200 bg-slate-50">
                <button
                    onClick={handleCreateDocument}
                    className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-md shadow-sm transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    新規ドキュメント
                </button>
            </div>
        </div>
    );
}
