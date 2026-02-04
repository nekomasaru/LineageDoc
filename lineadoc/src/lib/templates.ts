
export interface DocTemplate {
    id: string;
    name: string;
    description: string;
    icon: string;
    initialContent: string;
    initialSchema: string; // MDSchema definition
    category: 'basic' | 'business' | 'tech';
}

export const TEMPLATES: DocTemplate[] = [
    {
        id: 'empty',
        name: '空のドキュメント',
        description: '白紙の状態から自由に記述を開始します。',
        icon: 'FileText',
        initialContent: '# 新規ドキュメント\n\nここに内容を入力してください。',
        initialSchema: '# MDSchema: Basic\n- title: string\n- content: markdown',
        category: 'basic'
    },
    {
        id: 'minutes',
        name: '議事録 (Minutes)',
        description: '会議の日時、参加者、決定事項、ネクストアクションを記録します。',
        icon: 'Calendar',
        initialContent: '# 会議議事録\n\n## 概要\n- **日時**: 2024年 月 日\n- **場所**: \n- **参加者**: \n\n## アジェンダ\n1. \n\n## 決定事項\n- \n\n## ネクストアクション\n- [ ] ',
        initialSchema: 'structure:\n  - level: 1\n    text: "会議議事録"\n  - level: 2\n    text: "概要"\n  - level: 2\n    text: "アジェンダ"\n  - level: 2\n    text: "決定事項"\n  - level: 2\n    text: "ネクストアクション"',
        category: 'business'
    },
    {
        id: 'knowledge',
        name: 'ナレッジ / ノウハウ',
        description: '技術的な知見や業務上のマニュアルを構造化して共有します。',
        icon: 'Lightbulb',
        initialContent: '# ナレッジ共有: [タイトル]\n\n## 背景\n\n## 手順 / 解法\n\n## 注意点\n\n## 参考リンク\n',
        initialSchema: 'structure:\n  - level: 1\n    text: "/^ナレッジ共有:.*$/"\n  - level: 2\n    text: "背景"\n  - level: 2\n    text: "手順 / 解法"\n  - level: 2\n    text: "注意点"\n  - level: 2\n    text: "参考リンク"',
        category: 'tech'
    },
    {
        id: 'report',
        name: '業務日報 / 週報',
        description: 'その日の活動内容、成果、課題をまとめます。',
        icon: 'ClipboardList',
        initialContent: '# 業務日報: 2024-02-05\n\n## 本日の業務内容\n- \n\n## 成果 / 進捗\n- \n\n## 課題 / 相談事項\n- \n\n## 明日の予定\n- ',
        initialSchema: 'structure:\n  - level: 1\n    text: "/^業務日報:.*$/"\n  - level: 2\n    text: "本日の業務内容"\n  - level: 2\n    text: "成果 / 進捗"\n  - level: 2\n    text: "課題 / 相談事項"\n  - level: 2\n    text: "明日の予定"',
        category: 'business'
    }
];
