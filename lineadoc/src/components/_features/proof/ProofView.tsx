/**
 * ProofView.tsx
 * 
 * 出力プレビューモードのメインビュー
 * テンプレート選択と印刷/PDF出力設定のためのUI。
 * コンテンツは useEditorStore から取得する。
 */

'use client';

import { useState } from 'react';
import { Printer, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { useEditorStore } from '@/stores/editorStore';

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

export function ProofView() {
    const { markdown } = useEditorStore();
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('official');

    const currentTemplate = TEMPLATES.find((t) => t.id === selectedTemplate) || TEMPLATES[0];

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="flex h-full bg-slate-100">
            {/* 左サイドバー: 設定パネル */}
            <div className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto">
                <div className="p-4 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800">出力設定</h2>
                    <p className="text-xs text-slate-500 mt-1">テンプレートと印刷オプション</p>
                </div>

                <div className="p-4 space-y-6">
                    {/* テンプレート選択 */}
                    <div>
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            テンプレート
                        </h3>
                        <div className="space-y-2">
                            {TEMPLATES.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setSelectedTemplate(t.id)}
                                    className={`
                                        w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left
                                        transition-colors duration-150 border
                                        ${selectedTemplate === t.id
                                            ? 'bg-cyan-50 border-cyan-200 ring-1 ring-cyan-200'
                                            : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-300'
                                        }
                                    `}
                                >
                                    <span className="text-xl">{t.icon}</span>
                                    <div>
                                        <div className={`text-sm font-medium ${selectedTemplate === t.id ? 'text-cyan-900' : 'text-slate-700'}`}>
                                            {t.name}
                                        </div>
                                        <div className="text-xs text-slate-400">{t.description}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* アクションボタン */}
                    <div>
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            アクション
                        </h3>
                        <div className="space-y-2">
                            <button
                                onClick={handlePrint}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors shadow-sm"
                            >
                                <Printer className="w-4 h-4" />
                                印刷実行
                            </button>
                            <button
                                disabled
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-400 rounded-lg cursor-not-allowed border border-slate-200"
                            >
                                <Download className="w-4 h-4" />
                                PDF出力 (未実装)
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* メイン: プレビューエリア */}
            <div className="flex-1 overflow-auto p-8 relative">
                {/* A4用紙 */}
                <div
                    className="bg-white shadow-xl mx-auto origin-top transition-transform duration-200 ease-out"
                    style={{
                        width: '210mm',
                        minHeight: '297mm',
                        // padding: '20mm', // パディングは内部記事で制御
                        // zoom: 0.8, // 将来的にズーム機能をつける
                    }}
                >
                    <article className={`p-16 ${currentTemplate.className}`}>
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkBreaks]}
                            components={{
                                h1: ({ children }) => (
                                    <h1 className="text-2xl font-bold text-center mb-8 border-b-2 border-slate-300 pb-4">
                                        {children}
                                    </h1>
                                ),
                                h2: ({ children }) => (
                                    <h2 className="text-xl font-bold mt-8 mb-4 border-l-4 border-slate-400 pl-3">
                                        {children}
                                    </h2>
                                ),
                                p: ({ children }) => (
                                    <p className="mb-4 text-justify leading-loose">{children}</p>
                                ),
                                ul: ({ children }) => (
                                    <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>
                                ),
                                ol: ({ children }) => (
                                    <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>
                                ),
                            }}
                        >
                            {markdown || '(ドキュメントは空です)'}
                        </ReactMarkdown>
                    </article>
                </div>
            </div>
        </div>
    );
}
