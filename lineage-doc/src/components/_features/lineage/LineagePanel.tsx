'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { User, Bot, Save, Trash2, Copy, GitBranch, Edit2 } from 'lucide-react';
import { LineageEvent } from '@/lib/types';
import { calculateGraphLayout } from '@/lib/lineage-utils';

interface LineagePanelProps {
    events: LineageEvent[];
    selectedEventId?: string;
    isBranching?: boolean;
    onSelectEvent: (event: LineageEvent) => void;
    onClearHistory: () => void;
    onMakeLatest?: (event: LineageEvent) => void;
    onStartBranch?: (event: LineageEvent) => void;
    onCancelBranch?: () => void;
}

const eventConfig: Record<string, any> = {
    user_edit: {
        icon: User,
        label: '編集',
        color: '#3b82f6', // blue-500
        bgColor: 'bg-slate-100',
        textColor: 'text-slate-800',
    },
    ai_suggestion: {
        icon: Bot,
        label: 'AI提案',
        color: '#8b5cf6', // violet-500
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-800',
    },
    save: {
        icon: Save,
        label: '保存',
        color: '#22c55e', // green-500
        bgColor: 'bg-green-50',
        textColor: 'text-green-800',
    },
};

const ROW_HEIGHT = 64; // px
const COL_WIDTH = 32; // px (24 -> 32に拡張して干渉を低減)
const LEFT_MARGIN = 20; // px
const CIRCLE_RADIUS = 10; // (5 -> 10に拡大して文字を入れやすくする)

