'use client';

import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { User, Bot, Save, Trash2, RotateCcw, Copy } from 'lucide-react';
import { LineageEvent } from '@/lib/types';

interface LineagePanelProps {
    events: LineageEvent[];
    selectedEventId?: string;
    onSelectEvent: (event: LineageEvent) => void;
    onClearHistory: () => void;
    onMakeLatest?: (event: LineageEvent) => void; // 選択履歴を最新化
}

const eventConfig = {
    user_edit: {
        icon: User,
        label: '編集',
        bgColor: 'bg-slate-100',
        selectedBgColor: 'bg-blue-100',
        textColor: 'text-slate-800',
        borderColor: 'border-slate-300',
        selectedBorderColor: 'border-blue-500',
    },
    ai_suggestion: {
        icon: Bot,
        label: 'AI提案',
        bgColor: 'bg-blue-50',
        selectedBgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
        borderColor: 'border-blue-200',
        selectedBorderColor: 'border-blue-500',
    },
    save: {
        icon: Save,
        label: '保存',
        bgColor: 'bg-green-50',
        selectedBgColor: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-300',
        selectedBorderColor: 'border-green-500',
    },
};

export function LineagePanel({
    events,
    selectedEventId,
    onSelectEvent,
    onClearHistory,
    onMakeLatest,
}: LineagePanelProps) {
    const sortedEvents = [...events].reverse(); // 新しい順
    const latestEventId = events.length > 0 ? events[events.length - 1].id : undefined;
    const selectedEvent = events.find(e => e.id === selectedEventId);
    const isSelectedLatest = selectedEventId === latestEventId;

    return (
        <div className="w-72 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
            {/* Header */}
            <div className="h-12 bg-slate-800 text-white flex items-center px-4 shrink-0">
                <h2 className="font-semibold text-sm">変更履歴</h2>
                <span className="ml-2 text-xs text-slate-400">({events.length}件)</span>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3">
                {sortedEvents.length === 0 ? (
                    <div className="text-center text-slate-500 py-8">
                        <p className="text-sm">履歴がありません</p>
                        <p className="text-xs mt-2">編集を開始すると記録されます</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {sortedEvents.map((event) => {
                            const config = eventConfig[event.type];
                            const Icon = config.icon;
                            const isSelected = event.id === selectedEventId;
                            const isLatest = event.id === latestEventId;
                            const version = event.version ?? '?';

                            return (
                                <button
                                    key={event.id}
                                    onClick={() => onSelectEvent(event)}
                                    className={`w-full text-left p-2.5 rounded-lg border-2 transition-all ${isSelected
                                        ? `${config.selectedBgColor} ${config.selectedBorderColor} shadow-md`
                                        : `${config.bgColor} ${config.borderColor} hover:shadow-sm`
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        {/* バージョン番号 */}
                                        <span className="text-xs font-bold text-slate-500 w-6">
                                            v{version}
                                        </span>
                                        <Icon size={14} className={config.textColor} />
                                        <span className={`text-xs font-medium ${config.textColor}`}>
                                            {config.label}
                                        </span>
                                        {isLatest && (
                                            <span className="ml-auto text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded">
                                                最新
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-[11px] text-slate-500 ml-6">
                                        {format(new Date(event.timestamp), 'MM/dd HH:mm', { locale: ja })}
                                    </div>
                                    {event.summary && (
                                        <div className="text-xs text-slate-600 mt-1 truncate ml-6">
                                            {event.summary}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer */}
            {sortedEvents.length > 0 && (
                <div className="p-3 border-t border-slate-200 space-y-2 shrink-0">
                    {/* 選択中の履歴を最新化するボタン */}
                    {selectedEvent && !isSelectedLatest && onMakeLatest && (
                        <button
                            onClick={() => onMakeLatest(selectedEvent)}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-green-500 text-white hover:bg-green-600 rounded text-sm font-medium transition-colors"
                        >
                            <Copy size={14} />
                            <span>v{selectedEvent.version ?? '?'} を最新化</span>
                        </button>
                    )}
                    <button
                        onClick={onClearHistory}
                        className="w-full flex items-center justify-center gap-2 py-1.5 text-red-600 hover:bg-red-50 rounded text-xs transition-colors"
                        title="現在の内容を維持したまま、履歴のみを全消去します"
                    >
                        <Trash2 size={12} />
                        <span>履歴をリセット</span>
                    </button>
                </div>
            )}
        </div>
    );
}
