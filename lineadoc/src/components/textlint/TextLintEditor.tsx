"use client";

import React, { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce'; // Using the library installed in package.json
import { useTextLint } from '../../contexts/TextLintContext';
import { ErrorList } from './ErrorList';
import './TextLintEditor.css';

export function TextLintEditor({ initialText = '' }: { initialText?: string }) {
    const [text, setText] = useState(initialText);
    // Debounce input to avoid spamming the API
    const [debouncedText] = useDebounce(text, 1000); // 1.0s debounce for heavy API
    const { isChecking, errors, checkText } = useTextLint();

    useEffect(() => {
        checkText(debouncedText);
    }, [debouncedText, checkText]);

    return (
        <div className="textlint-editor-container grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Editor Section */}
            <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">文書作成</h2>
                    <div className="flex items-center space-x-3 text-sm">
                        {isChecking ? (
                            <span className="flex items-center text-amber-500 font-medium animate-pulse">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                校正中...
                            </span>
                        ) : errors.length > 0 ? (
                            <span className="text-red-500 font-medium">{errors.length} 件の指摘</span>
                        ) : text.trim() ? (
                            <span className="text-green-600 font-medium flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                問題なし
                            </span>
                        ) : (
                            <span className="text-gray-400">待機中</span>
                        )}
                    </div>
                </div>

                <textarea
                    className="flex-grow w-full p-4 text-base leading-relaxed border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-sans"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="ここに文章を入力してください。文化庁の国語施策基準に基づいてリアルタイムでチェックします..."
                    spellCheck={false} // Disable browser spellcheck to avoid confusion
                />
            </div>

            {/* Results Section */}
            <div className="flex flex-col h-full">
                <div className="flex items-center mb-4 pb-2 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">校正結果</h2>
                </div>
                <div className="flex-grow overflow-hidden">
                    <ErrorList errors={errors} text={text} />
                </div>
            </div>
        </div>
    );
}
