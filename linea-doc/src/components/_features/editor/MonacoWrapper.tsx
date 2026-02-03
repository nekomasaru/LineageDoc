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
  function MonacoWrapper({ value, onChange, onVisibleLineChange, onSave, onZoom, targetLine, compareWith, activeBase, readOnly, fontSize = 14, issues = [] }, ref) {
    const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
    const monacoRef = useRef<typeof Monaco | null>(null);
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const decorationsRef = useRef<Monaco.editor.IEditorDecorationsCollection | null>(null);
    const isScrollingFromExternalRef = useRef(false);
    const isSettingValueRef = useRef(false);
    const lastValueRef = useRef(value);
    const isAutoNumberingRef = useRef(false);

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
      if (!editorRef.current) return;
      // フォーカスチェックを削除: 値が変わった場合はフォーカスの有無に関わらず更新する
      // ループ防止は lastValueRef との比較で行う
      if (value !== lastValueRef.current) setEditorValue(value);
    }, [value, setEditorValue]);

    useEffect(() => {
      if (targetLine !== undefined && editorRef.current) {
        if (editorRef.current.hasTextFocus()) return;
        scrollToLine(targetLine);
      }
    }, [targetLine, scrollToLine]);

    // fontSize プロップが変更された時にエディタのオプションを更新
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

      // 両方とも undefined の場合のみクリア
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
    }, []); // 依存なし - refを使用するため

    // プロップ変更時に差分を更新
    useEffect(() => {
      updateDiffDecorations();
    }, [compareWith, activeBase, updateDiffDecorations]);

    const onSaveRef = useRef(onSave);
    useEffect(() => { onSaveRef.current = onSave; }, [onSave]);

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

      editor.onDidScrollChange(() => {
        if (isScrollingFromExternalRef.current) return;
        if (onVisibleLineChange) {
          const visibleRanges = editor.getVisibleRanges();
          if (visibleRanges.length > 0) {
            onVisibleLineChange(visibleRanges[0].startLineNumber);
          }
        }
      });

      // テキスト変更時に差分を再計算 & 自動採番
      editor.onDidChangeModelContent((e) => {
        updateDiffDecorations();

        // 自動採番 (# + Space)
        if (isAutoNumberingRef.current) return;

        // スペース入力のみ検知
        if (e.changes.length === 1 && e.changes[0].text === ' ') {
          const position = editor.getPosition();
          if (!position) return;

          const model = editor.getModel();
          if (!model) return;

          const lineContent = model.getLineContent(position.lineNumber);
          // "# " や "## " などの形式か簡易チェック
          if (!lineContent.trim().startsWith('#')) return;

          const lines = model.getLinesContent();
          const newText = getAutoNumbering(lines, position.lineNumber - 1);

          if (newText) {
            isAutoNumberingRef.current = true;
            // 行全体を置換
            editor.executeEdits('auto-numbering', [{
              range: new monaco.Range(position.lineNumber, 1, position.lineNumber, lineContent.length + 1),
              text: newText,
              forceMoveMarkers: true
            }]);
            isAutoNumberingRef.current = false;
          }
        }
      });

      // 初回の差分表示
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

    // Ctrl+Wheel zoom handler - use native listener with capture to intercept before Monaco
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
            glyphMargin: true,
            padding: { top: 16, bottom: 16 },
            lineDecorationsWidth: 10,
            readOnly: readOnly ?? false,
            mouseWheelZoom: false, // 独自のCtrl+Wheelハンドラを使うため無効化
          }}
        />
      </div>
    );
  }
);
