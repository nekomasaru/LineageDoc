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

    runValidation: (content, frontmatter) => {
        set({ isChecking: true });

        // シミュレーション: 少し遅延させて実行
        setTimeout(() => {
            const newIssues: QualityIssue[] = [];

            // 1. mdschema 相当の構造チェック (YAML)
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

            // 2. Vale 相当の文体チェック (Regexベースの簡易版)
            if (content.includes('等々')) {
                newIssues.push({
                    id: 'vale-1',
                    type: 'prose',
                    level: 'error',
                    message: '「等々」は公文書では使用を避けてください。「等」に統一します。',
                    source: 'Vale'
                });
            }
            if (content.includes('したりする')) {
                newIssues.push({
                    id: 'vale-2',
                    type: 'prose',
                    level: 'warning',
                    message: '「したりする」は曖昧な表現です。直接的な動詞の使用を検討してください。',
                    source: 'Vale'
                });
            }

            set({ issues: newIssues, isChecking: false });
        }, 500);
    }
}));
