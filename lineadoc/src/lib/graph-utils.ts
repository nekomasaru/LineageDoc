/**
 * graph-utils.ts
 * 
 * DocumentStore のデータからグラフ用のノード・リンクを生成するユーティリティ
 */

import { Document } from '@/lib/types';

export interface GraphNode {
    id: string;
    label: string;
    type: 'document' | 'project' | 'tag';
    color?: string;
    size?: number;
}

export interface GraphLink {
    source: string;
    target: string;
    type: 'belongs_to_project' | 'has_tag' | 'references';
}

export interface GraphData {
    nodes: GraphNode[];
    links: GraphLink[];
}

/**
 * ドキュメントリストからグラフデータを生成する
 */
export function buildGraphData(documents: Document[]): GraphData {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const projectSet = new Set<string>();
    const tagSet = new Set<string>();

    // 1. ドキュメントノードを追加
    documents.forEach(doc => {
        nodes.push({
            id: `doc-${doc.id}`,
            label: doc.title,
            type: 'document',
            color: '#0d9488', // Teal
            size: 8,
        });

        // プロジェクトを収集
        // DocumentStore migration ensures attributes exists, but we check for safety
        if (doc.attributes?.project) {
            projectSet.add(doc.attributes.project);
        }

        // タグを収集
        if (Array.isArray(doc.attributes?.tags)) {
            doc.attributes.tags.forEach((tag: string) => tagSet.add(tag));
        }
    });

    // 2. プロジェクトノードを追加
    projectSet.forEach(project => {
        nodes.push({
            id: `prj-${project}`,
            label: project,
            type: 'project',
            color: '#6366f1', // Indigo
            size: 12,
        });
    });

    // 3. タグノードを追加
    tagSet.forEach(tag => {
        nodes.push({
            id: `tag-${tag}`,
            label: `#${tag}`,
            type: 'tag',
            color: '#f59e0b', // Amber
            size: 6,
        });
    });

    // 4. リンクを追加
    documents.forEach(doc => {
        const docNodeId = `doc-${doc.id}`;

        // ドキュメント → プロジェクト
        if (doc.attributes?.project) {
            links.push({
                source: docNodeId,
                target: `prj-${doc.attributes.project}`,
                type: 'belongs_to_project',
            });
        }

        // ドキュメント → タグ
        if (Array.isArray(doc.attributes?.tags)) {
            doc.attributes.tags.forEach((tag: string) => {
                links.push({
                    source: docNodeId,
                    target: `tag-${tag}`,
                    type: 'has_tag',
                });
            });
        }

        // ドキュメント → 参照先ドキュメント (references フィールドがあれば)
        if (Array.isArray(doc.attributes?.references)) {
            doc.attributes.references.forEach((refId: string) => {
                // 参照先が存在するかチェック
                const targetDoc = documents.find(d => d.id === refId);
                if (targetDoc) {
                    links.push({
                        source: docNodeId,
                        target: `doc-${refId}`,
                        type: 'references',
                    });
                }
            });
        }
    });

    return { nodes, links };
}
