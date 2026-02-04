'use client';

import { useQualityStore, QualityIssue } from '@/stores/qualityStore';
import { AlertCircle, AlertTriangle, Lightbulb, CheckCircle2 } from 'lucide-react';
import { useEditorStore } from '@/stores/editorStore';

export function QualityPanel() {
    const { issues, isChecking, setHighlightedIssue } = useQualityStore();
    const { markdown } = useEditorStore();

    if (issues.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center">
                <CheckCircle2 size={48} className="mb-4 text-green-500 opacity-50" />
                <p className="font-medium text-slate-600">問題は見つかりませんでした</p>
                <p className="text-sm mt-2">公文書ガイドラインに準拠しています。</p>
            </div>
        );
    }

    const errors = issues.filter(i => i.level === 'error');
    const warnings = issues.filter(i => i.level === 'warning');
    const suggestions = issues.filter(i => i.level === 'suggestion');

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="p-4 border-b border-slate-200 bg-white">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <span className="bg-slate-100 p-1 rounded">
                        {issues.length}
                    </span>
                    件の問題
                </h3>
                <div className="flex gap-2 mt-2 text-xs">
                    {errors.length > 0 && (
                        <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full">
                            <AlertCircle size={12} /> {errors.length}
                        </span>
                    )}
                    {warnings.length > 0 && (
                        <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                            <AlertTriangle size={12} /> {warnings.length}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {issues.map((issue) => (
                    <IssueCard
                        key={issue.id}
                        issue={issue}
                        onClick={() => setHighlightedIssue(issue)}
                    />
                ))}
            </div>
        </div>
    );
}

function IssueCard({ issue, onClick }: { issue: QualityIssue, onClick: () => void }) {
    const icon = {
        error: <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />,
        warning: <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />,
        suggestion: <Lightbulb size={16} className="text-cyan-500 mt-0.5 shrink-0" />,
    }[issue.level];

    const bgClass = {
        error: 'bg-white border-l-4 border-l-red-500 hover:bg-red-50',
        warning: 'bg-white border-l-4 border-l-amber-500 hover:bg-amber-50',
        suggestion: 'bg-white border-l-4 border-l-cyan-500 hover:bg-cyan-50',
    }[issue.level];

    return (
        <div
            onClick={onClick}
            className={`
                group p-3 rounded shadow-sm border border-slate-200 cursor-pointer transition-colors
                ${bgClass}
            `}
        >
            <div className="flex gap-3 items-start">
                {icon}
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 font-medium leading-relaxed">
                        {issue.message}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                            {issue.source}
                        </span>
                        {issue.line && (
                            <span className="text-xs text-slate-400 group-hover:text-slate-600">
                                行 {issue.line}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
