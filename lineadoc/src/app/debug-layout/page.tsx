'use client';

import { Panel, Group as PanelGroup, Separator } from 'react-resizable-panels';
import { ResizeHandle } from '@/components/_shared/ResizeHandle';

export default function DebugLayoutPage() {
    return (
        <div className="h-screen w-screen bg-white p-10 flex flex-col gap-10">
            <h1 className="text-2xl font-bold">Resize Handle Debug</h1>

            <div className="h-[400px] w-full border border-black relative">
                <PanelGroup orientation="horizontal" className="h-full w-full">
                    <Panel defaultSize={20} className="bg-blue-100 flex items-center justify-center">
                        Left Panel (20%)
                    </Panel>

                    <ResizeHandle />

                    <Panel className="bg-green-100 flex items-center justify-center">
                        Right Panel (Auto)
                    </Panel>
                </PanelGroup>
            </div>

            <div className="h-[400px] w-full border border-black relative">
                <h2 className="mb-2">Direct Separator Test</h2>
                <PanelGroup orientation="horizontal" className="h-full w-full">
                    <Panel defaultSize={20} className="bg-blue-100 flex items-center justify-center">
                        Left Panel (20%)
                    </Panel>

                    <Separator className="w-4 bg-red-500 hover:bg-red-700 cursor-col-resize z-50 transition-colors" />

                    <Panel className="bg-green-100 flex items-center justify-center">
                        Right Panel (Auto)
                    </Panel>
                </PanelGroup>
            </div>
        </div>
    );
}
