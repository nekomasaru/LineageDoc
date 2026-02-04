/**
 * japaneseSlashMenu.ts
 * 
 * BlockNoteスラッシュコマンドの日本語化
 * MPL-2.0準拠: BlockNote本体は改変せず、新規ファイルとして実装
 * 
 * @skill editor-comp-blocknote
 */

import type { BlockNoteEditor } from '@blocknote/core';

/**
 * スラッシュメニュー項目の日本語翻訳マップ
 */
export const JAPANESE_SLASH_LABELS: Record<string, { title: string; subtext: string }> = {
    // 見出し
    'Heading 1': { title: '見出し1', subtext: '大見出しを挿入' },
    'Heading 2': { title: '見出し2', subtext: '中見出しを挿入' },
    'Heading 3': { title: '見出し3', subtext: '小見出しを挿入' },

    // トグル見出し
    'Toggle Heading 1': { title: 'トグル見出し1', subtext: '折りたたみ可能な大見出し' },
    'Toggle Heading 2': { title: 'トグル見出し2', subtext: '折りたたみ可能な中見出し' },
    'Toggle Heading 3': { title: 'トグル見出し3', subtext: '折りたたみ可能な小見出し' },

    // その他の見出し
    'Heading 4': { title: '見出し4', subtext: '極小見出しを挿入' },
    'Heading 5': { title: '見出し5', subtext: '極小見出しを挿入' },
    'Heading 6': { title: '見出し6', subtext: '極小見出しを挿入' },

    // 基本ブロック
    'Paragraph': { title: '段落', subtext: '本文テキスト' },
    'Bullet List': { title: '箇条書き', subtext: '・で始まるリスト' },
    'Numbered List': { title: '番号リスト', subtext: '1. で始まるリスト' },
    'Check List': { title: 'チェックリスト', subtext: 'タスクリスト' },
    'Toggle List': { title: 'トグルリスト', subtext: '折りたたみ可能なリスト' },
    'To-do List': { title: 'ToDoリスト', subtext: 'チェックボックス付きリスト' },

    // メディア・埋め込み
    'Image': { title: '画像', subtext: '画像を挿入' },
    'Video': { title: '動画', subtext: '動画を埋め込み' },
    'Audio': { title: '音声', subtext: '音声を埋め込み' },
    'File': { title: 'ファイル', subtext: 'ファイルを添付' },

    // 構造
    'Table': { title: '表', subtext: 'テーブルを挿入' },
    'Code Block': { title: 'コードブロック', subtext: 'コードを挿入' },
    'Quote': { title: '引用', subtext: '引用文を挿入' },
    'Blockquote': { title: '引用ブロック', subtext: '引用を挿入' },
    'Div': { title: '区切り', subtext: 'コンテンツをグループ化' },

    // その他
    'Emoji': { title: '絵文字', subtext: '絵文字を挿入' },
};

/**
 * デフォルトのスラッシュメニュー項目を日本語化する
 * 
 * @param items - デフォルトのスラッシュメニュー項目
 * @returns 日本語化されたスラッシュメニュー項目
 */
export function translateSlashMenuItems<T extends { title: string; subtext?: string }>(
    items: T[]
): T[] {
    return items.map((item) => {
        const translation = JAPANESE_SLASH_LABELS[item.title];
        if (translation) {
            return {
                ...item,
                title: translation.title,
                subtext: translation.subtext,
            };
        }
        return item;
    });
}

/**
 * 日本語化されたスラッシュメニューをフィルタリングする
 * 
 * @param items - スラッシュメニュー項目
 * @param query - 検索クエリ
 * @returns フィルタリングされた項目
 */
export function filterJapaneseSlashMenuItems<T extends { title: string; subtext?: string }>(
    items: T[],
    query: string
): T[] {
    const lowerQuery = query.toLowerCase();

    return items.filter((item) => {
        // 日本語タイトルで検索
        if (item.title.toLowerCase().includes(lowerQuery)) return true;

        // 日本語サブテキストで検索
        if (item.subtext && item.subtext.toLowerCase().includes(lowerQuery)) return true;

        // 元の英語名でも検索できるように
        const originalTitle = Object.entries(JAPANESE_SLASH_LABELS)
            .find(([, v]) => v.title === item.title)?.[0];
        if (originalTitle && originalTitle.toLowerCase().includes(lowerQuery)) return true;

        return false;
    });
}

/**
 * スラッシュメニューのキーワードエイリアス
 * 日本語入力でも英語コマンドが動作するように
 */
export const SLASH_ALIASES: Record<string, string[]> = {
    'Heading 1': ['みだし1', 'h1', '大見出し'],
    'Heading 2': ['みだし2', 'h2', '中見出し'],
    'Heading 3': ['みだし3', 'h3', '小見出し'],
    'Paragraph': ['だんらく', 'ほんぶん', 'p'],
    'Bullet List': ['かじょうがき', 'リスト', 'ul'],
    'Numbered List': ['ばんごうリスト', 'ol'],
    'Table': ['ひょう', 'テーブル'],
    'Code Block': ['こーど', 'コード'],
    'Quote': ['いんよう'],
    'Image': ['がぞう', 'img'],
};
