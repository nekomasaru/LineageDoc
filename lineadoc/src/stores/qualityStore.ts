/**
 * qualityStore.ts
 * 
 * 文書の品質（文体、構造）のチェック結果を管理するストア
 */

import { create } from 'zustand';
import { validateSchema } from '@/lib/quality/md-schema';

export interface QualityIssue {
    id: string;
    type: 'prose' | 'structure';
    level: 'error' | 'warning' | 'suggestion';
    message: string;
    line?: number;
    field?: string;
    source: string; // 'Vale', 'Textlint', or 'MDSCHEMA'
}

interface QualityState {
    issues: QualityIssue[];
    isChecking: boolean;
    highlightedIssue: QualityIssue | null;

    // アクション
    setIssues: (issues: QualityIssue[]) => void;
    clearIssues: () => void;
    setChecking: (isChecking: boolean) => void;
    setHighlightedIssue: (issue: QualityIssue | null) => void;

    // チェック実行（簡易バリデーター）
    runValidation: (content: string, frontmatter: any, mdSchema?: string) => Promise<void>;
}

export const useQualityStore = create<QualityState>((set) => ({
    issues: [],
    isChecking: false,
    highlightedIssue: null,

    setIssues: (issues) => set({ issues }),
    clearIssues: () => set({ issues: [] }),
    setChecking: (isChecking) => set({ isChecking }),
    setHighlightedIssue: (issue) => set({ highlightedIssue: issue }),

    runValidation: async (content, frontmatter, mdSchema) => {
        set({ isChecking: true });

        try {
            const newIssues: QualityIssue[] = [];

            // 1. Client-side Schema Validation (MDSCHEMA)
            const schemaResult = validateSchema(content, mdSchema);
            if (!schemaResult.valid) {
                schemaResult.issues.forEach((issue, index) => {
                    newIssues.push({
                        id: `schema-${index}`,
                        type: 'structure',
                        level: issue.severity,
                        message: issue.message,
                        line: issue.line,
                        source: 'MDSCHEMA'
                    });
                });
            }

            // 2. Textlint / Vale API Calls (Server-side)
            try {
                // Use relative path for internal API route
                const response = await fetch('/api/lint', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content }),
                });

                if (response.ok) {
                    const data = await response.json();

                    if (data.issues && Array.isArray(data.issues)) {
                        data.issues.forEach((msg: any, index: number) => {
                            newIssues.push({
                                id: `lint-${index}-${msg.line}-${msg.column}`,
                                type: 'prose',
                                level: msg.severity,
                                message: msg.message,
                                line: msg.line,
                                source: msg.rule || 'Textlint',
                            });
                        });
                    }
                }
            } catch (err) {
                // API unavailable - skip without error
                // console.debug('Lint API unavailable');
            }

            set({ issues: newIssues, isChecking: false });
        } catch (e) {
            console.error('Validation failed:', e);
            set({ isChecking: false });
        }
    }
}));
