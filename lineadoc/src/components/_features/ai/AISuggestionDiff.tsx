'use client';

import React from 'react';
import { Check, X, Copy, ArrowRight, CornerDownLeft } from 'lucide-react';

interface AISuggestionDiffProps {
    original: string;
    suggestion: string;
    onApply: () => void;
    onReject: () => void;
}

/**
 * AI の提案と原文の差分を表示し、承認/却下を行うためのコンポーネント
 * (現在はモックUIとしての簡易版実装)
 */
export function AISuggestionDiff({ original, suggestion, onApply, onReject }: AISuggestionDiffProps) {
    return (
        <div className="border border-indigo-200 rounded-xl bg-white shadow-lg overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-indigo-600 p-1 rounded-md text-white">
                        <Check size={14} />
                    </div>
                    <span className="text-xs font-bold text-indigo-900">AI の提案をレビュー</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={onReject}
                        className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-colors"
                        title="却下"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Diff Content */}
            <div className="p-4 grid grid-cols-2 gap-4">
                {/* Original */}
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">原文</p>
                    <div className="p-3 bg-red-50/50 border border-red-100 rounded-lg text-sm text-slate-600 line-through decoration-red-300">
                        {original || '(空)'}
                    </div>
                </div>

                {/* Suggestion */}
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">改善案</p>
                    <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg text-sm text-indigo-900 font-medium">
                        {suggestion}
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <p className="text-[10px] text-slate-400 italic">
                    適宜修正してから適用することも可能です
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={onReject}
                        className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={onApply}
                        className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all"
                    >
                        <CornerDownLeft size={14} />
                        採用してエディタに反映
                    </button>
                </div>
            </div>
        </div>
    );
}
