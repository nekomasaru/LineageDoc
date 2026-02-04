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
        // diffライブラリが提供する行数カウントを使用
        const lineCount = change.count || 0;

        if (change.added) {
            results.push({
                type: 'added',
                value: change.value,
                lineStart: currentLine,
                lineEnd: currentLine + lineCount - 1,
            });
            currentLine += lineCount;
        } else if (change.removed) {
            results.push({
                type: 'removed',
                value: change.value,
                lineStart: currentLine,
                lineEnd: currentLine,
            });
            // currentLine は進めない
        } else {
            // unchanged
            results.push({
                type: 'unchanged',
                value: change.value,
                lineStart: currentLine,
                lineEnd: currentLine + lineCount - 1,
            });
            currentLine += lineCount;
        }
    }

    return results;
}
