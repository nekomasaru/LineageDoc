'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, CheckCircle2, AlertCircle, BookOpen } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useDocumentStore } from '@/stores/documentStore';
import { useProjectStore } from '@/stores/projectStore';
import { GovernanceSettings, Document, Project, Team } from '@/lib/types';

interface DictionaryItem {
    id: string;
    pattern: string;
    expected: string;
    enabled: boolean;
    category?: string;
    type: 'correction' | 'exclusion';
}

const standardTemplates = {
    keishikimeishi: [
        { pattern: '事', expected: 'こと', description: '形式名詞', type: 'correction' },
        { pattern: '時', expected: 'とき', description: '形式名詞', type: 'correction' },
        { pattern: '所', expected: 'ところ', description: '形式名詞', type: 'correction' },
        { pattern: '為', expected: 'ため', description: '形式名詞', type: 'correction' },
        { pattern: '通り', expected: 'とおり', description: '形式名詞', type: 'correction' },
        { pattern: '様', expected: 'よう', description: '形式名詞', type: 'correction' },
        { pattern: '内', expected: 'うち', description: '形式名詞', type: 'correction' },
        { pattern: '訳', expected: 'わけ', description: '形式名詞', type: 'correction' },
    ],
    okurigana: [
        { pattern: '行なう', expected: 'を行う', description: '送り仮名', type: 'correction' },
        { pattern: '表わす', expected: '表す', description: '送り仮名', type: 'correction' },
        { pattern: '断わる', expected: '断る', description: '送り仮名', type: 'correction' },
        { pattern: '現われる', expected: '現れる', description: '送り仮名', type: 'correction' },
        { pattern: '合せる', expected: '合わせる', description: '送り仮名', type: 'correction' },
        { pattern: '付加える', expected: '付け加える', description: '送り仮名', type: 'correction' },
        { pattern: '打合せ', expected: '打ち合わせ', description: '送り仮名', type: 'correction' },
    ],
    commonExclusions: [
        { pattern: '冨', expected: '', description: '「富」の異体字（苗字など）', type: 'exclusion' },
        { pattern: '﨑', expected: '', description: '「崎」の異体字（たつさき）', type: 'exclusion' },
        { pattern: '髙', expected: '', description: '「高」の異体字（はしごだか）', type: 'exclusion' },
        { pattern: '栁', expected: '', description: '「柳」の異体字', type: 'exclusion' },
        { pattern: '澁', expected: '', description: '「渋」の旧字体（人名・地名用）', type: 'exclusion' },
        { pattern: '廣', expected: '', description: '「広」の旧字体（人名・地名用）', type: 'exclusion' },
    ]
};

