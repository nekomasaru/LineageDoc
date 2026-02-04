/**
 * qualityStore.ts
 * 
 * 文書の品質（文体、構造）のチェック結果を管理するストア
 */

import { create } from 'zustand';

export interface QualityIssue {
    id: string;
    type: 'prose' | 'structure';
    level: 'error' | 'warning' | 'suggestion';
    message: string;
    line?: number;
    field?: string;
    source: string; // 'Vale' or 'mdschema'
}

interface QualityState {
    issues: QualityIssue[];
    isChecking: boolean;

    // アクション
    setIssues: (issues: QualityIssue[]) => void;
    clearIssues: () => void;
    setChecking: (isChecking: boolean) => void;

    // チェック実行（簡易バリデーター）
    runValidation: (content: string, frontmatter: any) => void;
}

export const useQualityStore = create<QualityState>((set) => ({
    issues: [],
    isChecking: false,

    setIssues: (issues) => set({ issues }),
    clearIssues: () => set({ issues: [] }),
    setChecking: (isChecking) => set({ isChecking }),

    runValidation: async (content, frontmatter) => {
        set({ isChecking: true });

        try {
            const newIssues: QualityIssue[] = [];

            // 1. Textlint API 呼び出し
            try {
                const response = await fetch('http://localhost:8080/api/lint', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: content }),
                });

                if (response.ok) {
                    const data = await response.json();

                    // Textlintの結果をQualityIssueに変換
                    if (data.errors && Array.isArray(data.errors)) {
                        data.errors.forEach((msg: any, index: number) => {
                            newIssues.push({
                                id: `textlint-${index}-${msg.line}-${msg.column}`,
                                type: 'prose',
                                level: msg.severity as 'error' | 'warning' | 'suggestion',
                                message: msg.message,
                                line: msg.line,
                                source: 'Textlint',
                            });
                        });
                    }
                } else {
                    console.error('Textlint API error:', response.statusText);
                }
            } catch (err) {
                console.error('Textlint API connection failed:', err);
                // 接続失敗時もプロセスを落とさない
            }

            // 2. mdschema 相当の構造チェック (YAML) - 既存ロジック維持
            if (!frontmatter.rationale || frontmatter.rationale.length < 10) {
                newIssues.push({
                    id: 'schema-1',
                    type: 'structure',
                    level: 'warning',
                    message: '起案の理由（rationale）が短すぎます。より具体的な背景を記述してください。',
                    field: 'rationale',
                    source: 'mdschema'
                });
            }
            if (frontmatter.status === 'draft' && frontmatter.author === '') {
                newIssues.push({
                    id: 'schema-2',
                    type: 'structure',
                    level: 'suggestion',
                    message: '起案者の名前を入力することを推奨します。',
                    field: 'author',
                    source: 'mdschema'
                });
            }

            set({ issues: newIssues, isChecking: false });
        } catch (e) {
            console.error('Validation failed:', e);
            set({ isChecking: false });
        }
    }
}));
