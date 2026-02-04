/**
 * appStore.ts
 * 
 * アプリケーション全体の状態管理
 * ワークモード（Write/Proof/Lineage）とUIの状態を管理
 * 
 * @skill app-ux-modes
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * ワークモード
 * - 'write': 執筆モード（エディタ中心）
 * - 'proof': 校正・出力モード（プレビュー中心）
 * - 'lineage': 履歴・監査モード（ツリー中心）
 */
export type WorkMode = 'write' | 'proof' | 'lineage';

/**
 * アプリケーションストアの状態インターフェース
 */
/**
 * サイドバーのビューモード
 * - 'project_list': プロジェクト一覧（ホーム）
 * - 'project_detail': プロジェクト詳細（ドキュメント一覧）
 * - 'history': 履歴パネル（ドキュメント選択時）
 * - 'attributes': 属性パネル（ドキュメント選択時）
 */
export type SidebarView = 'project_list' | 'project_detail' | 'history' | 'attributes';

/**
 * アプリケーションストアの状態インターフェース
 */
interface AppState {
    // ===== ワークモード =====
    workMode: WorkMode;
    setWorkMode: (mode: WorkMode) => void;

    // ===== サイドバー =====
    isSidebarOpen: boolean;
    activeSidebarView: SidebarView; // 現在のサイドバー表示
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    setActiveSidebarView: (view: SidebarView) => void;

    // ===== 現在のドキュメント =====
    currentDocumentId: string | null;
    currentDocumentTitle: string;
    setCurrentDocument: (id: string | null, title?: string) => void;
}

/**
 * アプリケーションストア
 */
export const useAppStore = create<AppState>()(
    devtools(
        (set) => ({
            // ===== ワークモード =====
            workMode: 'write',
            setWorkMode: (mode) => set({ workMode: mode }),

            // ===== サイドバー =====
            isSidebarOpen: true,
            activeSidebarView: 'project_list', // デフォルトはプロジェクト一覧
            toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
            setSidebarOpen: (open) => set({ isSidebarOpen: open }),
            setActiveSidebarView: (view) => set({ activeSidebarView: view, isSidebarOpen: true }),

            // ===== 現在のドキュメント =====
            currentDocumentId: null,
            currentDocumentTitle: '無題のドキュメント',
            setCurrentDocument: (id, title = '無題のドキュメント') =>
                set({ currentDocumentId: id, currentDocumentTitle: title }),
        }),
        { name: 'app-store' }
    )
);

/**
 * セレクタヘルパー
 */
export const selectWorkMode = (state: AppState) => state.workMode;
export const selectIsSidebarOpen = (state: AppState) => state.isSidebarOpen;
export const selectActiveSidebarView = (state: AppState) => state.activeSidebarView;
