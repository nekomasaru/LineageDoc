/**
 * documentStore.ts
 * 
 * メタデータ駆動型のドキュメント管理ストア
 * Phase 4: プロジェクトIDによる厳格なフィルタリングへ移行
 */

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { persist, createJSONStorage } from 'zustand/middleware';
import matter from 'gray-matter';
import { Document } from '@/lib/types';

interface DocumentState {
    documents: Document[];

    // フィルタ状態
    filterProjectId: string | null;
    filterTag: string | null;
    searchQuery: string;

    // アクション
    addDocument: (projectId: string, title: string, initialContent?: string, mdSchema?: string) => Document;
    updateDocument: (id: string, content: string) => void;
    updateMdSchema: (id: string, mdSchema: string) => void;
    updateTextlintConfig: (id: string, config: Record<string, boolean>) => void;
    deleteDocument: (id: string) => void;

    setFilterProjectId: (projectId: string | null) => void;
    setFilterTag: (tag: string | null) => void;
    setSearchQuery: (query: string) => void;
}

export const useDocumentStore = create<DocumentState>()(
    persist(
        (set, get) => ({
            documents: [],
            filterProjectId: null,
            filterTag: null,
            searchQuery: '',

            addDocument: (projectId, title, initialContent = '', mdSchema = '') => {
                const id = uuidv4();
                const now = new Date().toISOString();

                // Markdownパース (将来的な属性抽出のため)
                const content = initialContent || `# ${title}\n\nここに文書を入力してください。`;
                const { data } = matter(content);

                const newDoc: Document = {
                    id,
                    projectId,
                    title,
                    rawContent: content,
                    mdSchema,
                    attributes: data, // maintain compatibility with frontmatter usage if needed
                    createdAt: now,
                    updatedAt: now,
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
                                    rawContent: content,
                                    updatedAt: now,
                                    title: data.title || doc.title, // FMのタイトルを優先反映
                                    attributes: { ...doc.attributes, ...data }
                                }
                                : doc
                        ),
                    }));
                } catch (e) {
                    console.error('[DocumentStore] Parse error during update:', e);
                    set((state) => ({
                        documents: state.documents.map((doc) =>
                            doc.id === id ? { ...doc, rawContent: content, updatedAt: now } : doc
                        ),
                    }));
                }
            },

            updateMdSchema: (id, mdSchema) => {
                const now = new Date().toISOString();
                set((state) => ({
                    documents: state.documents.map((doc) =>
                        doc.id === id ? { ...doc, mdSchema, updatedAt: now } : doc
                    ),
                }));
            },

            updateTextlintConfig: (id, textlintConfig) => {
                const now = new Date().toISOString();
                set((state) => ({
                    documents: state.documents.map((doc) =>
                        doc.id === id ? { ...doc, textlintConfig, updatedAt: now } : doc
                    ),
                }));
            },

            deleteDocument: (id) => {
                set((state) => ({
                    documents: state.documents.filter((doc) => doc.id !== id),
                }));
            },

            setFilterProjectId: (projectId) => set({ filterProjectId: projectId }),
            setFilterTag: (tag) => set({ filterTag: tag }),
            setSearchQuery: (query) => set({ searchQuery: query }),
        }),
        {
            name: 'lineadoc-documents-v2',
            storage: createJSONStorage(() => localStorage),
            onRehydrateStorage: () => (state) => {
                if (!state) return;

                // Migration: Ensure all documents have a projectId
                // 以前のデータ形式からの移行
                let hasChanges = false;
                const migratedDocs = state.documents.map((doc: any) => {
                    if (!doc.projectId) {
                        hasChanges = true;
                        return {
                            ...doc,
                            projectId: 'default-project', // Default project ID defined in projectStore
                            rawContent: doc.content || doc.rawContent, // Rename content to rawContent if needed
                            attributes: doc.frontmatter || doc.attributes // Rename frontmatter to attributes
                        };
                    }
                    return doc;
                });

                if (hasChanges) {
                    console.log('[DocumentStore] Migrated legacy documents to default-project');
                    state.documents = migratedDocs;
                }
            }
        }
    )
);

// セレクタ（フィルタリングロジック）
export const selectFilteredDocuments = (state: DocumentState) => {
    const { documents, filterProjectId, filterTag, searchQuery } = state;

    return documents.filter(doc => {
        // プロジェクトフィルタ (必須)
        // Project navigator select -> setFilterProjectId
        if (filterProjectId && doc.projectId !== filterProjectId) {
            return false;
        }

        // Tag Filter
        if (filterTag && !doc.attributes?.tags?.includes(filterTag)) {
            return false;
        }

        // Search Query
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            return (
                doc.title.toLowerCase().includes(lowerQuery) ||
                (doc.rawContent && doc.rawContent.toLowerCase().includes(lowerQuery))
            );
        }

        return true;
    });
};

// ユニークなタグ一覧を取得
export const selectUniqueTags = (state: DocumentState) => {
    const tags = new Set<string>();
    state.documents.forEach(doc => {
        const docTags = doc.attributes?.tags;
        if (Array.isArray(docTags)) {
            docTags.forEach(tag => tags.add(tag));
        }
    });
    return Array.from(tags).sort();
};
