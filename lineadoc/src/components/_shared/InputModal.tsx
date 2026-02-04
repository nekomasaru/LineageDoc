'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { X, MessageSquare } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

interface InputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (value: string) => void;
    title: string;
    label?: string;
    placeholder?: string;
    defaultValue?: string;
    confirmText?: string;
}

export function InputModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    label = 'Input',
    placeholder = '',
    defaultValue = '',
    confirmText,
}: InputModalProps) {
    const { t } = useLanguage();
    const [value, setValue] = useState(defaultValue);
    const inputRef = useRef<HTMLInputElement>(null);

    // Reset value when modal opens
    useEffect(() => {
        if (isOpen) {
            setValue(defaultValue);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen, defaultValue]);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(value);
        setValue('');
    }, [value, onConfirm]);

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
                        <MessageSquare className="text-teal-600" size={20} />
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
                        {label}
                    </label>
                    <input
                        ref={inputRef}
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={placeholder}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-800 placeholder:text-slate-400"
                    />

                    {/* Actions */}
                    <div className="flex justify-end gap-3 mt-5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-all font-bold text-sm shadow-sm shadow-teal-200"
                        >
                            {confirmText || t('common.confirm')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
