'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Eye, EyeOff, Save, Bot, FileText } from 'lucide-react';
import { MonacoWrapper, MonacoWrapperHandle } from '@/components/_features/editor/MonacoWrapper';
import { PreviewPane, PreviewPaneHandle } from '@/components/_features/preview/PreviewPane';
import { LineagePanel } from '@/components/_features/lineage/LineagePanel';
import { AIChatPane } from '@/components/_features/ai/AIChatPane';
import { useLineage } from '@/hooks/useLineage';
import { LineageEvent } from '@/lib/types';

const INITIAL_CONTENT = `# LineageDoc へようこそ

これは **LineageDoc** のデモページです。

## 機能

- 📝 Monaco Editor によるMarkdown編集
- 👀 リアルタイムプレビュー
- 🔄 スクロール同期（双方向）
- 📜 変更履歴の追跡
- 🔍 差分ハイライト表示
- 💾 手動保存（Ctrl + S）

## 使い方

1. 左の履歴パネルで変更履歴を確認
2. 中央のエディタでMarkdownを編集
3. **Ctrl + S** で履歴を保存
4. 右のプレビューで結果を確認

---

> 編集して保存を試してみてください！
`;

type RightPaneMode = 'preview' | 'ai';

export default function Home() {
  const [content, setContent] = useState(INITIAL_CONTENT);
  const [displayContent, setDisplayContent] = useState(INITIAL_CONTENT);
  const [editorTargetLine, setEditorTargetLine] = useState<number | undefined>(undefined);
  const [previewTargetLine, setPreviewTargetLine] = useState<number | undefined>(undefined);
  const [showDiff, setShowDiff] = useState(true);
  const [isSaved, setIsSaved] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>(undefined);
  const [rightPaneMode, setRightPaneMode] = useState<RightPaneMode>('preview');

  const editorRef = useRef<MonacoWrapperHandle>(null);
  const previewRef = useRef<PreviewPaneHandle>(null);
  const lastSavedContentRef = useRef(INITIAL_CONTENT);

  const { events, isLoaded, addEvent, resetWithContent, getPreviousEvent, getEventById } = useLineage();

  const latestEventId = events.length > 0 ? events[events.length - 1].id : undefined;
  const latestEvent = events.length > 0 ? events[events.length - 1] : undefined;
  const selectedEvent = selectedEventId ? getEventById(selectedEventId) : undefined;
  const isViewingLatest = selectedEventId === undefined || selectedEventId === latestEventId;

  const currentVersion = isViewingLatest
    ? (latestEvent?.version ?? 0)
    : (selectedEvent?.version ?? 0);

  useEffect(() => {
    if (isLoaded && events.length === 0) {
      addEvent('user_edit', INITIAL_CONTENT, '文書の作成');
      lastSavedContentRef.current = INITIAL_CONTENT;
    }
  }, [isLoaded, events.length, addEvent]);

  useEffect(() => {
    if (latestEventId && selectedEventId === undefined) {
      setSelectedEventId(latestEventId);
    }
  }, [latestEventId, selectedEventId]);

  const handleSave = useCallback(() => {
    if (content !== lastSavedContentRef.current) {
      const changes = Math.abs(content.length - lastSavedContentRef.current.length);
      const summary = `${changes}文字の変更を保存`;
      const newEvent = addEvent('user_edit', content, summary);
      lastSavedContentRef.current = content;
      setIsSaved(true);
      setSelectedEventId(newEvent.id);
      setDisplayContent(content);
    }
  }, [content, addEvent]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  const handleContentChange = useCallback((newContent: string) => {
    if (!isViewingLatest) return;
    setContent(newContent);
    setDisplayContent(newContent);
    setIsSaved(newContent === lastSavedContentRef.current);
  }, [isViewingLatest]);

  const handleEditorVisibleLineChange = useCallback((line: number) => {
    setPreviewTargetLine(line);
  }, []);

  const handlePreviewVisibleLineChange = useCallback((_line: number) => { }, []);

  const toggleDiffView = useCallback(() => {
    setShowDiff((prev) => !prev);
  }, []);

  const handleSelectEvent = useCallback((event: LineageEvent) => {
    setSelectedEventId(event.id);
    if (event.id === latestEventId) {
      setDisplayContent(content);
    } else {
      setDisplayContent(event.content);
    }
  }, [latestEventId, content]);

  const handleMakeLatest = useCallback((event: LineageEvent) => {
    const newEvent = addEvent('user_edit', event.content, `v${event.version ?? '?'}を復元`);
    setContent(event.content);
    setDisplayContent(event.content);
    lastSavedContentRef.current = event.content;
    setIsSaved(true);
    setSelectedEventId(newEvent.id);
  }, [addEvent]);

  const handleClearHistory = useCallback(() => {
    if (confirm('履歴を全て削除し、現在の内容をv1として保存し直しますか？\n（現在のエディタの内容は維持されます）')) {
      // 現在のエディタの内容でv1を再作成する (version: 1 になる)
      const newEvent = resetWithContent(content, '履歴のリセット');
      lastSavedContentRef.current = content;
      lastSavedContentRef.current = content;
      setIsSaved(true);
      setSelectedEventId(newEvent.id);
    }
  }, [resetWithContent, content]);

  // キーボードナビゲーション（↑↓キーで履歴切り替え）
  useEffect(() => {
    const handleNavigation = (e: KeyboardEvent) => {
      // エディタにフォーカスがある場合は何もしない
      if (editorRef.current?.hasFocus()) return;

      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        const sortedEvents = [...events].reverse(); // 新しい順 (LineagePanelと同じ並び)
        if (sortedEvents.length === 0) return;

        e.preventDefault();

        // 最新を表示中の場合
        const currentId = isViewingLatest && latestEventId ? latestEventId : selectedEventId;
        const currentIndex = sortedEvents.findIndex(ev => ev.id === currentId);

        if (currentIndex === -1) return;

        let nextIndex = currentIndex;
        if (e.key === 'ArrowUp') {
          // 上へ（新しい履歴へ）
          nextIndex = Math.max(0, currentIndex - 1);
        } else if (e.key === 'ArrowDown') {
          // 下へ（古い履歴へ）
          nextIndex = Math.min(sortedEvents.length - 1, currentIndex + 1);
        }

        if (nextIndex !== currentIndex) {
          const nextEvent = sortedEvents[nextIndex];
          handleSelectEvent(nextEvent);
        }
      }
    };

    window.addEventListener('keydown', handleNavigation);
    return () => window.removeEventListener('keydown', handleNavigation);
  }, [events, selectedEventId, latestEventId, isViewingLatest, handleSelectEvent]);

  const compareWith = (() => {
    if (!showDiff) return undefined;
    if (isViewingLatest && latestEventId) {
      return getPreviousEvent(latestEventId)?.content;
    } else if (selectedEventId) {
      return getPreviousEvent(selectedEventId)?.content;
    }
    return undefined;
  })();

  const activeBase = isViewingLatest && showDiff ? latestEvent?.content : undefined;

  return (
    <main className="h-screen flex flex-col bg-slate-100">
      <header className="h-12 bg-slate-900 text-white flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center">
          <h1 className="text-base font-semibold">LineageDoc</h1>
          {currentVersion > 0 && (
            <span className="ml-2 text-slate-400 text-sm font-mono">v{currentVersion}</span>
          )}
          {!isSaved && isViewingLatest && (
            <span className="ml-2 text-amber-400 text-xs font-medium animate-pulse">● 未保存</span>
          )}
          {!isViewingLatest && (
            <span className="ml-2 text-blue-400 text-xs font-medium">📜 過去履歴を表示中</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={!isViewingLatest || isSaved}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-sm transition-all ${!isViewingLatest || isSaved ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white'}`}
          >
            <Save size={16} />
            <span>保存</span>
          </button>
          <button
            onClick={toggleDiffView}
            disabled={events.length === 0}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-sm transition-all ${showDiff ? 'bg-blue-600 hover:bg-blue-500' : 'bg-slate-700 hover:bg-slate-600'}`}
          >
            {showDiff ? <EyeOff size={16} /> : <Eye size={16} />}
            <span>差分</span>
          </button>
          <div className="flex items-center bg-slate-800 rounded overflow-hidden">
            <button onClick={() => setRightPaneMode('preview')} className={`flex items-center gap-1 px-2.5 py-1 text-sm transition-colors ${rightPaneMode === 'preview' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              <FileText size={14} />
              <span>Preview</span>
            </button>
            <button onClick={() => setRightPaneMode('ai')} className={`flex items-center gap-1 px-2.5 py-1 text-sm transition-colors ${rightPaneMode === 'ai' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              <Bot size={14} />
              <span>AI</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <LineagePanel
          events={events}
          selectedEventId={selectedEventId}
          onSelectEvent={handleSelectEvent}
          onClearHistory={handleClearHistory}
          onMakeLatest={handleMakeLatest}
        />
        <div className="flex-1 border-r border-slate-300 relative min-w-0">
          {showDiff && compareWith && (
            <div className="absolute top-2 left-2 z-10 flex gap-2">
              <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded shadow">
                {`v${currentVersion - 1}との差分(保存済み)`}
              </div>
              {isViewingLatest && !isSaved && (
                <div className="bg-green-600 text-white text-xs px-2 py-1 rounded shadow">
                  未保存の変更
                </div>
              )}
            </div>
          )}
          {!isViewingLatest && (
            <div className="absolute top-2 right-2 z-10 bg-amber-500 text-white text-xs px-2 py-1 rounded shadow">
              読み取り専用
            </div>
          )}
          <MonacoWrapper
            ref={editorRef}
            value={displayContent}
            onChange={handleContentChange}
            onVisibleLineChange={handleEditorVisibleLineChange}
            onSave={handleSave}
            targetLine={editorTargetLine}
            compareWith={compareWith}
            activeBase={activeBase}
            readOnly={!isViewingLatest}
          />
        </div>
        <div className="flex-1 bg-slate-200 overflow-hidden min-w-0">
          {rightPaneMode === 'preview' ? (
            <PreviewPane ref={previewRef} content={displayContent} targetLine={previewTargetLine} onVisibleLineChange={handlePreviewVisibleLineChange} />
          ) : (
            <AIChatPane />
          )}
        </div>
      </div>
    </main>
  );
}
