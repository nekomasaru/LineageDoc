/**
 * QualityPanel.tsx
 * 
 * 文書の品質チェック結果（Vale/mdschema）を表示するパネル
 * RightContextPanel内に表示されることを想定し、垂直レイアウトに最適化。
 */

'use client';

import { AlertTriangle, Info, AlertCircle, ShieldCheck } from 'lucide-react';
import { useQualityStore, QualityIssue } from '@/stores/qualityStore';

interface QualityPanelProps {
    onIssueClick?: (issue: QualityIssue) => void;
    className?: string; // コンテナからのスタイリングを受け入れ
}

export function QualityPanel({ onIssueClick, className = '' }: QualityPanelProps) {
    const { issues, isChecking } = useQualityStore();

    const errorCount = issues.filter(i => i.level === 'error').length;
    const warningCount = issues.filter(i => i.level === 'warning').length;
    const suggestionCount = issues.filter(i => i.level === 'suggestion').length;

    return (
        <div className={`flex flex-col h-full bg-white ${className}`}>
            {/* ヘッダー */}
            <div className="p-4 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-5 h-5 text-cyan-600" />
                    <h2 className="font-bold text-slate-800">Governance Check</h2>
                </div>

                {isChecking ? (
                    <p className="text-xs text-slate-400 animate-pulse">チェック実行中...</p>
                ) : (
                    <div className="flex gap-3 text-xs">
                        <span className={`font-semibold ${errorCount > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                            {errorCount} Errors
                        </span>
                        <span className={`font-semibold ${warningCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                            {warningCount} Warnings
                        </span>
                    </div>
                )}
            </div>

            {/* コンテンツエリア */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {issues.length === 0 && !isChecking && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400">
                        <ShieldCheck className="w-12 h-12 mb-3 text-green-100" />
                        <p className="text-sm font-medium text-slate-600">問題は見つかりませんでした</p>
                        <p className="text-xs mt-1">品質基準を満たしています</p>
                    </div>
                )}

                {issues.map((issue) => (
                    <div
                        key={issue.id}
                        onClick={() => onIssueClick?.(issue)}
                        className={`
                            p-3 rounded-lg border text-sm cursor-pointer transition-all hover:shadow-sm
                            ${issue.level === 'error' ? 'bg-red-50 border-red-100 hover:border-red-200' :
                                issue.level === 'warning' ? 'bg-amber-50 border-amber-100 hover:border-amber-200' :
                                    'bg-blue-50 border-blue-100 hover:border-blue-200'}
                        `}
                    >
                        <div className="flex items-start gap-2 mb-1">
                            {issue.level === 'error' ? <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" /> :
                                issue.level === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" /> :
                                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />}

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-white rounded border border-current opacity-60">
                                        {issue.source}
                                    </span>
                                    {issue.field && (
                                        <span className="text-[10px] text-slate-500 font-mono">
                                            [{issue.field}]
                                        </span>
                                    )}
                                </div>
                                <p className={`text-xs leading-relaxed ${issue.level === 'error' ? 'text-red-900' :
                                        issue.level === 'warning' ? 'text-amber-900' : 'text-blue-900'
                                    }`}>
                                    {issue.message}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
