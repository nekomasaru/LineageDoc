import { diffLines, Change } from 'diff';

export interface DiffResult {
    type: 'added' | 'removed' | 'unchanged';
    value: string;
    lineStart: number;
    lineEnd: number;
}

/**
 * 2つのテキストを比較して差分を返す
 * @param oldText 古いテキスト（履歴）
 * @param newText 新しいテキスト（現在）
 * @returns 差分結果の配列
 */
export function computeDiff(oldText: string, newText: string): DiffResult[] {
    const changes = diffLines(oldText, newText);
    const results: DiffResult[] = [];
    let currentLine = 1;

    for (const change of changes) {
        const lineCount = (change.value.match(/\n/g) || []).length;
        const hasTrailingNewline = change.value.endsWith('\n');
        const actualLineCount = hasTrailingNewline ? lineCount : lineCount + 1;

        if (change.added) {
            results.push({
                type: 'added',
                value: change.value,
                lineStart: currentLine,
                lineEnd: currentLine + actualLineCount - 1,
            });
            currentLine += actualLineCount;
        } else if (change.removed) {
            // 削除された行は現在のテキストには存在しないので、
            // 削除が発生した位置として記録
            results.push({
                type: 'removed',
                value: change.value,
                lineStart: currentLine,
                lineEnd: currentLine, // 削除はマーカーとして1行で表示
            });
            // currentLine は進めない（削除された行は新テキストにない）
        } else {
            results.push({
                type: 'unchanged',
                value: change.value,
                lineStart: currentLine,
                lineEnd: currentLine + actualLineCount - 1,
            });
            currentLine += actualLineCount;
        }
    }

    return results;
}
