'use client';

import { Bot, MessageSquare } from 'lucide-react';

interface AIChatPaneProps {
    currentContent: string;
    onApplyContent: (newContent: string) => void;
}

export function AIChatPane({ currentContent, onApplyContent }: AIChatPaneProps) {
    return (
        <div className="h-full flex flex-col bg-slate-50">
            {/* Placeholder for future AI Assistant */}
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                <Bot size={64} className="mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">AI アシスタント</h3>
                <p className="text-sm text-center mb-4">
                    文書の校正や改善提案を行う<br />
                    AIアシスタント機能は近日公開予定です。
                </p>
                <div className="flex items-center gap-2 text-xs bg-slate-200 px-3 py-2 rounded-full">
                    <MessageSquare size={14} />
                    <span>Coming Soon</span>
                </div>
            </div>
        </div>
    );
}
