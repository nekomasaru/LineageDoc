declare module 'html-to-docx' {
    export default function HTMLToDOCX(
        html: string,
        headerHTMLString?: string | null,
        options?: any,
        footerHTMLString?: string | null
    ): Promise<Buffer | Blob>;
}
