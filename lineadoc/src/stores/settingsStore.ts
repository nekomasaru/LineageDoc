/**
 * settingsStore.ts
 * 
 * ユーザー設定（ホットキー等）を管理するストア
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface HotkeyConfig {
    id: string;
    label: string;
    key: string;      // 'e', 'm', etc
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
    meta: boolean;    // Command key on Mac
}

interface SettingsState {
    hotkeys: {
        toggleEditorMode: HotkeyConfig;
        toggleWorkMode: HotkeyConfig;
    };

    // アクション
    updateHotkey: (id: keyof SettingsState['hotkeys'], config: Partial<HotkeyConfig>) => void;
    resetHotkeys: () => void;
}

const DEFAULT_HOTKEYS: SettingsState['hotkeys'] = {
    toggleEditorMode: {
        id: 'toggleEditorMode',
        label: 'エディタ切替 (リッチ/コード)',
        key: 'e',
        ctrl: true,
        shift: false,
        alt: false,
        meta: false,
    },
    toggleWorkMode: {
        id: 'toggleWorkMode',
        label: 'ワークモード切替 (執筆/印刷)',
        key: 'm',
        ctrl: true,
        shift: false,
        alt: false,
        meta: false,
    }
};

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            hotkeys: DEFAULT_HOTKEYS,

            updateHotkey: (id, config) => set((state) => ({
                hotkeys: {
                    ...state.hotkeys,
                    [id]: { ...state.hotkeys[id], ...config }
                }
            })),

            resetHotkeys: () => set({ hotkeys: DEFAULT_HOTKEYS }),
        }),
        {
            name: 'lineadoc-settings',
        }
    )
);
