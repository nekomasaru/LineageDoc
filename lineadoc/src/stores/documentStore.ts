/**
 * documentStore.ts
 * 
 * メタデータ駆動型のドキュメント管理ストア
 * フラットなドキュメントリストを持ち、タグやプロジェクトIDでフィルタリングを行う
 */

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { persist, createJSONStorage } from 'zustand/middleware';
import matter from 'gray-matter';

export interface Document {
    id: string;
    title: string;
    content: string; // メタデータ抽出用（実際は重いので要注意だが、今回はローカルなので許容）
    updatedAt: string;
    // キャッシュされたメタデータ
    frontmatter: {
        project?: string;
        tags?: string[];
        [key: string]: any;
    };
}

interface DocumentState {
    documents: Document[];

    // フィルタ状態
    filterProject: string | null;
    filterTag: string | null;
    searchQuery: string;

    // Computed (Stateとして保持せず、getterで計算するか、専用のselectorを用意する)

    // アクション
    addDocument: (title: string, initialContent?: string) => Document;
    updateDocument: (id: string, content: string) => void;
    deleteDocument: (id: string) => void;

    setFilterProject: (project: string | null) => void;
    setFilterTag: (tag: string | null) => void;
    setSearchQuery: (query: string) => void;
}

export const useDocumentStore = create<DocumentState>()(
    persist(
        (set, get) => ({
            documents: [],
            filterProject: null,
            filterTag: null,
            searchQuery: '',

            addDocument: (title, initialContent = '') => {
                const id = uuidv4();
                const now = new Date().toISOString();
                // 初期コンテンツにフロントマターを含める
                // デフォルトでは「無題のドキュメント」プロジェクトなし
                const content = initialContent || `---
title: ${title}
project: 
tags: []
status: draft
---
# ${title}

ここに文書を入力してください。`;

                const { data } = matter(content);

                const newDoc: Document = {
                    id,
                    title,
                    content,
                    updatedAt: now,
                    frontmatter: data,
                };

                set((state) => ({
                    documents: [newDoc, ...state.documents],
                }));

                return newDoc;
            },

            updateDocument: (id, content) => {
                const now = new Date().toISOString();
                try {
                    const { data } = matter(content);

                    set((state) => ({
                        documents: state.documents.map((doc) =>
                            doc.id === id
                                ? {
                                    ...doc,
                                    content,
                                    updatedAt: now,
                                    title: data.title || doc.title, // FMのタイトルを優先反映
                                    frontmatter: data
                                }
                                : doc
                        ),
                    }));
                } catch (e) {
                    console.error('[DocumentStore] Parse error during update:', e);
                    // エラー時はcontentとtimeだけ更新
                    set((state) => ({
                        documents: state.documents.map((doc) =>
                            doc.id === id ? { ...doc, content, updatedAt: now } : doc
                        ),
                    }));
                }
            },

            deleteDocument: (id) => {
                set((state) => ({
                    documents: state.documents.filter((doc) => doc.id !== id),
                }));
            },

            setFilterProject: (project) => set({ filterProject: project }),
            setFilterTag: (tag) => set({ filterTag: tag }),
            setSearchQuery: (query) => set({ searchQuery: query }),
        }),
        {
            name: 'lineadoc-documents-v2', // v1 (projectStore) と区別
            storage: createJSONStorage(() => localStorage),
        }
    )
);

// セレクタ（フィルタリングロジック）
export const selectFilteredDocuments = (state: DocumentState) => {
    const { documents, filterProject, filterTag, searchQuery } = state;

    return documents.filter(doc => {
        // プロジェクトフィルタ
        if (filterProject && doc.frontmatter.project !== filterProject) {
            return false;
        }

        // タグフィルタ
        if (filterTag && !doc.frontmatter.tags?.includes(filterTag)) {
            return false;
        }

        // 検索クエリ (タイトル or 本文)
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            return (
                doc.title.toLowerCase().includes(lowerQuery) ||
                doc.content.toLowerCase().includes(lowerQuery)
            );
        }

        return true;
    });
};

// ユニークなプロジェクト一覧を取得
export const selectUniqueProjects = (state: DocumentState) => {
    const projects = new Set<string>();
    state.documents.forEach(doc => {
        if (doc.frontmatter.project) {
            projects.add(doc.frontmatter.project);
        }
    });
    return Array.from(projects).sort();
};

// ユニークなタグ一覧を取得 (出現数順など高度なことは一旦なし)
export const selectUniqueTags = (state: DocumentState) => {
    const tags = new Set<string>();
    state.documents.forEach(doc => {
        if (Array.isArray(doc.frontmatter.tags)) {
            doc.frontmatter.tags.forEach(tag => tags.add(tag));
        }
    });
    return Array.from(tags).sort();
};
