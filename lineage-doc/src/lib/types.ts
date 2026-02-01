// LineageDoc 共通型定義

export interface LineageEvent {
    id: string;
    timestamp: string;  // ISO8601
    type: 'user_edit' | 'ai_suggestion' | 'save';
    content: string;    // その時点のドキュメント全文
    summary?: string;   // 変更の概要（オプション）
    version?: number;   // バージョン番号 (v1, v2, ...)
}

export interface Document {
    id: string;
    title: string;
    rawContent: string;
    createdAt: string;
    updatedAt: string;
}
