/**
 * FrontmatterForm.tsx
 * 
 * MarkdownのYAML Frontmatterをフォーム形式で編集するコンポーネント
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import matter from 'gray-matter';
import yaml from 'js-yaml';

export interface Frontmatter {
    title: string;
    author: string;
    status: 'draft' | 'review' | 'final' | 'obsolete';
    rationale: string;
    priority: 'low' | 'medium' | 'high';
    tags?: string[];
    project?: string;
    [key: string]: any;
}

const DEFAULT_FRONTMATTER: Frontmatter = {
    title: '無題のドキュメント',
    author: '',
    status: 'draft',
    project: '',
    tags: [],
    rationale: '',
    priority: 'medium',
};

export function FrontmatterForm() {
    const { markdown, setMarkdown } = useEditorStore();
    const [formData, setFormData] = useState<Frontmatter>(DEFAULT_FRONTMATTER);

    // MarkdownからFrontmatterをパースしてStateを更新
    useEffect(() => {
        try {
            const { data } = matter(markdown);
            if (Object.keys(data).length > 0) {
                setFormData({
                    ...DEFAULT_FRONTMATTER,
                    ...data,
                });
            }
        } catch (e) {
            console.error('[FrontmatterForm] Parse error:', e);
        }
    }, [markdown]);

    // フォームの変更をMarkdownに反映する
    const updateMarkdown = useCallback((newData: Frontmatter) => {
        try {
            const { content } = matter(markdown);
            const newFrontmatter = yaml.dump(newData);
            const newMarkdown = `---\n${newFrontmatter}---\n${content}`;

            // 無限ループを防ぐため、内容が変わった場合のみ更新
            if (newMarkdown !== markdown) {
                setMarkdown(newMarkdown);
            }
        } catch (e) {
            console.error('[FrontmatterForm] Update error:', e);
        }
    }, [markdown, setMarkdown]);

    const handleChange = (field: keyof Frontmatter, value: any) => {
        const newData = { ...formData, [field]: value };
        setFormData(newData);
        updateMarkdown(newData);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200 w-72 shrink-0">
            {/* ヘッダー */}
            <div className="p-4 border-b border-slate-200 bg-white shrink-0">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-cyan-600 rounded-sm"></span>
                    文書属性 (Metadata)
                </h3>
                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Document Attribution</p>
            </div>

            {/* フォーム本体 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {/* プロジェクト */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">プロジェクト / 分類</label>
                    <input
                        type="text"
                        value={formData.project || ''}
                        onChange={(e) => handleChange('project', e.target.value)}
                        className="w-full text-sm font-mono border-slate-200 rounded-md focus:ring-cyan-500 focus:border-cyan-500 bg-white"
                        placeholder="PRJ-CODE..."
                    />
                </div>

                {/* タグ */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-tight flex flex-col gap-0.5">
                        タグ (Tags)
                        <span className="text-[9px] text-slate-400 font-normal leading-tight">※ カンマ区切りで入力</span>
                    </label>
                    <input
                        type="text"
                        value={formData.tags?.join(', ') || ''}
                        onChange={(e) => handleChange('tags', e.target.value.split(/[,\u3001]/).map(s => s.trim()).filter(s => s !== ''))}
                        className="w-full text-sm border-slate-200 rounded-md focus:ring-cyan-500 focus:border-cyan-500 bg-white"
                        placeholder="議事録, 設計書, 重要..."
                    />
                </div>

                {/* タイトル */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">タイトル</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        className="w-full text-sm border-slate-200 rounded-md focus:ring-cyan-500 focus:border-cyan-500 bg-white"
                        placeholder="文書の正式名称..."
                    />
                </div>

                {/* 起案者 */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">起案者 / 作成者</label>
                    <input
                        type="text"
                        value={formData.author}
                        onChange={(e) => handleChange('author', e.target.value)}
                        className="w-full text-sm border-slate-200 rounded-md focus:ring-cyan-500 focus:border-cyan-500 bg-white"
                        placeholder="氏名を入力..."
                    />
                </div>

                {/* ステータス */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">ステータス</label>
                    <select
                        value={formData.status}
                        onChange={(e) => handleChange('status', e.target.value)}
                        className="w-full text-sm border-slate-200 rounded-md focus:ring-cyan-500 focus:border-cyan-500 bg-white"
                    >
                        <option value="draft">ドラフト</option>
                        <option value="review">調整・レビュー中</option>
                        <option value="final">公式・確定</option>
                        <option value="obsolete">廃止</option>
                    </select>
                </div>

                {/* 優先度 */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">優先度 / 重要度</label>
                    <div className="flex gap-1.5">
                        {['low', 'medium', 'high'].map((p) => (
                            <button
                                key={p}
                                onClick={() => handleChange('priority', p)}
                                className={`
                                    flex-1 py-1.5 text-xs rounded border transition-all font-medium
                                    ${formData.priority === p
                                        ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                                        : 'bg-white text-slate-500 border-slate-200 hover:border-cyan-300'
                                    }
                                `}
                            >
                                {p === 'low' ? '低' : p === 'medium' ? '中' : '高'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 理由/背景 */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">起案の理由 / 背景</label>
                    <textarea
                        value={formData.rationale}
                        onChange={(e) => handleChange('rationale', e.target.value)}
                        rows={5}
                        className="w-full text-sm border-slate-200 rounded-md focus:ring-cyan-500 focus:border-cyan-500 bg-white leading-relaxed"
                        placeholder="なぜこの文書が必要なのか、組織的な背景を記述してください..."
                    />
                </div>

                {/* 関連ドキュメント (Lineage) */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-tight flex flex-col gap-0.5">
                        関連ドキュメント ID
                        <span className="text-[9px] text-slate-400 font-normal leading-tight">※ カンマ区切りで入力。他文書との繋がりを定義します。</span>
                    </label>
                    <input
                        type="text"
                        value={formData.references?.join(', ') || ''}
                        onChange={(e) => handleChange('references', e.target.value.split(',').map(s => s.trim()).filter(s => s !== ''))}
                        className="w-full text-sm font-mono border-slate-200 rounded-md focus:ring-cyan-500 focus:border-cyan-500 bg-slate-100/50"
                        placeholder="例: doc-1, doc-2"
                    />
                </div>
            </div>
        </div>
    );
}
