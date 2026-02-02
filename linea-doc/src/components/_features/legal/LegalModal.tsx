/**
 * LegalModal.tsx
 * 
 * オープンソースライセンス情報をモーダルで表示
 * 
 * @skill ui-component-basic
 */

import { X, FileText, ExternalLink } from 'lucide-react';

interface LicenseInfo {
    name: string;
    license: string;
    copyright: string;
    url: string;
}

const LICENSES: LicenseInfo[] = [
    {
        name: 'BlockNote',
        license: 'MPL-2.0',
        copyright: '© OpenBlocks B.V.',
        url: 'https://github.com/TypeCellOS/BlockNote',
    },
    {
        name: 'Monaco Editor',
        license: 'MIT',
        copyright: '© Microsoft Corporation',
        url: 'https://github.com/microsoft/monaco-editor',
    },
    {
        name: 'React',
        license: 'MIT',
        copyright: '© Facebook, Inc. and its affiliates',
        url: 'https://github.com/facebook/react',
    },
    {
        name: 'Next.js',
        license: 'MIT',
        copyright: '© Vercel, Inc.',
        url: 'https://nextjs.org',
    },
    {
        name: 'Tailwind CSS',
        license: 'MIT',
        copyright: '© Tailwind Labs, Inc.',
        url: 'https://tailwindcss.com',
    },
    {
        name: 'Zustand',
        license: 'MIT',
        copyright: '© Paul Henschel',
        url: 'https://github.com/pmndrs/zustand',
    },
    {
        name: 'Lucide Icons',
        license: 'ISC',
        copyright: '© Lucide Contributors',
        url: 'https://lucide.dev',
    },
];

interface LegalModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LegalModal({ isOpen, onClose }: LegalModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* オーバーレイ */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* モーダル本体 */}
            <div className="relative bg-white w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* ヘッダー */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-4 h-4 text-teal-700" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">利用規約・ライセンス情報</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* コンテンツ */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-6">
                        <p className="text-sm text-slate-600 leading-relaxed">
                            LineaDoc は以下のオープンソースソフトウェアを使用しています。
                            各ライブラリの著作権者に感謝いたします。
                        </p>

                        <div className="space-y-3">
                            {LICENSES.map((lib) => (
                                <div
                                    key={lib.name}
                                    className="bg-slate-50 border border-slate-200 rounded-lg p-4 hover:border-teal-200 transition-colors"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="font-semibold text-slate-800 text-sm">{lib.name}</h3>
                                            <p className="text-xs text-slate-500">{lib.copyright}</p>
                                        </div>
                                        <span className={`
                      px-2 py-0.5 rounded text-[10px] font-medium tracking-wide
                      ${lib.license === 'MPL-2.0'
                                                ? 'bg-orange-100 text-orange-700'
                                                : 'bg-teal-100 text-teal-700'}
                    `}>
                                            {lib.license}
                                        </span>
                                    </div>
                                    <a
                                        href={lib.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 hover:underline"
                                    >
                                        {lib.url}
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            ))}
                        </div>

                        {/* MPL-2.0 注記 */}
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <h3 className="text-xs font-semibold text-orange-800 mb-1">
                                MPL-2.0 ライセンスについて
                            </h3>
                            <p className="text-xs text-orange-700 leading-relaxed">
                                BlockNote は MPL-2.0 ライセンスで提供されています。
                                LineaDoc では、BlockNote 本体のファイルを改変せず、
                                新規ファイルでカスタマイズを行っています。
                            </p>
                        </div>
                    </div>
                </div>

                {/* フッター */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        閉じる
                    </button>
                </div>
            </div>
        </div>
    );
}
