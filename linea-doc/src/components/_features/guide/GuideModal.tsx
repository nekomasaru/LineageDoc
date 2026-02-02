import React from 'react';
import { BookOpen, X, Edit3, Save, GitBranch, History, MousePointerClick, FileText } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

interface GuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function GuideModal({ isOpen, onClose }: GuideModalProps) {
    const { t } = useLanguage();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <div className="flex items-center gap-2 text-slate-800">
                        <BookOpen size={20} className="text-teal-600" />
                        <h2 className="text-lg font-bold tracking-tight">{t('guide.title')}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 text-slate-700">
                    <div className="space-y-6">
                        {/* Section 1: Basic */}
                        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                                {t('guide.basic')}
                            </h3>
                            <ul className="space-y-3 text-sm ml-4">
                                <li className="flex items-start gap-2.5">
                                    <span className="shrink-0 font-sans font-bold bg-slate-100 px-2 py-0.5 rounded text-[10px] mt-0.5 whitespace-nowrap min-w-[44px] text-center border border-slate-200">{t('guide.edit')}</span>
                                    <span className="text-slate-600 leading-relaxed">{t('guide.editDesc')}</span>
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <span className="shrink-0 font-sans font-bold bg-slate-100 px-2 py-0.5 rounded text-[10px] mt-0.5 whitespace-nowrap min-w-[44px] text-center border border-slate-200">{t('guide.save')}</span>
                                    <span className="text-slate-600 leading-relaxed">{t('guide.saveDesc')}</span>
                                </li>
                            </ul>
                        </div>

                        {/* Section 2: History */}
                        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                                {t('guide.history')}
                            </h3>
                            <ul className="space-y-3 text-sm ml-4">
                                <li className="flex items-start gap-2.5">
                                    <History size={16} className="text-teal-600 mt-0.5 shrink-0" />
                                    <div className="leading-relaxed">
                                        <span className="font-bold text-slate-700">{t('guide.checkVersion')}:</span>
                                        <span className="ml-1.5 text-slate-600">{t('guide.checkVersionDesc')}</span>
                                    </div>
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <div className="flex gap-0.5 mt-1.5 shrink-0">
                                        <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                    </div>
                                    <div className="leading-relaxed">
                                        <span className="font-bold text-slate-700">{t('guide.checkDiff')}:</span>
                                        <span className="ml-1.5 text-slate-600">{t('guide.checkDiffDesc')}</span>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        {/* Section 3: Features */}
                        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                                {t('guide.features')}
                            </h3>
                            <ul className="space-y-3 text-sm ml-4">
                                <li className="flex items-start gap-2.5">
                                    <MousePointerClick size={16} className="text-teal-600 mt-0.5 shrink-0" />
                                    <div className="leading-relaxed">
                                        <span className="font-bold text-slate-700">{t('guide.navigation')}:</span>
                                        <span className="ml-1.5 text-slate-600">{t('guide.navigationDesc')}</span>
                                    </div>
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <FileText size={16} className="text-teal-600 mt-0.5 shrink-0" />
                                    <div className="leading-relaxed">
                                        <span className="font-bold text-slate-700">{t('guide.export')}:</span>
                                        <span className="ml-1.5 text-slate-600">{t('guide.exportDesc')}</span>
                                    </div>
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <span className="shrink-0 text-[10px] font-mono bg-slate-100 px-1 py-0.5 rounded border border-slate-200 mt-0.5"># 1.</span>
                                    <div className="leading-relaxed">
                                        <span className="font-bold text-slate-700">{t('guide.autoNumber')}:</span>
                                        <span className="ml-1.5 text-slate-600">{t('guide.autoNumberDesc')}</span>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-all text-sm font-bold shadow-sm shadow-teal-200"
                    >
                        {t('guide.close')}
                    </button>
                </div>
            </div>
        </div>
    );
}
