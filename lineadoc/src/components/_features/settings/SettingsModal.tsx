/**
 * SettingsModal.tsx
 * 
 * 設定モーダル
 * ホットキーの設定やライセンス情報の表示を行う
 */

import { useState } from 'react';
import { X, Keyboard, Info, RotateCcw } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useSettingsStore, HotkeyConfig } from '@/stores/settingsStore';
import { LegalModal } from '../legal/LegalModal';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const [activeTab, setActiveTab] = useState<'hotkeys' | 'legal'>('hotkeys');
    const { hotkeys, updateHotkey, resetHotkeys } = useSettingsStore();

    if (!isOpen) return null;

    const renderHotkeyInput = (id: keyof typeof hotkeys, label: string) => {
        const config = hotkeys[id];

        return (
            <div className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                    {/* Modifiers */}
                    <label className="flex items-center gap-1 text-xs">
                        <input
                            type="checkbox"
                            checked={config.ctrl}
                            onChange={(e) => updateHotkey(id, { ctrl: e.target.checked })}
                            className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                        />
                        Ctrl
                    </label>
                    <label className="flex items-center gap-1 text-xs">
                        <input
                            type="checkbox"
                            checked={config.shift}
                            onChange={(e) => updateHotkey(id, { shift: e.target.checked })}
                            className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                        />
                        Shift
                    </label>
                    <label className="flex items-center gap-1 text-xs">
                        <input
                            type="checkbox"
                            checked={config.alt}
                            onChange={(e) => updateHotkey(id, { alt: e.target.checked })}
                            className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                        />
                        Alt
                    </label>

                    <span className="text-slate-400">+</span>

                    {/* Key Input */}
                    <input
                        type="text"
                        value={config.key.toUpperCase()}
                        readOnly
                        onKeyDown={(e) => {
                            e.preventDefault();
                            if (e.key === 'Control' || e.key === 'Shift' || e.key === 'Alt' || e.key === 'Meta') return;
                            updateHotkey(id, { key: e.key.toLowerCase() });
                        }}
                        className="w-10 h-8 text-center text-sm font-bold bg-white border border-slate-300 rounded focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Body */}
            <div className="relative bg-white w-full max-w-xl max-h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                            <Keyboard className="w-4 h-4 text-slate-600" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">アプリケーション設定</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex px-6 pt-2 border-b border-slate-100 bg-slate-50/50">
                    <button
                        onClick={() => setActiveTab('hotkeys')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'hotkeys'
                            ? 'border-cyan-600 text-cyan-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        ホットキー
                    </button>
                    <button
                        onClick={() => setActiveTab('legal')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'legal'
                            ? 'border-cyan-600 text-cyan-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        ライセンス情報
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'hotkeys' ? (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">キーボードショートカット</h3>
                                <button
                                    onClick={resetHotkeys}
                                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    リセット
                                </button>
                            </div>

                            <div className="space-y-4">
                                {renderHotkeyInput('toggleEditorMode', 'エディタ切替 (リッチ / ソースコード)')}
                                {renderHotkeyInput('toggleWorkMode', 'ワークモード切替 (執筆 / 印刷用プレビュー)')}
                            </div>

                            <div className="mt-8 p-4 bg-amber-50 rounded-lg border border-amber-100">
                                <p className="text-xs text-amber-800 leading-relaxed">
                                    <span className="font-bold">注意:</span>
                                    ブラウザや他のアプリケーションの既存ショートカットと衝突する場合があります。
                                    可能な限り独自性の高い組み合わせを設定してください。
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in duration-300">
                            {/* Reusing content from LegalModal manually or we can refactor LegalModal to be a component purely for content */}
                            <LegalContent />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 transition-colors shadow-sm"
                    >
                        完了
                    </button>
                </div>
            </div>
        </div>
    );
}

// Separate component for Legal content to reuse in both places if needed
function LegalContent() {
    const LICENSES = [
        { name: 'BlockNote', license: 'MPL-2.0', url: 'https://github.com/TypeCellOS/BlockNote' },
        { name: 'Monaco Editor', license: 'MIT', url: 'https://github.com/microsoft/monaco-editor' },
        { name: 'React', license: 'MIT', url: 'https://github.com/facebook/react' },
        { name: 'Next.js', license: 'MIT', url: 'https://nextjs.org' },
        { name: 'Tailwind CSS', license: 'MIT', url: 'https://tailwindcss.com' },
        { name: 'Zustand', license: 'MIT', url: 'https://github.com/pmndrs/zustand' },
        { name: 'Lucide Icons', license: 'ISC', url: 'https://lucide.dev' },
    ];

    return (
        <div className="space-y-6 max-w-full overflow-hidden">
            <p className="text-sm text-slate-600 leading-relaxed">
                LineaDoc は以下のオープンソースソフトウェアを使用しています。
                各ライブラリの著作権者に感謝いたします。
            </p>

            <div className="grid grid-cols-1 gap-3">
                {LICENSES.map((lib) => (
                    <div key={lib.name} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-bold text-slate-800">{lib.name}</span>
                            <span className="text-[10px] font-medium px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded">
                                {lib.license}
                            </span>
                        </div>
                        <a href={lib.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-cyan-600 hover:underline truncate block">
                            {lib.url}
                        </a>
                    </div>
                ))}
            </div>

            <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg">
                <h4 className="text-xs font-bold text-orange-800 mb-1">MPL-2.0 ライセンスについて</h4>
                <p className="text-[10px] text-orange-700 leading-relaxed">
                    BlockNote は MPL-2.0 ライセンスで提供されています。
                    LineaDoc では、BlockNote 本体のファイルを改変せず、新規ファイルでのカスタマイズを行っています。
                </p>
            </div>
        </div>
    );
}
