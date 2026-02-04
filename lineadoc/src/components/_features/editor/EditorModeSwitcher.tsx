/**
 * EditorModeSwitcher.tsx
 * 
 * 「リッチ編集」と「ソースコード」を切り替えるタブUI
 * 切替時には同期処理を行う
 * 
 * @skill editor-ui-switcher
 */

'use client';

import { useState } from 'react';
import { FileCode2, FileText } from 'lucide-react';
import { useEditorStore, EditorMode } from '@/stores/editorStore';
import { syncBeforeModeChange } from '@/lib/editor/editorSync';

interface EditorModeSwitcherProps {
    className?: string;
}

export function EditorModeSwitcher({ className = '' }: EditorModeSwitcherProps) {
    const { mode, setMode } = useEditorStore();
    const [isTransitioning, setIsTransitioning] = useState(false);

    /**
     * モード切替ハンドラ
     * 同期処理を行ってからモードを変更する
     */
    const handleModeChange = async (newMode: EditorMode) => {
        if (mode === newMode) return;
        if (isTransitioning) return;

        setIsTransitioning(true);

        try {
            // 切替前に現在のモードのデータを同期
            const success = await syncBeforeModeChange();

            if (success) {
                setMode(newMode);
            } else {
                console.error('[Switcher] Sync failed, mode change cancelled');
                // TODO: ユーザーに通知
            }
        } catch (error) {
            console.error('[Switcher] Error during mode change:', error);
        }

        setIsTransitioning(false);
    };

    return (
        <div className={`flex border-b border-slate-200 bg-white ${className}`}>
            {/* リッチ編集ボタン */}
            <button
                onClick={() => handleModeChange('rich')}
                disabled={isTransitioning}
                className={`
          flex items-center gap-2 px-4 py-2.5 text-sm font-medium
          transition-colors duration-150
          ${mode === 'rich'
                        ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/50'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }
          ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}
        `}
                aria-selected={mode === 'rich'}
                role="tab"
            >
                <FileText className="w-4 h-4" />
                リッチ編集
            </button>

            {/* ソースコードボタン */}
            <button
                onClick={() => handleModeChange('code')}
                disabled={isTransitioning}
                className={`
          flex items-center gap-2 px-4 py-2.5 text-sm font-medium
          transition-colors duration-150
          ${mode === 'code'
                        ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/50'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }
          ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}
        `}
                aria-selected={mode === 'code'}
                role="tab"
            >
                <FileCode2 className="w-4 h-4" />
                ソースコード
            </button>

            {/* トランジション中のインジケーター */}
            {isTransitioning && (
                <div className="flex items-center px-3">
                    <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
}
