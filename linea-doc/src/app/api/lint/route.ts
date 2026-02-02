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

        // 一時ディレクトリとファイルを作成
        const tempDir = join(process.cwd(), '.temp-lint');
        const tempFile = join(tempDir, `${randomUUID()}.md`);

        // ディレクトリ作成
        await mkdir(tempDir, { recursive: true });

        // 一時ファイルに書き込み
        await writeFile(tempFile, content, 'utf-8');

        try {
            // Vale を実行 (JSON出力)
            // 注意: windows環境ではパスの扱いに注意が必要だが、execでコマンドとして渡すため基本はOK
            const { stdout, stderr } = await execAsync(
                `vale --output=JSON "${tempFile}"`,
                { cwd: process.cwd() }
            );

            // JSON解析
            // valeはエラーがあってもstdoutに出力するが、コマンド自体のexit codeが1になる場合がある
            // execはexit codeが0以外だとエラーをスローする
            // なのでここは到達しない可能性がある -> catchブロックでstdoutを確認する必要がある

            const valeOutput = JSON.parse(stdout || '{}');
            const fileIssues = valeOutput[tempFile] || [];

            // フォーマット変換
            const issues: LintIssue[] = fileIssues.map((issue: any) => ({
                line: issue.Line,
                column: issue.Span?.[0] || 1,
                severity: mapSeverity(issue.Severity),
                message: issue.Message,
                rule: issue.Check,
            }));

            return NextResponse.json({
                success: true,
                issues,
            });

        } catch (execError: any) {
            // Valeがエラー(指摘事項あり)でexit code 1を返した場合、stdoutに結果が入っている可能性がある
            if (execError.stdout) {
                try {
                    const valeOutput = JSON.parse(execError.stdout || '{}');
                    const fileIssues = valeOutput[tempFile] || [];

                    const issues: LintIssue[] = fileIssues.map((issue: any) => ({
                        line: issue.Line,
                        column: issue.Span?.[0] || 1,
                        severity: mapSeverity(issue.Severity),
                        message: issue.Message,
                        rule: issue.Check,
                    }));

                    return NextResponse.json({
                        success: true,
                        issues,
                    });
                } catch (parseError) {
                    console.error('Failed to parse Vale output from error:', parseError);
                }
            }

            console.error('Lint execution error:', execError);
            return NextResponse.json({
                success: false,
                issues: [],
                error: execError.message || 'Lint execution failed',
            }, { status: 500 });

        } finally {
            // クリーンアップ
            try {
                await unlink(tempFile);
            } catch (e) { /* ignore */ }
        }

    } catch (error) {
        console.error('Lint API error:', error);
        return NextResponse.json({
            success: false,
            issues: [],
            error: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}

function mapSeverity(valeSeverity: string): 'error' | 'warning' | 'suggestion' {
    switch (valeSeverity.toLowerCase()) {
        case 'error':
            return 'error';
        case 'warning':
            return 'warning';
        default:
            return 'suggestion';
    }
}
