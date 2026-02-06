/**
 * appStore.ts
 * 
 * アプリケーション全体の状態管理
 * Hub & Spoke アーキテクチャに基づく新しい状態定義
 * 
 * @skill app-ux-modes
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * ビューモード (Hub vs Spoke)
 * - 'hub': ダッシュボード（プロジェクト一覧・チーム管理）
 * - 'spoke': エディタ（ドキュメント編集・プレビュー）
 */
export type ViewMode = 'hub' | 'spoke' | 'governance';

/**
 * ワークモード (Spoke内)
 * - 'write': 執筆モード
 * - 'proof': 校正・出力プレビューモード
 */
export type WorkMode = 'write' | 'proof';

/**
 * 右パネル (Context Panel) のタブ
 */
export type RightPanelTab = 'history' | 'attributes' | 'graph' | 'quality' | 'assistant' | null;

export interface AIChatMessage {
    id: string;
    role: 'assistant' | 'user';
    content: string;
    timestamp: Date;
    sources?: Array<{
        title: string;
        url?: string;
        type: 'gov' | 'project' | 'web';
        preview?: string;
    }>;
    confidence?: 'high' | 'mid' | 'low';
}

export interface AIContext {
    selectedText: string;
    source: 'monaco' | 'blocknote' | null;
    range?: any; // Selection range info
    pendingAction?: string | null; // AIActionType と同期
    pendingOptions?: any; // Sub-action settings (tone, etc.)
    sessionMessages: AIChatMessage[];
}

export interface AISelectionTooltipState {
    isVisible: boolean;
    x: number;
    y: number;
}
export interface ToastState {
    isVisible: boolean;
    message: string;
    type: 'success' | 'info' | 'warning';
}

interface AppState {
    // ===== ビューモード (Main Layout) =====
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;

    // ===== ワークモード (Editor) =====
    workMode: WorkMode;
    setWorkMode: (mode: WorkMode) => void;

    // ===== 右パネル (Context) =====
    rightPanelTab: RightPanelTab;
    setRightPanelTab: (tab: RightPanelTab) => void;
    toggleRightPanel: (tab: RightPanelTab) => void;

    // ===== AI アシスタントコンテキスト =====
    aiContext: AIContext;
    aiSelectionTooltip: AISelectionTooltipState;
    setAiContext: (context: Partial<AIContext>) => void;
    setAiSelectionTooltip: (state: Partial<AISelectionTooltipState>) => void;
    clearAiContext: () => void;
    clearAiSession: () => void;
    addAiMessage: (message: Omit<AIChatMessage, 'id' | 'timestamp'>) => void;

    // ===== 現在のドキュメント (Spoke Context) =====
    currentDocumentId: string | null;
    currentDocumentTitle: string;
    setCurrentDocument: (id: string | null, title?: string) => void;

    // ===== 通知 (Toast) =====
    toast: ToastState;
    showToast: (message: string, type?: ToastState['type']) => void;

    // ===== モーダル管理 =====
    activeModal: 'export' | 'create-document' | 'ai-instruction' | 'legal' | 'settings' | null;
    setActiveModal: (modal: 'export' | 'create-document' | 'ai-instruction' | 'legal' | 'settings' | null) => void;
}

export const useAppStore = create<AppState>()(
    devtools(
        (set) => ({
            // Default: Hub (Dashboard)
            viewMode: 'hub',
            setViewMode: (mode) => set({ viewMode: mode }),

            // Default: Write
            workMode: 'write',
            setWorkMode: (mode) => set({ workMode: mode }),

            // Default: Panel Closed
            rightPanelTab: null,
            setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
            toggleRightPanel: (tab) => set((state) => ({
                rightPanelTab: state.rightPanelTab === tab ? null : tab
            })),

            // AI Context
            aiContext: { selectedText: '', source: null, sessionMessages: [] },
            aiSelectionTooltip: { isVisible: false, x: 0, y: 0 },
            setAiContext: (context) => set((state) => ({
                aiContext: { ...state.aiContext, ...context }
            })),
            setAiSelectionTooltip: (tooltip) => set((state) => ({
                aiSelectionTooltip: { ...state.aiSelectionTooltip, ...tooltip }
            })),
            clearAiContext: () => set((state) => ({
                aiContext: { ...state.aiContext, selectedText: '', source: null },
                aiSelectionTooltip: { isVisible: false, x: 0, y: 0 }
            })),
            clearAiSession: () => set((state) => ({
                aiContext: { ...state.aiContext, sessionMessages: [] }
            })),
            addAiMessage: (message) => set((state) => ({
                aiContext: {
                    ...state.aiContext,
                    sessionMessages: [
                        ...state.aiContext.sessionMessages,
                        {
                            ...message,
                            id: Math.random().toString(36).substring(7),
                            timestamp: new Date()
                        }
                    ]
                }
            })),

            // Toast
            toast: { isVisible: false, message: '', type: 'info' },
            showToast: (message, type = 'info') => {
                set({ toast: { isVisible: true, message, type } });
                setTimeout(() => {
                    set((state) => ({ toast: { ...state.toast, isVisible: false } }));
                }, 3000);
            },

            // Document Context
            currentDocumentId: null,
            currentDocumentTitle: '無題のドキュメント',
            setCurrentDocument: (id, title = '無題のドキュメント') =>
                set({
                    currentDocumentId: id,
                    currentDocumentTitle: title,
                    // ドキュメントが選択されたら自動的にSpokeへ遷移
                    viewMode: id ? 'spoke' : 'hub'
                }),

            activeModal: null,
            setActiveModal: (modal) => set({ activeModal: modal }),
        }),
        { name: 'app-store' }
    )
);

// Selectors
export const selectViewMode = (state: AppState) => state.viewMode;
export const selectWorkMode = (state: AppState) => state.workMode;
export const selectRightPanelTab = (state: AppState) => state.rightPanelTab;
