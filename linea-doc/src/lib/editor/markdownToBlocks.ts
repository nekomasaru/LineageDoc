/**
 * markdownToBlocks.ts
 * 
 * Markdown文字列をBlockNoteのブロック形式（JSON）に変換するパーサー
 * 
 * @skill editor-logic-md2bn
 */

import type { BlockNoteEditor, Block } from '@blocknote/core';

/**
 * MarkdownをBlockNoteブロックに変換する
 * 
 * @param markdown - 変換元のMarkdown文字列
 * @param editor - BlockNoteエディタインスタンス
 * @returns BlockNoteブロックの配列
 * 
 * @example
 * ```tsx
 * const blocks = await markdownToBlocks('# Hello', editor);
 * editor.replaceBlocks(editor.document, blocks);
 * ```
 */
export async function markdownToBlocks(
    markdown: string,
    editor: BlockNoteEditor
): Promise<Block[]> {
    try {
        // バックスラッシュのエスケープ前処理
        // Monacoでは `\` と表示されているが、そのままパースするとエスケープ文字として消費されるため
        // `\\` に変換して文字として認識させる。
        // ※bn2mdでのエスケープ解除と対になる処理
        const escapedMarkdown = markdown.replace(/\\/g, '\\\\');

        // BlockNoteの内蔵パーサーを使用
        const blocks = await editor.tryParseMarkdownToBlocks(escapedMarkdown);
        return blocks;
    } catch (error) {
        console.error('[md2bn] Markdown to Blocks conversion failed:', error);

        // エラー時はフォールバック：プレーンテキストとして扱う
        return [
            {
                id: crypto.randomUUID(),
                type: 'paragraph',
                props: {
                    textColor: 'default',
                    backgroundColor: 'default',
                    textAlignment: 'left',
                },
                content: [{ type: 'text', text: markdown, styles: {} }],
                children: [],
            } as unknown as Block,
        ];
    }
}

/**
 * 変換結果の検証
 * 
 * @param blocks - 変換されたブロック
 * @returns 有効なブロックかどうか
 */
export function validateBlocks(blocks: Block[]): boolean {
    if (!Array.isArray(blocks)) return false;
    if (blocks.length === 0) return true; // 空は許容

    return blocks.every((block) => {
        return (
            block &&
            typeof block === 'object' &&
            'type' in block &&
            typeof block.type === 'string'
        );
    });
}
