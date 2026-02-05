/**
 * LeftSidebar.tsx
 * 
 * Notion風の左サイドバーナビゲーション
 * - プロジェクト/チーム切り替え
 * - ドキュメントツリー
 * - チーム設定へのアクセス
 */

'use client';

import {
    Search, Plus, Home, Settings, Users, ChevronLeft,
    ChevronRight, FileText, Hash
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useProjectStore } from '@/stores/projectStore';
import { useDocumentStore } from '@/stores/documentStore';

interface LeftSidebarProps {
    className?: string;
}

export function LeftSidebar({ className = '' }: LeftSidebarProps) {
    const { setViewMode, setCurrentDocument, setActiveModal } = useAppStore();
    const { activeProjectId, projects } = useProjectStore();
    const { documents } = useDocumentStore();

    const activeProject = projects.find(p => p.id === activeProjectId);
    const projectDocuments = documents.filter(d => d.projectId === activeProjectId);

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
                        <button
                            key={doc.id}
                            onClick={() => setCurrentDocument(doc.id, doc.title)}
                            className="w-full flex items-center gap-2 px-2 py-1 text-sm text-slate-600 hover:bg-slate-200 rounded-md transition-colors text-left group"
                        >
                            <FileText className="w-4 h-4 text-slate-400 group-hover:text-cyan-600" />
                            <span className="truncate">{doc.title || '無題のドキュメント'}</span>
                        </button>
                    ))}
                    <button
                        onClick={() => setActiveModal('create-document')}
                        className="w-full flex items-center gap-2 px-2 py-1 text-sm text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors text-left mt-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span>新規ドキュメント</span>
                    </button>
                </div>
            </div>

            {/* Footer if needed */}
        </div>
    );
}
