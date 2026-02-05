'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, CheckCircle2, Save, AlertCircle, List } from 'lucide-react';
import { useDocumentStore } from '@/stores/documentStore';
import { useAppStore } from '@/stores/appStore';
import { useProjectStore } from '@/stores/projectStore';
import { GovernanceScopeSelector, GovernanceScope } from './GovernanceScopeSelector';
import { Project, Team, Document } from '@/lib/types';

interface SchemaRow {
    id: string;
    level: number;
    text: string;
}

interface MDSchemaFormEditorProps {
    overrideTarget?: { type: 'team' | 'project' | 'template'; id: string };
}

export const MDSchemaFormEditor: React.FC<MDSchemaFormEditorProps> = ({ overrideTarget }) => {
    const { currentDocumentId } = useAppStore();
    const { documents } = useDocumentStore();
    const { projects, teams, updateProjectGovernance, updateTeamGovernance, updateTemplateGovernance } = useProjectStore();

    const [rows, setRows] = useState<SchemaRow[]>([]);
    const [isSaved, setIsSaved] = useState(false);

    // Initial load: parse YAML to rows based on overrideTarget
    useEffect(() => {
        if (!overrideTarget) return;

        let schemaToParse: string | undefined;

        if (overrideTarget.type === 'template') {
            const team = teams[0];
            schemaToParse = team?.templateGovernance?.[overrideTarget.id]?.mdSchema;
        } else if (overrideTarget.type === 'project') {
            const project = projects.find(p => p.id === overrideTarget.id);
            schemaToParse = project?.governance?.mdSchema;
        } else if (overrideTarget.type === 'team') {
            const team = teams.find(t => t.id === overrideTarget.id);
            schemaToParse = team?.governance?.mdSchema;
        }

        if (!schemaToParse) {
            setRows([{ id: '1', level: 1, text: '' }]);
            return;
        }

        try {
            const parsedRows: SchemaRow[] = [];
            const lines = schemaToParse.split('\n');
            let currentLevel: number | null = null;

            lines.forEach((line, index) => {
                const levelMatch = line.match(/level:\s*(\d+)/);
                const textMatch = line.match(/text:\s*["']?([^"']+)["']?/);

                if (levelMatch) currentLevel = parseInt(levelMatch[1]);
                if (textMatch && currentLevel !== null) {
                    parsedRows.push({
                        id: `row-${index}-${Date.now()}`,
                        level: currentLevel,
                        text: textMatch[1]
                    });
                    currentLevel = null;
                }
            });

            if (parsedRows.length > 0) {
                setRows(parsedRows);
            } else {
                setRows([{ id: '1', level: 1, text: '' }]);
            }
        } catch (e) {
            console.error('Failed to parse mdSchema YAML:', e);
            setRows([{ id: '1', level: 1, text: '' }]);
        }
    }, [overrideTarget, documents, projects, teams]);

    const addRow = () => {
        const lastRow = rows[rows.length - 1];
        setRows([...rows, {
            id: Math.random().toString(36).substr(2, 9),
            level: lastRow ? lastRow.level : 2,
            text: ''
        }]);
    };

    const removeRow = (id: string) => {
        if (rows.length <= 1) return;
        setRows(rows.filter(r => r.id !== id));
    };

    const updateRow = (id: string, updates: Partial<SchemaRow>) => {
        setRows(rows.map(r => r.id === id ? { ...r, ...updates } : r));
    };

    const handleSave = () => {
        if (!overrideTarget) return;

        const yaml = "structure:\n" + rows
            .filter(r => r.text.trim() !== '')
            .map(r => `  - level: ${r.level}\n    text: "${r.text.replace(/"/g, '\\"')}"`)
            .join('\n');

        if (overrideTarget.type === 'template') {
            const teamId = teams[0]?.id;
            if (teamId) {
                updateTemplateGovernance(teamId, overrideTarget.id, { mdSchema: yaml });
            }
        } else if (overrideTarget.type === 'project') {
            updateProjectGovernance(overrideTarget.id, { mdSchema: yaml });
        } else if (overrideTarget.type === 'team') {
            updateTeamGovernance(overrideTarget.id, { mdSchema: yaml });
        }

        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const targetLabel = overrideTarget?.type === 'team' ? '組織・チーム'
        : overrideTarget?.type === 'project' ? 'プロジェクト'
            : 'テンプレート';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <List className="text-cyan-600" size={24} />
                        文書構造の定義
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        選択中の {targetLabel} に適用する、見出しの順序と階層を設定します。
                    </p>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">構成要素の一覧</span>
                    <button
                        onClick={handleSave}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 ${isSaved
                            ? 'bg-green-600 text-white'
                            : 'bg-slate-800 text-white hover:bg-slate-900'
                            }`}
                    >
                        {isSaved ? <CheckCircle2 size={16} /> : <Save size={16} />}
                        {isSaved ? '保存済み' : `${targetLabel}の設定として保存`}
                    </button>
                </div>

                <div className="p-6 space-y-3">
                    {rows.map((row, index) => (
                        <div key={row.id} className="flex items-center gap-3 group animate-in slide-in-from-left duration-200" style={{ animationDelay: `${index * 50}ms` }}>
                            <div className="text-slate-300 group-hover:text-slate-400 cursor-grab px-1">
                                <GripVertical size={18} />
                            </div>

                            <div className="w-24 shrink-0">
                                <select
                                    value={row.level}
                                    onChange={(e) => updateRow(row.id, { level: parseInt(e.target.value) })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                                >
                                    <option value={1}>H1 (大)</option>
                                    <option value={2}>H2 (中)</option>
                                    <option value={3}>H3 (小)</option>
                                    <option value={4}>H4</option>
                                </select>
                            </div>

                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={row.text}
                                    placeholder="見出しのテキスト (例: 概要、目的、決定事項...)"
                                    onChange={(e) => updateRow(row.id, { text: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-800 placeholder:text-slate-300 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all"
                                />
                            </div>

                            <button
                                onClick={() => removeRow(row.id)}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}

                    <button
                        onClick={addRow}
                        className="w-full py-3 mt-4 flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-cyan-300 hover:text-cyan-600 hover:bg-cyan-50/50 transition-all font-medium text-sm"
                    >
                        <Plus size={18} />
                        項目を追加する
                    </button>
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3 text-sm text-amber-900">
                <AlertCircle className="shrink-0 mt-0.5 text-amber-600" size={20} />
                <div>
                    <p className="font-bold">ヒント: 正規表現の利用</p>
                    <p className="mt-1 opacity-80 leading-relaxed">
                        「text」欄に <code>/^本文:.*$/</code> のようにスラッシュで囲って記述すると、正規表現として扱われます。
                        動的なタイトルや日付を含む見出しをチェックしたい場合に便利です。
                    </p>
                </div>
            </div>
        </div>
    );
};
