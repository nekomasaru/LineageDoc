import React from 'react';
import { X, BookOpen, Save, GitBranch, Search, Keyboard, FileText } from 'lucide-react';

interface GuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function GuideModal({ isOpen, onClose }: GuideModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <div className="flex items-center gap-2 text-slate-700">
                        <BookOpen size={20} />
                        <h2 className="text-lg font-semibold">LineageDoc の使い方</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-700">

                    <section className="space-y-3">
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            基本操作
                        </h3>
                        <ul className="space-y-2 text-sm ml-4">
                            <li className="flex items-start gap-2">
                                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs mt-0.5">編集</span>
                                <span>中央のエディタでMarkdownを入力します。プレビューはリアルタイムで更新されます。</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs mt-0.5">保存</span>
                                <span>
                                    <kbd className="font-mono bg-slate-100 border border-slate-300 px-1 rounded mx-1">Ctrl</kbd>+
                                    <kbd className="font-mono bg-slate-100 border border-slate-300 px-1 rounded mx-1">S</kbd>
                                    で履歴を保存します。保存すると新しいバージョン(vN)が作成されます。
                                </span>
                            </li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            履歴管理
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-3 rounded border border-slate-100 text-sm">
                                <div className="font-medium mb-1 flex items-center gap-1">
                                    <GitBranch size={14} className="text-slate-500" />
                                    バージョンの確認
                                </div>
                                <p className="text-slate-600 text-xs leading-relaxed">
                                    左側のパネルで過去の履歴をクリックすると、その時点の内容を確認できます。
                                </p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded border border-slate-100 text-sm">
                                <div className="font-medium mb-1 flex items-center gap-1">
                                    <Search size={14} className="text-slate-500" />
                                    差分の確認
                                </div>
                                <p className="text-slate-600 text-xs leading-relaxed">
                                    <span className="text-blue-600 font-medium">青色</span>は保存済み、
                                    <span className="text-green-600 font-medium">緑色</span>は未保存の変更を表示します。
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                            便利機能
                        </h3>
                        <ul className="space-y-2 text-sm ml-4">
                            <li className="flex items-center gap-2">
                                <Keyboard size={14} className="text-slate-400" />
                                <span>
                                    <strong>キーボード操作:</strong> エディタ外で
                                    <kbd className="font-mono bg-slate-100 border border-slate-300 px-1 rounded mx-1">↑</kbd>
                                    <kbd className="font-mono bg-slate-100 border border-slate-300 px-1 rounded mx-1">↓</kbd>
                                    を押すと、履歴をパラパラと切り替えられます。
                                </span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Save size={14} className="text-slate-400" />
                                <span>
                                    <strong>エクスポート:</strong> ヘッダーのボタンから、現在の内容をMarkdownファイルとしてダウンロードできます。
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="mt-1"><FileText size={14} className="text-slate-400" /></span>
                                <span>
                                    <strong>見出し自動採番:</strong> プレビュー画面では、見出し<code>#</code>に合わせて自動的に番号(1. 1.1など)が表示されます。
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs mt-0.5 border border-slate-300 h-6 flex items-center">Alt</span>
                                <span>
                                    <strong>マルチカーソル:</strong> <code>Alt</code>キーを押しながらクリックすると、複数の場所にカーソルを置いて同時に編集できます。
                                </span>
                            </li>
                        </ul>
                    </section>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors text-sm font-medium"
                    >
                        閉じる
                    </button>
                </div>
            </div>
        </div>
    );
}
