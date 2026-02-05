import React, { useState } from 'react';
import {
    Sparkles,
    Zap,
    RefreshCcw,
    X,
    Layout,
    ChevronRight,
    ArrowLeft,
    Languages,
    SearchCode,
    List,
    Table,
    Type,
    BrainCircuit,
    PenTool
} from 'lucide-react';
import { AIActionType } from '@/lib/ai/promptTemplates';

interface AISelectionTooltipProps {
    x: number;
    y: number;
    onAction: (action: AIActionType, options?: any) => void;
    onClose: () => void;
}

type MenuType = 'main' | 'style' | 'analyze' | 'structure' | 'translate';

export function AISelectionTooltip({ x, y, onAction, onClose }: AISelectionTooltipProps) {
    const [activeMenu, setActiveMenu] = useState<MenuType>('main');

    const handleAction = (action: AIActionType, options?: any) => {
        onAction(action, options);
        // Tooltip will be closed by the parent (V2Page) when it sets pendingAction
    };

    return (
        <div
            className="fixed z-[9999] flex flex-col bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 origin-bottom"
            style={{
                left: `${x}px`,
                top: `${y - 10}px`, // Adjusted for height
                transform: 'translate(-50%, -100%)'
            }}
        >
            <div className="flex items-center p-1 min-h-[40px]">
                {activeMenu === 'main' ? (
                    <div className="flex items-center gap-0.5 px-1">
                        <ActionButton icon={<Sparkles size={14} />} label="要約" color="indigo" onClick={() => handleAction('summarize')} />
                        <Divider />
                        <ActionButton icon={<Zap size={14} />} label="文体" color="purple" onClick={() => setActiveMenu('style')} hasSubmenu />
                        <Divider />
                        <ActionButton icon={<SearchCode size={14} />} label="分析" color="slate" onClick={() => setActiveMenu('analyze')} hasSubmenu />
                        <Divider />
                        <ActionButton icon={<ArrowLeft className="rotate-180" size={14} />} label="生成" color="cyan" onClick={() => handleAction('continue')} />
                        <Divider />
                        <ActionButton icon={<Layout size={14} />} label="構造" color="teal" onClick={() => setActiveMenu('structure')} hasSubmenu />
                        <Divider />
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 text-slate-400 rounded-full transition-colors">
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-0.5 px-1 animate-in slide-in-from-left-2">
                        <button onClick={() => setActiveMenu('main')} className="p-2 hover:bg-slate-100 text-slate-500 rounded-full transition-colors mr-1">
                            <ArrowLeft size={14} />
                        </button>

                        {activeMenu === 'style' && (
                            <>
                                <ActionButton label="公用文" color="purple" onClick={() => handleAction('official_polish')} />
                                <ActionButton label="丁寧" color="purple" onClick={() => handleAction('polish', { tone: 'detailed' })} />
                                <ActionButton label="簡潔" color="purple" onClick={() => handleAction('polish', { tone: 'concise' })} />
                                <ActionButton label="やさしい" color="orange" onClick={() => handleAction('plainJapanese')} />
                            </>
                        )}

                        {activeMenu === 'analyze' && (
                            <>
                                <ActionButton label="ToDo" color="slate" onClick={() => handleAction('todo_extract')} />
                                <ActionButton label="要件" color="slate" onClick={() => handleAction('points_extract')} />
                                <ActionButton label="論理性" color="red" onClick={() => handleAction('consistency_check')} />
                                <ActionButton label="解説" color="indigo" onClick={() => handleAction('explain')} />
                            </>
                        )}

                        {activeMenu === 'structure' && (
                            <>
                                <ActionButton label="構造化" color="teal" onClick={() => handleAction('format')} />
                                <ActionButton label="箇条書き" color="teal" onClick={() => handleAction('improve')} />
                                <ActionButton label="通知・案内" color="blue" onClick={() => handleAction('notice_draft')} />
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function ActionButton({ icon, label, color, onClick, hasSubmenu = false }: { icon?: React.ReactNode, label: string, color: string, onClick: () => void, hasSubmenu?: boolean }) {
    const colorClasses: Record<string, string> = {
        indigo: "hover:bg-indigo-50 text-indigo-600",
        purple: "hover:bg-purple-50 text-purple-600",
        cyan: "hover:bg-cyan-50 text-cyan-700",
        teal: "hover:bg-teal-50 text-teal-600",
        orange: "hover:bg-orange-50 text-orange-600",
        red: "hover:bg-red-50 text-red-600",
        slate: "hover:bg-slate-50 text-slate-600",
    };

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap active:scale-95 group ${colorClasses[color] || colorClasses.slate}`}
        >
            {icon && <span className="group-hover:scale-110 transition-transform">{icon}</span>}
            {label}
            {hasSubmenu && <ChevronRight size={10} className="ml-0.5 opacity-50" />}
        </button>
    );
}

function Divider() {
    return <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />;
}
