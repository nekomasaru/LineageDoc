/**
 * /hybrid ページ
 * 
 * 新しいハイブリッドエディタをテストするためのページ
 */

'use client';

import { SplitEditorLayout } from '@/components/_features/editor/SplitEditorLayout';
import { useEditorStore } from '@/stores/editorStore';
import { Save, FileText, RotateCcw } from 'lucide-react';

export default function HybridEditorPage() {
    const { isDirty, markdown, resetDocument } = useEditorStore();

    return (
        <div className="h-screen flex flex-col bg-slate-50">
            {/* ヘッダー */}
            <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-semibold text-slate-800">LineaDoc</span>
                    <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs rounded-full">
                        Hybrid Editor
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {/* 保存状態インジケーター */}
                    {isDirty && (
                        <span className="text-amber-500 text-sm flex items-center gap-1">
                            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                            未保存
                        </span>
                    )}

                    {/* リセットボタン */}
                    <button
                        onClick={() => resetDocument()}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                    >
                        <RotateCcw className="w-4 h-4" />
                        リセット
                    </button>

                    {/* 保存ボタン（将来実装） */}
                    <button
                        disabled
                        className="flex items-center gap-2 px-4 py-1.5 bg-teal-600 text-white text-sm rounded-lg opacity-50 cursor-not-allowed"
                    >
                        <Save className="w-4 h-4" />
                        保存
                    </button>
                </div>
            </header>

            {/* メインエリア: ハイブリッドエディタ */}
            <main className="flex-1 overflow-hidden">
                <SplitEditorLayout />
            </main>

            {/* デバッグ情報（開発用） */}
            <footer className="h-8 bg-slate-800 text-slate-400 text-xs flex items-center px-4 gap-6">
                <span>Mode: {useEditorStore.getState().mode}</span>
                <span>Content: {markdown.length} chars</span>
                <span>Dirty: {isDirty ? 'Yes' : 'No'}</span>
            </footer>
        </div>
    );
}
