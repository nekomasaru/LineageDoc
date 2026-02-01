'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { X, GitBranch } from 'lucide-react';

interface BranchCommentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (comment: string) => void;
    title: string;
    defaultComment?: string;
}

export function BranchCommentModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    defaultComment = '',
}: BranchCommentModalProps) {
    const [comment, setComment] = useState(defaultComment);
    const inputRef = useRef<HTMLInputElement>(null);

    // Reset comment when modal opens
    useEffect(() => {
        if (isOpen) {
            setComment(defaultComment);
            // Focus input after a short delay to ensure modal is visible
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen, defaultComment]);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(comment.trim() || title);
        setComment('');
    }, [comment, onConfirm, title]);

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
                        <GitBranch className="text-blue-600" size={20} />
                        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-5">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        この操作の目的（コメント）
                    </label>
                    <input
                        ref={inputRef}
                        type="text"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="例：別案の作成、レイアウト変更前に戻す など"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 placeholder:text-slate-400"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                        空欄の場合は「{title}」として記録されます。
                    </p>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 mt-5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                        >
                            <GitBranch size={16} />
                            確定
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
