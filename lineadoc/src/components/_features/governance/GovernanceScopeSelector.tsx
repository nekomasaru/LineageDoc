'use client';

import React from 'react';
import { FileText, FolderOpen, Users } from 'lucide-react';

export type GovernanceScope = 'document' | 'project' | 'team';

interface GovernanceScopeSelectorProps {
    scope: GovernanceScope;
    onScopeChange: (scope: GovernanceScope) => void;
}

export const GovernanceScopeSelector: React.FC<GovernanceScopeSelectorProps> = ({ scope, onScopeChange }) => {
    return (
        <div className="flex bg-slate-100 p-1 rounded-xl w-fit shrink-0">
            <button
                onClick={() => onScopeChange('document')}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${scope === 'document' ? 'bg-white text-green-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <FileText size={14} />
                <span>この文書</span>
            </button>
            <button
                onClick={() => onScopeChange('project')}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${scope === 'project' ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <FolderOpen size={14} />
                <span>プロジェクト</span>
            </button>
            <button
                onClick={() => onScopeChange('team')}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${scope === 'team' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Users size={14} />
                <span>チーム</span>
            </button>
        </div>
    );
};
