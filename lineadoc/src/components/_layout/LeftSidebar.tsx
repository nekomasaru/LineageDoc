/**
 * LeftSidebar.tsx
 * 
 * Notion風の左サイドバーナビゲーション
 * - プロジェクト/チーム切り替え
 * - ドキュメントツリー
 * - チーム設定へのアクセス
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import {
    Search, Plus, Home, Settings, Users, ChevronLeft,
    ChevronRight, FileText, Hash, ShieldCheck, MoreHorizontal,
    Copy, Trash2, Edit2, Check, X
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useProjectStore } from '@/stores/projectStore';
import { useDocumentStore } from '@/stores/documentStore';
import { ConfirmModal } from '@/components/_shared/ConfirmModal';

interface LeftSidebarProps {
    className?: string;
}

export function LeftSidebar({ className = '' }: LeftSidebarProps) {
    const { setViewMode, setActiveModal, setCurrentDocument } = useAppStore();
    const { projects, activeProjectId } = useProjectStore();
    const { documents, duplicateDocument, deleteDocument, renameDocument } = useDocumentStore();
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const renameInputRef = useRef<HTMLInputElement>(null);

    const activeProject = projects.find(p => p.id === activeProjectId);
    const projectDocuments = documents.filter(d => d.projectId === activeProjectId);

    useEffect(() => {
        if (renamingId && renameInputRef.current) {
            renameInputRef.current.focus();
            renameInputRef.current.select();
        }
    }, [renamingId]);

    const handleStartRename = (id: string, currentTitle: string) => {
        setRenamingId(id);
        setRenameValue(currentTitle);
        setMenuOpenId(null);
    };

    const handleConfirmRename = (id: string) => {
        if (renameValue.trim()) {
            renameDocument(id, renameValue.trim());
        }
        setRenamingId(null);
    };

    const handleDuplicate = (id: string) => {
        duplicateDocument(id);
        setMenuOpenId(null);
    };

    return (
        <div className={`flex flex-col h-full bg-slate-50 border-r border-slate-200 ${className}`}>
            {/* Header: Project/Team Context */}
            <div className="h-14 flex items-center px-4 border-b border-slate-200 hover:bg-slate-100 cursor-pointer transition-colors shrink-0">
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-6 h-6 rounded bg-cyan-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {activeProject ? activeProject.name.slice(0, 1).toUpperCase() : 'P'}
                    </div>
                    <span className="font-semibold text-slate-700 truncate text-sm">
                        {activeProject ? activeProject.name : 'Select Project'}
                    </span>
                    <ChevronRight className="w-3 h-3 text-slate-400 rotate-90" />
                </div>
            </div>

            {/* Quick Actions */}
            <div className="p-2 space-y-1 shrink-0">
                <button
                    onClick={() => console.log('Global Search')}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200 rounded-md transition-colors text-left"
                >
                    <Search className="w-4 h-4" />
                    <span>検索</span>
                </button>
                <button
                    onClick={() => setViewMode('hub')}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200 rounded-md transition-colors text-left"
                >
                    <Home className="w-4 h-4" />
                    <span>ホーム</span>
                </button>
                <button
                    onClick={() => setActiveModal('settings')}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200 rounded-md transition-colors text-left"
                >
                    <Settings className="w-4 h-4" />
                    <span>設定</span>
                </button>
                <button
                    onClick={() => setViewMode('governance')}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200 rounded-md transition-colors text-left"
                >
                    <ShieldCheck className="w-4 h-4 text-cyan-600" />
                    <span>ガバナンス設定</span>
                </button>
            </div>

            {/* Team Management */}
            <div className="px-3 py-2 shrink-0">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Team
                </div>
                <button
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-200 rounded-md transition-colors text-left"
                >
                    <Users className="w-4 h-4" />
                    <span>メンバー管理 & アサイン</span>
                </button>
            </div>


            {/* Scrollable Content: Document Tree */}
            <div className="flex-1 overflow-y-auto px-2 py-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">
                    Documents
                </div>
                <div className="space-y-0.5">
                    {projectDocuments.map(doc => (
                        <div key={doc.id} className="relative group">
                            {renamingId === doc.id ? (
                                <div className="flex items-center gap-1 px-2 py-1 bg-white border border-cyan-200 rounded-md shadow-sm mx-1">
                                    <input
                                        ref={renameInputRef}
                                        type="text"
                                        value={renameValue}
                                        onChange={(e) => setRenameValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleConfirmRename(doc.id);
                                            if (e.key === 'Escape') setRenamingId(null);
                                        }}
                                        className="flex-1 text-sm outline-none text-slate-700 min-w-0"
                                    />
                                    <button onClick={() => handleConfirmRename(doc.id)} className="p-0.5 text-emerald-600 hover:bg-emerald-50 rounded">
                                        <Check size={14} />
                                    </button>
                                    <button onClick={() => setRenamingId(null)} className="p-0.5 text-slate-400 hover:bg-slate-50 rounded">
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center group/item">
                                    <button
                                        onClick={() => setCurrentDocument(doc.id, doc.title)}
                                        className="flex-1 flex items-center gap-2 px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-200 rounded-md transition-colors text-left truncate"
                                    >
                                        <FileText className="w-4 h-4 text-slate-400 group-hover:text-cyan-600 shrink-0" />
                                        <span className="truncate">{doc.title || '無題のドキュメント'}</span>
                                    </button>

                                    {/* Action Trigger */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setMenuOpenId(menuOpenId === doc.id ? null : doc.id);
                                        }}
                                        className={`p-1 mr-1 rounded hover:bg-slate-300 transition-opacity shrink-0 ${menuOpenId === doc.id ? 'opacity-100 bg-slate-300' : 'opacity-0 group-hover/item:opacity-100'}`}
                                    >
                                        <MoreHorizontal size={14} className="text-slate-500" />
                                    </button>

                                    {/* Dropdown Menu */}
                                    {menuOpenId === doc.id && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setMenuOpenId(null)} />
                                            <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                                <button
                                                    onClick={() => handleStartRename(doc.id, doc.title)}
                                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
                                                >
                                                    <Edit2 size={12} />
                                                    <span>名前の変更</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDuplicate(doc.id)}
                                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
                                                >
                                                    <Copy size={12} />
                                                    <span>複製</span>
                                                </button>
                                                <div className="h-px bg-slate-100 my-1" />
                                                <button
                                                    onClick={() => {
                                                        setDeleteTarget(doc.id);
                                                        setMenuOpenId(null);
                                                    }}
                                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors"
                                                >
                                                    <Trash2 size={12} />
                                                    <span>削除</span>
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                    <button
                        onClick={() => setActiveModal('create-document')}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors text-left mt-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span>新規ドキュメント</span>
                    </button>
                </div>
            </div>

            {/* Delete Confirmation */}
            <ConfirmModal
                isOpen={deleteTarget !== null}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => {
                    if (deleteTarget) deleteDocument(deleteTarget);
                    setDeleteTarget(null);
                }}
                title="ドキュメントの削除"
                message="このドキュメントを本当に削除しますか？\nこの操作は取り消せません。"
                confirmText="削除する"
                variant="danger"
            />
        </div>
    );
}
