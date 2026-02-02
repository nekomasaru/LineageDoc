import React, { useCallback, useRef } from 'react';
import { Plus, Upload, Globe } from 'lucide-react';
import { Logo } from '@/components/_shared/Logo';
import { useLanguage } from '@/lib/LanguageContext';

interface WelcomeScreenProps {
    onCreateNew: () => void;
    onImportFile: (content: string, filename: string) => void;
}

export function WelcomeScreen({ onCreateNew, onImportFile }: WelcomeScreenProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { t, language, setLanguage } = useLanguage();

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
        <div className="min-h-full w-full flex flex-col items-center justify-center bg-slate-50 p-6 animate-in fade-in duration-500 relative">
            {/* Language Toggle */}
            <div className="absolute top-6 right-6 flex items-center gap-2 bg-white rounded-full p-1 shadow-sm border border-slate-200">
                <Globe size={14} className="text-slate-400 ml-2" />
                <div className="flex bg-slate-100 rounded-full p-0.5">
                    <button
                        onClick={() => setLanguage('ja')}
                        className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${language === 'ja'
                            ? 'bg-white text-teal-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        JP
                    </button>
                    <button
                        onClick={() => setLanguage('en')}
                        className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${language === 'en'
                            ? 'bg-white text-teal-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        EN
                    </button>
                </div>
            </div>

            <div className="max-w-2xl w-full text-center space-y-12">

                {/* Branding */}
                <div className="mb-10 flex flex-col items-center">
                    <div className="mb-6">
                        <Logo size={120} />
                    </div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">LineaDoc</h1>
                    <p className="text-slate-500 text-xl font-medium tracking-wide">
                        {t('app.tagline')}
                    </p>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-lg mx-auto">
                    {/* New File */}
                    <button
                        onClick={onCreateNew}
                        className="group flex flex-col items-center p-8 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-300 hover:-translate-y-1 transition-all duration-200"
                    >
                        <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-teal-600 group-hover:text-white transition-all duration-300 shadow-inner">
                            <Plus size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">{t('welcome.createNew')}</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            {t('welcome.createNewDesc')}
                        </p>
                    </button>

                    {/* Import */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="group flex flex-col items-center p-8 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-cyan-300 hover:-translate-y-1 transition-all duration-200 relative"
                    >
                        <div className="w-16 h-16 bg-cyan-50 text-cyan-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-cyan-600 group-hover:text-white transition-all duration-300 shadow-inner">
                            <Upload size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">{t('welcome.openFile')}</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            {t('welcome.openFileDesc')}
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
                    {t('welcome.footer')}
                </p>
            </div>
        </div>
    );
}
