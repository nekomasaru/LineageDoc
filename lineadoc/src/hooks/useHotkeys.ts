/**
 * useHotkeys.ts
 * 
 * グローバルホットキーのリスナーフック
 */

import { useEffect, useCallback } from 'react';
import { useSettingsStore, HotkeyConfig } from '@/stores/settingsStore';
import { useAppStore } from '@/stores/appStore';
import { useEditorStore } from '@/stores/editorStore';
import { syncBeforeModeChange } from '@/lib/editor/editorSync';

export function useHotkeys() {
    const { hotkeys } = useSettingsStore();
    const { workMode, setWorkMode } = useAppStore();
    const { mode, setMode } = useEditorStore();

    const checkHotkey = useCallback((e: KeyboardEvent, config: HotkeyConfig) => {
        if (e.key.toLowerCase() !== config.key.toLowerCase()) return false;
        if (config.ctrl && !e.ctrlKey) return false;
        if (config.shift && !e.shiftKey) return false;
        if (config.alt && !e.altKey) return false;
        if (config.meta && !e.metaKey) return false;
        // 逆に設定されていない修飾キーが押されている場合も排除（厳格化する場合）
        if (!config.ctrl && e.ctrlKey) return false;
        // MetaキーはMacでCtrlの代わりになることが多いので、必要に応じて調整
        return true;
    }, []);

    useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            // 入力フィールド等にフォーカスがある場合は無視（必要なら）
            const activeElem = document.activeElement;
            const isInput = activeElem?.tagName === 'INPUT' ||
                activeElem?.tagName === 'TEXTAREA' ||
                (activeElem as HTMLElement)?.isContentEditable;

            // ただし、ホットキー設定中は特別扱いが必要かもしれないが、
            // ここでは一般的な動作として、INPUT中もCtrl系なら許可する等のカスタマイズが可能

            // 1. エディタ切替 (Rich / Code)
            if (checkHotkey(e, hotkeys.toggleEditorMode)) {
                e.preventDefault();
                const newMode = mode === 'rich' ? 'code' : 'rich';
                const success = await syncBeforeModeChange();
                if (success) {
                    setMode(newMode);
                    console.log(`[Hotkeys] Switched editor mode to: ${newMode}`);
                }
            }

            // 2. ワークモード切替 (Write / Proof)
            if (checkHotkey(e, hotkeys.toggleWorkMode)) {
                e.preventDefault();
                const newMode = workMode === 'write' ? 'proof' : 'write';
                setWorkMode(newMode);
                console.log(`[Hotkeys] Switched work mode to: ${newMode}`);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [hotkeys, mode, setMode, workMode, setWorkMode, checkHotkey]);
}
