'use client';

import { Panel, Group as PanelGroup } from 'react-resizable-panels';

import { GlobalHeader } from '@/components/_layout/GlobalHeader';
import { DashboardView } from '@/components/_features/dashboard/DashboardView';
import { RightContextPanel } from '@/components/_layout/RightContextPanel';
import { SplitEditorLayout } from '@/components/_features/editor/SplitEditorLayout';
import { ProofView } from '@/components/_features/proof/ProofView';
import { ResizeHandle } from '@/components/_shared/ResizeHandle';
import { LeftSidebar } from '@/components/_layout/LeftSidebar';

import { useAppStore } from '@/stores/appStore';
import { useProjectStore } from '@/stores/projectStore';
import { useEditorStore } from '@/stores/editorStore';
import { useDocumentStore } from '@/stores/documentStore';
import { useLinea } from '@/hooks/useLinea';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { BranchCommentModal } from '@/components/_shared/BranchCommentModal';
import { ConfirmModal } from '@/components/_shared/ConfirmModal';
import { CreateDocumentModal } from '@/components/_features/document/CreateDocumentModal';
import { DocTemplate } from '@/lib/templates';
import { LegalModal } from '@/components/_features/legal/LegalModal';
import { SettingsModal } from '@/components/_features/settings/SettingsModal';
import { useHotkeys } from '@/hooks/useHotkeys';

