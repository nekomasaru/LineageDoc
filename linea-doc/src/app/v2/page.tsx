/**
 * /v2 ページ
 * 
 * 新しいUXを統合したLineaDocの次期バージョン
 * - レールナビゲーション（左端）
 * - 2つのワークモード（執筆/出力） ※履歴タブは執筆タブに統合
 * - Ctrl+S で履歴保存
 * - 執筆モードで LineaPanel を常時表示し、過去バージョンを選択して閲覧・復元可能
 * 
 * @skill app-ux-modes
 */

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { FileText, Save, RotateCcw, GitBranch } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useEditorStore } from '@/stores/editorStore';
import { useLinea } from '@/hooks/useLinea';
import { RailNav, NavItem } from '@/components/_shared/RailNav';
import { WorkModeTabs } from '@/components/_shared/WorkModeTabs';
import { Logo } from '@/components/_shared/Logo';
import { SplitEditorLayout } from '@/components/_features/editor/SplitEditorLayout';
import { FrontmatterForm } from '@/components/_features/editor/FrontmatterForm';
import { LineaPanel } from '@/components/_features/lineage/LineaPanel';
import { DocumentNavigator } from '@/components/_features/navigator/DocumentNavigator';
import { NetworkGraph } from '@/components/_features/graph/NetworkGraph';
import { LegalModal } from '@/components/_features/legal/LegalModal';
import { BranchCommentModal } from '@/components/_shared/BranchCommentModal';
import { ConfirmModal } from '@/components/_shared/ConfirmModal';
import { InputModal } from '@/components/_shared/InputModal';
import { LineaEvent } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import matter from 'gray-matter';

// ===== ホームビュー =====
interface HomeViewProps {
    onOpenLegal: () => void;
    onStartNew: () => void;
}

