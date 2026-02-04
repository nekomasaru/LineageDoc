'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { X, FileText, FilePlus } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

interface CreateDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (title: string) => void;
}

export function CreateDocumentModal({
    isOpen,
    onClose,
    onConfirm,
}: CreateDocumentModalProps) {
    const { t } = useLanguage();
    const [title, setTitle] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(title || '無題のドキュメント');
        onClose();
    }, [title, onConfirm, onClose]);

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
                className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
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
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600">
                            新しいドキュメントのタイトルを入力してください。<br />
                            現在の編集内容は保存されます。
                        </p>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-slate-700">
                                タイトル
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
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 mt-8">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 transition-all font-bold text-sm shadow-sm shadow-cyan-200"
                        >
                            作成する
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
