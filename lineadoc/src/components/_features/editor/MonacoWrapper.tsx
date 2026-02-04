'use client';

import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import { useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import type * as Monaco from 'monaco-editor';
import { computeDiff } from '@/lib/diff-utils';
import { getAutoNumbering } from '@/lib/markdown-utils';
import { QualityIssue } from '@/stores/qualityStore';

interface MonacoWrapperProps {
  value: string;
  onChange: (value: string) => void;
  onVisibleLineChange?: (line: number) => void;
  onSave?: () => void;
  onAiMention?: () => void; // AIメンショントリガー
  onZoom?: (delta: number) => void; // Ctrl+Wheel zoom callback
  targetLine?: number;
  compareWith?: string; // 保存済みの比較対象 (vN-1)
  activeBase?: string;   // 未保存の比較対象 (vN)
  readOnly?: boolean;
  fontSize?: number; // エディタのフォントサイズ (px)
  issues?: QualityIssue[]; // Lintエラー
}

export interface MonacoWrapperHandle {
  scrollToLine: (line: number) => void;
  moveCursorTo: (line: number, column?: number) => void;
  clearDecorations: () => void;
  setValue: (value: string) => void;
  hasFocus: () => boolean;
  focus: () => void;
}

export const MonacoWrapper = forwardRef<MonacoWrapperHandle, MonacoWrapperProps>(
  function MonacoWrapper({ value, onChange, onVisibleLineChange, onSave, onZoom, onAiMention, targetLine, compareWith, activeBase, readOnly, fontSize = 14, issues = [] }, ref) {
    const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
    const monacoRef = useRef<typeof Monaco | null>(null);
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const decorationsRef = useRef<Monaco.editor.IEditorDecorationsCollection | null>(null);
    const isScrollingFromExternalRef = useRef(false);
    const isSettingValueRef = useRef(false);
    const lastValueRef = useRef(value);
    const isAutoNumberingRef = useRef(false);
    const completionProviderRef = useRef<Monaco.IDisposable | null>(null);

    // プロップをrefに保持（イベントハンドラ内で最新値を参照するため）
    const compareWithRef = useRef(compareWith);
    const activeBaseRef = useRef(activeBase);
    useEffect(() => { compareWithRef.current = compareWith; }, [compareWith]);
    useEffect(() => { activeBaseRef.current = activeBase; }, [activeBase]);

    const scrollToLine = useCallback((line: number) => {
      if (!editorRef.current) return;
      isScrollingFromExternalRef.current = true;
      editorRef.current.revealLineInCenter(line);
      setTimeout(() => { isScrollingFromExternalRef.current = false; }, 100);
    }, []);

    const moveCursorTo = useCallback((line: number, column: number = 1) => {
      if (!editorRef.current) return;
      editorRef.current.setPosition({ lineNumber: line, column });
      editorRef.current.revealLineInCenter(line);
      editorRef.current.focus();
    }, []);

    const clearDecorations = useCallback(() => {
      if (decorationsRef.current) {
        decorationsRef.current.clear();
      }
    }, []);

    const setEditorValue = useCallback((newValue: string) => {
      if (!editorRef.current) return;
      isSettingValueRef.current = true;
      const position = editorRef.current.getPosition();
      const scrollTop = editorRef.current.getScrollTop();
      editorRef.current.setValue(newValue);
      lastValueRef.current = newValue;
      if (position) editorRef.current.setPosition(position);
      editorRef.current.setScrollTop(scrollTop);
      setTimeout(() => { isSettingValueRef.current = false; }, 50);
    }, []);

    const hasFocus = useCallback(() => {
      return editorRef.current?.hasTextFocus() ?? false;
    }, []);

    const focus = useCallback(() => {
      editorRef.current?.focus();
    }, []);

    useImperativeHandle(ref, () => ({ scrollToLine, moveCursorTo, clearDecorations, setValue: setEditorValue, hasFocus, focus }));

    useEffect(() => {
      const editor = editorRef.current;
      if (!editor) return;

      // Handle synchronization with external value prop
      const newValue = value;
      const currentVal = editor.getValue();

      // 1. If already in sync with the actual editor content, just update refs
      if (newValue === currentVal) {
        lastValueRef.current = newValue;
        return;
      }

      // 2. If the change matches what we last sent out, it's an echo. Skip it.
      if (newValue === lastValueRef.current) {
        return;
      }

      // 3. If the user is currently interacting (has focus), avoid forcing the value
      // to prevent breaking IME composition, cursor jumps, or flicker.
      // We prioritize the editor's internal state during user interaction.
      if (editor.hasTextFocus()) {
        // Note: We might want to handle "hard" external updates here in the future
        // but for now, the editor state is the source of truth when focused.
        return;
      }

      // 4. Force synchronization for external changes
      setEditorValue(newValue);
    }, [value, setEditorValue]);

    useEffect(() => {
      if (targetLine !== undefined && editorRef.current) {
        if (editorRef.current.hasTextFocus()) return;
        scrollToLine(targetLine);
      }
    }, [targetLine, scrollToLine]);

    useEffect(() => {
      if (editorRef.current) {
        editorRef.current.updateOptions({ fontSize });
      }
    }, [fontSize]);

    // 差分ハイライトを計算・適用する関数
    const updateDiffDecorations = useCallback(() => {
      if (!editorRef.current || !monacoRef.current) return;

      const editor = editorRef.current;
      const monaco = monacoRef.current;
      const currentCompareWith = compareWithRef.current;
      const currentActiveBase = activeBaseRef.current;

      if (currentCompareWith === undefined && currentActiveBase === undefined) {
        if (decorationsRef.current) decorationsRef.current.clear();
        return;
      }

      const currentValue = editor.getValue();
      const model = editor.getModel();
      if (!model) return;

      const newDecorations: Monaco.editor.IModelDeltaDecoration[] = [];
      const addedLineRanges: Set<number> = new Set();

      // 1. 保存済み差分 (compareWith vs currentValue) - 青色
      if (currentCompareWith !== undefined) {
        const baseDiffs = computeDiff(currentCompareWith, currentValue);
        const baseAddedLines: Set<number> = new Set();
        for (const diff of baseDiffs) {
          if (diff.type === 'added') {
            for (let l = diff.lineStart; l <= diff.lineEnd; l++) baseAddedLines.add(l);
          }
        }
        baseAddedLines.forEach(l => addedLineRanges.add(l));

        for (const diff of baseDiffs) {
          if (diff.type === 'added') {
            newDecorations.push({
              range: new monaco.Range(diff.lineStart, 1, diff.lineEnd, 1),
              options: { isWholeLine: true, className: 'diff-added-line', linesDecorationsClassName: 'diff-added-line-margin' },
            });
          } else if (diff.type === 'removed') {
            const safeLine = Math.min(diff.lineStart, model.getLineCount());
            if (safeLine >= 1 && !baseAddedLines.has(safeLine)) {
              newDecorations.push({
                range: new monaco.Range(safeLine, 1, safeLine, 1),
                options: { isWholeLine: true, className: 'diff-removed-line', linesDecorationsClassName: 'diff-removed-line-margin', glyphMarginClassName: 'diff-removed-glyph' },
              });
            }
          }
        }
      }

      // 2. 未保存差分 (activeBase vs currentValue) - 緑色/黄色
      if (currentActiveBase !== undefined) {
        const activeDiffs = computeDiff(currentActiveBase, currentValue);
        const activeAddedLines: Set<number> = new Set();
        for (const diff of activeDiffs) {
          if (diff.type === 'added') {
            for (let l = diff.lineStart; l <= diff.lineEnd; l++) activeAddedLines.add(l);
          }
        }

        for (const diff of activeDiffs) {
          if (diff.type === 'added') {
            newDecorations.push({
              range: new monaco.Range(diff.lineStart, 1, diff.lineEnd, 1),
              options: { isWholeLine: true, className: 'diff-active-line', linesDecorationsClassName: 'diff-active-line-margin' },
            });
          } else if (diff.type === 'removed') {
            const safeLine = Math.min(diff.lineStart, model.getLineCount());
            if (safeLine >= 1 && !activeAddedLines.has(safeLine) && !addedLineRanges.has(safeLine)) {
              newDecorations.push({
                range: new monaco.Range(safeLine, 1, safeLine, 1),
                options: { isWholeLine: true, className: 'diff-active-removed-line', linesDecorationsClassName: 'diff-active-removed-line-margin', glyphMarginClassName: 'diff-removed-glyph' },
              });
            }
          }
        }
      }

      if (decorationsRef.current) decorationsRef.current.clear();
      decorationsRef.current = editor.createDecorationsCollection(newDecorations);
    }, []);

    useEffect(() => {
      updateDiffDecorations();
    }, [compareWith, activeBase, updateDiffDecorations]);

    const onSaveRef = useRef(onSave);
    useEffect(() => { onSaveRef.current = onSave; }, [onSave]);

    // AI Mention Handler Ref
    const onAiMentionRef = useRef(onAiMention);
    useEffect(() => { onAiMentionRef.current = onAiMention; }, [onAiMention]);

    const handleEditorMount: OnMount = useCallback((editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;
      lastValueRef.current = value;

      editor.addAction({
        id: 'save-document',
        label: 'Save Document',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
        run: () => { if (onSaveRef.current) onSaveRef.current(); },
      });

      // AIメンション用コマンドの登録
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, () => {
        if (onAiMentionRef.current) onAiMentionRef.current();
      });

      // Completion Provider for @ Mentions
      if (!completionProviderRef.current) {
        completionProviderRef.current = monaco.languages.registerCompletionItemProvider('markdown', {
          triggerCharacters: ['@'],
          provideCompletionItems: (model: Monaco.editor.ITextModel, position: Monaco.Position) => {
            const wordUntil = model.getWordUntilPosition(position);
            const range = {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: wordUntil.startColumn - 1, // Include @
              endColumn: wordUntil.endColumn,
            };

            const textUntilPosition = model.getValueInRange({
              startLineNumber: position.lineNumber,
              startColumn: 1,
              endLineNumber: position.lineNumber,
              endColumn: position.column
            });

            // 簡易チェック: @の直後のみ発火
            if (!textUntilPosition.endsWith('@')) {
              // すでに入力がある場合はフィルタリングされるので返す
            }

            const suggestions: Monaco.languages.CompletionItem[] = [
              {
                label: 'AI Assistant',
                kind: monaco.languages.CompletionItemKind.Bot,
                documentation: 'AIに新しいブランチでの作業を指示します',
                insertText: '@AI ',
                range: range,
                command: {
                  id: 'trigger-ai-mention',
                  title: 'Trigger AI',
                  arguments: []
                }
              },
              {
                label: 'Me (Myself)',
                kind: monaco.languages.CompletionItemKind.User,
                insertText: '@Me ',
                range: range,
              },
              // Mock Members
              {
                label: 'Project Manager',
                kind: monaco.languages.CompletionItemKind.User,
                insertText: '@PM ',
                range: range,
              }
            ];

            return { suggestions };
          }
        });

        // Trigger AI Command registration (global but tied to instance via closure is tricky, better use Editor.addCommand but command ID in Completion must match)
        // Global command needed for Completion Item 'command' property?
        // Monaco's completion `command` executes an Editor Action or global command.
        // We'll define a unique ID for this instance if possible, or use a general one.
        // Actually, editor.addCommand adds internal command. Global command is `editor.getAction()`.

        // Simpler approach: Register a custom action with a specific ID, then reference it.
        // BUT multiple editors might exist.
        // Let's rely on `addCommand` but we need to know the ID.
        // `editor.addCommand` returns id? No.

        // Let's try registering a global action only once if possible, OR
        // Use `editor.trigger` in onChange? No.

        // Let's stick to a simpler "Detect @AI" change for now to be safe against instance issues.
        // Or actually, just inserting "@AI " is enough signal?
      }

      // Hack for command trigger from completion
      // Since completion `command` needs a global string ID, and we are localized...
      // We will listen to ModelContent changes. If inserted text is "@AI ", we trigger.
      // (This logic is added in onDidChangeModelContent below)

      let scrollTimeout: NodeJS.Timeout | null = null;
      editor.onDidScrollChange(() => {
        if (isScrollingFromExternalRef.current) return;
        if (scrollTimeout) clearTimeout(scrollTimeout);

        scrollTimeout = setTimeout(() => {
          if (onVisibleLineChange) {
            const visibleRanges = editor.getVisibleRanges();
            if (visibleRanges.length > 0) {
              onVisibleLineChange(visibleRanges[0].startLineNumber);
            }
          }
        }, 50); // Small debounce to prevent jitter
      });

      let cursorTimeout: NodeJS.Timeout | null = null;
      editor.onDidChangeCursorPosition((e) => {
        if (onVisibleLineChange && !isScrollingFromExternalRef.current) {
          if (editor.hasTextFocus()) {
            if (cursorTimeout) clearTimeout(cursorTimeout);
            cursorTimeout = setTimeout(() => {
              onVisibleLineChange(e.position.lineNumber);
            }, 100); // 100ms debounce for highlight sync
          }
        }
      });

      editor.onDidChangeModelContent((e) => {
        updateDiffDecorations();

        // AI Mention Detection
        // If the change inserted "@AI ", trigger the callback
        if (e.changes.length === 1 && e.changes[0].text === '@AI ') {
          if (onAiMentionRef.current) onAiMentionRef.current();
        }

        if (isAutoNumberingRef.current) return;
        if (e.changes.length === 1 && e.changes[0].text === ' ') {
          const position = editor.getPosition();
          if (!position) return;
          const model = editor.getModel();
          if (!model) return;
          const lineContent = model.getLineContent(position.lineNumber);
          if (!lineContent.trim().startsWith('#')) return;
          const lines = model.getLinesContent();
          const newText = getAutoNumbering(lines, position.lineNumber - 1);
          if (newText) {
            isAutoNumberingRef.current = true;
            editor.executeEdits('auto-numbering', [{
              range: new monaco.Range(position.lineNumber, 1, position.lineNumber, lineContent.length + 1),
              text: newText,
              forceMoveMarkers: true
            }]);
            isAutoNumberingRef.current = false;
          }
        }
      });

      updateDiffDecorations();
    }, [onVisibleLineChange, value, updateDiffDecorations]);

    // Issues (Lint結果) をマーカーとして反映
    useEffect(() => {
      if (!editorRef.current || !monacoRef.current) return;

      const editor = editorRef.current;
      const monaco = monacoRef.current;
      const model = editor.getModel();

      if (!model) return;

      const markers: Monaco.editor.IMarkerData[] = issues.map(issue => {
        const line = issue.line || 1;
        const lineMaxCol = model.getLineMaxColumn(line);

        return {
          startLineNumber: line,
          startColumn: 1,
          endLineNumber: line,
          endColumn: lineMaxCol,
          message: issue.message,
          severity: issue.level === 'error' ? monaco.MarkerSeverity.Error :
            issue.level === 'warning' ? monaco.MarkerSeverity.Warning :
              monaco.MarkerSeverity.Info,
          source: issue.source
        };
      });

      monaco.editor.setModelMarkers(model, 'quality-check', markers);

    }, [issues]);

    const handleChange: OnChange = useCallback((val) => {
      if (isSettingValueRef.current) return;
      if (readOnly) return;
      lastValueRef.current = val ?? '';
      onChange(val ?? '');
    }, [onChange, readOnly]);

    useEffect(() => {
      const wrapper = wrapperRef.current;
      if (!wrapper || !onZoom) return;

      const handleWheel = (e: WheelEvent) => {
        if (e.ctrlKey) {
          e.preventDefault();
          e.stopPropagation();
          const delta = e.deltaY > 0 ? -1 : 1;
          onZoom(delta);
        }
      };

      wrapper.addEventListener('wheel', handleWheel, { capture: true, passive: false });
      return () => wrapper.removeEventListener('wheel', handleWheel, { capture: true });
    }, [onZoom]);

    // Cleanup completion provider
    useEffect(() => {
      return () => {
        if (completionProviderRef.current) {
          completionProviderRef.current.dispose();
        }
      };
    }, []);

    return (
      <div ref={wrapperRef} className="h-full w-full">
        <Editor
          height="100%"
          defaultLanguage="markdown"
          theme="vs-light"
          defaultValue={value}
          onChange={handleChange}
          onMount={handleEditorMount}
          options={{
            minimap: { enabled: false },
            fontSize: fontSize,
            fontFamily: 'Consolas, Monaco, monospace',
            lineNumbers: 'on',
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            glyphMargin: false,
            padding: { top: 16, bottom: 16 },
            lineDecorationsWidth: 0,
            overviewRulerLanes: 0,
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
            scrollbar: {
              vertical: 'visible',
              horizontal: 'auto',
              verticalScrollbarSize: 12,
              verticalHasArrows: false,
              useShadows: false,
            },
            readOnly: readOnly ?? false,
            mouseWheelZoom: false,
          }}
        />
      </div>
    );
  }
);
