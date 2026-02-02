/**
 * RailNav.tsx
 * 
 * 左端のレールナビゲーション（48px幅）
 * VSCode/Notion風のアイコンナビ
 * 
 * @skill ui-layout-app
 */

'use client';

import { Home, Search, FileText, Settings, HelpCircle, GitBranch, Info, Share2 } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { Logo } from '@/components/_shared/Logo';

/**
 * ナビゲーション項目
 */
export type NavItem = 'home' | 'search' | 'documents' | 'history' | 'metadata' | 'graph' | 'settings';

interface RailNavProps {
    activeItem: NavItem;
    onItemClick: (item: NavItem) => void;
    onHelpClick?: () => void;
}

const NAV_ITEMS: { id: NavItem; icon: typeof Home | typeof GitBranch; label: string }[] = [
    { id: 'home', icon: Home, label: 'ホーム' },
    { id: 'documents', icon: FileText, label: 'エクスプローラー' },
    { id: 'metadata', icon: Info, label: '属性 (Metadata)' },
    { id: 'history', icon: GitBranch, label: '履歴 (Linea)' },
    { id: 'graph', icon: Share2, label: 'グラフ' },
    { id: 'search', icon: Search, label: '横断検索' },
    { id: 'settings', icon: Settings, label: '設定' },
];

export function RailNav({ activeItem, onItemClick, onHelpClick }: RailNavProps) {
    return (
        <nav className="w-12 bg-cyan-900 flex flex-col items-center py-3 shrink-0">
            {/* ロゴ */}
            <div className="mb-6">
                <Logo size={32} useImage={false} className="text-cyan-400 drop-shadow-sm" />
            </div>

            {/* ナビ項目 */}
            <div className="flex-1 flex flex-col gap-1">
                {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
                    const isActive = activeItem === id;
                    const isDisabled = id === 'search' || id === 'settings';

                    return (
                        <button
                            key={id}
                            onClick={() => !isDisabled && onItemClick(id)}
                            disabled={isDisabled}
                            className={`
                relative w-10 h-10 rounded-lg flex items-center justify-center
                transition-all duration-150 group
                ${isActive
                                    ? 'bg-cyan-600 text-white'
                                    : isDisabled
                                        ? 'text-slate-600 cursor-not-allowed'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }
              `}
                            title={isDisabled ? `${label}（将来実装）` : label}
                        >
                            <Icon className="w-5 h-5" />

                            {/* アクティブインジケーター */}
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-r" />
                            )}

                            {/* ツールチップ */}
                            <div className="
                absolute left-full ml-3 px-2 py-1 bg-slate-800 text-white text-xs rounded
                opacity-0 group-hover:opacity-100 pointer-events-none
                transition-opacity whitespace-nowrap z-50
              ">
                                {label}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* ヘルプ（下部固定） */}
            {onHelpClick && (
                <button
                    onClick={onHelpClick}
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white transition-colors group"
                    title="ヘルプ"
                >
                    <HelpCircle className="w-5 h-5" />
                    <div className="
            absolute left-full ml-3 px-2 py-1 bg-slate-800 text-white text-xs rounded
            opacity-0 group-hover:opacity-100 pointer-events-none
            transition-opacity whitespace-nowrap z-50
          ">
                        ヘルプ
                    </div>
                </button>
            )}
        </nav>
    );
}