export default function V2Page() {
    const {
        viewMode,
        workMode,
        rightPanelTab,
        activeModal,
        setActiveModal,
        currentDocumentId,
        currentDocumentTitle,
        setCurrentDocument
    } = useAppStore();

    const { markdown } = useEditorStore();
    const { updateDocument, documents } = useDocumentStore();

    // History Hook
    const linea = useLinea(currentDocumentId);
    const { addEvent, getLatestEvent, getEventById, getPreviousEvent, updateEventSummary } = linea;
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [isBranching, setIsBranching] = useState(false);

    // Comment Modal State
    const [commentModal, setCommentModal] = useState<{
        isOpen: boolean;
        targetEventId: string | null;
        mode: 'branch' | 'edit' | 'save';
        initialValue: string;
    }>({
        isOpen: false,
        targetEventId: null,
        mode: 'edit',
        initialValue: '',
    });

    const [pendingBranchComment, setPendingBranchComment] = useState<string | null>(null);
    const [restoreConfirm, setRestoreConfirm] = useState<{ isOpen: boolean; event: any | null }>({
        isOpen: false,
        event: null,
    });
    const [clearHistoryConfirm, setClearHistoryConfirm] = useState(false);

    const { setMarkdown } = useEditorStore();

    // ホットキーの初期化
    useHotkeys();

    // Reset selection and LOAD latest content when document changes
    useEffect(() => {
        setSelectedEventId(null);
        setIsBranching(false);
        setPendingBranchComment(null);

        // Load latest content from history if available
        // --- NEW: 厳格な読込完了チェック (linea.isLoaded && loadedId 一致) ---
        if (currentDocumentId && linea.isLoaded && linea.loadedId === currentDocumentId) {
            const latest = getLatestEvent();
            if (latest && latest.content) {
                setMarkdown(latest.content);
                console.log('[Page] Initialized editor with latest history version:', latest.version);
            } else {
                // If no history, check if document metadata has content (from template)
                const doc = documents.find(d => d.id === currentDocumentId);
                if (doc && doc.rawContent) {
                    setMarkdown(doc.rawContent);
                    // Initialize history v1 automatically
                    addEvent(doc.rawContent, 'user_edit', null, '新規作成（テンプレート）');
                    console.log('[Page] Initialized v1 history from template content');
                } else {
                    setMarkdown('# 新規ドキュメント\n\nここに文書を入力してください。');
                    console.log('[Page] No content found, set default placeholder');
                }
            }
        }
    }, [currentDocumentId, linea.isLoaded, linea.loadedId]); // deps に loadedId を追加

    const selectedEvent = useMemo(() =>
        selectedEventId ? getEventById(selectedEventId) : null
        , [selectedEventId, getEventById]);

    const parentEvent = useMemo(() =>
        selectedEventId ? getPreviousEvent(selectedEventId) : null
        , [selectedEventId, getPreviousEvent]);

    const handleSave = useCallback((forcedComment?: string) => {
        // --- NEW: 読込完了前や変更中の保存を禁止 ---
        if (!linea.isLoaded || linea.loadedId !== currentDocumentId) {
            console.warn('[Page] Save blocked: document still loading or changing.');
            return;
        }

        if (currentDocumentId && markdown) {
            // 1. Update Document Metadata/Content
            updateDocument(currentDocumentId, markdown);

            // 2. Add History Event (Only if changed)
            const latest = getLatestEvent();
            const hasChanged = !latest || latest.content !== markdown;

            if (hasChanged || isBranching) {
                // ブランチ作成中なら selectedEventId を親にし、そうでなければ最新を親にする
                const parentId = isBranching ? selectedEventId : (latest?.id || null);

                // コメントの優先順位: 1. 引数(即時), 2. ブランチ時の予約, 3. デフォルト
                const summary = forcedComment || pendingBranchComment || (isBranching ? `ブランチ保存 (from v${selectedEvent?.version})` : '手動保存 (Ctrl+S)');

                addEvent(
                    markdown,
                    'user_edit',
                    parentId,
                    summary
                );

                console.log('[Page] Saved and history event added');
            } else {
                console.log('[Page] Saved (No content change, history skipped)');
            }

            // 保存後はブランチモード解除
            if (isBranching) {
                setIsBranching(false);
                setSelectedEventId(null);
                setPendingBranchComment(null);
            }
        }
    }, [currentDocumentId, markdown, updateDocument, addEvent, getLatestEvent, isBranching, selectedEventId, selectedEvent, pendingBranchComment]);

    const handleSaveWithComment = useCallback(() => {
        setCommentModal({
            isOpen: true,
            targetEventId: 'current', // 特殊ID
            mode: 'save',
            initialValue: '',
        });
    }, []);

    const handleStartBranch = useCallback((event: any) => {
        // モーダルを開いて理由を尋ねる
        setCommentModal({
            isOpen: true,
            targetEventId: event.id,
            mode: 'branch',
            initialValue: '',
        });
    }, []);

    const handleEditComment = useCallback((event: any) => {
        setCommentModal({
            isOpen: true,
            targetEventId: event.id,
            mode: 'edit',
            initialValue: event.summary || '',
        });
    }, []);

    const handleCommentConfirm = useCallback((comment: string) => {
        const { targetEventId, mode } = commentModal;

        if (mode === 'save') {
            handleSave(comment);
        } else if (mode === 'branch') {
            if (!targetEventId) return;
            const event = getEventById(targetEventId);
            if (event) {
                setMarkdown(event.content);
                setSelectedEventId(event.id);
                setIsBranching(true);
                setPendingBranchComment(comment);
                console.log('[Page] Started branching from:', event.id, 'with comment:', comment);
            }
        } else {
            // Edit existing comment
            if (!targetEventId) return;
            updateEventSummary(targetEventId, comment);
            console.log('[Page] Updated comment for:', targetEventId);
        }

        setCommentModal(prev => ({ ...prev, isOpen: false }));
    }, [commentModal, getEventById, setMarkdown, updateEventSummary, handleSave]);

    const handleMakeLatest = useCallback((event: any) => {
        setRestoreConfirm({ isOpen: true, event });
    }, []);

    const executeRestore = useCallback(() => {
        const event = restoreConfirm.event;
        if (!event || !currentDocumentId) return;

        setMarkdown(event.content);
        updateDocument(currentDocumentId, event.content);
        addEvent(
            event.content,
            'user_edit',
            getLatestEvent()?.id || null,
            `v${event.version} から復元`
        );
        console.log('[Page] Restored version as latest:', event.version);
        setRestoreConfirm({ isOpen: false, event: null });
    }, [currentDocumentId, updateDocument, addEvent, getLatestEvent, setMarkdown, restoreConfirm]);

    const handleClearHistoryRequest = useCallback(() => {
        setClearHistoryConfirm(true);
    }, []);

    const executeClearHistory = useCallback(() => {
        const { clearEvents } = linea;
        clearEvents();
        setSelectedEventId(null);
        setClearHistoryConfirm(false);
        console.log('[Page] History cleared');
    }, [linea]);

    const handleCancelBranch = useCallback(() => {
        setIsBranching(false);
        setSelectedEventId(null);
        setPendingBranchComment(null);
        console.log('[Page] Cancelled branching');
    }, []);

    // Global Key Listener for Ctrl+S
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSave]);

    // --- Layout Renderers ---

    // 1. Hub (Dashboard)
    if (viewMode === 'hub') {
        return (
            <div className="h-screen flex flex-col bg-slate-50">
                <GlobalHeader onSave={handleSave} />
                <main className="flex-1 overflow-auto">
                    <DashboardView />
                </main>
            </div>
        );
    }

    // 2. Spoke (Editor)
    return (
        <div className="h-screen flex flex-col bg-white overflow-hidden">
            <GlobalHeader onSave={handleSave} />

            <main className="flex-1 flex overflow-hidden relative">
                <PanelGroup orientation="horizontal">
                    {/* Left Sidebar (Project Navigator) */}
                    <Panel
                        defaultSize="20"
                        minSize="15"
                        maxSize="30"
                        collapsible
                        className="bg-slate-50 relative border-r border-slate-200"
                        id="left-sidebar-panel"
                    >
                        <LeftSidebar />
                    </Panel>

                    <ResizeHandle
                        className="w-2 bg-slate-100 hover:bg-cyan-200 transition-colors border-r border-slate-200 z-50"
                        direction="horizontal"
                        id="left-panel-resize-handle"
                    />

                    {/* Main Editor Area */}
                    <Panel className="flex flex-col relative" id="main-editor-panel">
                        {workMode === 'write' ? (
                            <SplitEditorLayout
                                onAiMention={() => setActiveModal('ai-instruction')}
                                onSave={handleSave}
                                overrideContent={selectedEvent?.content}
                                compareWith={parentEvent?.content}
                                compareLabel={selectedEvent ? `比較対象: v${parentEvent?.version || '0'}` : undefined}
                                isBranching={isBranching}
                                isLatestHistory={!selectedEventId || (getLatestEvent()?.id === selectedEventId)}
                            />
                        ) : (
                            <ProofView />
                        )}
                    </Panel>

                    {/* Right Context Panel (Conditional) */}
                    {rightPanelTab && (
                        <>
                            <ResizeHandle
                                className="w-2 bg-slate-100 hover:bg-cyan-200 transition-colors border-l border-r border-slate-200 z-50"
                                direction="horizontal"
                                id="right-panel-resize-handle"
                            />
                            <Panel
                                defaultSize="25"
                                minSize="10"
                                maxSize="90"
                                collapsible
                                className="bg-slate-50 relative"
                                id="right-context-panel"
                            >
                                <RightContextPanel
                                    linea={linea}
                                    selectedEventId={selectedEventId || undefined}
                                    onSelectEvent={(id) => setSelectedEventId(id)}
                                    isBranching={isBranching}
                                    onStartBranch={handleStartBranch}
                                    onCancelBranch={handleCancelBranch}
                                    onEditComment={handleEditComment}
                                    onMakeLatest={handleMakeLatest}
                                    onClearHistory={handleClearHistoryRequest}
                                />
                            </Panel>
                        </>
                    )}
                </PanelGroup>
            </main>

            {/* Global Modals place here if needed */}
            <ExportModal />
            <CreateDocumentModal
                isOpen={activeModal === 'create-document'}
                onClose={() => setActiveModal(null)}
                onConfirm={(title, template) => {
                    const { activeProjectId } = useProjectStore.getState();
                    const { addDocument } = useDocumentStore.getState();

                    if (!activeProjectId) {
                        alert('プロジェクトを選択してください');
                        return;
                    }

                    // 1. Create Document Meta
                    const doc = addDocument(activeProjectId, title, template.initialContent, template.initialSchema);

                    // 2. Set Active Doc
                    setCurrentDocument(doc.id, doc.title);

                    // 3. The useLinea hook will handle the initial load and setMarkdown
                    console.log('[Page] Created new document from template:', template.id);
                    setActiveModal(null);
                }}
            />
            <AiInstructionModal
                isOpen={activeModal === 'ai-instruction'}
                onClose={() => setActiveModal(null)}
                onConfirm={async (instruction, strategy) => {
                    console.log('AI Instruction:', instruction, strategy);
                    setActiveModal(null);

                    // --- Sibling Branching Logic (Automatic for Latest) ---
                    const latest = getLatestEvent();
                    const isAtLatest = !selectedEventId || (latest?.id === selectedEventId);

                    let parentId: string | null = null;

                    if (isAtLatest && latest) {
                        // 【User Requirement】最新履歴状態でAI指示を出した場合、一つ前の履歴からブランチとして生やす（兄弟）
                        parentId = latest.parentId;
                        console.log('[AI] Automated Sibling Branching from parent:', parentId);
                    } else if (strategy === 'fork') {
                        // 過去ノード選択中に「別案」を選んだ場合: そのノードの親から
                        const current = getEventById(selectedEventId!);
                        parentId = current?.parentId || null;
                    } else {
                        // それ以外（過去ノードの延長など）
                        parentId = selectedEventId || (latest?.id || null);
                    }

                    // --- Mock AI Execution ---
                    // TODO: Connect to actual AI API (Vertex AI / Gemini)
                    console.log(`[AI] Generating content from parent: ${parentId}`);

                    // 擬似的な遅延
                    setTimeout(() => {
                        const currentContent = selectedEvent?.content || markdown;
                        const aiContent = `${currentContent}\n\n---\n**AIによる提案 (${instruction})**\n\nここにAIが生成したテキストが入ります。既存の内容を ${instruction} という指示に基づいて最適化しました。`;

                        const newEvent = addEvent(
                            aiContent,
                            'ai_branch',
                            parentId,
                            `AI提案: ${instruction.slice(0, 20)}${instruction.length > 20 ? '...' : ''}`
                        );

                        // 作成したAIブランチを選択状態にする
                        setSelectedEventId(newEvent.id);
                        setMarkdown(newEvent.content);

                        console.log('[AI] Sibling branch created:', newEvent.id);
                    }, 1000);
                }}
            />
            {/* Branch / Comment Edit Modal */}
            <BranchCommentModal
                isOpen={commentModal.isOpen}
                onClose={() => setCommentModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={handleCommentConfirm}
                title={commentModal.mode === 'branch' ? 'ブランチ作成の理由' : '履歴コメントの編集'}
                defaultComment={commentModal.initialValue}
            />

            {/* Restore Confirmation Modal */}
            <ConfirmModal
                isOpen={restoreConfirm.isOpen}
                onClose={() => setRestoreConfirm({ isOpen: false, event: null })}
                onConfirm={executeRestore}
                title="バージョンの復元"
                message={`選択したバージョン (v${restoreConfirm.event?.version}) を最新として復元しますか？\n現在の最新状態の上に、このバージョンの内容で新しい履歴が追加されます。`}
                confirmText="復元する"
                variant="warning"
            />

            {/* Clear History Confirmation Modal */}
            <ConfirmModal
                isOpen={clearHistoryConfirm}
                onClose={() => setClearHistoryConfirm(false)}
                onConfirm={executeClearHistory}
                title="履歴の消去"
                message="このドキュメントのすべての履歴を消去しますか？\n消去後は現在の内容が「v1」として新しく保存されます。この操作は取り消せません。"
                confirmText="消去する"
                variant="danger"
            />
            <LegalModal
                isOpen={activeModal === 'legal'}
                onClose={() => setActiveModal(null)}
            />
            <SettingsModal
                isOpen={activeModal === 'settings'}
                onClose={() => setActiveModal(null)}
            />
        </div>
    );
}

import { ExportModal } from '@/components/_features/export/ExportModal';
import { AiInstructionModal } from '@/components/_features/ai/AiInstructionModal';
