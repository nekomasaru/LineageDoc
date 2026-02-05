import * as mammoth from 'mammoth';

export async function importDocx(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const result = await (mammoth as any).convertToMarkdown({ arrayBuffer });

    if (result.messages.length > 0) {
        console.warn('Mammoth import messages:', result.messages);
    }

    return result.value;
}