export function LineagePanel({
    events,
    selectedEventId,
    isBranching,
    onSelectEvent,
    onClearHistory,
    onMakeLatest,
    onStartBranch,
    onCancelBranch,
}: LineagePanelProps) {
    // グラフレイアウト計算
    const { nodes, links, maxColumn } = useMemo(() => calculateGraphLayout(events), [events]);

    // イベントが子を持つかどうかの判定用マップ
    const hasChildrenMap = useMemo(() => {
        const map = new Set<string>();
        events.forEach(e => {
            if (e.parentId) map.add(e.parentId);
        });
        return map;
    }, [events]);

    // グラフ描画領域の幅
    const graphWidth = LEFT_MARGIN + (maxColumn + 1) * COL_WIDTH;
    const totalHeight = nodes.length * ROW_HEIGHT;
    const latestEventId = events.length > 0 ? events[events.length - 1].id : undefined;
    const selectedEvent = events.find(e => e.id === selectedEventId);
    const isSelectedLatest = selectedEventId === latestEventId;
    const isSelectedTip = selectedEventId ? !hasChildrenMap.has(selectedEventId) : false;

    return (
        <div className="w-full h-full bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
            {/* Header */}
            <div className="h-12 bg-slate-800 text-white flex items-center px-4 shrink-0 justify-between">
                <div className="flex items-center">
                    <h2 className="font-semibold text-sm">変更履歴</h2>
                    <span className="ml-2 text-xs text-slate-400">({events.length})</span>
                </div>
            </div>

            {/* Content Area (SVG + List) */}
            <div className="flex-1 overflow-auto relative">
                {nodes.length === 0 ? (
                    <div className="text-center text-slate-500 py-8">
                        <p className="text-sm">履歴がありません</p>
                    </div>
                ) : (
                    <div className="relative min-h-full">
                        {/* SVG Layer (Background) */}
                        <svg
                            className="absolute top-0 left-0 pointer-events-none z-10"
                            width={Math.max(graphWidth, 50)}
                            height={totalHeight}
                        >
                            {/* Links */}
                            {links.map((link) => {
                                const sx = LEFT_MARGIN + link.sourceColumn * COL_WIDTH;
                                const sy = link.sourceY * ROW_HEIGHT + ROW_HEIGHT / 2;
                                const tx = LEFT_MARGIN + link.targetColumn * COL_WIDTH;
                                const ty = link.targetY * ROW_HEIGHT + ROW_HEIGHT / 2;

                                // Bezier Curve: 下から上へ接続
                                // カーブの制御点を調整して、隣接カラムへの干渉を減らす
                                const curveOffset = ROW_HEIGHT * 0.45; // 0.5だと垂直区間が長すぎて膨らむ場合がある
                                const cp1y = sy + curveOffset;
                                const cp2y = ty - curveOffset;

                                return (
                                    <path
                                        key={`${link.sourceId}-${link.targetId}`}
                                        d={`M ${sx} ${sy} C ${sx} ${cp1y} ${tx} ${cp2y} ${tx} ${ty}`}
                                        fill="none"
                                        stroke="#94a3b8" // slate-400
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />
                                );
                            })}

                            {/* Nodes */}
                            {nodes.map((node) => {
                                const cx = LEFT_MARGIN + node.column * COL_WIDTH;
                                const cy = node.yIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
                                const isSelected = node.event.id === selectedEventId;
                                const version = node.event.version ?? '?';

                                return (
                                    <g key={node.event.id}>
                                        <circle
                                            cx={cx}
                                            cy={cy}
                                            r={CIRCLE_RADIUS}
                                            fill={isSelected ? '#3b82f6' : '#fff'}
                                            stroke={isSelected ? '#2563eb' : '#94a3b8'}
                                            strokeWidth={isSelected ? 2 : 1}
                                        />
                                        <text
                                            x={cx}
                                            y={cy}
                                            textAnchor="middle"
                                            dominantBaseline="central"
                                            fontSize="9"
                                            fontWeight="600"
                                            fill={isSelected ? '#fff' : '#64748b'}
                                            pointerEvents="none"
                                        >
                                            {version}
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>

                        {/* List Layer (Foreground) */}
                        <div className="relative z-20">
                            {nodes.map((node) => {
                                const event = node.event;
                                const config = eventConfig[event.type];
                                const Icon = config.icon;
                                const isSelected = event.id === selectedEventId;
                                const isLatest = event.id === latestEventId;
                                const version = event.version ?? '?';

                                return (
                                    <div
                                        key={event.id}
                                        style={{ height: ROW_HEIGHT, paddingLeft: graphWidth + 8, overflow: 'hidden' }}
                                        className={`min-w-max h-16 w-full flex items-center pr-2 border-b border-slate-100 transition-colors cursor-pointer shrink-0
                                            ${isSelected ? 'bg-blue-50/80' : 'hover:bg-slate-50'}
                                        `}
                                        onClick={() => onSelectEvent(event)}
                                    >
                                        <div className="flex-1 min-w-0 py-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-1.5 rounded">
                                                    v{version}
                                                </span>
                                                <span className={`text-xs font-medium ${config.textColor} flex items-center gap-1`}>
                                                    <Icon size={12} />
                                                    {config.label}
                                                </span>
                                                {isLatest && (
                                                    <span className="ml-auto text-[10px] bg-blue-500 text-white px-1.5 rounded-full">
                                                        Latest
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-slate-400 mb-0.5">
                                                {format(new Date(event.timestamp), 'MM/dd HH:mm', { locale: ja })}
                                            </div>
                                            {event.summary && (
                                                <div className="text-xs text-slate-600 truncate" title={event.summary}>
                                                    {event.summary}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-200 bg-white z-30 space-y-2 shrink-0">
                {/* 分岐モード中（編集中） */}
                {isBranching && onCancelBranch && (
                    <button
                        onClick={onCancelBranch}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-amber-500 text-white hover:bg-amber-600 rounded text-sm font-medium transition-colors shadow-sm"
                    >
                        <GitBranch size={14} />
                        <span>{isSelectedTip ? '編集を中断' : '分岐の作成をキャンセル'}</span>
                    </button>
                )}

                {/* 非分岐モードで、ノードが選択されている場合 */}
                {!isBranching && selectedEvent && (
                    <div className="space-y-2">
                        {onStartBranch && (
                            isSelectedTip ? (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onStartBranch(selectedEvent)}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded text-sm font-medium transition-colors shadow-sm"
                                        title="このブランチの続きを作成します"
                                    >
                                        <Edit2 size={14} />
                                        <span>編集</span>
                                    </button>
                                    <button
                                        onClick={() => onStartBranch(selectedEvent)}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded text-sm font-medium transition-colors shadow-sm"
                                        title="この時点から新しいブランチを作成します"
                                    >
                                        <GitBranch size={14} />
                                        <span>分岐</span>
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => onStartBranch(selectedEvent)}
                                    className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded text-sm font-medium transition-colors shadow-sm"
                                >
                                    <GitBranch size={14} />
                                    <span>このバージョンから分岐を作成</span>
                                </button>
                            )
                        )}
                        {/* 復元ボタンは最新以外のノードにのみ表示 */}
                        {onMakeLatest && !isSelectedLatest && (
                            <button
                                onClick={() => onMakeLatest(selectedEvent)}
                                className="w-full flex items-center justify-center gap-2 py-2 bg-green-500 text-white hover:bg-green-600 rounded text-sm font-medium transition-colors shadow-sm"
                            >
                                <Copy size={14} />
                                <span>v{selectedEvent.version ?? '?'} を最新として復元</span>
                            </button>
                        )}
                    </div>
                )}
                <button
                    onClick={onClearHistory}
                    className="w-full flex items-center justify-center gap-2 py-1.5 text-red-600 hover:bg-red-50 rounded text-xs transition-colors"
                >
                    <Trash2 size={12} />
                    <span>履歴リセット</span>
                </button>
            </div>
        </div>
    );
}
