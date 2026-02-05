'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { X, MessageSquare, GitBranch, GitMerge } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

export type BranchStrategy = 'extend' | 'fork';

interface AiInstructionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (instruction: string, strategy: BranchStrategy) => void;
}

export function AiInstructionModal({
    isOpen,
    onClose,
    onConfirm,
}: AiInstructionModalProps) {
    const { t } = useLanguage();
    const [instruction, setInstruction] = useState('');
    const [strategy, setStrategy] = useState<BranchStrategy>('extend');
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen) {
            setInstruction('');
            setStrategy('extend');
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!instruction.trim()) return;
        onConfirm(instruction, strategy);
    }, [instruction, strategy, onConfirm]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
        // Ctrl+Enter or Cmd+Enter to submit
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            if (instruction.trim()) {
                onConfirm(instruction, strategy);
            }
        }
    }, [onClose, instruction, strategy, onConfirm]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            onKeyDown={handleKeyDown}
        >
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="text-purple-600" size={20} />
                        <h2 className="text-lg font-semibold text-slate-800">LineaDoc AI 指示</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Instruction Input */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">
                            指示内容
                        </label>
                        <textarea
                            ref={inputRef}
                            value={instruction}
                            onChange={(e) => setInstruction(e.target.value)}
                            placeholder="例: 文体をもっと柔らかくして、箇条書きを活用して"
                            className="w-full h-32 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-slate-800 placeholder:text-slate-400 resize-none"
                        />
                        <p className="text-xs text-slate-400 text-right">Ctrl + Enter で送信</p>
                    </div>

                    {/* Branching Strategy Selection */}
                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-slate-700">
                            作成モード
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            {/* Extend: Continue from current */}
                            <label
                                className={`
                                    relative flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer transition-all
                                    ${strategy === 'extend'
                                        ? 'border-purple-500 bg-purple-50 text-purple-900'
                                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'}
                                `}
                            >
                                <input
                                    type="radio"
                                    name="strategy"
                                    value="extend"
                                    checked={strategy === 'extend'}
                                    onChange={() => setStrategy('extend')}
                                    className="absolute opacity-0 w-full h-full cursor-pointer"
                                />
                                <GitBranch className={`mb-2 ${strategy === 'extend' ? 'text-purple-600' : 'text-slate-400'}`} size={24} />
                                <span className="font-bold text-sm">続きを作成</span>
                                <span className="text-xs opacity-80 mt-1 text-center">現在の内容の続きとして履歴に追加</span>
                            </label>

                            {/* Fork: Branch from previous */}
                            <label
                                className={`
                                    relative flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer transition-all
                                    ${strategy === 'fork'
                                        ? 'border-purple-500 bg-purple-50 text-purple-900'
                                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'}
                                `}
                            >
                                <input
                                    type="radio"
                                    name="strategy"
                                    value="fork"
                                    checked={strategy === 'fork'}
                                    onChange={() => setStrategy('fork')}
                                    className="absolute opacity-0 w-full h-full cursor-pointer"
                                />
                                <GitMerge className={`mb-2 rotate-180 ${strategy === 'fork' ? 'text-purple-600' : 'text-slate-400'}`} size={24} />
                                <span className="font-bold text-sm">別案を作成</span>
                                <span className="text-xs opacity-80 mt-1 text-center">親ノードから分岐して新しい案を作成</span>
                            </label>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            disabled={!instruction.trim()}
                            className="px-6 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-sm shadow-sm shadow-purple-200"
                        >
                            指示を開始
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
