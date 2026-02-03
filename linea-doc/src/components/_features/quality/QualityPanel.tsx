/**
 * QualityPanel.tsx
 * 
 * 文書の品質チェック結果（Vale/mdschema）を表示するパネル
 */

'use client';

import { useState } from 'react';
import { AlertTriangle, Info, AlertCircle, ChevronUp, ChevronDown, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useQualityStore, QualityIssue } from '@/stores/qualityStore';

interface QualityPanelProps {
    onIssueClick?: (issue: QualityIssue) => void;
}

export function QualityPanel({ onIssueClick }: QualityPanelProps) {
    const { issues, isChecking } = useQualityStore();
    const [isExpanded, setIsExpanded] = useState(false);

    const errorCount = issues.filter(i => i.level === 'error').length;
    const warningCount = issues.filter(i => i.level === 'warning').length;
    const suggestionCount = issues.filter(i => i.level === 'suggestion').length;

    if (issues.length === 0 && !isChecking) {
        return (
            <div className="h-8 bg-slate-100 border-t border-slate-200 flex items-center px-4 justify-between">
                <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
                    <ShieldCheck className="w-4 h-4" />
                    品質チェック合格: 問題は見つかりませんでした
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white border-t border-slate-200 transition-all duration-300 ${isExpanded ? 'h-48' : 'h-8'}`}>
            {/* ヘッダー（概要） */}
            <div
                className="h-8 flex items-center px-4 justify-between cursor-pointer hover:bg-slate-50"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4 text-xs font-semibold">
                    <span className="text-slate-500 uppercase flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
                        Governance Check
                    </span>

                    {isChecking ? (
                        <span className="text-slate-400 animate-pulse italic">チェック実行中...</span>
                    ) : (
                        <div className="flex items-center gap-3">
                            {errorCount > 0 && (
                                <span className="flex items-center gap-1 text-red-600">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    {errorCount} エラー
                                </span>
                            )}
                            {warningCount > 0 && (
                                <span className="flex items-center gap-1 text-amber-600">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    {warningCount} 警告
                                </span>
                            )}
                            {suggestionCount > 0 && (
                                <span className="flex items-center gap-1 text-blue-600">
                                    <Info className="w-3.5 h-3.5" />
                                    {suggestionCount} 提案
                                </span>
                            )}
                        </div>
                    )}
                </div>
                {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
            </div>

            {/* 詳細リスト */}
            {isExpanded && (
                <div className="h-40 overflow-y-auto px-4 pb-4">
                    <div className="space-y-1">
                        {issues.map((issue) => (
                            <div
                                key={issue.id}
                                onClick={() => onIssueClick?.(issue)}
                                className={`
                                    flex items-start gap-3 p-2 rounded-md text-sm border-l-4 cursor-pointer hover:opacity-80 transition-opacity
                                    ${issue.level === 'error' ? 'bg-red-50 border-red-500 text-red-800' :
                                        issue.level === 'warning' ? 'bg-amber-50 border-amber-500 text-amber-800' :
                                            'bg-blue-50 border-blue-500 text-blue-800'}
                                `}
                            >
                                <span className="shrink-0 mt-0.5">
                                    {issue.level === 'error' ? <AlertCircle className="w-4 h-4" /> :
                                        issue.level === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                                            <Info className="w-4 h-4" />}
                                </span>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-white/50 border border-current opacity-70">
                                            {issue.source}
                                        </span>
                                        {issue.field && (
                                            <span className="font-mono text-[10px] font-bold">
                                                [{issue.field}]
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-1">{issue.message}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
