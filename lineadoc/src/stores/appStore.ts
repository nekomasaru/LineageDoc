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
export type ViewMode = 'hub' | 'spoke';

/**
 * ワークモード (Spoke内)
 * - 'write': 執筆モード
 * - 'proof': 校正・出力プレビューモード
 */
export type WorkMode = 'write' | 'proof';

/**
 * 右パネル (Context Panel) のタブ
 */
export type RightPanelTab = 'history' | 'attributes' | 'graph' | 'quality' | null;

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

    // ===== 現在のドキュメント (Spoke Context) =====
    currentDocumentId: string | null;
    currentDocumentTitle: string;
    setCurrentDocument: (id: string | null, title?: string) => void;

    // ===== モーダル管理 =====
    activeModal: 'export' | 'create-document' | 'ai-instruction' | null;
    setActiveModal: (modal: 'export' | 'create-document' | 'ai-instruction' | null) => void;
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
