/**
 * blocksToMarkdown.ts
 * 
 * BlockNoteブロックをMarkdown文字列にシリアライズする
 * 「lossy」変換（装飾の一部が失われる）だが、公文書スタイルには適している
 * 
 * @skill editor-logic-bn2md
 */

import type { BlockNoteEditor, Block } from '@blocknote/core';

/**
 * BlockNoteブロックをMarkdownに変換する
 * 
 * @param blocks - 変換元のBlockNoteブロック
 * @param editor - BlockNoteエディタインスタンス
 * @returns Markdown文字列
 * 
 * @example
 * ```tsx
 * const markdown = await blocksToMarkdown(editor.document, editor);
 * useEditorStore.getState().setMarkdown(markdown);
 * ```
 */
export async function blocksToMarkdown(
    blocks: Block[],
    editor: BlockNoteEditor
): Promise<string> {
    try {
        // BlockNoteの内蔵シリアライザーを使用
        // "lossy" = 一部の装飾が失われるが、クリーンなMarkdownになる
        let markdown = await editor.blocksToMarkdownLossy(blocks);

        // バックスラッシュのエスケープ (\\) を解除
        // BlockNoteは仕様通り \\ を生成するが、Monacoで \\ と表示されると
        // リッチ編集( \ )とズレて見えるため、ユーザー体験を優先して補正する。
        markdown = markdown.replace(/\\\\/g, '\\');

        return markdown;
    } catch (error) {
        console.error('[bn2md] Blocks to Markdown conversion failed:', error);

        // エラー時は空文字列を返す
        return '';
    }
}

/**
 * ブロックから純粋なテキストを抽出する（プレビュー用）
 * 
 * @param blocks - BlockNoteブロック
 * @returns プレーンテキスト
 */
export function blocksToPlainText(blocks: Block[]): string {
    const lines: string[] = [];

    function extractText(block: any): void {
        if (block.content) {
            if (Array.isArray(block.content)) {
                const text = block.content
                    .map((inline: any) => inline.text || '')
                    .join('');
                if (text) lines.push(text);
            } else if (typeof block.content === 'string') {
                lines.push(block.content);
            }
        }

        if (block.children) {
            block.children.forEach(extractText);
        }
    }

    blocks.forEach(extractText);
    return lines.join('\n');
}
