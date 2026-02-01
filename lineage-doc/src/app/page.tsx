'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Eye, EyeOff, Save, Bot, FileText, Download, HelpCircle, X, Trash2, GitBranch } from 'lucide-react';
import { MonacoWrapper, MonacoWrapperHandle } from '@/components/_features/editor/MonacoWrapper';
import { PreviewPane, PreviewPaneHandle } from '@/components/_features/preview/PreviewPane';
import { LineaPanel } from '@/components/_features/lineage/LineaPanel';
import { AIChatPane } from '@/components/_features/ai/AIChatPane';
import { GuideModal } from '@/components/_features/guide/GuideModal';
import { WelcomeScreen } from '@/components/_features/welcome/WelcomeScreen';
import { AlertDialog } from '@/components/_shared/AlertDialog';
import { BranchCommentModal } from '@/components/_shared/BranchCommentModal';
import { InputModal } from '@/components/_shared/InputModal';
import { ConfirmModal } from '@/components/_shared/ConfirmModal';
import { Logo } from '@/components/_shared/Logo';
import { useLinea } from '@/hooks/useLinea';
import { LineaEvent } from '@/lib/types';

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
  const [isBranching, setIsBranching] = useState(false);

  // Resizable Layout State
  const [sidebarWidth, setSidebarWidth] = useState(384); // px (w-96 = 384px)
  const [editorWidthPercent, setEditorWidthPercent] = useState(50); // %
  const [fontSize, setFontSize] = useState(14); // px (editor font size)
  const [treeScale, setTreeScale] = useState(1); // scale for tree panel
  const [isResizing, setIsResizing] = useState<'sidebar' | 'editor' | null>(null);

  // Branch Comment Modal State
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [pendingBranchAction, setPendingBranchAction] = useState<{ type: 'branch' | 'restore'; event: LineaEvent } | null>(null);
  const [branchModalTitle, setBranchModalTitle] = useState('');
  const [editCommentEvent, setEditCommentEvent] = useState<LineaEvent | null>(null); // コメント編集対象
  const [showEditCommentModal, setShowEditCommentModal] = useState(false); // コメント編集モーダル
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false); // 履歴リセット確認モーダル

  const editorRef = useRef<MonacoWrapperHandle>(null);
  const previewRef = useRef<PreviewPaneHandle>(null);
  const lastSavedContentRef = useRef('');
  const branchCommentRef = useRef<string>(''); // 分岐モードで使うコメント
  const branchSourceIdRef = useRef<string | null>(null); // 分岐元のイベントID

  const { events, isLoaded, addEvent, resetWithContent, clearEvents, getPreviousEvent, getEventById, updateEventSummary } = useLinea();
  const latestEventId = events.length > 0 ? events[events.length - 1].id : undefined;
  const latestEvent = events.length > 0 ? events[events.length - 1] : undefined;
  const selectedEvent = selectedEventId ? getEventById(selectedEventId) : undefined;
  const isViewingLatest = selectedEventId === undefined || selectedEventId === latestEventId;
  const hasHistory = events.length > 0;

  const currentVersion = isViewingLatest
    ? (latestEvent?.version ?? 0)
    : (selectedEvent?.version ?? 0);

  // 親ノードのバージョン番号（差分表示用）
  const parentVersion = (() => {
    const event = isViewingLatest ? latestEvent : selectedEvent;
    if (!event || !event.parentId) return 0;
    const parent = getEventById(event.parentId);
    return parent?.version ?? 0;
  })();

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
    setIsBranching(false);
  }, [resetWithContent]);

  const handleImportFile = useCallback((fileContent: string, filename: string) => {
    resetWithContent(fileContent, `${filename} をインポート`);
    setContent(fileContent);
    setDisplayContent(fileContent);
    lastSavedContentRef.current = fileContent;
    setIsSaved(true);
    setIsBranching(false);
  }, [resetWithContent]);



  const handleSave = useCallback(() => {
    if (content !== lastSavedContentRef.current) {
      // 分岐モード時はモーダルで入力したコメントを使用
      const summary = isBranching && branchCommentRef.current
        ? branchCommentRef.current
        : `${Math.abs(content.length - lastSavedContentRef.current.length)}文字の変更を保存`;

      // 親IDの決定: 
      // 1. 分岐モードなら分岐元ID (branchSourceIdRef) を親にする
      // 2. 最新を見ているなら最新ID (直線)
      // 3. 過去を見ているならそのID (分岐)
      const parentId = isBranching && branchSourceIdRef.current
        ? branchSourceIdRef.current
        : (isViewingLatest ? latestEventId : selectedEventId);

      const newEvent = addEvent(content, 'user_edit', parentId ?? null, summary);
      lastSavedContentRef.current = content;
      setIsSaved(true);
      setIsBranching(false);
      branchCommentRef.current = ''; // リセット
      branchSourceIdRef.current = null;
      setSelectedEventId(newEvent.id);
      setDisplayContent(content);
    }
  }, [content, addEvent, isViewingLatest, latestEventId, selectedEventId, isBranching]);

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
    if (!isViewingLatest && !isBranching) return;
    setContent(newContent);
    setDisplayContent(newContent);
    setIsSaved(newContent === lastSavedContentRef.current);
  }, [isViewingLatest, isBranching]);

  const handleEditorVisibleLineChange = useCallback((line: number) => {
    setPreviewTargetLine(line);
  }, []);

  const handlePreviewVisibleLineChange = useCallback((_line: number) => { }, []);

  const toggleDiffView = useCallback(() => {
    setShowDiff((prev) => !prev);
  }, []);

  const handleSelectEvent = useCallback((event: LineaEvent) => {
    setSelectedEventId(event.id);
    setIsBranching(false);
    if (event.id === latestEventId) {
      setDisplayContent(content);
    } else {
      setDisplayContent(event.content);
    }
  }, [latestEventId, content]);

  const handleMakeLatest = useCallback((event: LineaEvent) => {
    // モーダルを表示してコメントを取得
    setPendingBranchAction({ type: 'restore', event });
    setBranchModalTitle(`v${event.version ?? '?'}を復元`);
    setShowBranchModal(true);
  }, []);

  const handleStartBranch = useCallback((event: LineaEvent) => {
    // モーダルを表示してコメントを取得
    setPendingBranchAction({ type: 'branch', event });
    setBranchModalTitle(`v${event.version ?? '?'}から分岐`);
    setShowBranchModal(true);
  }, []);

  const handleBranchModalConfirm = useCallback((comment: string) => {
    if (!pendingBranchAction) return;

    const { type, event } = pendingBranchAction;

    if (type === 'restore') {
      // 復元は選択されたイベントを親として分岐を作成する
      const newEvent = addEvent(event.content, 'user_edit', event.id, comment);
      setContent(event.content);
      setDisplayContent(event.content);
      lastSavedContentRef.current = event.content;
      setIsSaved(true);
      setIsBranching(false);
      setSelectedEventId(newEvent.id);
    } else if (type === 'branch') {
      // 分岐: 作業エリアをセットして分岐モードへ
      // コメントと分岐元IDを保存（保存時に使用）
      branchCommentRef.current = comment;
      branchSourceIdRef.current = event.id;
      setContent(event.content);
      setDisplayContent(event.content);
      lastSavedContentRef.current = event.content;
      setIsBranching(true);
      setIsSaved(true);
      // 編集フォーカスを当てる
      if (editorRef.current) {
        editorRef.current.focus?.();
      }
    }

    // モーダルを閉じて状態をリセット
    setShowBranchModal(false);
    setPendingBranchAction(null);
  }, [pendingBranchAction, addEvent]);

  const handleBranchModalClose = useCallback(() => {
    setShowBranchModal(false);
    setPendingBranchAction(null);
  }, []);

  const handleCancelBranch = useCallback(() => {
    // 分岐モードをキャンセル
    setIsBranching(false);
    // 選択中のイベントがあれば、その内容を再表示
    if (selectedEventId) {
      const event = getEventById(selectedEventId);
      if (event) {
        setDisplayContent(event.content);
        lastSavedContentRef.current = event.content;
      }
    }
    setIsSaved(true);
  }, [selectedEventId, getEventById]);

  const handleClearHistory = useCallback(() => {
    setShowResetConfirmModal(true);
  }, []);

  const handleConfirmReset = useCallback(() => {
    const newEvent = resetWithContent(content, '履歴のリセット');
    lastSavedContentRef.current = content;
    setIsSaved(true);
    setSelectedEventId(newEvent.id);
    setShowResetConfirmModal(false);
  }, [resetWithContent, content]);

  // コメント編集ハンドラ
  const handleEditComment = useCallback((event: LineaEvent) => {
    setEditCommentEvent(event);
    setShowEditCommentModal(true);
  }, []);

  const handleConfirmEditComment = useCallback((newComment: string) => {
    if (editCommentEvent) {
      updateEventSummary(editCommentEvent.id, newComment);
    }
    setShowEditCommentModal(false);
    setEditCommentEvent(null);
  }, [editCommentEvent, updateEventSummary]);

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

  // Resize handlers for draggable dividers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      if (isResizing === 'sidebar') {
        // Constrain sidebar width between 200px and 600px
        const newWidth = Math.max(200, Math.min(600, e.clientX));
        setSidebarWidth(newWidth);
      } else if (isResizing === 'editor') {
        // Calculate editor width as percentage of remaining space (after sidebar)
        const container = document.getElementById('editor-preview-container');
        if (container) {
          const rect = container.getBoundingClientRect();
          const relativeX = e.clientX - rect.left;
          const percent = Math.max(20, Math.min(80, (relativeX / rect.width) * 100));
          setEditorWidthPercent(percent);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(null);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isResizing) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Ctrl+Wheel zoom for editor and tree (scoped to each container)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;

      const target = e.target as HTMLElement;

      // Check if cursor is over the editor container
      const editorContainer = document.getElementById('editor-container');
      if (editorContainer && editorContainer.contains(target)) {
        e.preventDefault();
        setFontSize(prev => {
          const delta = e.deltaY > 0 ? -1 : 1;
          return Math.max(10, Math.min(24, prev + delta));
        });
        return;
      }

      // Check if cursor is over the tree container
      const treeContainer = document.getElementById('lineage-tree-container');
      if (treeContainer && treeContainer.contains(target)) {
        e.preventDefault();
        setTreeScale(prev => {
          const delta = e.deltaY > 0 ? -0.05 : 0.05;
          return Math.max(0.6, Math.min(1.4, prev + delta));
        });
        return;
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  const compareWith = (() => {
    if (!showDiff) return undefined;
    // 差分表示: 親ノードとの比較（分岐元との差分を表示）
    if (isViewingLatest && latestEventId && latestEvent) {
      const parent = latestEvent.parentId ? getEventById(latestEvent.parentId) : null;
      return parent?.content;
    } else if (selectedEventId && selectedEvent) {
      const parent = selectedEvent.parentId ? getEventById(selectedEvent.parentId) : null;
      return parent?.content;
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
          <div className="flex items-center gap-2 select-none">
            <Logo size={24} />
            <span className="text-slate-700 font-semibold">LineaDoc</span>
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
          <div className="flex items-center gap-2 select-none">
            <Logo size={24} />
            <span className="text-slate-700 font-semibold">LineaDoc</span>
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

            {/* Branch Mode Indicator */}
            {isBranching && branchCommentRef.current && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border bg-orange-50 text-orange-700 border-orange-200">
                <GitBranch size={12} />
                分岐: {branchCommentRef.current.length > 20 ? branchCommentRef.current.slice(0, 20) + '…' : branchCommentRef.current}
              </span>
            )}

            {/* Diff Labels */}
            {showDiff && compareWith !== undefined && (
              <div className="flex gap-2 ml-2">
                <div className="bg-blue-600/10 text-blue-700 text-xs px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  {`v${parentVersion}との差分`}
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
        <div
          style={{ width: sidebarWidth }}
          className="border-r border-slate-200 bg-white shrink-0 z-10 flex flex-col"
        >
          <LineaPanel
            events={events}
            selectedEventId={selectedEventId}
            isBranching={isBranching}
            treeScale={treeScale}
            onSelectEvent={handleSelectEvent}
            onClearHistory={handleClearHistory}
            onMakeLatest={handleMakeLatest}
            onStartBranch={handleStartBranch}
            onCancelBranch={() => setIsBranching(false)}
            onEditComment={handleEditComment}
          />
        </div>

        {/* Resize Handle: Sidebar <-> Editor */}
        <div
          className="w-1 bg-slate-200 hover:bg-blue-400 cursor-col-resize transition-colors shrink-0"
          onMouseDown={() => setIsResizing('sidebar')}
        />

        {/* Center + Right: Editor & Preview Container */}
        <div id="editor-preview-container" className="flex-1 flex min-w-0">
          {/* Center: Editor */}
          <div
            id="editor-container"
            style={{ width: `${editorWidthPercent}%` }}
            className="border-r border-slate-300 relative min-w-0 bg-white shrink-0"
          >
            <MonacoWrapper
              ref={editorRef}
              value={displayContent}
              onChange={handleContentChange}
              onVisibleLineChange={handleEditorVisibleLineChange}
              onSave={handleSave}
              onZoom={(delta) => setFontSize(prev => Math.max(10, Math.min(24, prev + delta)))}
              targetLine={editorTargetLine}
              readOnly={!isViewingLatest && !isBranching}
              compareWith={compareWith}
              activeBase={activeBase}
              fontSize={fontSize}
            />
          </div>

          {/* Resize Handle: Editor <-> Preview */}
          <div
            className="w-1 bg-slate-200 hover:bg-blue-400 cursor-col-resize transition-colors shrink-0"
            onMouseDown={() => setIsResizing('editor')}
          />

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
      <BranchCommentModal
        isOpen={showBranchModal}
        onClose={handleBranchModalClose}
        onConfirm={handleBranchModalConfirm}
        title={branchModalTitle}
      />
      <InputModal
        isOpen={showEditCommentModal}
        onClose={() => {
          setShowEditCommentModal(false);
          setEditCommentEvent(null);
        }}
        onConfirm={handleConfirmEditComment}
        title="コメント編集"
        label="コメント"
        placeholder="変更の理由や目的を入力"
        defaultValue={editCommentEvent?.summary || ''}
        confirmText="保存"
      />
      <ConfirmModal
        isOpen={showResetConfirmModal}
        onClose={() => setShowResetConfirmModal(false)}
        onConfirm={handleConfirmReset}
        title="履歴のリセット"
        message="履歴を全て削除し、現在の内容をv1として保存し直しますか？&#10;（現在のエディタの内容は維持されます）"
        confirmText="リセット"
        variant="danger"
      />
    </div>
  );
}
