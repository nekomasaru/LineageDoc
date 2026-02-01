import React, { useCallback, useRef } from 'react';
import { FilePlus, Upload, FileText } from 'lucide-react';

interface WelcomeScreenProps {
    onCreateNew: () => void;
    onImportFile: (content: string, filename: string) => void;
}

export function WelcomeScreen({ onCreateNew, onImportFile }: WelcomeScreenProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            onImportFile(content, file.name);
        };
        reader.readAsText(file);

        // Reset inputs
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [onImportFile]);

    return (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-6 animate-in fade-in duration-500">
            <div className="max-w-2xl w-full text-center space-y-12">

                {/* Branding */}
                <div className="space-y-4">
                    <div className="inline-flex items-center justify-center p-4 bg-white rounded-2xl shadow-sm border border-slate-200 mb-4">
                        <FileText size={48} className="text-blue-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">LineageDoc</h1>
                    <p className="text-slate-500 text-lg max-w-md mx-auto">
                        変更履歴をすべて記録する、進化するMarkdownエディタ。
                    </p>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-lg mx-auto">
                    {/* New File */}
                    <button
                        onClick={onCreateNew}
                        className="group flex flex-col items-center p-8 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 hover:-translate-y-1 transition-all duration-200"
                    >
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                            <FilePlus size={32} />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">新規作成</h3>
                        <p className="text-sm text-slate-500">
                            白紙の状態から新しいドキュメントを作成します。
                        </p>
                    </button>

                    {/* Import */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="group flex flex-col items-center p-8 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-300 hover:-translate-y-1 transition-all duration-200 relative"
                    >
                        <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-200">
                            <Upload size={32} />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">ファイルを開く</h3>
                        <p className="text-sm text-slate-500">
                            .md や .txt ファイルを読み込んで編集を開始します。
                        </p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".md,.txt,.markdown"
                            onChange={handleFileChange}
                        />
                    </button>
                </div>

                {/* Footer info */}
                <p className="text-slate-400 text-sm">
                    v0.1.0 • Local Storage Auto-save
                </p>
            </div>
        </div>
    );
}
