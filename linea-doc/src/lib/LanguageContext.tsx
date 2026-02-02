'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'ja' | 'en';

type Translations = {
    [key in Language]: {
        [key: string]: string;
    };
};

const translations: Translations = {
    ja: {
        // Welcome Screen
        'app.tagline': 'AI-Powered Document Lineage',
        'welcome.createNew': '新規作成',
        'welcome.createNewDesc': '白紙の状態から新しいドキュメントを作成します。',
        'welcome.openFile': 'ファイルを開く',
        'welcome.openFileDesc': '.md や .txt ファイルを読み込んで編集を開始します。',
        'welcome.aiAssistant': 'AI アシスタント',
        'welcome.aiComingSoon': '文書の校正や改善提案を行うAIアシスタント機能は近日公開予定です。',
        'welcome.footer': 'v0.1.0 • Local Storage Auto-save',

        // Header
        'header.save': '保存',
        'header.saved': '保存済み',
        'header.unsaved': '未保存',
        'header.export': '保存 (Export)',
        'header.help': '使い方ガイド',
        'header.returnHome': 'ホームに戻る',
        'header.diff': 'v{version} との差分',
        'header.unsavedChanges': '未保存の変更',
        'header.branch': 'ブランチ: {branch}',

        // Lineage Panel
        'panel.title': 'Lineage', // Keep English
        'panel.latest': '最新',
        'panel.branchedFrom': 'v{version}から分岐',
        'panel.edit': '編集',
        'panel.branch': 'ブランチ',
        'panel.save': '保存',
        'panel.aiSuggest': 'AI提案',
        'panel.cancelEdit': '編集をキャンセル',
        'panel.cancelBranch': 'ブランチをキャンセル',
        'panel.createBranchFrom': 'このバージョンからブランチ',
        'panel.restoreAsLatest': 'v{version}を最新として復元',
        'panel.restore': '復元',
        'panel.clearHistory': '履歴をクリア',
        'panel.empty': '履歴はありません',

        // Guide Modal
        'guide.title': 'LineaDoc の使い方',
        'guide.basic': '基本操作',
        'guide.edit': '編集',
        'guide.editDesc': '中央のエディタでMarkdownを入力します。プレビューはリアルタイムで更新されます。',
        'guide.save': '保存',
        'guide.saveDesc': 'Ctrl + S で履歴を保存します。保存すると新しいバージョン(vN)が作成されます。',
        'guide.history': '履歴管理',
        'guide.checkVersion': 'バージョンの確認',
        'guide.checkVersionDesc': '左側のパネルで過去の履歴をクリックすると、その時点の内容を確認できます。',
        'guide.checkDiff': '差分の確認',
        'guide.checkDiffDesc': '青色は保存済み、緑色は未保存の変更を表示します。',
        'guide.features': '便利機能',
        'guide.navigation': 'キーボード操作',
        'guide.navigationDesc': 'エディタ外で↑↓を押すと、履歴をパラパラと切り替えられます。',
        'guide.export': 'エクスポート',
        'guide.exportDesc': 'ヘッダーのボタンから、現在の内容をMarkdownファイルとしてダウンロードできます。',
        'guide.autoNumber': '見出し自動採番',
        'guide.autoNumberDesc': 'プレビュー画面では、見出し(#)に合わせて自動的に番号(1. 1.1など)が表示されます。',
        'guide.close': '閉じる',

        // Modals
        'modal.closeFile.title': 'ファイルを閉じますか？',
        'modal.closeFile.desc': '現在の編集内容は破棄され、復元できなくなります。',
        'modal.closeFile.recommend': '※Markdownファイルとしてエクスポート（保存）してから閉じることを推奨します。',
        'modal.closeFile.exportExit': 'エクスポートして終了',
        'modal.closeFile.discardExit': '保存せずに終了',
        'modal.closeFile.cancel': 'キャンセル',

        'modal.branch.title': 'ブランチ作成',
        'modal.branch.label': 'この操作の目的（コメント）',
        'modal.branch.placeholder': '例：別案の作成、レイアウト変更前に戻す など',
        'modal.branch.note': '空欄の場合は「{title}」として記録されます。',
        'modal.branch.confirm': '確定',
        'modal.branch.cancel': 'キャンセル',

        'modal.comment.title': 'コメント編集',
        'modal.comment.label': 'コメント',
        'modal.comment.placeholder': '変更の理由や目的を入力',
        'modal.comment.save': '保存',

        'modal.reset.title': '履歴のリセット',
        'modal.reset.message': '履歴を全て削除し、現在の内容をv1として保存し直しますか？\n（現在のエディタの内容は維持されます）',
        'modal.reset.confirm': 'リセット',
        'modal.reset.cancel': 'キャンセル',

        // Save & History logic
        'save.newDocument': '新規ドキュメント',
        'save.importFile': '{filename} をインポート',
        'save.summary': '{chars}文字の変更を保存',
        'save.resetHistory': '履歴のリセット',
        'modal.restoreBranch.title': 'v{version}を復元',
        'modal.createBranch.title': 'v{version}からブランチ作成',

        // Preview & AI
        'preview.zoomIn': '拡大',
        'preview.zoomOut': '縮小',
        'preview.resetZoom': 'ズームリセット (100%)',
        'ai.title': 'AI アシスタント',
        'ai.description': 'AIによる文章校正や改善提案機能は近日公開予定です。',
        'ai.comingSoon': '近日公開',

        // Misc
        'common.cancel': 'キャンセル',
        'common.confirm': '確定',
    },
    en: {
        // Welcome Screen
        'app.tagline': 'AI-Powered Document Lineage',
        'welcome.createNew': 'Create New',
        'welcome.createNewDesc': 'Start a new document from scratch.',
        'welcome.openFile': 'Open File',
        'welcome.openFileDesc': 'Import .md or .txt files to start editing.',
        'welcome.aiAssistant': 'AI Assistant',
        'welcome.aiComingSoon': 'Proofreading and improvement suggestions powered by AI are coming soon.',
        'welcome.footer': 'v0.1.0 • Local Storage Auto-save',

        // Header
        'header.save': 'Save',
        'header.saved': 'Saved',
        'header.unsaved': 'Unsaved',
        'header.export': 'Export',
        'header.help': 'Help Guide',
        'header.returnHome': 'Return to Home',
        'header.diff': 'Diff with v{version}',
        'header.unsavedChanges': 'Unsaved Changes',
        'header.branch': 'Branch: {branch}',

        // Lineage Panel
        'panel.title': 'Lineage',
        'panel.latest': 'LATEST',
        'panel.branchedFrom': 'Branch from v{version}',
        'panel.edit': 'Edit',
        'panel.branch': 'Branch',
        'panel.save': 'Save',
        'panel.aiSuggest': 'AI Suggest',
        'panel.cancelEdit': 'Cancel Edit',
        'panel.cancelBranch': 'Cancel Branch',
        'panel.createBranchFrom': 'Create branch from this version',
        'panel.restoreAsLatest': 'Restore v{version} as latest',
        'panel.restore': 'Restore',
        'panel.clearHistory': 'Clear History',
        'panel.empty': 'No history',

        // Guide Modal
        'guide.title': 'How to use LineaDoc',
        'guide.basic': 'Basic Operations',
        'guide.edit': 'Edit',
        'guide.editDesc': 'Input Markdown in the editor. The preview updates in real-time.',
        'guide.save': 'Save',
        'guide.saveDesc': 'Press Ctrl+S to save history and create a new version (vN).',
        'guide.history': 'History Management',
        'guide.checkVersion': 'Check Versions',
        'guide.checkVersionDesc': 'Click entries in the history panel to view that specific version.',
        'guide.checkDiff': 'Check Diffs',
        'guide.checkDiffDesc': 'Blue shows saved changes, Green shows unsaved changes.',
        'guide.features': 'Useful Features',
        'guide.navigation': 'Navigation',
        'guide.navigationDesc': 'Press ↑ ↓ in empty areas to switch versions.',
        'guide.export': 'Export',
        'guide.exportDesc': 'Download current content as a Markdown file.',
        'guide.autoNumber': 'Auto-Numbering',
        'guide.autoNumberDesc': 'Headings (#) in preview are numbered automatically.',
        'guide.close': 'Close',

        // Modals
        'modal.closeFile.title': 'Close this file?',
        'modal.closeFile.desc': 'Your current session will be closed. Any unsaved changes will be lost.',
        'modal.closeFile.recommend': '* Recommended to Export as Markdown before closing.',
        'modal.closeFile.exportExit': 'Export and Exit',
        'modal.closeFile.discardExit': 'Discard and Exit',
        'modal.closeFile.cancel': 'Cancel',

        'modal.branch.title': 'Branch Verification', // Logic defines title dynamically, this is default
        'modal.branch.label': 'Operation Purpose (Comment)',
        'modal.branch.placeholder': 'e.g. Branching for Draft, Reverting to v1...',
        'modal.branch.note': 'If left blank, it will be recorded as "{title}".',
        'modal.branch.confirm': 'Confirm',
        'modal.branch.cancel': 'Cancel',

        'modal.comment.title': 'Edit Comment',
        'modal.comment.label': 'Comment',
        'modal.comment.placeholder': 'Enter reason or purpose for this change',
        'modal.comment.save': 'Save',

        'modal.reset.title': 'Reset History',
        'modal.reset.message': 'Are you sure you want to clear all history? Current content will be saved as v1. (This action cannot be undone)',
        'modal.reset.confirm': 'Reset',
        'modal.reset.cancel': 'Cancel',

        // Save & History logic
        'save.newDocument': 'New Document',
        'save.importFile': 'Import {filename}',
        'save.summary': 'Save {chars} chars change',
        'save.resetHistory': 'Reset History',
        'modal.restoreBranch.title': 'Restore v{version}',
        'modal.createBranch.title': 'Branch from v{version}',

        // Preview & AI
        'preview.zoomIn': 'Zoom In',
        'preview.zoomOut': 'Zoom Out',
        'preview.resetZoom': 'Reset Zoom (100%)',
        'ai.title': 'AI Assistant',
        'ai.description': 'Proofreading and improvement suggestions powered by AI are coming soon.',
        'ai.comingSoon': 'Coming Soon',

        // Misc
        'common.cancel': 'Cancel',
        'common.confirm': 'Confirm',
    }
};

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>('ja');

    const t = (key: string, params?: Record<string, string | number>) => {
        let text = translations[language][key] || key;
        if (params) {
            Object.entries(params).forEach(([k, v]) => {
                text = text.replace(`{${k}}`, String(v));
            });
        }
        return text;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
