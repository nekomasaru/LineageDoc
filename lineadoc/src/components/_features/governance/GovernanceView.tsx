'use client';

import React, { useState } from 'react';
import { ShieldCheck, List, SpellCheck, Save, CheckCircle2, ChevronRight, Home, BookOpen, Users, FolderOpen, FileText } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useProjectStore } from '@/stores/projectStore';
import { useDocumentStore } from '@/stores/documentStore';
import { Document, Project, Team } from '@/lib/types';
import { TEMPLATES } from '@/lib/templates';
import { MDSchemaFormEditor } from './MDSchemaFormEditor';
import { TextlintConfig } from './TextlintConfig';
import { CustomDictionaryEditor } from './CustomDictionaryEditor';

export const GovernanceView: React.FC = () => {
    const { setViewMode, currentDocumentTitle } = useAppStore();
    const { projects, teams } = useProjectStore();
    const { documents } = useDocumentStore();

    const [activeSection, setActiveSection] = useState<'schema' | 'lint' | 'dictionary'>('schema');
    const [target, setTarget] = useState({ type: 'team' as 'team' | 'project' | 'template', id: teams[0]?.id || '' });

    const handleBack = () => {
        setViewMode('spoke');
    };

    const selectedTeam = teams.find(t => t.id === (target.type === 'team' ? target.id : projects.find(p => p.id === target.id)?.teamId));
    const selectedProject = projects.find(p => p.id === target.id);
    const selectedTemplate = TEMPLATES.find(t => t.id === target.id);

    const targetLabel = target.type === 'team' ? '組織・チーム標準'
        : target.type === 'project' ? 'プロジェクト個別のルール'
            : '文書テンプレートのルール';

    const targetName = target.type === 'team' ? selectedTeam?.name
        : target.type === 'project' ? selectedProject?.name
            : selectedTemplate?.name || '未選択';

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
                        <span className="font-bold text-slate-800 flex items-center gap-2">
                            <ShieldCheck size={16} className="text-cyan-600" />
                            ガバナンス設定・管理
                        </span>
                        <ChevronRight size={14} />
                        <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg text-slate-600 font-bold">
                            {target.type === 'team' && <Users size={14} className="text-indigo-500" />}
                            {target.type === 'project' && <FolderOpen size={14} className="text-cyan-500" />}
                            {target.type === 'template' && <FileText size={14} className="text-green-500" />}
                            <span>{targetName} ({targetLabel})</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <p className="text-xs text-slate-400 mr-4 hidden sm:block">
                        ※ 選択した単位に対してルールが適用・保存されます
                    </p>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Internal Sidebar */}
                <aside className="w-72 border-r border-slate-100 bg-slate-50/50 p-4 shrink-0 overflow-y-auto flex flex-col gap-6">
                    <section>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">1. 編集対象の選択</h4>
                        <div className="space-y-4">
                            {/* Team Selection */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 px-2 flex items-center gap-1">
                                    <Users size={10} /> チーム（組織全体）
                                </label>
                                <select
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                    value={target.type === 'team' ? target.id : ''}
                                    onChange={(e) => setTarget({ type: 'team', id: e.target.value })}
                                >
                                    <option value="" disabled>チームを選択</option>
                                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>

                            {/* Project Selection */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 px-2 flex items-center gap-1">
                                    <FolderOpen size={10} /> プロジェクト単位
                                </label>
                                <select
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                    value={target.type === 'project' ? target.id : ''}
                                    onChange={(e) => setTarget({ type: 'project', id: e.target.value })}
                                >
                                    <option value="">プロジェクトを選択</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>

                            {/* Template Selection */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 px-2 flex items-center gap-1">
                                    <FileText size={10} /> 文書テンプレート
                                </label>
                                <select
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                    value={target.type === 'template' ? target.id : ''}
                                    onChange={(e) => setTarget({ type: 'template', id: e.target.value })}
                                >
                                    <option value="">テンプレートを選択</option>
                                    {/* System Standard Templates */}
                                    {TEMPLATES.map(tmpl => (
                                        <option key={tmpl.id} value={tmpl.id}>【標準】{tmpl.name}</option>
                                    ))}
                                    {/* Current active documents as custom templates could be added here later */}
                                </select>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">2. 設定項目の選択</h4>
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
                    </section>

                    <section className="mt-auto">
                        <div className="p-4 bg-cyan-50 rounded-2xl border border-cyan-100 shadow-sm">
                            <h4 className="text-xs font-bold text-cyan-800 mb-2 flex items-center gap-2">
                                <ShieldCheck size={14} />
                                管理ポリシー
                            </h4>
                            <p className="text-[10px] text-cyan-700 leading-relaxed opacity-80">
                                チーム設定 ＞ プロジェクト設定 ＞ テンプレート設定 の順でルールが継承され、より具体的な設定が優先されます。
                            </p>
                        </div>
                    </section>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-auto p-8 max-w-5xl mx-auto w-full">
                    {!target.id ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                            <ShieldCheck size={64} className="opacity-20" />
                            <p className="font-bold">左側のサイドバーから編集対象（チーム、プロジェクト、またはテンプレート）を選択してください</p>
                        </div>
                    ) : (
                        <>
                            {activeSection === 'schema' ? (
                                <MDSchemaFormEditor overrideTarget={target} />
                            ) : activeSection === 'lint' ? (
                                <TextlintConfig overrideTarget={target} />
                            ) : (
                                <CustomDictionaryEditor overrideTarget={target} />
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};
