'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Send,
    Sparkles,
    RefreshCcw,
    CheckCircle2,
    Bot,
    User,
    Zap,
    ChevronRight,
    Maximize2,
    Minimize2,
    Trash2,
    FileText,
    Layout,
    CheckSquare,
    MessageSquare,
    Languages,
    Type,
    BrainCircuit,
    PenTool,
    SearchCode,
    LineChart,
    AlertCircle
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAppStore } from '@/stores/appStore';
import { AIAssistantIcon } from '@/components/_ui/AIAssistantIcon';
import { PROMPT_TEMPLATES, AIActionType } from '@/lib/ai/promptTemplates';

interface Message {
    id: string;
    role: 'assistant' | 'user';
    content: string;
    type?: 'text' | 'suggestion';
    timestamp: Date;
}

interface AIChatPaneProps {
    currentContent: string;
    onApplyContent?: (newContent: string) => void;
    onSaveMilestone?: (summary: string) => void;
}

export function AIChatPane({ currentContent, onApplyContent, onSaveMilestone }: AIChatPaneProps) {
    const { t } = useLanguage();
    const { aiContext, currentDocumentTitle, setRightPanelTab, addAiMessage, clearAiSession } = useAppStore();
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showPolishOptions, setShowPolishOptions] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const messages = aiContext.sessionMessages;

    // Initial greeting
    useEffect(() => {
        // Prevent duplicate greeting in development (Strict Mode) or recomposition
        const sessionMessages = useAppStore.getState().aiContext.sessionMessages;
        if (sessionMessages.length === 0) {
            addAiMessage({
                role: 'assistant',
                content: 'こんにちは。LineaDoc AI エージェントです。行政実務における文書作成や校正、論理性チェックなどをサポートします。また、プロジェクトのガバナンスや過去の公文書に基づいた最適な案の提示も可能です。何かお手伝いしましょうか？'
            });
        }
    }, []);

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    // Handle Pending Action from Tooltip/External
    useEffect(() => {
        if (aiContext.pendingAction) {
            const action = aiContext.pendingAction as AIActionType;
            const options = aiContext.pendingOptions;

            // Clear pending action and options from store
            useAppStore.getState().setAiContext({ pendingAction: null, pendingOptions: null });

            const actionLabels: Record<string, string> = {
                summarize: '要約して',
                polish: '磨き上げて',
                improve: '文章を改善して',
                continue: '続きを書いて',
                shorter: '短くして',
                longer: '長くして',
                plain: '分かりやすくして',
                explain: '解説して',
                fix_grammar: '誤字脱字を直して',
                official_polish: '公用文として磨き上げて',
                notice_draft: '通知案を作って',
                outline_draft: '構成案を作って',
                agenda_draft: 'アジェンダを作って',
                qa_draft: '答弁案を作って',
                todo_extract: 'ToDoを抽出して',
                points_extract: '要点を整理して',
                consistency_check: '論理チェックをして',
                format: 'Markdown化して'
            };

            const prompt = actionLabels[action] || '処理して';
            handleSend(prompt, action, options);
        }
    }, [aiContext.pendingAction]);

    const handleSend = (text: string = inputValue, actionType?: AIActionType, actionOptions?: any) => {
        if (!text.trim()) return;

        addAiMessage({
            role: 'user',
            content: text
        });

        setInputValue('');
        setIsTyping(true);

        // Simulation of AI using templates with MOCK RAG METADATA
        setTimeout(() => {
            let responseContent = '';
            let sources: any[] | undefined = undefined;
            let confidence: 'high' | 'mid' | 'low' | undefined = undefined;

            if (actionType && PROMPT_TEMPLATES[actionType]) {
                // Mock results based on action
                if (actionType === 'summarize') {
                    responseContent = `以下の通り、行政実務の観点から要約しました：\n\n- ${aiContext.selectedText?.slice(0, 30)}...の主要なポイントを整理\n- 予算・スケジュールの明確化\n- 課題と対応策の抽出`;
                    sources = [
                        { title: '令和5年度 実施計画書', type: 'project', preview: '本事業は第3次総合計画に基づき...' },
                        { title: '事務事業評価シート (V2)', type: 'project' }
                    ];
                    confidence = 'high';
                } else if (actionType === 'official_polish') {
                    responseContent = `公用文作成要領に基づき、行政文書として磨き上げました。\n\n${aiContext.selectedText}\n\n（※「貴職」「供覧」などの語彙を適用しています）`;
                    sources = [
                        { title: '公用文作成のポイント', type: 'gov' }
                    ];
                    confidence = 'high';
                } else if (actionType === 'polish') {
                    responseContent = `文章を磨き上げました（方針：${actionOptions?.tone}）。\n\n${aiContext.selectedText}`;
                } else {
                    responseContent = `「${aiContext.selectedText || 'ドキュメント全体'}」について承知しました。現在はプロトタイプ表示ですが、将来的にここに高度な提案が生成されます。`;
                    confidence = 'mid';
                }
            } else {
                responseContent = `ご質問ありがとうございます。プロジェクト全体の文脈を踏まえて回答いたします。`;
            }

            addAiMessage({
                role: 'assistant',
                content: responseContent,
                sources,
                confidence
            });
            setIsTyping(false);
        }, 1500);
    };

    const runAction = (action: AIActionType, options?: any) => {
        if (action === 'polish' && !options) {
            setShowPolishOptions(!showPolishOptions);
            return;
        }

        setShowPolishOptions(false);
        const actionLabels: Record<string, string> = {
            summarize: '要約',
            polish: '磨き上げ',
            improve: '品質向上',
            continue: '続きを生成',
            shorter: '短縮',
            longer: '拡張',
            plain: 'シンプル表現',
            explain: '内容解説',
            fix_grammar: '校正',
            official_polish: '公用文変換',
            notice_draft: '通知案作成',
            outline_draft: '構成案作成',
            agenda_draft: '次第作成',
            qa_draft: '答弁案作成',
            todo_extract: 'ToDo抽出',
            points_extract: '要点整理',
            consistency_check: '論理性チェック',
            format: 'Markdown化'
        };

        const prompt = `${actionLabels[action] || '処理'}を実行して`;
        handleSend(prompt, action, options);
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
            {/* Header with Gradient */}
            <div className="shrink-0 p-4 bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 shadow-md">
                <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-1.5 rounded-xl backdrop-blur-md">
                            <AIAssistantIcon size={24} animated={false} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold leading-none">LineaDoc AI</h3>
                            <span className="text-[10px] opacity-70">Powered by Vertex AI (Premium)</span>
                        </div>
                    </div>
                    <button
                        onClick={clearAiSession}
                        title="会話をリセット"
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <RefreshCcw size={16} />
                    </button>
                </div>
            </div>

            {/* Selection Context Area */}
            {aiContext.selectedText && (
                <div className="shrink-0 p-3 bg-indigo-50 border-b border-indigo-100 flex items-start gap-3 animate-in fade-in slide-in-from-top duration-300">
                    <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600 shrink-0">
                        <FileText size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">選択範囲を処理中...</p>
                        </div>
                        <p className="text-xs text-indigo-700 line-clamp-2 mt-0.5 italic">
                            "{aiContext.selectedText}"
                        </p>
                    </div>
                    <button
                        onClick={() => useAppStore.getState().clearAiContext()}
                        className="p-1 text-indigo-300 hover:text-indigo-500 hover:bg-indigo-100 rounded transition-colors"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            )}

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
            >
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                    >
                        <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${msg.role === 'assistant'
                                ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white'
                                : 'bg-slate-200 text-slate-500'
                                }`}>
                                {msg.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
                            </div>
                            <div className="space-y-1">
                                {msg.role === 'assistant' && msg.confidence && (
                                    <div className={`flex items-center gap-1.5 mb-1 px-2 py-0.5 rounded-full text-[9px] font-bold w-fit ${msg.confidence === 'high' ? 'bg-emerald-100 text-emerald-700' :
                                        msg.confidence === 'mid' ? 'bg-amber-100 text-amber-700' :
                                            'bg-slate-100 text-slate-500'
                                        }`}>
                                        <BrainCircuit size={10} />
                                        {msg.confidence === 'high' ? '確信度: 高' : msg.confidence === 'mid' ? '確信度: 中' : '一般知識'}
                                    </div>
                                )}
                                <div className={`p-3 rounded-2xl text-sm shadow-sm ${msg.role === 'assistant'
                                    ? 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                                    : 'bg-indigo-600 text-white rounded-tr-none'
                                    }`}>
                                    {msg.content}
                                </div>

                                {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {msg.sources.map((src, i) => (
                                            <div
                                                key={i}
                                                title={src.preview || src.title}
                                                className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-bold cursor-help transition-all hover:scale-105 ${src.type === 'gov' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                    src.type === 'project' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                        'bg-cyan-50 text-cyan-600 border-cyan-100'
                                                    }`}
                                            >
                                                {src.type === 'gov' ? <Zap size={8} /> :
                                                    src.type === 'project' ? <FileText size={8} /> :
                                                        <SearchCode size={8} />}
                                                {src.title}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {msg.role === 'assistant' && msg.id !== messages[0]?.id && (
                                    <div className="mt-2 flex justify-end">
                                        <button
                                            onClick={() => onApplyContent?.(msg.content)}
                                            className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-all active:scale-95 border border-indigo-100"
                                        >
                                            <CheckCircle2 size={12} />
                                            エディタに適用
                                        </button>
                                    </div>
                                )}
                                <p className={`text-[10px] text-slate-400 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start animate-in fade-in duration-300">
                        <div className="flex gap-3 max-w-[85%] items-end">
                            <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center shadow-sm">
                                <Bot size={18} />
                            </div>
                            <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-tl-none flex gap-1 items-center">
                                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Horizontal Command Bar (Unified & Expanded) */}
            <div className="shrink-0 bg-white border-t border-slate-100 py-2 shadow-[0_-2px_6px_rgba(0,0,0,0.01)]">
                <div className="flex items-center gap-2 overflow-x-auto px-3 pb-1 no-scrollbar">
                    {/* Editing Category */}
                    <div className="flex items-center gap-1.5 pr-2 border-r border-slate-100 shrink-0">
                        <ActionPill icon={<Zap size={12} />} label="公用文" onClick={() => runAction('official_polish')} disabled={!aiContext.selectedText} color="purple" />
                        <ActionPill icon={<Sparkles size={12} />} label="要約" onClick={() => runAction('summarize')} disabled={!aiContext.selectedText} color="indigo" />
                        <ActionPill icon={<AlertCircle size={12} />} label="校正" onClick={() => runAction('fix_grammar')} disabled={!aiContext.selectedText} color="red" />
                        <ActionPill icon={<Type size={12} />} label="やさしい" onClick={() => runAction('plainJapanese')} disabled={!aiContext.selectedText} color="orange" />
                        <ActionPill icon={<Layout size={12} />} label="構造化" onClick={() => runAction('format')} disabled={!aiContext.selectedText} color="teal" />
                        <ActionPill
                            icon={<MessageSquare size={12} />}
                            label="AI指示"
                            onClick={() => useAppStore.getState().setActiveModal('ai-instruction')}
                            color="purple"
                        />
                        <ActionPill
                            icon={<Sparkles size={12} />}
                            label="マイルストーン保存"
                            onClick={() => {
                                onSaveMilestone?.('AIによる自動構造化と要約');
                                useAppStore.getState().showToast('マイルストーンを保存しました', 'success');
                            }}
                            color="purple"
                        />
                    </div>

                    {/* Creation Category */}
                    <div className="flex items-center gap-1.5 px-2 border-r border-slate-100 shrink-0">
                        <ActionPill icon={<PenTool size={12} />} label="通知文" onClick={() => runAction('notice_draft')} color="blue" />
                        <ActionPill icon={<BrainCircuit size={12} />} label="構成案" onClick={() => runAction('outline_draft')} color="indigo" />
                        <ActionPill icon={<MessageSquare size={12} />} label="答弁案" onClick={() => runAction('qa')} color="cyan" />
                        <ActionPill icon={<Layout size={12} />} label="アジェンダ" onClick={() => runAction('agenda_draft')} color="emerald" />
                        <ActionPill icon={<RefreshCcw size={12} />} label="続き" onClick={() => runAction('continue')} color="indigo" />
                    </div>

                    {/* Analysis & Adjustment Category */}
                    <div className="flex items-center gap-1.5 pl-2 shrink-0">
                        <ActionPill icon={<CheckSquare size={12} />} label="ToDo" onClick={() => runAction('todo_extract')} color="slate" />
                        <ActionPill icon={<SearchCode size={12} />} label="要件" onClick={() => runAction('points_extract')} color="slate" />
                        <ActionPill icon={<AlertCircle size={12} />} label="論理性" onClick={() => runAction('consistency_check')} color="red" />
                        <ActionPill icon={<Bot size={12} />} label="解説" onClick={() => runAction('explain')} disabled={!aiContext.selectedText} color="indigo" />
                        <ActionPill icon={<Minimize2 size={12} className="rotate-45" />} label="短く" onClick={() => runAction('shorter')} disabled={!aiContext.selectedText} color="slate" />
                        <ActionPill icon={<Maximize2 size={12} className="rotate-45" />} label="長く" onClick={() => runAction('longer')} disabled={!aiContext.selectedText} color="slate" />
                    </div>
                </div>
            </div>

            {/* Polish Options Submenu (Inline version / Quick access) */}
            {showPolishOptions && (
                <div className="shrink-0 p-3 bg-white border-t border-slate-100 animate-in slide-in-from-bottom-2 duration-200">
                    <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-tight">磨き上げトーン選択</p>
                    <div className="flex flex-col gap-1">
                        <button
                            onClick={() => runAction('polish', { tone: 'formal' })}
                            className="flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-purple-50 text-purple-700 rounded-lg text-xs transition-colors group"
                        >
                            <span className="font-bold">公用文・ビジネスフォーマル</span>
                            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>
                        <button
                            onClick={() => runAction('polish', { tone: 'concise' })}
                            className="flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-purple-50 text-purple-700 rounded-lg text-xs transition-colors group"
                        >
                            <span className="font-bold">簡潔・スリム化</span>
                            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>
                        <button
                            onClick={() => runAction('polish', { tone: 'detailed' })}
                            className="flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-purple-50 text-purple-700 rounded-lg text-xs transition-colors group"
                        >
                            <span className="font-bold">詳細・ストーリー化</span>
                            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                    <button
                        onClick={() => setShowPolishOptions(false)}
                        className="w-full mt-2 py-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase transition-colors"
                    >
                        キャンセル
                    </button>
                </div>
            )}

            <div className="shrink-0 p-3 bg-white border-t border-slate-100 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">

                {/* Input Area */}
                <div className="mt-2 flex items-end gap-2 bg-slate-100 p-1.5 rounded-2xl focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                    <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="AIにメッセージを送信..."
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-3 resize-none max-h-32 min-h-[40px] text-slate-800 placeholder:text-slate-400"
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={!inputValue.trim() || isTyping}
                        className="p-2.5 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-xl shadow-md hover:shadow-indigo-200 active:scale-90 transition-all disabled:opacity-30 disabled:grayscale"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Compact pill action for horizontal bar
 */
function ActionPill({ icon, label, onClick, disabled = false, color = 'slate' }: { icon: React.ReactNode, label: string, onClick: () => void, disabled?: boolean, color?: string }) {
    const colorClasses: Record<string, string> = {
        purple: "hover:bg-purple-50 text-purple-600 border-purple-100 hover:border-purple-200",
        indigo: "hover:bg-indigo-50 text-indigo-600 border-indigo-100 hover:border-indigo-200",
        blue: "hover:bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-200",
        cyan: "hover:bg-cyan-50 text-cyan-700 border-cyan-100 hover:border-cyan-200",
        orange: "hover:bg-orange-50 text-orange-600 border-orange-100 hover:border-orange-200",
        red: "hover:bg-red-50 text-red-600 border-red-100 hover:border-red-200",
        teal: "hover:bg-teal-50 text-teal-600 border-teal-100 hover:border-teal-200",
        slate: "hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300"
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-[11px] font-bold whitespace-nowrap transition-all active:scale-95 disabled:opacity-30 border shadow-sm ${colorClasses[color] || colorClasses.slate}`}
        >
            {icon}
            {label}
        </button>
    );
}
