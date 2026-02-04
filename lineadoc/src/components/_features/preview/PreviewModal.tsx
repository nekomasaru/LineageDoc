/**
 * PreviewModal.tsx
 * 
 * 出力プレビューモーダル
 * テンプレート選択と印刷/PDF出力設定
 * 
 * @skill preview-pane
 */

'use client';

import { useState } from 'react';
import { X, Printer, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useEditorStore } from '@/stores/editorStore';

interface PreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type TemplateId = 'official' | 'contract' | 'minutes' | 'plain';

interface Template {
    id: TemplateId;
    name: string;
    icon: string;
    description: string;
    className: string;
}

const TEMPLATES: Template[] = [
    {
        id: 'official',
        name: '公文書',
        icon: '📄',
        description: 'A4縦・明朝体',
        className: 'font-serif text-base leading-relaxed',
    },
    {
        id: 'contract',
        name: '契約書',
        icon: '📝',
        description: '甲乙・署名欄',
        className: 'font-serif text-sm leading-loose',
    },
    {
        id: 'minutes',
        name: '議事録',
        icon: '📋',
        description: '決定事項形式',
        className: 'font-sans text-sm leading-relaxed',
    },
    {
        id: 'plain',
        name: 'シンプル',
        icon: '📃',
        description: '装飾なし',
        className: 'font-sans text-base',
    },
];

export function PreviewModal({ isOpen, onClose }: PreviewModalProps) {
    const { markdown } = useEditorStore();
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('official');

    const currentTemplate = TEMPLATES.find((t) => t.id === selectedTemplate) || TEMPLATES[0];

    if (!isOpen) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-[95vw] max-w-6xl h-[90vh] flex flex-col overflow-hidden">
                {/* ヘッダー */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">出力プレビュー</h2>
                        <p className="text-sm text-slate-500">印刷・PDF出力前の確認</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                            <Printer className="w-4 h-4" />
                            印刷
                        </button>
                        <button
                            disabled
                            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg opacity-50 cursor-not-allowed"
                            title="将来実装予定"
                        >
                            <Download className="w-4 h-4" />
                            PDF出力
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>
                </div>

                {/* ボディ */}
                <div className="flex-1 flex overflow-hidden">
                    {/* 左: テンプレート選択 */}
                    <div className="w-64 border-r border-slate-200 bg-slate-50 p-4 flex-shrink-0">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                            テンプレート
                        </h3>
                        <div className="space-y-2">
                            {TEMPLATES.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setSelectedTemplate(t.id)}
                                    className={`
                    w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left
                    transition-colors duration-150
                    ${selectedTemplate === t.id
                                            ? 'bg-teal-100 text-teal-700 ring-1 ring-teal-300'
                                            : 'hover:bg-slate-100 text-slate-600'
                                        }
                  `}
                                >
                                    <span className="text-2xl">{t.icon}</span>
                                    <div>
                                        <div className="text-sm font-medium">{t.name}</div>
                                        <div className="text-xs text-slate-400">{t.description}</div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* 差し込み設定（将来） */}
                        <div className="mt-8">
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                                差し込み設定
                            </h3>
                            <p className="text-xs text-slate-400 italic">
                                （将来実装予定：日付、宛名など）
                            </p>
                        </div>
                    </div>

                    {/* 右: プレビュー */}
                    <div className="flex-1 bg-slate-200 p-8 overflow-auto">
                        {/* A4サイズのプレビュー */}
                        <div
                            className="bg-white shadow-xl mx-auto"
                            style={{
                                width: '210mm',
                                minHeight: '297mm',
                                maxWidth: '100%',
                            }}
                        >
                            <article className={`p-16 ${currentTemplate.className}`}>
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        h1: ({ children }) => (
                                            <h1 className="text-2xl font-bold text-center mb-8 border-b-2 border-slate-300 pb-4">
                                                {children}
                                            </h1>
                                        ),
                                        h2: ({ children }) => (
                                            <h2 className="text-xl font-bold mt-8 mb-4">{children}</h2>
                                        ),
                                        p: ({ children }) => (
                                            <p className="mb-4 text-justify">{children}</p>
                                        ),
                                    }}
                                >
                                    {markdown}
                                </ReactMarkdown>
                            </article>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
