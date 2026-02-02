'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { User, Bot, Save, Trash2, Copy, GitBranch, Edit2 } from 'lucide-react';
import { LineaEvent } from '@/lib/types';
import { calculateGraphLayout } from '@/lib/linea-utils';
import { useLanguage } from '@/lib/LanguageContext';

interface LineaPanelProps {
    events: LineaEvent[];
    selectedEventId: string | undefined;
    isBranching: boolean;
    treeScale?: number; // Ctrl+Wheel zoom scale for tree
    onSelectEvent: (event: LineaEvent) => void;
    onClearHistory: () => void;
    onMakeLatest: (event: LineaEvent) => void;
    onStartBranch: (event: LineaEvent) => void;
    onCancelBranch: () => void;
    onEditComment: (event: LineaEvent) => void; // コメント編集コールバック
}

const eventConfig: Record<string, any> = {
    user_edit: {
        icon: User,
        labelKey: 'panel.edit',
        color: '#0891b2', // cyan-600
        bgColor: 'bg-slate-100',
        textColor: 'text-slate-800',
    },
    ai_suggestion: {
        icon: Bot,
        labelKey: 'panel.aiSuggest',
        color: '#7c3aed', // violet-600
        bgColor: 'bg-indigo-50',
        textColor: 'text-indigo-800',
    },
    save: {
        icon: Save,
        labelKey: 'panel.save',
        color: '#16a34a', // green-600
        bgColor: 'bg-green-50',
        textColor: 'text-green-800',
    },
};

const ROW_HEIGHT = 64; // px
const COL_WIDTH = 32; // px (24 -> 32に拡張して干渉を低減)
const LEFT_MARGIN = 20; // px
const CIRCLE_RADIUS = 10; // (5 -> 10に拡大して文字を入れやすくする)

export function LineaPanel({
    events,
    selectedEventId,
    isBranching,
    treeScale = 1,
    onSelectEvent,
    onClearHistory,
    onMakeLatest,
    onStartBranch,
    onCancelBranch,
    onEditComment,
}: LineaPanelProps) {
    const { t } = useLanguage();
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

    // キーボード操作
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            // 表示順(nodes)に基づいて移動する
            const currentIndex = nodes.findIndex(node => node.event.id === selectedEventId);

            if (currentIndex === -1 && nodes.length > 0) {
                // 未選択なら一番下（最新）を選択
                onSelectEvent(nodes[nodes.length - 1].event);
                return;
            }

            let nextIndex = currentIndex;
            if (e.key === 'ArrowUp') {
                // 上キー = リストの上へ (index減)
                nextIndex = Math.max(0, currentIndex - 1);
            } else {
                // 下キー = リストの下へ (index増)
                nextIndex = Math.min(nodes.length - 1, currentIndex + 1);
            }

            if (nextIndex !== currentIndex) {
                onSelectEvent(nodes[nextIndex].event);
            }
        }
    };

    return (
        <div
            className="w-full h-full bg-slate-50 border-r border-slate-200 flex flex-col shrink-0 outline-none"
            tabIndex={0}
            onKeyDown={handleKeyDown}
        >
            {/* Header */}
            <div className="h-12 bg-white border-b border-slate-200 flex items-center px-4 shrink-0 justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-cyan-600 rounded-full"></div>
                    <h2 className="font-bold text-slate-900 text-sm tracking-tight">{t('panel.title')}</h2>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {events.length}
                    </span>
                </div>
            </div>

            {/* Content Area (SVG + List) */}
            <div id="lineage-tree-container" className="flex-1 overflow-auto relative">
                {nodes.length === 0 ? (
                    <div className="text-center text-slate-400 py-12 px-6">
                        <p className="text-xs">{t('panel.empty')}</p>
                    </div>
                ) : (
                    <div
                        className="relative min-h-full"
                        style={{ transform: `scale(${treeScale})`, transformOrigin: 'top left' }}
                    >
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
                                            fill={isSelected ? '#06b6d4' : '#fff'} // cyan-500
                                            stroke={isSelected ? '#0891b2' : '#94a3b8'} // cyan-600
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

                        {/* Comment Labels Layer (Clickable HTML overlay - z-30 to be above List Layer) */}
                        <div className="absolute top-0 left-0 z-30 pointer-events-none" style={{ width: graphWidth, height: totalHeight }}>
                            {nodes.map((node) => {
                                if (!node.event.summary) return null;
                                const cx = LEFT_MARGIN + node.column * COL_WIDTH;
                                const cy = node.yIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
                                const displayText = node.event.summary.length > 12
                                    ? node.event.summary.slice(0, 12) + '…'
                                    : node.event.summary;
                                return (
                                    <div
                                        key={`comment-${node.event.id}`}
                                        className="absolute text-[8px] font-medium text-amber-500 cursor-pointer hover:text-amber-600 hover:underline whitespace-nowrap pointer-events-auto"
                                        style={{
                                            left: cx - CIRCLE_RADIUS,
                                            top: cy + CIRCLE_RADIUS + 6,
                                        }}
                                        title={node.event.summary}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEditComment?.(node.event);
                                        }}
                                    >
                                        {displayText}
                                    </div>
                                );
                            })}
                        </div>

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
                                            ${isSelected ? 'bg-cyan-50/80' : 'hover:bg-slate-50'}
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
                                                    {t(config.labelKey)}
                                                </span>
                                                {isLatest && (
                                                    <span className="ml-auto text-[10px] bg-cyan-600 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                                        {t('panel.latest')}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-slate-400 mb-0.5">
                                                {/* Date formatting could be localized too but sticking to numeric for now */}
                                                {format(new Date(event.timestamp), 'yyyy/MM/dd HH:mm:ss')}
                                            </div>

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
                        <span>{isSelectedTip ? t('panel.cancelEdit') : t('panel.cancelBranch')}</span>
                    </button>
                )}

                {/* 非分岐モードで、ノードが選択されている場合 */}
                {!isBranching && selectedEvent && (
                    <div className="space-y-2">
                        {onStartBranch && (
                            isSelectedTip ? (
                                /* 最新の先端（Tip）を選択している場合 */
                                <div className="flex gap-2">
                                    {/* 最新の場合は「編集」ボタンのみを表示 */}
                                    {!isSelectedLatest && (
                                        <button
                                            onClick={() => onStartBranch(selectedEvent)}
                                            className="w-full flex items-center justify-center gap-2 py-2 bg-cyan-600 text-white hover:bg-cyan-700 rounded text-sm font-medium transition-colors shadow-sm"
                                            title="Resume editing this branch"
                                        >
                                            <Edit2 size={14} />
                                            <span>{t('panel.edit')}</span>
                                        </button>
                                    )}
                                </div>
                            ) : (
                                /* 過去のノードを選択している場合 */
                                <button
                                    onClick={() => onStartBranch(selectedEvent)}
                                    className="w-full flex items-center justify-center gap-2 py-2 bg-cyan-600 text-white hover:bg-cyan-700 rounded text-sm font-medium transition-colors shadow-sm"
                                >
                                    <GitBranch size={14} />
                                    <span>{t('panel.createBranchFrom')}</span>
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
                                <span>{t('panel.restoreAsLatest', { version: selectedEvent.version ?? '?' })}</span>
                            </button>
                        )}
                    </div>
                )}
                <button
                    onClick={onClearHistory}
                    className="w-full flex items-center justify-center gap-2 py-1.5 text-red-600 hover:bg-red-50 rounded text-xs transition-colors"
                >
                    <Trash2 size={12} />
                    <span>{t('panel.clearHistory')}</span>
                </button>
            </div>
        </div>
    );
}
