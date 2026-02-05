export interface LintIssue {
    line: number;
    column: number;
    severity: 'error' | 'warning' | 'suggestion';
    message: string;
    rule: string;
}

export interface LintResult {
    success: boolean;
    issues: LintIssue[];
    error?: string;
}

/**
 * サーバーサイドでTextlintを実行し、結果を取得する
 */
export async function lintMarkdown(content: string, textlintConfig?: Record<string, boolean>): Promise<LintResult> {
    try {
        const response = await fetch('/api/lint', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, textlintConfig }),
        });

        if (!response.ok) {
            throw new Error(`Lint API error: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Lint API client error:', error);
        return {
            success: false,
            issues: [],
            error: error instanceof Error ? error.message : 'Network error',
        };
    }
}
