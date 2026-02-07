'use client';

import { Panel, Group as PanelGroup } from 'react-resizable-panels';

import { GlobalHeader } from '@/components/_layout/GlobalHeader';
import { DashboardView } from '@/components/_features/dashboard/DashboardView';
import { RightContextPanel } from '@/components/_layout/RightContextPanel';
import { AIChatPane } from '@/components/_features/ai/AIChatPane';
import { SplitEditorLayout, SplitEditorLayoutHandle } from '@/components/_features/editor/SplitEditorLayout';
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
import { GovernanceView } from '@/components/_features/governance/GovernanceView';
import { AISelectionTooltip } from '@/components/_features/ai/AISelectionTooltip';
import { Maximize2 } from 'lucide-react';

export default function V2Page() {
    const {
        viewMode,
        workMode,
        rightPanelTab,
        activeModal,
        setActiveModal,
        currentDocumentId,
        currentDocumentTitle,
        setCurrentDocument,
        isRightPanelPinned,
        isAiChatFullPage,
        setIsAiChatFullPage
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

    const splitEditorRef = useRef<SplitEditorLayoutHandle>(null);

    const handleApplyAiSuggestion = useCallback((content: string) => {
        splitEditorRef.current?.applyAiContent(content);
    }, []);

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
                    console.log('[Page] Initialized editor from document rawContent (No history yet)');
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
                    summary,
                    false, // isMilestone
                    1      // importance
                );

                console.log('[Page] Saved and history event added');
                useAppStore.getState().showToast('履歴を保存しました', 'success');
            } else {
                console.log('[Page] Saved (No content change, history skipped)');
                useAppStore.getState().showToast('保存しました', 'info');
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

    const handleSaveMilestone = useCallback((summary: string, importance: number = 3) => {
        if (currentDocumentId && markdown) {
            updateDocument(currentDocumentId, markdown);
            const latest = getLatestEvent();
            const parentId = latest?.id || null;

            addEvent(
                markdown,
                'save',
                parentId,
                summary,
                true, // isMilestone
                importance,
                `AIによって構造化された重要変更: ${summary}` // aiSummary dummy
            );
            console.log('[Page] Saved as Milestone');
        }
    }, [currentDocumentId, markdown, updateDocument, addEvent, getLatestEvent]);

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
            `v${event.version} から復元`,
            false, // isMilestone
            2      // importance (restoration is somewhat important)
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

    // 3. Governance Mode
    if (viewMode === 'governance') {
        return (
            <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
                <GlobalHeader onSave={handleSave} />
                <main className="flex-1 flex overflow-hidden">
                    <LeftSidebar className="shrink-0" />
                    <div className="flex-1 overflow-auto bg-white">
                        <GovernanceView />
                    </div>
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
                                ref={splitEditorRef}
                                onAiMention={(action) => {
                                    if (action) {
                                        useAppStore.getState().setRightPanelTab('assistant');
                                        useAppStore.getState().setAiContext({ pendingAction: action as any });
                                    } else {
                                        setActiveModal('ai-instruction');
                                    }
                                }}
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

                    {/* Right Context Panel (Conditional - Pinned Mode) */}
                    {rightPanelTab && isRightPanelPinned && (
                        <>
                            <ResizeHandle
                                className="w-2 bg-slate-100 hover:bg-cyan-200 transition-colors border-l border-r border-slate-200 z-50"
                                direction="horizontal"
                                id="right-panel-resize-handle"
                            />
                            <Panel
                                defaultSize="30"
                                minSize="20"
                                maxSize="90"
                                collapsible
                                className="bg-slate-50 relative"
                                id="right-context-panel-pinned"
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
                                    onApplyContent={handleApplyAiSuggestion}
                                    onSaveMilestone={handleSaveMilestone}
                                />
                            </Panel>
                        </>
                    )}
                </PanelGroup>

                {/* Right Context Panel (Floating Mode) */}
                {rightPanelTab && !isRightPanelPinned && (
                    <div
                        className="absolute inset-y-0 right-0 z-[60] w-[400px] shadow-2xl animate-in slide-in-from-right duration-300"
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
                            onApplyContent={handleApplyAiSuggestion}
                            onSaveMilestone={handleSaveMilestone}
                        />
                    </div>
                )}

                {/* AI Chat Full Page Mode Overlay */}
                {isAiChatFullPage && (
                    <div className="absolute inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-300">
                        <div className="bg-white w-full max-w-5xl h-full rounded-2xl shadow-2xl overflow-hidden relative border border-slate-200">
                            <AIChatPane
                                currentContent={linea?.events?.find((e: any) => e.isLatest)?.content || ''}
                                onApplyContent={handleApplyAiSuggestion}
                                onSaveMilestone={handleSaveMilestone}
                            />
                        </div>
                    </div>
                )}
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

                    // 3. Immediately initialize history v1 to prevent duplicate creation cycles
                    // Note: We need a small delay or ensure store is synced if using hooks, 
                    // but here we can rely on the fact that useLinea will pick up the new ID soon.
                    // However, it's safer to let the editor load it first, OR create it here if we have access to addEvent.
                    // Since we are in the callback, we'll let handleSave or the next manual save handle it, or better,
                    // we can use a dedicated initialization.
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
                    const targetNode = selectedEventId ? getEventById(selectedEventId) : latest;

                    if (strategy === 'fork') {
                        // 【別案を作成】選択ノードの親からブランチを生やす（兄弟を作る）
                        parentId = targetNode?.parentId || null;
                        console.log('[AI] Forking (sibling) from parent:', parentId);
                    } else {
                        // 【続きを作成】選択ノード（または最新）を直接の親にする
                        parentId = targetNode?.id || null;
                        console.log('[AI] Extending from node:', parentId);
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
                        useAppStore.getState().showToast('AI提案を履歴に追加しました', 'success');
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

            {/* Floating UI Elements */}
            {useAppStore.getState().aiSelectionTooltip.isVisible && (
                <AISelectionTooltip
                    x={useAppStore.getState().aiSelectionTooltip.x}
                    y={useAppStore.getState().aiSelectionTooltip.y}
                    onAction={(action, options) => {
                        // Switch to assistant tab
                        useAppStore.getState().setRightPanelTab('assistant');
                        // Set pending action to trigger AIChatPane logic
                        useAppStore.getState().setAiContext({
                            pendingAction: action as any,
                            pendingOptions: options
                        });
                        // Hide tooltip
                        useAppStore.getState().setAiSelectionTooltip({ isVisible: false });
                    }}
                    onClose={() => useAppStore.getState().setAiSelectionTooltip({ isVisible: false })}
                />
            )}
        </div>
    );
}

import { ExportModal } from '@/components/_features/export/ExportModal';
import { AiInstructionModal } from '@/components/_features/ai/AiInstructionModal';
