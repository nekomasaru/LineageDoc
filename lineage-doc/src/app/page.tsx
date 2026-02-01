'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Eye, EyeOff, Save, Bot, FileText, Download, HelpCircle, X, Trash2 } from 'lucide-react';
import { MonacoWrapper, MonacoWrapperHandle } from '@/components/_features/editor/MonacoWrapper';
import { PreviewPane, PreviewPaneHandle } from '@/components/_features/preview/PreviewPane';
import { LineagePanel } from '@/components/_features/lineage/LineagePanel';
import { AIChatPane } from '@/components/_features/ai/AIChatPane';
import { GuideModal } from '@/components/_features/guide/GuideModal';
import { WelcomeScreen } from '@/components/_features/welcome/WelcomeScreen';
import { AlertDialog } from '@/components/_shared/AlertDialog';
import { useLineage } from '@/hooks/useLineage';
import { LineageEvent } from '@/lib/types';

type RightPaneMode = 'preview' | 'ai';

export default function Home() {
  const [content, setContent] = useState('# Title ');
  const [displayContent, setDisplayContent] = useState('');
  const [editorTargetLine, setEditorTargetLine] = useState<number | undefined>(undefined);
  const [previewTargetLine, setPreviewTargetLine] = useState<number | undefined>(undefined);
  const [showDiff, setShowDiff] = useState(true);
  const [isSaved, setIsSaved] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>(undefined);
  const [rightPaneMode, setRightPaneMode] = useState<RightPaneMode>('preview');
  const [showGuide, setShowGuide] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);

  const editorRef = useRef<MonacoWrapperHandle>(null);
  const previewRef = useRef<PreviewPaneHandle>(null);
  const lastSavedContentRef = useRef('');

  const { events, isLoaded, addEvent, resetWithContent, clearEvents, getPreviousEvent, getEventById } = useLineage();

  const latestEventId = events.length > 0 ? events[events.length - 1].id : undefined;
  const latestEvent = events.length > 0 ? events[events.length - 1] : undefined;
  const selectedEvent = selectedEventId ? getEventById(selectedEventId) : undefined;
  const isViewingLatest = selectedEventId === undefined || selectedEventId === latestEventId;
  const hasHistory = events.length > 0;

  const currentVersion = isViewingLatest
    ? (latestEvent?.version ?? 0)
    : (selectedEvent?.version ?? 0);

  // 初期ロード時の状態同期
  useEffect(() => {
    if (isLoaded && events.length > 0) {
      const latest = events[events.length - 1];
      setContent(latest.content);
      lastSavedContentRef.current = latest.content;
      setDisplayContent(latest.content);
      setSelectedEventId(latest.id);
    }
  }, [isLoaded, events.length]); // events全体への依存は重いが、length監視で初期同期を行う。厳密には見直しが必要だが既存ロジックを踏襲

  useEffect(() => {
    if (latestEventId && selectedEventId === undefined) {
      setSelectedEventId(latestEventId);
    }
  }, [latestEventId, selectedEventId]);

  const handleCreateNew = useCallback(() => {
    const initialText = '# Title ';
    resetWithContent(initialText, '新規ドキュメント');
    setContent(initialText);
    setDisplayContent(initialText);
    lastSavedContentRef.current = initialText;
    setIsSaved(true);
  }, [resetWithContent]);

  const handleImportFile = useCallback((fileContent: string, filename: string) => {
    resetWithContent(fileContent, `${filename} をインポート`);
    setContent(fileContent);
    setDisplayContent(fileContent);
    lastSavedContentRef.current = fileContent;
    setIsSaved(true);
  }, [resetWithContent]);



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

  // エクスポート機能
  const handleExport = useCallback(() => {
    // 先頭行からファイル名を生成（禁止文字除去）
    const lines = displayContent.split('\n');
    const firstTextLine = lines.find(line => line.trim().length > 0) || '';

    // Markdown見出し記号(#)やOS禁止文字(\/:*?"<>|)を除去
    let safeName = firstTextLine
      .replace(/^#+\s*/, '')
      .replace(/[\\/:*?"<>|]/g, '')
      .trim();

    if (!safeName) safeName = 'lineage-doc';
    // 長すぎる場合は50文字でカット
    if (safeName.length > 50) safeName = safeName.substring(0, 50);

    const filename = `${safeName}.md`;
    const blob = new Blob([displayContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [displayContent]);

  // 実際にファイルを閉じる処理
  const executeCloseFile = useCallback(() => {
    clearEvents();
    setContent('');
    setDisplayContent('');
    lastSavedContentRef.current = '';
    setIsSaved(true);
    setSelectedEventId(undefined);
    setShowCloseDialog(false);
  }, [clearEvents]);

  // エクスポートして閉じる
  const handleExportAndClose = useCallback(() => {
    handleExport();
    executeCloseFile();
  }, [handleExport, executeCloseFile]);

  const handleCloseFile = useCallback(() => {
    setShowCloseDialog(true);
  }, []);

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
      const newEvent = resetWithContent(content, '履歴のリセット');
      lastSavedContentRef.current = content;
      setIsSaved(true);
      setSelectedEventId(newEvent.id);
    }
  }, [resetWithContent, content]);

  // キーボードナビゲーション
  useEffect(() => {
    const handleNavigation = (e: KeyboardEvent) => {
      if (editorRef.current?.hasFocus && typeof editorRef.current.hasFocus === 'function') {
        if (editorRef.current.hasFocus()) return;
      }

      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        const sortedEvents = [...events].reverse();
        if (sortedEvents.length === 0) return;

        e.preventDefault();

        const currentId = isViewingLatest && latestEventId ? latestEventId : selectedEventId;
        const currentIndex = sortedEvents.findIndex(ev => ev.id === currentId);

        if (currentIndex === -1) return;

        let nextIndex = currentIndex;
        if (e.key === 'ArrowUp') {
          nextIndex = Math.max(0, currentIndex - 1);
        } else if (e.key === 'ArrowDown') {
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
      const prev = getPreviousEvent(latestEventId);
      return prev?.content;
    } else if (selectedEventId) {
      const prev = getPreviousEvent(selectedEventId);
      return prev?.content;
    }
    return undefined;
  })();

  const activeBase = isViewingLatest && showDiff ? latestEvent?.content : undefined;

  const modeBtnClass = (isActive: boolean) =>
    `p-1.5 rounded transition-colors ${isActive ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:bg-slate-200'
    }`;

  // コンテンツが無い（履歴が無い）場合はWelcome画面を表示
  if (isLoaded && !hasHistory) {
    return (
      <div className="h-screen w-full flex flex-col bg-slate-50 overflow-hidden">
        {/* Welcome Header (Simple) */}
        <header className="h-12 bg-white border-b border-slate-200 flex items-center px-4 justify-between shrink-0 z-20 shadow-sm relative">
          <div className="flex items-center gap-2 text-slate-700 font-semibold select-none">
            <FileText size={18} className="text-blue-600" />
            <span>LineageDoc</span>
          </div>
          <button
            onClick={() => setShowGuide(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded transition-colors text-xs font-medium"
          >
            <HelpCircle size={16} />
            <span className="hidden sm:inline">ヘルプ</span>
          </button>
        </header>

        <WelcomeScreen
          onCreateNew={handleCreateNew}
          onImportFile={handleImportFile}
        />
        <GuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />
      </div>
    );
  }

  // 以下は既存のエディタ画面 (hasHistory === true)
  return (
    <div className="h-screen w-full flex flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <header className="h-12 bg-white border-b border-slate-200 flex items-center px-4 justify-between shrink-0 z-20 shadow-sm relative">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-slate-700 font-semibold select-none">
            <FileText size={18} className="text-blue-600" />
            <span>LineageDoc</span>
          </div>
          <div className="h-4 w-px bg-slate-300 mx-1" />
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium border border-slate-200">
              v{currentVersion}
            </span>
            <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border transition-colors ${isSaved
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isSaved ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
              {isSaved ? '保存済み' : '未保存'}
            </span>

            {/* Diff Labels */}
            {showDiff && compareWith !== undefined && (
              <div className="flex gap-2 ml-2">
                <div className="bg-blue-600/10 text-blue-700 text-xs px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  {`v${currentVersion > 1 ? currentVersion - 1 : '0'}との差分`}
                </div>
                {isViewingLatest && !isSaved && (
                  <div className="bg-green-600/10 text-green-700 text-xs px-2 py-0.5 rounded border border-green-200 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    未保存の変更
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Close File Button */}
          <button
            onClick={handleCloseFile}
            className="flex items-center gap-1.5 px-2 py-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded transition-colors text-xs font-medium mr-2"
            title="ファイルを閉じる（Welcome画面へ）"
          >
            <X size={16} />
          </button>

          {/* Export Button */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded transition-colors text-xs font-medium"
            title="Markdownとしてエクスポート"
          >
            <Download size={16} />
            <span className="hidden sm:inline">エクスポート</span>
          </button>

          <div className="h-4 w-px bg-slate-300 mx-1" />

          {/* Help Button */}
          <button
            onClick={() => setShowGuide(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded transition-colors text-xs font-medium"
            title="使い方を見る"
          >
            <HelpCircle size={16} />
            <span className="hidden sm:inline">ヘルプ</span>
          </button>

          <div className="h-4 w-px bg-slate-300 mx-1" />

          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => {
                setShowDiff(true);
                setRightPaneMode('preview');
              }}
              className={modeBtnClass(rightPaneMode === 'preview' && showDiff)}
              title="差分 + プレビュー"
            >
              <Eye size={16} />
            </button>
            <button
              onClick={() => {
                setShowDiff(false);
                setRightPaneMode('preview');
              }}
              className={modeBtnClass(rightPaneMode === 'preview' && !showDiff)}
              title="プレビューのみ"
            >
              <EyeOff size={16} />
            </button>
            <button
              onClick={() => setRightPaneMode('ai')}
              className={modeBtnClass(rightPaneMode === 'ai')}
              title="AIアシスタント"
            >
              <Bot size={16} />
            </button>
          </div>

          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all shadow-sm text-xs font-medium ${isSaved
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow shadow-blue-200'
              }`}
            disabled={isSaved}
            title="Ctrl+S で保存"
          >
            <Save size={14} />
            保存
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: History */}
        <div className="w-72 border-r border-slate-200 bg-white shrink-0 z-10 flex flex-col">
          <LineagePanel
            events={events}
            selectedEventId={selectedEventId}
            onSelectEvent={handleSelectEvent}
            onClearHistory={handleClearHistory}
            onMakeLatest={handleMakeLatest}
          />
        </div>

        {/* Center: Editor */}
        <div className="flex-1 border-r border-slate-300 relative min-w-0 bg-white">
          <MonacoWrapper
            ref={editorRef}
            value={displayContent}
            onChange={handleContentChange}
            onVisibleLineChange={handleEditorVisibleLineChange}
            onSave={handleSave}
            targetLine={editorTargetLine}
            readOnly={!isViewingLatest}
            compareWith={compareWith}
            activeBase={activeBase}
          />
        </div>

        {/* Right: Preview or AI */}
        <div className="flex-1 min-w-0 bg-white">
          {rightPaneMode === 'preview' ? (
            <PreviewPane
              ref={previewRef}
              content={displayContent}
              onVisibleLineChange={handlePreviewVisibleLineChange}
              targetLine={previewTargetLine}
            />
          ) : (
            <AIChatPane
              currentContent={content}
              onApplyContent={handleContentChange}
            />
          )}
        </div>
      </div>

      <AlertDialog
        isOpen={showCloseDialog}
        onClose={() => setShowCloseDialog(false)}
        title="ファイルを閉じますか？"
        description={
          <div className="space-y-2">
            <p>現在の編集内容は破棄され、復元できなくなります。</p>
            <p className="text-sm text-slate-500">※Markdownファイルとしてエクスポート（保存）してから閉じることを推奨します。</p>
          </div>
        }
        actions={[
          {
            label: 'エクスポートして終了',
            onClick: handleExportAndClose,
            variant: 'primary',
            icon: <Download size={16} />
          },
          {
            label: '保存せずに終了',
            onClick: executeCloseFile,
            variant: 'danger',
            icon: <Trash2 size={16} />
          },
          {
            label: 'キャンセル',
            onClick: () => setShowCloseDialog(false),
            variant: 'outline'
          }
        ]}
      />
      <GuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />
    </div>
  );
}
