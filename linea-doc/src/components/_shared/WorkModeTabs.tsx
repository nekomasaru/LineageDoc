/**
 * WorkModeTabs.tsx
 * 
 * 3つのワークモード（執筆・出力・履歴）を切り替えるタブUI
 * 
 * @skill app-ux-modes
 */

'use client';

import { Edit3, Eye, GitBranch } from 'lucide-react';
import { useAppStore, WorkMode } from '@/stores/appStore';

const MODES: { id: WorkMode; label: string; icon: typeof Edit3; description: string }[] = [
    { id: 'write', label: '執筆', icon: Edit3, description: '文書を編集' },
    { id: 'proof', label: '出力', icon: Eye, description: 'プレビュー・印刷' },
];

interface WorkModeTabsProps {
    className?: string;
}

export function WorkModeTabs({ className = '' }: WorkModeTabsProps) {
    const { workMode, setWorkMode } = useAppStore();

    return (
        <div className={`flex gap-1 bg-slate-100 rounded-lg p-1 ${className}`}>
            {MODES.map(({ id, label, icon: Icon }) => (
                <button
                    key={id}
                    onClick={() => setWorkMode(id)}
                    className={`
            flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium
            transition-all duration-150
            ${workMode === id
                            ? 'bg-white text-cyan-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }
          `}
                    aria-selected={workMode === id}
                    role="tab"
                >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{label}</span>
                </button>
            ))}
        </div>
    );
}
