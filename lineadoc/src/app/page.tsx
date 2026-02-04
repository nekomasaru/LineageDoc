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

export default function V2Page() {
    const {
        viewMode,
        workMode,
        rightPanelTab,
        activeModal,
        setActiveModal
    } = useAppStore();

    // --- Layout Renderers ---

    // 1. Hub (Dashboard)
    if (viewMode === 'hub') {
        return (
            <div className="h-screen flex flex-col bg-slate-50">
                <GlobalHeader />
                <main className="flex-1 overflow-auto">
                    <DashboardView />
                </main>
            </div>
        );
    }

    // 2. Spoke (Editor)
    return (
        <div className="h-screen flex flex-col bg-white overflow-hidden">
            <GlobalHeader />

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
                                <RightContextPanel />
                            </Panel>
                        </>
                    )}
                </PanelGroup>
            </main>

            {/* Global Modals place here if needed */}
            <ExportModal />
            <AiInstructionModal
                isOpen={activeModal === 'ai-instruction'}
                onClose={() => setActiveModal(null)}
                onConfirm={(instruction, strategy) => {
                    console.log('AI Instruction:', instruction, strategy);
                    setActiveModal(null);
                    // TODO: Implement actual AI instruction handling
                }}
            />
        </div>
    );
}

import { ExportModal } from '@/components/_features/export/ExportModal';
import { AiInstructionModal } from '@/components/_features/ai/AiInstructionModal';
