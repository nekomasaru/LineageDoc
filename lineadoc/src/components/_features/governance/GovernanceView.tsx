'use client';

import React, { useState } from 'react';
import { ShieldCheck, List, SpellCheck, Save, CheckCircle2, ChevronRight, Home, BookOpen, Users, FolderOpen, FileText } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { MDSchemaFormEditor } from './MDSchemaFormEditor';
import { TextlintConfig } from './TextlintConfig';
import { CustomDictionaryEditor } from './CustomDictionaryEditor';

export const GovernanceView: React.FC = () => {
    const { setViewMode, currentDocumentTitle } = useAppStore();
    const [activeSection, setActiveSection] = useState<'schema' | 'lint' | 'dictionary'>('schema');
    const [isSaved, setIsSaved] = useState(false);

    const handleBack = () => {
        setViewMode('spoke');
    };

    return (
        <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-300">
            {/* Header */}
            <header className="h-16 border-b border-slate-200 px-6 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleBack}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                    >
                        <Home size={20} />
                    </button>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                        <span>{currentDocumentTitle}</span>
                        <ChevronRight size={14} />
                        <span className="font-bold text-slate-800 flex items-center gap-2">
                            <ShieldCheck size={16} className="text-cyan-600" />
                            ガバナンス設定
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <p className="text-xs text-slate-400 mr-4 hidden sm:block">
                        ※ 設定は現在のドキュメントにのみ適用されます
                    </p>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Internal Sidebar */}
                <aside className="w-64 border-r border-slate-100 bg-slate-50/50 p-4 shrink-0 overflow-y-auto">
                    <nav className="space-y-1">
                        <button
                            onClick={() => setActiveSection('schema')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeSection === 'schema'
                                ? 'bg-white text-cyan-700 shadow-sm border border-slate-200'
                                : 'text-slate-600 hover:bg-white/60'
                                }`}
                        >
                            <List size={18} className={activeSection === 'schema' ? 'text-cyan-600' : 'text-slate-400'} />
                            <span>文書構造の定義</span>
                        </button>
                        <button
                            onClick={() => setActiveSection('lint')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeSection === 'lint'
                                ? 'bg-white text-cyan-700 shadow-sm border border-slate-200'
                                : 'text-slate-600 hover:bg-white/60'
                                }`}
                        >
                            <SpellCheck size={18} className={activeSection === 'lint' ? 'text-cyan-600' : 'text-slate-400'} />
                            <span>文章校正のルール</span>
                        </button>
                        <button
                            onClick={() => setActiveSection('dictionary')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeSection === 'dictionary'
                                ? 'bg-white text-cyan-700 shadow-sm border border-slate-200'
                                : 'text-slate-600 hover:bg-white/60'
                                }`}
                        >
                            <BookOpen size={18} className={activeSection === 'dictionary' ? 'text-cyan-600' : 'text-slate-400'} />
                            <span>カスタム用語・表記辞書</span>
                        </button>
                    </nav>

                    <div className="mt-8 space-y-4">
                        <div className="p-4 bg-white/50 rounded-2xl border border-slate-200">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">有効な設定スコープ</h4>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                    <FileText size={12} className="text-slate-400" />
                                    <span>このドキュメント</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                                    <FolderOpen size={12} className="text-slate-400" />
                                    <span>所属プロジェクト</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                    <Users size={12} className="text-slate-400" />
                                    <span>所属チーム (組織)</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-cyan-50 rounded-2xl border border-cyan-100 shadow-sm shadow-cyan-50/50">
                            <h4 className="text-xs font-bold text-cyan-800 mb-2 flex items-center gap-2">
                                <ShieldCheck size={14} />
                                管理ポリシー
                            </h4>
                            <p className="text-[11px] text-cyan-700 leading-relaxed opacity-80 mb-4">
                                文書が公文書として、あるいは組織のルールとして正しく構造化されているかを定義します。
                            </p>
                            <div className="pt-3 border-t border-cyan-200/50">
                                <p className="text-[10px] text-cyan-800 font-bold mb-1">ポリシーの継承</p>
                                <p className="text-[10px] text-cyan-600 leading-relaxed">
                                    上位レベル（チーム・組織）の設定は下位レベルに継承され、必要に応じて上書き可能です。
                                </p>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-auto p-8 max-w-5xl mx-auto w-full">
                    {activeSection === 'schema' ? (
                        <MDSchemaFormEditor />
                    ) : activeSection === 'lint' ? (
                        <TextlintConfig />
                    ) : (
                        <CustomDictionaryEditor />
                    )}
                </main>
            </div>
        </div>
    );
};
