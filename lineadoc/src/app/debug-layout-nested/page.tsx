'use client';

import { Panel, Group as PanelGroup, Separator } from 'react-resizable-panels';
import { ResizeHandle } from '@/components/_shared/ResizeHandle';

// Mock Mock components to simulate the structure
const RailNavMock = () => <div className="w-16 h-full bg-slate-800 text-white p-2">Nav</div>;
const HeaderMock = () => <div className="h-12 bg-slate-100 border-b p-2">Header</div>;
const FooterMock = () => <div className="h-6 bg-slate-800 text-white p-1 text-xs">Footer</div>;

export default function DebugLayoutNestedPage() {
    return (
        // 1. Root container (h-screen flex)
        <div className="h-screen flex bg-slate-50">
            <RailNavMock />

            {/* 2. Middle wrapper (flex-1 flex flex-col overflow-hidden) */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <HeaderMock />

                {/* 3. Main container (flex-1 overflow-hidden relative) */}
                <main className="flex-1 overflow-hidden relative">
                    <PanelGroup orientation="horizontal" className="h-full w-full overflow-visible">
                        {/* Panel 1 (Sidebar) */}
                        <Panel
                            id="sidebar-panel"
                            defaultSize={20}
                            minSize={10}
                            collapsible
                            className="bg-white flex flex-col border-r border-slate-200"
                        >
                            <div className="flex-1 overflow-auto bg-yellow-100 p-4">
                                <p>Sidebar Content</p>
                            </div>
                        </Panel>

                        {/* Resize Handle (Target of investigation) */}
                        <ResizeHandle id="nested-resize-handle" style={{ flex: '0 0 auto', width: '8px', position: 'relative', zIndex: 50 }} />

                        {/* Panel 2 (Editor) */}
                        <Panel id="editor-panel" className="overflow-hidden bg-green-100">
                            <div className="h-full w-full p-4">
                                <p>Editor Content</p>
                            </div>
                        </Panel>
                    </PanelGroup>
                </main>

                <FooterMock />
            </div>
        </div>
    );
}
