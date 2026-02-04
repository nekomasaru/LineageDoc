'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { X, FilePlus } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { TEMPLATES, DocTemplate } from '@/lib/templates';
import * as Icons from 'lucide-react';

interface CreateDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (title: string, template: DocTemplate) => void;
}

export function CreateDocumentModal({
    isOpen,
    onClose,
    onConfirm,
}: CreateDocumentModalProps) {
    const { t } = useLanguage();
    const [title, setTitle] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState('empty');
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedTemplate = TEMPLATES.find(t => t.id === selectedTemplateId) || TEMPLATES[0];

    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setSelectedTemplateId('empty');
            // We focus title input only if it's visible, but here we show it together or after.
            // Let's focus it when the component renders.
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(title || selectedTemplate.name, selectedTemplate);
        onClose();
    }, [title, selectedTemplate, onConfirm, onClose]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            onKeyDown={handleKeyDown}
        >
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-2">
                        <FilePlus className="text-cyan-600" size={20} />
                        <h2 className="text-lg font-semibold text-slate-800">新規ドキュメント作成</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="space-y-6">
                        {/* Section 1: Title */}
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">
                                1. タイトル
                            </label>
                            <input
                                ref={inputRef}
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="例: 定例会議事録 2024-02"
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-slate-800 placeholder:text-slate-400"
                            />
                        </div>

                        {/* Section 2: Templates */}
                        <div className="space-y-3">
                            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">
                                2. テンプレートを選択
                            </label>
                            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                                {TEMPLATES.map((tmpl) => {
                                    const IconNode = (Icons as any)[tmpl.icon] || Icons.FileText;
                                    const isSelected = selectedTemplateId === tmpl.id;

                                    return (
                                        <div
                                            key={tmpl.id}
                                            onClick={() => setSelectedTemplateId(tmpl.id)}
                                            className={`
                                                p-4 border-2 rounded-xl cursor-pointer transition-all flex items-start gap-3
                                                ${isSelected
                                                    ? 'border-cyan-500 bg-cyan-50'
                                                    : 'border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50'
                                                }
                                            `}
                                        >
                                            <div className={`p-2 rounded-lg ${isSelected ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                <IconNode size={24} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={`font-bold text-sm ${isSelected ? 'text-cyan-900' : 'text-slate-700'}`}>
                                                    {tmpl.name}
                                                </div>
                                                <div className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                                    {tmpl.description}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium"
                        >
                            キャンセル
                        </button>
                        <button
                            onClick={handleSubmit}
                            className={`
                                px-6 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 transition-all font-bold text-sm shadow-sm 
                                ${!selectedTemplateId ? 'opacity-50 cursor-not-allowed' : 'shadow-cyan-200 hover:scale-[1.02]'}
                            `}
                        >
                            作成して開始
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
