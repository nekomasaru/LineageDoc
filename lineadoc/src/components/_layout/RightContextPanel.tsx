import { useAppStore } from '@/stores/appStore';
import { LineaPanel } from '@/components/_features/lineage/LineaPanel';
import { FrontmatterForm } from '@/components/_features/editor/FrontmatterForm';
import { QualityPanel } from '@/components/_layout/panels/QualityPanel';
import { useLinea } from '@/hooks/useLinea';
import { Loader2, Pin, PinOff, X } from 'lucide-react';
import { useQualityStore } from '@/stores/qualityStore';
import { AIChatPane } from '@/components/_features/ai/AIChatPane';

interface RightContextPanelProps {
    linea?: ReturnType<typeof useLinea>;
    selectedEventId?: string;
    onSelectEvent?: (id: string | null) => void;
    isBranching?: boolean;
    onStartBranch?: (event: any) => void;
    onCancelBranch?: () => void;
    onEditComment?: (event: any) => void;
    onToggleMilestone?: (event: any) => void;
    onMakeLatest?: (event: any) => void;
    onClearHistory?: () => void;
    onApplyContent?: (content: string) => void;
    onSaveMilestone?: (summary: string) => void;
}

export function RightContextPanel({
    linea,
    selectedEventId,
    onSelectEvent,
    isBranching = false,
    onStartBranch,
    onCancelBranch,
    onEditComment,
    onToggleMilestone,
    onMakeLatest,
    onClearHistory,
    onApplyContent,
    onSaveMilestone,
}: RightContextPanelProps) {
    const {
        rightPanelTab,
        setRightPanelTab,
        currentDocumentId,
        isRightPanelPinned,
        setIsRightPanelPinned
    } = useAppStore();

    // Linea Data from props or fallback
    const {
        events,
        isLoaded: isLineaLoaded,
        addEvent,
        clearEvents,
        resetWithContent,
        updateEventSummary,
        updateEventMilestone,
    } = linea || {
        events: [],
        isLoaded: true,
        addEvent: () => ({}),
        clearEvents: () => { },
        resetWithContent: () => ({}),
        updateEventSummary: () => { },
        updateEventMilestone: () => { }
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
        <div className="h-full bg-slate-50 flex flex-col border-l border-slate-200 shadow-xl lg:shadow-none">
            {/* Global Panel Controls (Visible in Floating Mode or for Non-AI tabs) */}
            {!isRightPanelPinned && rightPanelTab !== 'assistant' && (
                <div className="shrink-0 flex items-center justify-between p-2 px-3 bg-white border-b border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {rightPanelTab === 'history' ? '変更履歴' :
                            rightPanelTab === 'attributes' ? '属性編集' :
                                rightPanelTab === 'quality' ? '品質チェック' :
                                    rightPanelTab === 'assistant' ? 'AIアシスタント' : 'コンテキスト'}
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setIsRightPanelPinned(true)}
                            title="横に固定する"
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <Pin size={14} />
                        </button>
                        <button
                            onClick={() => setRightPanelTab(null)}
                            title="閉じる"
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>
            )}
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
                        onToggleMilestone={(e) => {
                            if (onToggleMilestone) {
                                onToggleMilestone(e);
                            } else {
                                updateEventMilestone(e.id, !e.isMilestone);
                            }
                        }}
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

            {rightPanelTab === 'assistant' && (
                <AIChatPane
                    currentContent={linea?.events?.find((e: any) => e.isLatest)?.content || ''}
                    onApplyContent={onApplyContent}
                    onSaveMilestone={onSaveMilestone}
                />
            )}
        </div>
    );
}
