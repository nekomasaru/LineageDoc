'use client';

import { Logo } from '@/components/_shared/Logo';
import { useAppStore } from '@/stores/appStore';
import { useProjectStore } from '@/stores/projectStore';
import { useEditorStore } from '@/stores/editorStore';
import { useDocumentStore } from '@/stores/documentStore';
import { syncBeforeModeChange } from '@/lib/editor/editorSync';
import { GitBranch, Info, Settings, ChevronRight, Home, LayoutGrid, ShieldCheck, PenTool, Printer, FileText, FileCode2, Save, Download, Upload, Sparkles, CheckCircle } from 'lucide-react';
import { useCallback, useRef } from 'react';
import { useLinea } from '@/hooks/useLinea';
interface GlobalHeaderProps {
    onSave?: () => void;
}

export function GlobalHeader({ onSave }: GlobalHeaderProps) {
    const {
        viewMode,
        setViewMode,
        workMode,
        setWorkMode,
        currentDocumentTitle,
        currentDocumentId,
        rightPanelTab,
        toggleRightPanel,
        setActiveModal,
        setCurrentDocument,
        showToast
    } = useAppStore();

    const { mode, setMode, markdown } = useEditorStore();
    const { activeProjectId, projects, activeTeamId, teams } = useProjectStore();
    const { addDocument, updateDocument } = useDocumentStore();

    const linea = useLinea(currentDocumentId);
    const { addEvent, getLatestEvent } = linea;

    const activeProject = projects.find(p => p.id === activeProjectId);
    const activeTeam = teams.find(t => t.id === activeTeamId);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSave = useCallback(() => {
        if (onSave) {
            onSave();
            return;
        }

        // --- NEW: 読込完了前やID不一致時の保存を禁止 ---
        if (!linea.isLoaded || linea.loadedId !== currentDocumentId) {
            console.warn('[Header] Save blocked: document still loading or changing.');
            return;
        }

        if (currentDocumentId && markdown) {
            // 1. Update Document Store
            updateDocument(currentDocumentId, markdown);

            // 2. Add History Event (Only if changed)
            const latest = getLatestEvent();
            if (!latest || latest.content !== markdown) {
                addEvent(markdown, 'user_edit', latest?.id || null, '手動保存 (Header)');
                console.log('Saved to local storage & history updated (Header)');
                showToast('履歴を保存しました', 'success');
            } else {
                console.log('Saved (No content change, history skipped)');
                showToast('保存しました', 'info');
            }
        }
    }, [currentDocumentId, markdown, updateDocument, addEvent, getLatestEvent, linea.isLoaded, linea.loadedId, onSave]);

    const handleHomeClick = useCallback(() => {
        setViewMode('hub');
    }, [setViewMode]);

    const handleEditorModeChange = async (newMode: 'rich' | 'code') => {
        if (mode === newMode) return;
        const success = await syncBeforeModeChange();
        if (success) setMode(newMode);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleExportClick = () => {
        setActiveModal('export');
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            let content = '';
            const title = file.name.replace(/\.[^/.]+$/, "");

            if (file.name.endsWith('.docx')) {
                const { importDocx } = await import('@/lib/interop/docx-utils');
                content = await importDocx(file);
                console.log('Imported from docx');
            } else {
                const reader = new FileReader();
                content = await new Promise((resolve) => {
                    reader.onload = (event) => resolve(event.target?.result as string);
                    reader.readAsText(file);
                });
            }

            if (content) {
                const projectId = activeProjectId || 'default-project';
                const newDoc = addDocument(projectId, title, content);
                setCurrentDocument(newDoc.id, newDoc.title);
                console.log('Imported document and set active:', newDoc.id);
            }
        } catch (error) {
            console.error('Import failed:', error);
        }

        // Reset input
        e.target.value = '';
    };


    return (
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 justify-between shrink-0 z-40">
            {/* Left: Navigation / Breadcrumbs */}
            <div className="flex items-center gap-2 overflow-hidden">
                <button
                    onClick={handleHomeClick}
                    className="flex items-center gap-2 hover:bg-slate-100 p-1.5 rounded-lg transition-colors group"
                >
                    <Logo size={42} className="text-cyan-600 drop-shadow-sm" />
                    {viewMode === 'hub' && (
                        <span className="font-extrabold text-2xl text-slate-800 tracking-tight hidden sm:inline">LineaDoc</span>
                    )}
                </button>

                {/* Spoke Mode: Breadcrumbs */}
                {viewMode === 'spoke' && (
                    <>
                        <div className="h-6 w-px bg-slate-200 mx-1" />

                        <nav className="flex items-center text-sm text-slate-500 whitespace-nowrap overflow-hidden">
                            {/* Team Name */}
                            <span className="px-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                                {activeTeam ? activeTeam.name : 'Team'}
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-300 mx-0.5" />

                            {/* Project Name (Clickable) */}
                            {activeProject ? (
                                <button
                                    onClick={handleHomeClick}
                                    className="hover:text-cyan-700 hover:underline px-1 truncate max-w-[150px]"
                                >
                                    {activeProject.name}
                                </button>
                            ) : (
                                <span className="px-1 text-slate-400">Project</span>
                            )}

                            <ChevronRight className="w-4 h-4 text-slate-300 mx-0.5" />

                            {/* Document Title */}
                            <span className="font-bold text-slate-800 px-1 truncate max-w-[200px] sm:max-w-[300px]">
                                {currentDocumentTitle}
                            </span>
                        </nav>
                    </>
                )}
            </div>

            {/* Right: Actions & Context Toggles */}
            <div className="flex items-center gap-1">
                {viewMode === 'spoke' && (
                    <>
                        {/* 1. Save Button */}
                        <button
                            className="p-2 text-slate-400 hover:bg-cyan-50 hover:text-cyan-600 rounded-md transition-colors mr-2"
                            title="保存 (Ctrl+S)"
                            onClick={handleSave}
                        >
                            <Save size={18} />
                        </button>

                        {/* 1. IO Operations (Export/Import) */}
                        <button
                            className="p-2 text-slate-400 hover:bg-cyan-50 hover:text-cyan-600 rounded-md transition-colors mr-1"
                            title="エクスポート (Export MD)"
                            onClick={handleExportClick}
                        >
                            <Download size={18} />
                        </button>
                        <button
                            className="p-2 text-slate-400 hover:bg-cyan-50 hover:text-cyan-600 rounded-md transition-colors mr-2"
                            title="インポート (Import MD)"
                            onClick={handleImportClick}
                        >
                            <Upload size={18} />
                        </button>

                        {/* Hidden file input for import */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".md,.txt,.docx"
                            className="hidden"
                        />
                        <button
                            className="p-2 text-slate-400 hover:bg-cyan-50 hover:text-cyan-600 rounded-md transition-colors mr-2"
                            title="インポート (Import MD)"
                            onClick={handleImportClick}
                        >
                            <Download size={18} />
                        </button>

                        {/* 2. Editor Mode Toggle (Rich / Code) - Only visible in Write mode */}
                        {workMode === 'write' && (
                            <div className="flex bg-slate-100 rounded-lg p-0.5 mr-2">
                                <button
                                    onClick={() => handleEditorModeChange('rich')}
                                    className={`p-1.5 rounded-md transition-all ${mode === 'rich'
                                        ? 'bg-white text-teal-600 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                    title="リッチ編集"
                                >
                                    <FileText size={16} />
                                </button>
                                <button
                                    onClick={() => handleEditorModeChange('code')}
                                    className={`p-1.5 rounded-md transition-all ${mode === 'code'
                                        ? 'bg-white text-teal-600 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                    title="ソースコード"
                                >
                                    <FileCode2 size={16} />
                                </button>
                            </div>
                        )}

                        {/* 3. Work Mode Toggle (Write / Proof) */}
                        <div className="flex bg-slate-100 rounded-lg p-0.5 mr-4">
                            <button
                                onClick={() => setWorkMode('write')}
                                className={`p-1.5 rounded-md transition-all ${workMode === 'write'
                                    ? 'bg-white text-cyan-600 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                title="編集モード (Write)"
                            >
                                <PenTool size={16} />
                            </button>
                            <button
                                onClick={() => setWorkMode('proof')}
                                className={`p-1.5 rounded-md transition-all ${workMode === 'proof'
                                    ? 'bg-white text-cyan-600 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                title="出力プレビュー (Proof)"
                            >
                                <Printer size={16} />
                            </button>
                        </div>

                        <div className="h-6 w-px bg-slate-200 mx-2" />

                        {/* History Toggle */}
                        <div className="relative">
                            <button
                                onClick={() => toggleRightPanel('history')}
                                className={`p-2 rounded-md transition-colors ${rightPanelTab === 'history'
                                    ? 'bg-cyan-100 text-cyan-700'
                                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                                    }`}
                                title="履歴 (History)"
                            >
                                <GitBranch size={18} />
                            </button>

                            {/* Simple Toast Popover */}
                            {useAppStore.getState().toast.isVisible && useAppStore.getState().toast.type === 'success' && (
                                <div className="absolute right-0 top-full mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="bg-emerald-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap flex items-center gap-2">
                                        <CheckCircle size={14} />
                                        {useAppStore.getState().toast.message}
                                        <div className="absolute -top-1 right-3 w-2 h-2 bg-emerald-600 rotate-45" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Attributes Toggle */}
                        <button
                            onClick={() => toggleRightPanel('attributes')}
                            className={`p-2 rounded-md transition-colors ${rightPanelTab === 'attributes'
                                ? 'bg-cyan-100 text-cyan-700'
                                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                                }`}
                            title="属性 (Attributes)"
                        >
                            <Info size={19} />
                        </button>

                        {/* Quality/Governance Toggle */}
                        <button
                            onClick={() => toggleRightPanel('quality')}
                            className={`p-2 rounded-md transition-colors ${rightPanelTab === 'quality'
                                ? 'bg-cyan-100 text-cyan-700'
                                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                                }`}
                            title="品質・ガバナンス (Governance Check)"
                        >
                            <ShieldCheck size={18} />
                        </button>

                        {/* AI Toggle */}
                        <button
                            onClick={() => toggleRightPanel('assistant')}
                            className={`p-2 rounded-md transition-all ${rightPanelTab === 'assistant'
                                ? 'bg-purple-100 text-purple-700 shadow-sm'
                                : 'text-slate-400 hover:bg-purple-50 hover:text-purple-600'
                                }`}
                            title="LineaDoc AI"
                        >
                            <Sparkles size={18} className={rightPanelTab === 'assistant' ? 'animate-pulse' : ''} />
                        </button>

                        <div className="h-6 w-px bg-slate-200 mx-2" />
                    </>
                )}

                {/* Common Settings (Placeholder) */}
                <button
                    className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-md transition-colors"
                    title="設定"
                    onClick={() => setActiveModal('settings')}
                >
                    <Settings size={18} />
                </button>
            </div>
        </header>
    );
}
