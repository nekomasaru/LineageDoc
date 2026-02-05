'use client';

import React, { useState, useEffect } from 'react';
import { useDocumentStore } from '@/stores/documentStore';
import { useAppStore } from '@/stores/appStore';
import { AlertCircle, Save, Info, CheckCircle2 } from 'lucide-react';

export const GovernanceSettings: React.FC = () => {
    const { currentDocumentId } = useAppStore();
    const { documents, updateMdSchema } = useDocumentStore();

    const doc = documents.find(d => d.id === currentDocumentId);
    const [schemaText, setSchemaText] = useState(doc?.mdSchema || '');
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        if (doc) {
            setSchemaText(doc.mdSchema || '');
        }
    }, [doc?.id]);

    const handleSave = () => {
        if (currentDocumentId) {
            updateMdSchema(currentDocumentId, schemaText);
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        }
    };

    if (!doc) {
        return (
            <div className="p-8 text-center text-slate-500">
                ドキュメントが選択されていません。
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">ガバナンス設定</h2>
                    <p className="text-xs text-slate-500">MDSchemaによる構造規定の定義</p>
                </div>
                <button
                    onClick={handleSave}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isSaved
                            ? 'bg-green-600 text-white'
                            : 'bg-cyan-600 text-white hover:bg-cyan-700 active:scale-95'
                        }`}
                >
                    {isSaved ? <CheckCircle2 size={16} /> : <Save size={16} />}
                    {isSaved ? '保存完了' : 'スキーマを保存'}
                </button>
            </div>

            <div className="p-4 flex-1 overflow-auto space-y-4">
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex gap-3 text-sm text-blue-800">
                    <Info className="shrink-0 mt-0.5" size={18} />
                    <div>
                        <p className="font-bold">MDSchemaとは？</p>
                        <p className="mt-1 opacity-90">
                            文書の見出し構造や必須項目を、YAML形式で定義します。
                            エディタ右側の「品質」パネルでリアルタイムにチェックが行われます。
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        スキーマ定義 (YAML)
                        <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded uppercase font-mono">
                            MDSCHEMA v1
                        </span>
                    </label>
                    <textarea
                        value={schemaText}
                        onChange={(e) => setSchemaText(e.target.value)}
                        className="w-full h-[300px] p-4 font-mono text-sm bg-slate-900 text-slate-300 rounded-lg border border-slate-700 focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all outline-none"
                        placeholder="# structure:
#   - level: 1
#     text: 'タイトル'
#   - level: 2
#     text: '概要'"
                    />
                </div>

                <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                    <h3 className="text-sm font-bold text-slate-800 mb-2">記述例</h3>
                    <pre className="text-xs text-slate-600 font-mono overflow-x-auto">
                        {`structure:
  - level: 1
    text: "/^業務日報:.*$/"  # 正規表現も使用可能
  - level: 2
    text: "本日の業務内容"
  - level: 2
    text: "課題 / 相談事項"`}
                    </pre>
                </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50">
                <p className="text-[11px] text-slate-400">
                    ※ 変更は即座にこのドキュメントのバリデーションに反映されます。
                    テンプレート自体の変更は将来のアップデートで対応予定です。
                </p>
            </div>
        </div>
    );
};