function HomeView({ onOpenLegal, onStartNew }: HomeViewProps) {
    return (
        <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-cyan-100">
            <div className="text-center max-w-lg px-8">
                <div className="flex items-center justify-center mb-8">
                    <Logo size={120} showText={false} className="drop-shadow-xl" />
                </div>
                <p className="text-slate-600 mb-10 text-lg">
                    AI-Powered Document Lineage OS
                </p>

                <div className="space-y-3">
                    <button
                        onClick={onStartNew}
                        className="w-full py-3 px-6 bg-cyan-600 text-white rounded-xl font-medium hover:bg-cyan-700 transition-colors shadow-sm"
                    >
                        新規ドキュメントを作成
                    </button>
                    <button
                        disabled
                        className="w-full py-3 px-6 bg-slate-100 text-slate-400 rounded-xl font-medium cursor-not-allowed"
                    >
                        ファイルをインポート（将来実装）
                    </button>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-200">
                    <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
                        <span>JP / EN 切替（将来）</span>
                        <span>•</span>
                        <button
                            onClick={onOpenLegal}
                            className="hover:text-cyan-600 hover:underline"
                        >
                            ライセンス情報
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ===== 出力ビュー =====
type TemplateId = 'official' | 'contract' | 'minutes' | 'plain';

const TEMPLATES: { id: TemplateId; name: string; icon: string; className: string }[] = [
    { id: 'official', name: '公文書', icon: '📄', className: 'font-serif' },
    { id: 'contract', name: '契約書', icon: '📝', className: 'font-serif text-sm' },
    { id: 'minutes', name: '議事録', icon: '📋', className: 'font-sans text-sm' },
    { id: 'plain', name: 'シンプル', icon: '📃', className: 'font-sans' },
];

function ProofView() {
    const { markdown } = useEditorStore();
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('official');
    const currentTemplate = TEMPLATES.find(t => t.id === selectedTemplate) || TEMPLATES[0];

    const handlePrint = () => window.print();

    return (
        <div className="h-full flex flex-col">
            <div className="h-14 bg-gradient-to-r from-cyan-600 to-cyan-700 flex items-center justify-between px-6 shrink-0">
                <div>
                    <h2 className="text-white font-semibold">出力プレビュー</h2>
                    <p className="text-cyan-100 text-xs">印刷・PDF出力前の確認</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-cyan-700 text-sm font-medium rounded-lg hover:bg-cyan-50 transition-colors"
                    >
                        印刷 / PDF
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="w-64 border-r border-slate-200 bg-slate-50 p-4 flex-shrink-0 overflow-auto">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                        テンプレート
                    </h3>
                    <div className="space-y-2">
                        {TEMPLATES.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setSelectedTemplate(t.id)}
                                className={`
                                    w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left
                                    transition-colors duration-150
                                    ${selectedTemplate === t.id
                                        ? 'bg-cyan-100 text-cyan-700 ring-1 ring-cyan-300'
                                        : 'hover:bg-slate-100 text-slate-600'
                                    }
                                `}
                            >
                                <span className="text-2xl">{t.icon}</span>
                                <span className="text-sm font-medium">{t.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 bg-slate-200 p-8 overflow-auto print:p-0 print:bg-white">
                    <div
                        className="bg-white shadow-xl mx-auto print:shadow-none"
                        style={{ width: '210mm', minHeight: '297mm', maxWidth: '100%' }}
                    >
                        <article className={`p-16 ${currentTemplate.className}`}>
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    h1: ({ children }) => (
                                        <h1 className="text-2xl font-bold text-center mb-8 border-b-2 border-slate-300 pb-4">
                                            {children}
                                        </h1>
                                    ),
                                    h2: ({ children }) => (
                                        <h2 className="text-xl font-bold mt-8 mb-4">{children}</h2>
                                    ),
                                    p: ({ children }) => (
                                        <p className="mb-4 text-justify leading-relaxed">{children}</p>
                                    ),
                                }}
                            >
                                {markdown}
                            </ReactMarkdown>
                        </article>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ===== メインページ =====
export default function V2Page() {
    const { workMode, setWorkMode, currentDocumentTitle, currentDocumentId } = useAppStore();
    const { markdown, isDirty, markAsSaved, resetDocument, setMarkdown, savedMarkdown } = useEditorStore();

    // Linea (履歴管理) - ドキュメントIDを渡す
    const {
        events,
        isLoaded,
        addEvent,
        clearEvents,
        resetWithContent,
        getEventById,
        getLatestEvent,
        updateEventSummary,
    } = useLinea(currentDocumentId);

    const [activeNav, setActiveNav] = useState<NavItem>('documents');
    const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);

    // 履歴関連の状態
    const [selectedEventId, setSelectedEventId] = useState<string | undefined>(undefined);
    const [isBranching, setIsBranching] = useState(false);

    // 現在表示中のコンテンツ（履歴閲覧用）
    const [historyViewContent, setHistoryViewContent] = useState<string | null>(null);

    // モーダル状態
    const [showBranchModal, setShowBranchModal] = useState(false);
    const [pendingBranchAction, setPendingBranchAction] = useState<{ type: 'branch' | 'restore'; event: LineaEvent } | null>(null);
    const [branchModalTitle, setBranchModalTitle] = useState('');
    const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
    const [showEditCommentModal, setShowEditCommentModal] = useState(false);
    const [editCommentEvent, setEditCommentEvent] = useState<LineaEvent | null>(null);

    // Refs
    const branchCommentRef = useRef<string>('');
    const branchSourceIdRef = useRef<string | null>(null);

    const latestEventId = events.length > 0 ? events[events.length - 1].id : undefined;
    const latestEvent = getLatestEvent();
    const selectedEvent = selectedEventId ? getEventById(selectedEventId) : undefined;

    // 最新を見ているかどうか
    const isViewingLatest = selectedEventId === undefined || selectedEventId === latestEventId;

    // ヘッダー表示用のタイトル (メタデータのタイトルを優先)
    const displayTitle = useMemo(() => {
        try {
            const { data } = matter(markdown);
            return data.title || currentDocumentTitle;
        } catch (e) {
            return currentDocumentTitle;
        }
    }, [markdown, currentDocumentTitle]);

    // エディタの強制再マウント用キー
    // 履歴モード(readonly)と編集モード(editable)の切り替え、
    // および履歴IDの変更時にキーを変更してコンポーネントを再作成させる
    const editorKey = `${historyViewContent ? 'readonly' : 'editable'}-${selectedEventId ?? 'initial'}`;

    // 初期ロード時の同期
    useEffect(() => {
        if (isLoaded && events.length > 0) {
            const latest = events[events.length - 1];
            setMarkdown(latest.content || '');
            markAsSaved();
            setSelectedEventId(latest.id);
            setHistoryViewContent(null);
        }
    }, [isLoaded]);

    // ===== 保存処理 =====
    const handleSave = useCallback(() => {
        if (!isDirty) return;

        const parentId = isBranching && branchSourceIdRef.current
            ? branchSourceIdRef.current
            : latestEventId ?? null;

        const summary = isBranching && branchCommentRef.current
            ? branchCommentRef.current
            : `${Math.abs(markdown.length - savedMarkdown.length)}文字の変更`;

        const newEvent = addEvent(markdown, 'user_edit', parentId, summary);

        markAsSaved();
        setIsBranching(false);
        branchCommentRef.current = '';
        branchSourceIdRef.current = null;
        setSelectedEventId(newEvent.id);
        setHistoryViewContent(null);

        console.log('[V2] Saved as version', newEvent.version);
    }, [isDirty, markdown, savedMarkdown, addEvent, markAsSaved, latestEventId, isBranching]);

    // ===== キーボードショートカット =====
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        handleSave();
                        break;
                    case '1':
                        e.preventDefault();
                        setWorkMode('write');
                        break;
                    case '2':
                        e.preventDefault();
                        setWorkMode('proof');
                        break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSave, setWorkMode]);

    // ===== ナビゲーション =====
    const handleNavClick = useCallback((item: NavItem) => {
        if (item === 'settings') {
            alert('設定は将来実装予定です');
            return;
        }
        if (item === 'search') {
            alert('横断検索は将来実装予定です');
            return;
        }
        setActiveNav(item);
    }, []);
    // ===== 新規ドキュメント作成 =====
    const handleStartNew = useCallback(() => {
        const initialContent = `# 見出し1

ここに文書を入力してください。
`;
        resetDocument(initialContent);
        const newEvent = resetWithContent(initialContent, '新規ドキュメント作成');
        setSelectedEventId(newEvent.id);
        setHistoryViewContent(null);
        setActiveNav('documents');
        setWorkMode('write');
    }, [resetDocument, resetWithContent, setWorkMode]);



    // ===== 履歴操作 =====
    const handleSelectEvent = useCallback((event: LineaEvent) => {
        setSelectedEventId(event.id);
        setIsBranching(false);

        if (event.id === latestEventId) {
            setHistoryViewContent(null);
        } else {
            setHistoryViewContent(event.content || '');
        }
    }, [latestEventId]);

    const handleClearHistory = useCallback(() => {
        setShowResetConfirmModal(true);
    }, []);

    const handleConfirmReset = useCallback(() => {
        const newEvent = resetWithContent(markdown, '履歴のリセット');
        setSelectedEventId(newEvent.id);
        historyViewContent && setHistoryViewContent(null);
        setShowResetConfirmModal(false);
    }, [resetWithContent, markdown, historyViewContent]);

    const handleMakeLatest = useCallback((event: LineaEvent) => {
        setPendingBranchAction({ type: 'restore', event });
        setBranchModalTitle(`v${event.version ?? '?'} を復元`);
        setShowBranchModal(true);
    }, []);

    const handleStartBranch = useCallback((event: LineaEvent) => {
        setPendingBranchAction({ type: 'branch', event });
        setBranchModalTitle(`v${event.version ?? '?'} から分岐`);
        setShowBranchModal(true);
    }, []);

    const handleBranchModalConfirm = useCallback((comment: string) => {
        if (!pendingBranchAction) return;

        const { type, event } = pendingBranchAction;

        if (type === 'restore') {
            const content = event.content || '';
            const newEvent = addEvent(content, 'user_edit', event.id, comment);
            setMarkdown(content);
            markAsSaved();
            setIsBranching(false);
            setSelectedEventId(newEvent.id);
            setHistoryViewContent(null);
        } else if (type === 'branch') {
            branchCommentRef.current = comment;
            branchSourceIdRef.current = event.id;

            setMarkdown(event.content || '');
            setHistoryViewContent(null);
            setIsBranching(true);
            setWorkMode('write');
        }

        setShowBranchModal(false);
        setPendingBranchAction(null);
    }, [pendingBranchAction, addEvent, setMarkdown, markAsSaved, setWorkMode]);

    const handleCancelBranch = useCallback(() => {
        setIsBranching(false);
        branchCommentRef.current = '';
        branchSourceIdRef.current = null;
        if (latestEvent) {
            setMarkdown(latestEvent.content || '');
            setHistoryViewContent(null);
            setSelectedEventId(latestEvent.id);
        }
    }, [latestEvent, setMarkdown]);

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

    // ===== ホーム画面 =====
    if (activeNav === 'home') {
        return (
            <div className="h-screen flex bg-slate-50">
                <RailNav activeItem={activeNav} onItemClick={handleNavClick} />
                <div className="flex-1 relative">
                    <HomeView
                        onOpenLegal={() => setIsLegalModalOpen(true)}
                        onStartNew={handleStartNew}
                    />
                    <LegalModal isOpen={isLegalModalOpen} onClose={() => setIsLegalModalOpen(false)} />
                </div>
            </div>
        );
    }

    // ===== ドキュメントビュー =====
    return (
        <div className="h-screen flex bg-slate-50">
            <RailNav activeItem={activeNav} onItemClick={handleNavClick} />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* ヘッダー */}
                <header className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <Logo size={20} className="text-cyan-600" />
                        <span className="text-sm font-bold text-slate-700 truncate max-w-xs">
                            {displayTitle}
                        </span>
                        {events.length > 0 && (
                            <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                v{latestEvent?.version ?? 0}
                            </span>
                        )}
                        {isDirty && !historyViewContent && (
                            <span className="text-amber-500 text-xs flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                                未保存
                            </span>
                        )}
                        {isBranching && (
                            <span className="text-orange-500 text-xs flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded">
                                <GitBranch className="w-3 h-3" />
                                分岐編集中
                            </span>
                        )}
                        {historyViewContent && (
                            <span className="text-cyan-600 text-xs flex items-center gap-1 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-100">
                                過去バージョン閲覧中 (v{selectedEvent?.version})
                            </span>
                        )}
                    </div>

                    <WorkModeTabs />

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => resetDocument()}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700"
                            title="リセット"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!isDirty || !!historyViewContent}
                            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${isDirty && !historyViewContent
                                ? 'bg-cyan-600 text-white hover:bg-cyan-700'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                            title="保存 (Ctrl+S)"
                        >
                            <Save className="w-4 h-4" />
                            保存
                        </button>
                    </div>
                </header>

                {/* メインコンテンツ */}
                <main className="flex-1 overflow-hidden relative">
                    {workMode === 'write' && activeNav !== 'graph' && (
                        <div className="h-full flex">
                            {/* 左サイドバーパネル: モードによって切り替 */}
                            <div className="flex border-r border-slate-200">
                                {activeNav === 'documents' && <div className="w-72 bg-white h-full"><DocumentNavigator /></div>}
                                {activeNav === 'metadata' && <FrontmatterForm />}
                                {activeNav === 'history' && (
                                    <div className="w-72 bg-white h-full">
                                        <LineaPanel
                                            events={events}
                                            selectedEventId={selectedEventId}
                                            isBranching={isBranching}
                                            onSelectEvent={handleSelectEvent}
                                            onClearHistory={handleClearHistory}
                                            onMakeLatest={handleMakeLatest}
                                            onStartBranch={handleStartBranch}
                                            onCancelBranch={handleCancelBranch}
                                            onEditComment={handleEditComment}
                                        />
                                    </div>
                                )}
                                {activeNav === 'search' && (
                                    <div className="w-72 bg-white h-full p-4 text-slate-500 text-sm italic border-r border-slate-200">横断検索パネル（開発予定）</div>
                                )}
                            </div>
                            {/* 右: エディタ */}
                            <div className="flex-1 overflow-hidden">
                                <SplitEditorLayout
                                    editorKey={editorKey} // 追加
                                    overrideContent={historyViewContent || undefined}
                                    savedMarkdown={historyViewContent
                                        ? undefined
                                        : savedMarkdown
                                    }
                                    compareWith={(() => {
                                        let sourceId: string | null | undefined = undefined;

                                        if (historyViewContent) {
                                            // 過去閲覧中: 選択中のイベントの親と比較
                                            sourceId = selectedEvent?.parentId;
                                        } else if (isBranching && branchSourceIdRef.current) {
                                            // 分岐編集中: 分岐元と比較
                                            sourceId = branchSourceIdRef.current;
                                        } else {
                                            // 最新編集中: 最新イベントの親と比較 (青Diff用)
                                            sourceId = latestEvent?.parentId;
                                        }

                                        return sourceId ? getEventById(sourceId)?.content : undefined;
                                    })()}
                                    onSave={handleSave}
                                />
                            </div>
                        </div>
                    )}
                    {/* グラフモード: フルエリア表示 */}
                    {workMode === 'write' && activeNav === 'graph' && (
                        <div className="h-full flex">
                            {/* 左: ドキュメント一覧（クリック時の詳細表示用） */}
                            <div className="w-72 bg-white border-r border-slate-200 h-full shrink-0">
                                <DocumentNavigator />
                            </div>
                            {/* 右: ナレッジグラフ（フルエリア） */}
                            <div className="flex-1 h-full">
                                <NetworkGraph />
                            </div>
                        </div>
                    )}
                    {workMode === 'proof' && <ProofView />}
                    <LegalModal isOpen={isLegalModalOpen} onClose={() => setIsLegalModalOpen(false)} />
                </main>

                {/* フッター */}
                <footer className="h-6 bg-slate-800 text-slate-400 text-xs flex items-center px-4 gap-6">
                    <span>Mode: {workMode}</span>
                    <span>History: {events.length}</span>
                    <span className="hidden sm:inline">Ctrl+S: Save</span>
                </footer>
            </div>

            {/* モーダル群 */}
            <BranchCommentModal
                isOpen={showBranchModal}
                onClose={() => { setShowBranchModal(false); setPendingBranchAction(null); }}
                onConfirm={handleBranchModalConfirm}
                title={branchModalTitle}
            />
            <ConfirmModal
                isOpen={showResetConfirmModal}
                onClose={() => setShowResetConfirmModal(false)}
                onConfirm={handleConfirmReset}
                title="履歴をリセット"
                message="現在の内容を保持したまま、履歴をv1にリセットします。この操作は取り消せません。"
                confirmText="リセット"
                variant="danger"
            />
            <InputModal
                isOpen={showEditCommentModal}
                onClose={() => { setShowEditCommentModal(false); setEditCommentEvent(null); }}
                onConfirm={handleConfirmEditComment}
                title="コメントを編集"
                label="コメント"
                placeholder="変更内容のメモ"
                defaultValue={editCommentEvent?.summary || ''}
                confirmText="保存"
            />
        </div>
    );
}
