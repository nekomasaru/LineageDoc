import { useAppStore } from '@/stores/appStore';
import { LineaPanel } from '@/components/_features/lineage/LineaPanel';
import { FrontmatterForm } from '@/components/_features/editor/FrontmatterForm';
import { QualityPanel } from '@/components/_layout/panels/QualityPanel';
import { useLinea } from '@/hooks/useLinea';
import { Loader2 } from 'lucide-react';
import { useQualityStore } from '@/stores/qualityStore';

interface RightContextPanelProps {
    linea?: ReturnType<typeof useLinea>;
    selectedEventId?: string;
    onSelectEvent?: (id: string | null) => void;
    isBranching?: boolean;
    onStartBranch?: (event: any) => void;
    onCancelBranch?: () => void;
    onEditComment?: (event: any) => void;
    onMakeLatest?: (event: any) => void;
    onClearHistory?: () => void;
}

export function RightContextPanel({
    linea,
    selectedEventId,
    onSelectEvent,
    isBranching = false,
    onStartBranch,
    onCancelBranch,
    onEditComment,
    onMakeLatest,
    onClearHistory
}: RightContextPanelProps) {
    const { rightPanelTab, currentDocumentId } = useAppStore();

    // Linea Data from props or fallback
    const {
        events,
        isLoaded: isLineaLoaded,
        addEvent,
        clearEvents,
        resetWithContent,
        updateEventSummary
    } = linea || {
        events: [],
        isLoaded: true,
        addEvent: () => ({}),
        clearEvents: () => { },
        resetWithContent: () => ({}),
        updateEventSummary: () => { }
    } as any;

    // If panel is closed or no tab selected, return null
    if (!currentDocumentId) {
        return (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                ドキュメントが選択されていません
            </div>
        );
    }

    return (
        <div className="h-full bg-slate-50 flex flex-col border-l border-slate-200">
            {rightPanelTab === 'history' && (
                isLineaLoaded ? (
                    <LineaPanel
                        events={events}
                        selectedEventId={selectedEventId}
                        isBranching={isBranching}
                        onSelectEvent={(e) => {
                            if (e.id === selectedEventId) {
                                onSelectEvent?.(null); // Deselect toggle
                            } else {
                                onSelectEvent?.(e.id);
                            }
                        }}
                        onClearHistory={() => onClearHistory ? onClearHistory() : clearEvents()}
                        onMakeLatest={(e) => onMakeLatest?.(e)}
                        onStartBranch={(e) => onStartBranch?.(e)}
                        onCancelBranch={() => onCancelBranch?.()}
                        onEditComment={(e) => onEditComment?.(e)}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                )
            )}

            {rightPanelTab === 'attributes' && (
                <FrontmatterForm />
            )}

            {rightPanelTab === 'quality' && (
                <QualityPanel />
            )}

            {rightPanelTab === 'graph' && (
                <div className="p-4 text-slate-500 text-sm">
                    Graph View Coming Soon
                </div>
            )}
        </div>
    );
}
