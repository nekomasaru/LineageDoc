// LineaDoc 共通型定義

export interface LineaEvent {
    id: string;
    parentId: string | null; // 親ノードID（DAG構造）
    timestamp: string;  // ISO8601
    type: 'user_edit' | 'ai_suggestion' | 'save';
    content: string;    // その時点のドキュメント全文
    summary?: string;   // 変更の概要（オプション）
    version?: number;   // バージョン番号 (v1, v2, ...)
}

// グラフレイアウト用のノード型
export interface LayoutNode {
    event: LineaEvent;
    column: number;
    yIndex: number;
}

// グラフレイアウト用のリンク型
export interface LayoutLink {
    sourceId: string;
    targetId: string;
    sourceColumn: number;
    targetColumn: number;
    sourceY: number;
    targetY: number;
}

export interface Document {
    id: string;
    title: string;
    rawContent: string;
    createdAt: string;
    updatedAt: string;
}
