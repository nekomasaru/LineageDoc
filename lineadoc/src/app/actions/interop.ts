'use server';

/**
 * MarkdownをサーバーサイドでDocxに変換する
 */
export async function convertMarkdownToDocx(markdown: string, title: string) {
    try {
        // 動的インポートを使用してクライアント側へのビルド漏れを抑制
        const { marked } = await import('marked');
        const HTMLToDOCX = (await import('html-to-docx')).default;

        // Markdown -> HTML
        const html = await marked.parse(markdown);

        // 適切な meta タグを含む構成。
        // html-to-docx は HTML 全体を受け取ると内部でパースするが、
        // 文字コード指定を確実にする。
        const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>${html}</body></html>`;

        const result = await HTMLToDOCX(fullHtml, null, {
            title: 'LineaDoc Export',
        });

        // result は Buffer | Blob | ArrayBuffer の可能性がある
        let buffer: Buffer;
        if (Buffer.isBuffer(result)) {
            buffer = result;
        } else if ((result as any).arrayBuffer) {
            const arrayBuffer = await (result as any).arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
        } else {
            buffer = Buffer.from(result as any);
        }

        return {
            success: true,
            data: buffer.toString('base64'),
        };
    } catch (error) {
        console.error('Server side docx conversion failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
