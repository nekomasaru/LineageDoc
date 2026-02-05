import React, { useState, useEffect } from 'react';
import { SpellCheck, CheckCircle2, Save, Info } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useDocumentStore } from '@/stores/documentStore';
import { useProjectStore } from '@/stores/projectStore';
import { Document, Project, Team } from '@/lib/types';
import { GovernanceScopeSelector, GovernanceScope } from './GovernanceScopeSelector';

interface LintRule {
    id: string;
    name: string;
    description: string;
    level: 'error' | 'warning' | 'suggestion';
    enabled: boolean;
}

export const TextlintConfig: React.FC = () => {
    const { currentDocumentId } = useAppStore();
    const { documents, updateTextlintConfig } = useDocumentStore();
    const { projects, teams, updateProjectGovernance, updateTeamGovernance } = useProjectStore(); // Added

    const [scope, setScope] = useState<GovernanceScope>('document'); // Added
    const [isSaved, setIsSaved] = useState(false);

    // Define available rules (mapped to actual rule IDs)
    // Default rules template
    const defaultRules: LintRule[] = [
        // Technical Writing Preset
        { id: 'preset-ja-technical-writing/ja-no-mixed-period', name: '句読点の統一', description: '文末が「。」で統一されているかチェックします。', level: 'error', enabled: true },
        { id: 'preset-ja-technical-writing/sentence-length', name: '文章の長さ制御', description: '一文が長すぎないか（100文字以内）をチェックします。', level: 'warning', enabled: true },
        { id: 'preset-ja-technical-writing/ja-no-successive-word', name: '連続した語句の禁止', description: '同じ言葉が連続して使われていないか（誤字脱字の検知）をチェックします。', level: 'warning', enabled: true },
        { id: 'preset-ja-technical-writing/ja-no-weak-phrase', name: '弱い表現の回避', description: '「〜かもしれない」などの曖昧な表現を指摘します。', level: 'suggestion', enabled: false },
        { id: 'preset-ja-technical-writing/no-exclamation-question-mark', name: '感嘆符・疑問符の制限', description: '公用文で不適切な「！」や「？」の使用を制限します。', level: 'warning', enabled: false },

        // Single rules
        { id: 'ja-hiragana-keishikimeishi', name: '形式名詞のひらがな化', description: '「事」「時」などを「こと」「とき」と書く公用文ルールを適用します。', level: 'warning', enabled: true },
        { id: 'joyo-kanji', name: '常用漢字外のチェック', description: '「冨」などの常用外漢字を非推奨とし、読みやすい漢字への置き換えを促します。', level: 'warning', enabled: true },

        // Dictionary-based (via prh)
        { id: 'prh', name: '用語・送り仮名の統一 (prh)', description: '「行なう→行う」などの送り仮名や、専門用語の表記揺れを一括チェックします。', level: 'error', enabled: true },

        // Generic Rules
        { id: 'no-todo', name: 'TODO記述の禁止', description: '本文中に「TODO」や「未定」が残っている場合に警告します。', level: 'error', enabled: true },
        { id: 'max-kanji-continuous-len', name: '漢字の連続使用制限', description: '漢字が6文字以上連続する場合、読みにくさとして指摘します。', level: 'warning', enabled: true },
        { id: 'no-double-negative-ja', name: '二重否定の禁止', description: '「〜ないわけではない」といった、分かりにくい否定表現を検知します。', level: 'warning', enabled: true },
        { id: 'no-dropping-the-ra', name: 'ら抜き言葉のチェック', description: '「見れる」「食べれる」などの不適切な表現を指摘します。', level: 'error', enabled: true },
    ];

    const [rules, setRules] = useState<LintRule[]>(defaultRules); // Updated initialization

    const doc = documents.find((d: Document) => d.id === currentDocumentId);
    const project = doc ? projects.find((p: Project) => p.id === doc.projectId) : null; // Added
    const team = project ? teams.find((t: Team) => t.id === project.teamId) : null; // Added

    // Load from appropriate scope
    useEffect(() => {
        let config: Record<string, boolean> | undefined;

        if (scope === 'document') {
            config = doc?.textlintConfig;
        } else if (scope === 'project') {
            config = project?.governance?.textlintConfig;
        } else if (scope === 'team') {
            config = team?.governance?.textlintConfig;
        }

        if (config) {
            setRules(defaultRules.map(r => ({
                ...r,
                enabled: config?.[r.id] ?? r.enabled
            })));
        } else {
            setRules(defaultRules);
        }
    }, [scope, doc?.id, project?.id, team?.id]); // Updated dependencies

    const toggleRule = (id: string) => {
        setRules(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
    };

    const handleSave = () => {
        const config: Record<string, boolean> = {};
        rules.forEach(r => {
            config[r.id] = r.enabled;
        });

        if (scope === 'document' && currentDocumentId) {
            updateTextlintConfig(currentDocumentId, config);
        } else if (scope === 'project' && project) {
            updateProjectGovernance(project.id, { textlintConfig: config });
        } else if (scope === 'team' && team) {
            updateTeamGovernance(team.id, { textlintConfig: config });
        }

        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const getSaveButtonText = () => {
        if (isSaved) return '保存済み';
        switch (scope) {
            case 'document':
                return 'この文書に適用';
            case 'project':
                return 'プロジェクトに適用';
            case 'team':
                return 'チームに適用';
            default:
                return '保存';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <SpellCheck className="text-cyan-600" size={24} />
                        文章校正のルール
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        公用文ルールやテクニカルライティングの基準に基づいて、文章の品質をチェックします。
                    </p>
                </div>

                <GovernanceScopeSelector scope={scope} onScopeChange={setScope} />
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold py-1 px-2 bg-slate-100 text-slate-500 rounded-md">ENGINE: TEXTLINT / VALE</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rules.map((rule) => (
                    <div
                        key={rule.id}
                        onClick={() => toggleRule(rule.id)}
                        className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${rule.enabled
                            ? 'bg-white border-cyan-100 shadow-md ring-1 ring-cyan-50'
                            : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className={`p-2 rounded-lg ${rule.enabled ? 'bg-cyan-50 text-cyan-600' : 'bg-slate-100 text-slate-400'}`}>
                                <SpellCheck size={20} />
                            </div>
                            <div className={`w-10 h-6 rounded-full relative transition-colors ${rule.enabled ? 'bg-cyan-600' : 'bg-slate-200'}`}>
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${rule.enabled ? 'left-5' : 'left-1'}`} />
                            </div>
                        </div>

                        <h3 className="font-bold mb-1 text-slate-800">
                            {rule.name}
                        </h3>
                        <p className="text-xs leading-relaxed text-slate-500">
                            {rule.description}
                        </p>

                        <div className="mt-4 flex items-center justify-between">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${rule.level === 'error' ? 'bg-red-50 text-red-600' :
                                rule.level === 'warning' ? 'bg-amber-50 text-amber-600' :
                                    'bg-blue-50 text-blue-600'
                                }`}>
                                {rule.level.toUpperCase()}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-center pt-8 border-t border-slate-100 mt-8">
                <button
                    onClick={handleSave}
                    className={`flex items-center gap-3 px-8 py-3 rounded-2xl font-bold transition-all shadow-lg ${isSaved
                        ? 'bg-green-600 text-white translate-y-1 shadow-green-100'
                        : 'bg-slate-800 text-white hover:bg-slate-900 active:scale-95 shadow-slate-200'
                        }`}
                >
                    {isSaved ? <CheckCircle2 size={20} /> : <Save size={20} />}
                    {isSaved ? '保存済み' : `${scope === 'document' ? 'この文書' : scope === 'project' ? 'プロジェクト' : 'チーム'}に適用`}
                </button>
            </div>

            <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl flex gap-4 text-xs text-blue-800 items-start">
                <Info className="shrink-0 text-blue-600" size={24} />
                <div className="space-y-2">
                    <p className="font-bold text-sm">自動チェックのタイミング</p>
                    <p className="opacity-80 leading-relaxed">
                        校正チェックは、執筆中のエディタで一定時間操作が止まった際、および「保存」実行時にバックグラウンドで実施されます。
                        指摘内容はエディタ右側の「品質」パネル、または波線（スクイグル）として表示されます。
                    </p>
                </div>
            </div>
        </div>
    );
};
