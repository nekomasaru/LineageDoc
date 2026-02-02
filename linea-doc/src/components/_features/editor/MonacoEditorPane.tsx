/**
 * MonacoEditorPane.tsx
 * 
 * Monaco Editorをラップし、editorStoreと接続するコンポーネント
 * mode === 'code' の時のみ表示される
 * 
 * @skill editor-comp-monaco
 */

'use client';

import { useRef, useCallback, useEffect } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useEditorStore } from '@/stores/editorStore';

interface MonacoEditorPaneProps {
    className?: string;
    /** 比較対象のコンテンツ（差分表示用） */
    compareWith?: string;
    /** フォントサイズ */
    fontSize?: number;
    /** 読み取り専用 */
    readOnly?: boolean;
}

export function MonacoEditorPane({
    className = '',
    compareWith,
    fontSize = 14,
    readOnly = false,
}: MonacoEditorPaneProps) {
    const { markdown, mode, setMarkdown } = useEditorStore();

    // エディタインスタンスへの参照
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    // 内部更新フラグ（無限ループ防止）
    const isInternalUpdateRef = useRef(false);
    // 最後の値（重複更新防止）
    const lastValueRef = useRef(markdown);

    /**
     * エディタマウント時の処理
     */
    const handleEditorMount: OnMount = useCallback((editor) => {
        editorRef.current = editor;

        // フォーカスを設定
        editor.focus();

        // Ctrl+S で保存（将来の保存機能用）
        // Note: KeyMod/KeyCode はランタイムで取得する必要がある
        editor.addAction({
            id: 'save-document',
            label: 'Save Document',
            keybindings: [
                // Monaco.KeyMod.CtrlCmd | Monaco.KeyCode.KeyS
            ],
            run: () => {
                // TODO: 保存処理（api-client-save スキルで実装）
                console.log('[Monaco] Save action triggered');
            },
        });
    }, []);

    /**
     * エディタ内容変更時の処理
     */
    const handleChange: OnChange = useCallback((value) => {
        // 内部更新中は何もしない（無限ループ防止）
        if (isInternalUpdateRef.current) return;

        const newValue = value ?? '';

        // 同じ値なら何もしない
        if (newValue === lastValueRef.current) return;

        lastValueRef.current = newValue;
        setMarkdown(newValue);
    }, [setMarkdown]);

    /**
     * ストアのmarkdown変更を監視し、エディタに反映
     */
    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) return;

        // 現在の値と同じなら何もしない
        if (markdown === lastValueRef.current) return;

        // 内部更新フラグを立てる
        isInternalUpdateRef.current = true;
        lastValueRef.current = markdown;

        // エディタの値を更新
        editor.setValue(markdown);

        // フラグをリセット
        setTimeout(() => {
            isInternalUpdateRef.current = false;
        }, 0);
    }, [markdown]);

    // Code モード以外では表示しない
    if (mode !== 'code') {
        return null;
    }

    return (
        <div className={`h-full w-full ${className}`}>
            <Editor
                height="100%"
                language="markdown"
                theme="vs-light"
                value={markdown}
                onChange={handleChange}
                onMount={handleEditorMount}
                options={{
                    fontSize,
                    fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                    wordWrap: 'on',
                    lineNumbers: 'on',
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    insertSpaces: true,
                    renderWhitespace: 'selection',
                    quickSuggestions: false,
                    suggestOnTriggerCharacters: false,
                    folding: true,
                    lineDecorationsWidth: 10,
                    readOnly,
                    mouseWheelZoom: false,
                    padding: { top: 16, bottom: 16 },
                }}
            />
        </div>
    );
}
