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
    Trash2,
    FileText
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAppStore } from '@/stores/appStore';
import { AIAssistantIcon } from '@/components/_ui/AIAssistantIcon';

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
}

export function AIChatPane({ currentContent, onApplyContent }: AIChatPaneProps) {
    const { t } = useLanguage();
    const { aiContext, setRightPanelTab } = useAppStore();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial greeting
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([
                {
                    id: '1',
                    role: 'assistant',
                    content: 'こんにちは！LineaDoc AIアシスタントです。文章の校正や要約、新しいアイデアの提案など、何でもお手伝いします。',
                    timestamp: new Date()
                }
            ]);
        }
    }, []);

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = (text: string = inputValue) => {
        if (!text.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsTyping(true);

        // Mock AI Response
        setTimeout(() => {
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `「${aiContext.selectedText || 'ドキュメント全体'}」について承知しました。現在モック実装のため、実際的な解析は行われませんが、将来的にここに高度な提案が表示されます。`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMsg]);
            setIsTyping(false);
        }, 1500);
    };

    const runAction = (action: 'summarize' | 'polish' | 'extend') => {
        const prompt = action === 'summarize' ? '選択範囲を要約して' :
            action === 'polish' ? '選択範囲を公用文として磨き上げて' :
                '選択範囲の続きを書いて';
        handleSend(prompt);
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
            {/* Header with Gradient */}
            <div className="shrink-0 p-4 bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 shadow-md">
                <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-1.5 rounded-xl backdrop-blur-md">
                            <AIAssistantIcon size={24} animated />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold leading-none">AI アシスタント</h3>
                            <span className="text-[10px] opacity-70">Powered by Vertex AI (Beta)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Selection Context Area */}
            {aiContext.selectedText && (
                <div className="shrink-0 p-3 bg-indigo-50 border-b border-indigo-100 flex items-start gap-3 animate-in fade-in slide-in-from-top duration-300">
                    <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600 shrink-0">
                        <FileText size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">選択中のコンテキスト</p>
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
                                <div className={`p-3 rounded-2xl text-sm shadow-sm ${msg.role === 'assistant'
                                    ? 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                                    : 'bg-indigo-600 text-white rounded-tr-none'
                                    }`}>
                                    {msg.content}
                                </div>
                                {msg.role === 'assistant' && msg.id !== '1' && (
                                    <div className="mt-2 flex justify-end">
                                        <button
                                            onClick={() => onApplyContent?.(msg.content)}
                                            className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-all active:scale-95 border border-indigo-100"
                                        >
                                            <CheckCircle2 size={12} />
                                            この案を適用する
                                        </button>
                                    </div>
                                )}
                                <p className={`text-[10px] text-slate-400 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

            {/* Quick Actions Footer */}
            <div className="shrink-0 p-3 bg-white border-t border-slate-100">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                    <button
                        onClick={() => runAction('summarize')}
                        disabled={!aiContext.selectedText}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold whitespace-nowrap hover:bg-indigo-100 transition-all active:scale-95 disabled:opacity-40 disabled:grayscale"
                    >
                        <Sparkles size={14} className="text-indigo-500" />
                        要約する (Mock)
                    </button>
                    <button
                        onClick={() => runAction('polish')}
                        disabled={!aiContext.selectedText}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-full text-xs font-bold whitespace-nowrap hover:bg-purple-100 transition-all active:scale-95 disabled:opacity-40 disabled:grayscale"
                    >
                        <Zap size={14} className="text-purple-500" />
                        磨き上げる (Mock)
                    </button>
                    <button
                        onClick={() => runAction('extend')}
                        disabled={!aiContext.selectedText}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-full text-xs font-bold whitespace-nowrap hover:bg-cyan-100 transition-all active:scale-95 disabled:opacity-40 disabled:grayscale"
                    >
                        <RefreshCcw size={14} className="text-cyan-600" />
                        続きを書く (Mock)
                    </button>
                </div>

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
