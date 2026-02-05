// LineaDoc 共通型定義

export interface LineaEvent {
    id: string;
    parentId: string | null; // 親ノードID（DAG構造）
    timestamp: string;  // ISO8601
    type: 'user_edit' | 'ai_suggestion' | 'ai_branch' | 'save';
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

export interface GovernanceSettings {
    mdSchema?: string;
    textlintConfig?: Record<string, boolean>;
    customDictionary?: { pattern: string; expected: string; enabled: boolean; type?: 'correction' | 'exclusion' | any }[];
}

export interface Team {
    id: string;
    name: string;
    members: string[]; // User IDs or names for now
    governance?: GovernanceSettings;
    templateGovernance?: Record<string, GovernanceSettings>; // Template ID -> Settings
}

export interface Project {
    id: string;
    name: string;
    description?: string;
    teamId: string;
    tags: string[];
    governance?: GovernanceSettings;
    createdAt: string;
    updatedAt: string;
}

export interface Document {
    id: string;
    projectId: string; // Required link to Project
    title: string;
    rawContent: string;
    mdSchema?: string; // MDSchema definition (YAML/DSL)
    textlintConfig?: Record<string, boolean>; // Textlint rule enable/disable state
    customDictionary?: { pattern: string; expected: string; enabled: boolean; type?: 'correction' | 'exclusion' | any }[];
    attributes?: Record<string, any>; // Flexible metadata
    createdAt: string;
    updatedAt: string;
}
