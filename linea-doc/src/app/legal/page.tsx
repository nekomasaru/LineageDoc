/**
 * /legal ページ
 * 
 * オープンソースライセンス表示
 * MIT, MPL-2.0 のライセンス情報を記載
 */

import { FileText, ExternalLink } from 'lucide-react';

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

export default function LegalPage() {
    return (
        <div className="min-h-screen bg-slate-50">
            {/* ヘッダー */}
            <header className="bg-white border-b border-slate-200 py-6">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center">
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-slate-800">LineaDoc</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">利用規約・ライセンス情報</h1>
                </div>
            </header>

            {/* メインコンテンツ */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                {/* イントロ */}
                <section className="mb-12">
                    <p className="text-slate-600 leading-relaxed">
                        LineaDoc は以下のオープンソースソフトウェアを使用しています。
                        各ライブラリの著作権者に感謝いたします。
                    </p>
                </section>

                {/* ライセンス一覧 */}
                <section className="mb-12">
                    <h2 className="text-xl font-bold text-slate-800 mb-6">
                        使用しているオープンソースソフトウェア
                    </h2>

                    <div className="space-y-4">
                        {LICENSES.map((lib) => (
                            <div
                                key={lib.name}
                                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-semibold text-slate-800 text-lg">
                                            {lib.name}
                                        </h3>
                                        <p className="text-sm text-slate-500 mt-1">
                                            {lib.copyright}
                                        </p>
                                    </div>
                                    <span className={`
                    px-3 py-1 rounded-full text-xs font-medium
                    ${lib.license === 'MPL-2.0'
                                            ? 'bg-orange-100 text-orange-700'
                                            : lib.license === 'MIT'
                                                ? 'bg-teal-100 text-teal-700'
                                                : 'bg-slate-100 text-slate-600'
                                        }
                  `}>
                                        {lib.license}
                                    </span>
                                </div>
                                <a
                                    href={lib.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 mt-3"
                                >
                                    {lib.url}
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        ))}
                    </div>
                </section>

                {/* MPL-2.0 注記 */}
                <section className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-12">
                    <h3 className="font-semibold text-orange-800 mb-2">
                        MPL-2.0 ライセンスについて
                    </h3>
                    <p className="text-sm text-orange-700 leading-relaxed">
                        BlockNote は MPL-2.0 ライセンスで提供されています。
                        LineaDoc では、BlockNote 本体のファイルを改変せず、
                        新規ファイルでカスタマイズを行っています。
                        これは MPL-2.0 の要件に準拠しています。
                    </p>
                </section>

                {/* ソースコードリンク */}
                <section className="text-center text-slate-500 text-sm">
                    <p>
                        全ライセンスの詳細については、ソースコードをご参照ください。
                    </p>
                    <a
                        href="https://github.com/lineadoc/lineadoc"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 mt-2"
                    >
                        GitHub リポジトリ
                        <ExternalLink className="w-3 h-3" />
                    </a>
                </section>
            </main>

            {/* フッター */}
            <footer className="bg-white border-t border-slate-200 py-6 mt-12">
                <div className="max-w-4xl mx-auto px-6 text-center text-sm text-slate-400">
                    © 2024 LineaDoc. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
