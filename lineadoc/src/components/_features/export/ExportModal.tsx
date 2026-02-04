'use client';

import { useAppStore } from '@/stores/appStore';
import { FileText, FileJson, FileType, Check, X } from 'lucide-react';
import { useState } from 'react';

type ExportFormat = 'markdown' | 'text' | 'knowledge';

export function ExportModal() {
    const { activeModal, setActiveModal } = useAppStore();
    const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('markdown');

    if (activeModal !== 'export') return null;

    const handleClose = () => setActiveModal(null);

    const handleExport = () => {
        console.log(`Exporting as ${selectedFormat}...`);
        // TODO: Implement actual export logic
        handleClose();
    };

    const cards = [
        {
            id: 'markdown',
            label: 'Markdown',
            description: '標準的なMarkdown形式 (.md) で出力します。',
            icon: FileText,
            color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        },
        {
            id: 'text',
            label: 'Plain Text',
            description: '装飾を除いたプレーンテキスト (.txt) で出力します。',
            icon: FileType,
            color: 'bg-slate-50 text-slate-600 border-slate-200',
        },
        {
            id: 'knowledge',
            label: 'Knowledge Base',
            description: 'AI学習用の知識データ形式 (JSON) で出力します。',
            icon: FileJson,
            color: 'bg-violet-50 text-violet-600 border-violet-200',
        },
    ] as const;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden mx-4 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-lg font-bold text-slate-800">
                        エクスポート形式の選択
                    </h2>
                    <button
                        onClick={handleClose}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-sm text-slate-500 mb-4">
                        ドキュメントの用途に合わせて出力形式を選択してください。
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {cards.map((card) => {
                            const Icon = card.icon;
                            const isSelected = selectedFormat === card.id;

                            return (
                                <button
                                    key={card.id}
                                    onClick={() => setSelectedFormat(card.id)}
                                    className={`
                                        relative group flex flex-col items-center p-4 rounded-xl border-2 text-center transition-all duration-200
                                        ${isSelected
                                            ? `border-cyan-500 bg-cyan-50/30 shadow-md ring-1 ring-cyan-500`
                                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                        }
                                    `}
                                >
                                    {isSelected && (
                                        <div className="absolute top-2 right-2 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center text-white">
                                            <Check size={12} strokeWidth={3} />
                                        </div>
                                    )}

                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${card.color}`}>
                                        <Icon size={24} />
                                    </div>
                                    <h3 className={`font-bold mb-1 ${isSelected ? 'text-cyan-800' : 'text-slate-700'}`}>
                                        {card.label}
                                    </h3>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        {card.description}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={handleExport}
                        className="px-6 py-2 text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
                    >
                        <span>エクスポート</span>
                        <FileText size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
