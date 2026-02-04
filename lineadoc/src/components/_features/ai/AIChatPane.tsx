'use client';

import { Bot, MessageSquare } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

interface AIChatPaneProps {
    currentContent: string;
    onApplyContent: (newContent: string) => void;
}

export function AIChatPane({ currentContent, onApplyContent }: AIChatPaneProps) {
    const { t } = useLanguage();

    return (
        <div className="h-full flex flex-col bg-slate-50">
            {/* Placeholder for future AI Assistant */}
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                <Bot size={64} className="mb-4 text-teal-600 opacity-20" />
                <h3 className="text-lg font-bold text-slate-800 mb-2 mt-2">{t('ai.title')}</h3>
                <p className="text-sm text-center text-slate-500 mb-6 leading-relaxed max-w-[240px]">
                    {t('ai.description')}
                </p>
                <div className="flex items-center gap-2 text-xs bg-slate-200 px-3 py-2 rounded-full">
                    <MessageSquare size={14} />
                    <span>{t('ai.comingSoon')}</span>
                </div>
            </div>
        </div>
    );
}
