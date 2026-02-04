import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const execAsync = promisify(exec);

interface LintIssue {
    line: number;
    column: number;
    severity: 'error' | 'warning' | 'suggestion';
    message: string;
    rule: string;
}

interface LintResponse {
    success: boolean;
    issues: LintIssue[];
    error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<LintResponse>> {
    try {
        const { content } = await request.json();

        if (!content || typeof content !== 'string') {
            return NextResponse.json({
                success: false,
                issues: [],
                error: 'Content is required',
            }, { status: 400 });
        }

        // --- Textlint API Call ONLY ---
        let textlintIssues: LintIssue[] = [];
        try {
            const textlintRes = await fetch('http://localhost:8080/api/lint', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: content }),
                signal: AbortSignal.timeout(5000)
            });

            if (textlintRes.ok) {
                const data = await textlintRes.json();
                if (data.errors) {
                    textlintIssues = data.errors.map((err: any) => ({
                        line: err.line,
                        column: err.column,
                        severity: err.severity,
                        message: err.message,
                        rule: `textlint:${err.ruleId}`,
                    }));
                }
            } else {
                console.warn('Textlint API returned non-OK status:', textlintRes.status);
            }
        } catch (err) {
            console.error('Failed to call textlint-api:', err);
            return NextResponse.json({
                success: false,
                issues: [],
                error: 'Textlint service is unavailable',
            }, { status: 503 });
        }

        // Sort by line/column
        const allIssues = textlintIssues.sort((a, b) => {
            if (a.line !== b.line) return a.line - b.line;
            return a.column - b.column;
        });

        return NextResponse.json({
            success: true,
            issues: allIssues,
        });

    } catch (error) {
        console.error('Lint API error:', error);
        return NextResponse.json({
            success: false,
            issues: [],
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}