export const CustomDictionaryEditor: React.FC = () => {
    const { currentDocumentId } = useAppStore();
    const { documents, updateDocument } = useDocumentStore();
    const { projects, teams, updateProjectGovernance, updateTeamGovernance } = useProjectStore();

    const [scope, setScope] = useState<'document' | 'project' | 'team'>('document');
    const [items, setItems] = useState<DictionaryItem[]>([]);
    const [isSaved, setIsSaved] = useState(false);
    const [showLibrary, setShowLibrary] = useState(false);

    const doc = documents.find(d => d.id === currentDocumentId);
    const project = doc ? projects.find(p => p.id === doc.projectId) : null;
    const team = project ? teams.find(t => t.id === project.teamId) : null;

    useEffect(() => {
        let initialData: any[] = [];
        if (scope === 'document') {
            initialData = doc?.attributes?.customDictionary || [];
        } else if (scope === 'project') {
            initialData = project?.governance?.customDictionary || [];
        } else if (scope === 'team') {
            initialData = team?.governance?.customDictionary || [];
        }

        setItems(initialData.map((item, idx) => ({
            id: `item-${idx}-${Date.now()}`,
            ...item,
            type: item.type || (item.expected && item.expected !== item.pattern ? 'correction' : 'exclusion')
        })));
    }, [scope, doc?.id, project?.id, team?.id]);

    const addItem = (type: 'correction' | 'exclusion') => {
        setItems([...items, { id: Math.random().toString(36).substr(2, 9), pattern: '', expected: '', enabled: true, type }]);
    };

    const removeItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const updateItem = (id: string, updates: Partial<DictionaryItem>) => {
        setItems(items.map(item => item.id === id ? { ...item, ...updates } : item));
    };

    const handleSave = () => {
        const govItems = items.filter(i => i.pattern).map(({ pattern, expected, enabled, category, type }) => ({
            pattern,
            expected: type === 'exclusion' ? pattern : expected,
            enabled,
            category,
            type
        }));

        if (scope === 'document' && currentDocumentId) {
            // Attribute sync logic
        } else if (scope === 'project' && project) {
            updateProjectGovernance(project.id, { customDictionary: govItems });
        } else if (scope === 'team' && team) {
            updateTeamGovernance(team.id, { customDictionary: govItems });
        }

        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const addFromLibrary = (template: any) => {
        if (items.some(i => i.pattern === template.pattern)) return;
        setItems([...items, {
            id: Math.random().toString(36).substr(2, 9),
            pattern: template.pattern,
            expected: template.expected,
            enabled: true,
            category: 'standard',
            type: template.type
        }]);
    };

    const renderTable = (type: 'correction' | 'exclusion') => {
        const filtered = items.filter(i => i.type === type);
        return (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-8">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        {type === 'correction' ? (
                            <><AlertCircle className="text-amber-500" size={18} /> 表記の修正・統一</>
                        ) : (
                            <><CheckCircle2 className="text-green-500" size={18} /> チェック除外 (例外許可)</>
                        )}
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {filtered.length} 項目設定済み
                    </span>
                </div>
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-200">
                            <th className="px-6 py-2 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider w-12">有効</th>
                            <th className="px-6 py-2 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                {type === 'correction' ? '対象（パターン）' : '許可する言葉'}
                            </th>
                            {type === 'correction' && (
                                <th className="px-6 py-2 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">期待される表記</th>
                            )}
                            <th className="px-6 py-2 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider w-16">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                                <td className="px-6 py-4">
                                    <input
                                        type="checkbox"
                                        checked={item.enabled}
                                        onChange={(e) => updateItem(item.id, { enabled: e.target.checked })}
                                        className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-slate-300"
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <input
                                        type="text"
                                        value={item.pattern}
                                        onChange={(e) => updateItem(item.id, { pattern: e.target.value })}
                                        placeholder={type === 'correction' ? "例: 行なう" : "例: 冨"}
                                        className="w-full bg-transparent border-none focus:ring-0 text-sm text-slate-800 placeholder:text-slate-300 font-medium"
                                    />
                                </td>
                                {type === 'correction' && (
                                    <td className="px-6 py-4">
                                        <input
                                            type="text"
                                            value={item.expected}
                                            onChange={(e) => updateItem(item.id, { expected: e.target.value })}
                                            placeholder="例: 行う"
                                            className="w-full bg-transparent border-none focus:ring-0 text-sm text-cyan-600 font-bold placeholder:text-slate-300"
                                        />
                                    </td>
                                )}
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="p-3 bg-white border-t border-slate-100">
                    <button
                        onClick={() => addItem(type)}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all"
                    >
                        <Plus size={14} />
                        {type === 'correction' ? '修正ルールを追加' : '除外設定を追加'}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {showLibrary && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <BookOpen className="text-cyan-600" size={24} />
                                    標準表記ライブラリ
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">公認の一般的な規則を個別に追加できます。</p>
                            </div>
                            <button onClick={() => setShowLibrary(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-xl transition-all">
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>
                        <div className="p-8 max-h-[60vh] overflow-y-auto space-y-8">
                            <section>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    形式名詞・送り仮名 (修正)
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {[...standardTemplates.keishikimeishi, ...standardTemplates.okurigana].map(t => (
                                        <button key={t.pattern} onClick={() => addFromLibrary(t)} disabled={items.some(i => i.pattern === t.pattern)} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-cyan-200 hover:bg-cyan-50/30 transition-all text-left disabled:opacity-50 group">
                                            <div>
                                                <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                                    <span>{t.pattern}</span>
                                                    <span className="text-slate-300 font-normal">→</span>
                                                    <span className="text-cyan-600">{t.expected}</span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 mt-1">{t.description}</div>
                                            </div>
                                            <Plus size={18} className="text-slate-300 group-hover:text-cyan-600 transition-colors" />
                                        </button>
                                    ))}
                                </div>
                            </section>
                            <section>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    常用外・人名漢字 (除外許可)
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {standardTemplates.commonExclusions.map(t => (
                                        <button key={t.pattern} onClick={() => addFromLibrary(t)} disabled={items.some(i => i.pattern === t.pattern)} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-cyan-200 hover:bg-cyan-50/30 transition-all text-left disabled:opacity-50 group">
                                            <div>
                                                <div className="text-sm font-bold text-slate-800">
                                                    {t.pattern} <span className="text-[10px] font-normal text-slate-400 ml-2">(許可)</span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 mt-1">{t.description}</div>
                                            </div>
                                            <Plus size={18} className="text-slate-300 group-hover:text-cyan-600 transition-colors" />
                                        </button>
                                    ))}
                                </div>
                            </section>
                        </div>
                        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button onClick={() => setShowLibrary(false)} className="px-6 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-900 transition-all shadow-lg shadow-slate-200">完了</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <BookOpen className="text-cyan-600" size={24} />
                        カスタム用語・表記辞書
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">表記の統一ルールや、標準チェックの例外として許可したい単語を管理します。</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => setScope('document')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${scope === 'document' ? 'bg-white text-green-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>文書</button>
                    <button onClick={() => setScope('project')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${scope === 'project' ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>プロジェクト</button>
                    <button onClick={() => setScope('team')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${scope === 'team' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>チーム</button>
                </div>
            </div>

            <div className="mb-6">
                <button onClick={() => setShowLibrary(true)} className="flex items-center gap-2 px-5 py-3 bg-white border border-cyan-100 text-cyan-700 rounded-2xl text-sm font-bold hover:bg-cyan-50 hover:border-cyan-200 transition-all shadow-sm shadow-cyan-100">
                    <BookOpen size={18} />
                    標準ライブラリからルールを一括追加
                </button>
            </div>

            {renderTable('correction')}
            {renderTable('exclusion')}

            <div className="flex justify-center pt-8 border-t border-slate-100 mt-8">
                <button onClick={handleSave} className={`flex items-center gap-2 px-10 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg ${isSaved ? 'bg-green-600 text-white translate-y-1' : 'bg-slate-800 text-white hover:bg-slate-900 active:scale-95 shadow-slate-200'}`}>
                    {isSaved ? <CheckCircle2 size={18} /> : <Save size={18} />}
                    {isSaved ? '保存済み' : `${scope === 'document' ? 'この文書' : scope === 'project' ? 'プロジェクト' : 'チーム'}の設定として保存`}
                </button>
            </div>

            <div className="flex gap-4 p-5 bg-amber-50 rounded-2xl border border-amber-100 mt-12">
                <AlertCircle className="text-amber-500 shrink-0" size={20} />
                <div className="text-xs text-amber-800 leading-relaxed">
                    <p className="font-bold mb-1">💡 ヒント</p>
                    <p>標準ルールでエラーが出る言葉も、「除外設定」に追加することで正当な表記として扱われるようになります。</p>
                </div>
            </div>
        </div>
    );
};
