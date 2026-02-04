import { useAppStore } from '@/stores/appStore';
import { LineaPanel } from '@/components/_features/lineage/LineaPanel';
import { FrontmatterForm } from '@/components/_features/editor/FrontmatterForm';
import { QualityPanel } from '@/components/_features/quality/QualityPanel';
import { useLinea } from '@/hooks/useLinea';
import { Loader2 } from 'lucide-react';
import { useQualityStore } from '@/stores/qualityStore';

export function RightContextPanel() {
    const { rightPanelTab, currentDocumentId } = useAppStore();
    const { setHighlightedIssue } = useQualityStore();

    // Linea Hook (Load data for History view)
    const {
        events,
        isLoaded: isLineaLoaded,
        addEvent,
        clearEvents,
        resetWithContent,
        updateEventSummary
    } = useLinea(currentDocumentId);

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
                        selectedEventId={undefined} // TODO: State for selected event
                        isBranching={false} // TODO: Integration with Editor branching state
                        onSelectEvent={(e) => console.log('Select event', e)}
                        onClearHistory={clearEvents}
                        onMakeLatest={(e) => console.log('Make latest', e)}
                        onStartBranch={(e) => console.log('Start branch', e)}
                        onCancelBranch={() => console.log('Cancel branch')}
                        onEditComment={(e) => console.log('Edit comment', e)}
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
                <QualityPanel
                    onIssueClick={(issue) => {
                        setHighlightedIssue(issue);
                    }}
                />
            )}

            {rightPanelTab === 'graph' && (
                <div className="p-4 text-slate-500 text-sm">
                    Graph View Coming Soon
                </div>
            )}
        </div>
    );
}
