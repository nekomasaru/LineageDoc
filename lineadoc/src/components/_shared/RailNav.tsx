/**
 * RailNav.tsx
 * 
 * 左端のレールナビゲーション（48px幅）
 * プロジェクト中心のコンテキスト切り替えを行う
 * 
 * @skill ui-layout-app
 */

'use client';

import { Home, Settings, HelpCircle, GitBranch, Info, FolderGit2 } from 'lucide-react';
import { useAppStore, SidebarView } from '@/stores/appStore';
import { Logo } from '@/components/_shared/Logo';

interface RailNavProps {
    onHelpClick?: () => void;
}

export function RailNav({ onHelpClick }: RailNavProps) {
    const {
        activeSidebarView,
        setActiveSidebarView,
        currentDocumentId,
        setActiveSidebarView: setView // alias
    } = useAppStore();

    // 共通のボタンスタイル
    const getButtonClass = (isActive: boolean, isDisabled: boolean) => `
        relative w-10 h-10 rounded-lg flex items-center justify-center
        transition-all duration-150 group
        ${isActive
            ? 'bg-cyan-600 text-white'
            : isDisabled
                ? 'text-slate-600 cursor-not-allowed opacity-50'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }
    `;

    return (
        <nav className="w-12 bg-cyan-900 flex flex-col items-center py-3 shrink-0 z-50">
            {/* アプリロゴ (Home/Project List) */}
            <div className="mb-4">
                <button
                    onClick={() => setView('project_list')}
                    className="p-1 rounded hover:bg-cyan-800 transition-colors"
                    title="ホーム (プロジェクト一覧)"
                >
                    <Logo size={28} useImage={false} className={`text-cyan-400 drop-shadow-sm ${activeSidebarView === 'project_list' ? 'text-white' : ''}`} />
                </button>
            </div>

            {/* ナビゲーション */}
            <div className="flex-1 flex flex-col gap-2 w-full items-center">

                {/* Spacer / Explicit Project Icon if visual hierarchy needs it */}
                {/* <div className="h-px w-6 bg-cyan-800/50 my-1" /> */}

                {/* History (Document Context) */}
                <button
                    onClick={() => currentDocumentId && setView('history')}
                    disabled={!currentDocumentId}
                    className={getButtonClass(activeSidebarView === 'history', !currentDocumentId)}
                    title={currentDocumentId ? "履歴 (Linea)" : "ドキュメントを選択してください"}
                >
                    <GitBranch className="w-5 h-5" />
                    {activeSidebarView === 'history' && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-r" />
                    )}
                </button>

                {/* Attributes (Document/Project Context) */}
                <button
                    onClick={() => currentDocumentId && setView('attributes')}
                    disabled={!currentDocumentId}
                    className={getButtonClass(activeSidebarView === 'attributes', !currentDocumentId)}
                    title={currentDocumentId ? "属性情報" : "ドキュメントを選択してください"}
                >
                    <Info className="w-5 h-5" />
                    {activeSidebarView === 'attributes' && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-r" />
                    )}
                </button>

                <div className="flex-1" />

                {/* Settings */}
                <button
                    onClick={() => alert('Settings Modal Not Implemented Yet')} // TODO: Settings Modal
                    className={getButtonClass(false, false)}
                    title="設定"
                >
                    <Settings className="w-5 h-5" />
                </button>

            </div>

            {/* ヘルプ */}
            {onHelpClick && (
                <button
                    onClick={onHelpClick}
                    className="mt-2 w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white transition-colors group"
                    title="ヘルプ"
                >
                    <HelpCircle className="w-5 h-5" />
                </button>
            )}
        </nav>
    );
}
