"use client";

import React from 'react';
import { TextLintError } from '../../contexts/TextLintContext';

interface ErrorListProps {
    errors: TextLintError[];
    text: string;
}

export function ErrorList({ errors, text }: ErrorListProps) {
    if (errors.length === 0) {
        return (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded text-gray-400 text-center text-sm">
                指摘事項はありません
            </div>
        );
    }

    // Group by severity
    const errorsByLevel = errors.reduce((acc, error) => {
        if (!acc[error.severity]) {
            acc[error.severity] = [];
        }
        acc[error.severity].push(error);
        return acc;
    }, {} as Record<string, TextLintError[]>);

    // We need lines to show context
    // Splitting text by newline might be heavy for very large text, but standard for this UI
    const lines = text.split('\n');

    return (
        <div className="border border-gray-200 rounded bg-gray-50 max-h-[600px] overflow-y-auto p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center justify-between">
                <span>指摘事項</span>
                <span className="text-sm font-normal bg-gray-200 px-2 py-1 rounded-full">{errors.length}件</span>
            </h3>

            {errorsByLevel['error'] && (
                <ErrorGroup
                    level="error"
                    errors={errorsByLevel['error']}
                    lines={lines}
                />
            )}

            {errorsByLevel['warning'] && (
                <ErrorGroup
                    level="warning"
                    errors={errorsByLevel['warning']}
                    lines={lines}
                />
            )}

            {errorsByLevel['suggestion'] && (
                <ErrorGroup
                    level="suggestion"
                    errors={errorsByLevel['suggestion']}
                    lines={lines}
                />
            )}
        </div>
    );
}

function ErrorGroup({ level, errors, lines }: { level: string, errors: TextLintError[], lines: string[] }) {
    const levelLabels: Record<string, string> = {
        error: 'エラー (要修正)',
        warning: '警告 (確認推奨)',
        suggestion: '提案 (スタイル)'
    };

    const levelColors: Record<string, string> = {
        error: 'text-red-600 border-l-red-500',
        warning: 'text-orange-600 border-l-orange-500',
        suggestion: 'text-blue-600 border-l-blue-500'
    };

    return (
        <div className={`mb-6 last:mb-0`}>
            <h4 className={`text-sm font-bold uppercase mb-2 ${levelColors[level].split(' ')[0]}`}>
                {levelLabels[level]} ({errors.length}件)
            </h4>
            <div className="space-y-3">
                {errors.map((error, index) => (
                    <ErrorItem key={`${error.ruleId}-${index}`} error={error} lines={lines} levelColor={levelColors[level]} />
                ))}
            </div>
        </div>
    );
}

function ErrorItem({ error, lines, levelColor }: { error: TextLintError, lines: string[], levelColor: string }) {
    // textlint line is 1-indexed
    const lineIndex = error.line - 1;
    const context = lines[lineIndex]?.trim() || '';

    // Calculate surrounding lines for better context if needed, but keeping it simple for now

    return (
        <div className={`bg-white p-3 rounded shadow-sm border-l-4 ${levelColor.split(' ')[1]}`}>
            <div className="flex justify-between items-start mb-1 text-xs text-gray-500">
                <span className="font-mono bg-gray-100 px-1 rounded">
                    {error.line}行目 : {error.column}文字目
                </span>
                <span className="font-mono text-gray-400">{error.ruleId}</span>
            </div>

            <div className="text-gray-800 text-sm font-medium mb-2">
                {error.message}
            </div>

            {context && (
                <div className="bg-gray-100 p-2 rounded text-xs text-gray-600 font-mono break-all">
                    {context.length > 80 ? context.substring(0, 80) + '...' : context}
                </div>
            )}

            {error.fix && (
                <div className="mt-2 text-xs">
                    <span className="text-green-600 font-bold mr-1">修正案:</span>
                    {error.fix.text}
                </div>
            )}
        </div>
    );
}
