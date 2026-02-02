---
name: preview-pane
description: Markdown を公文書スタイル（A4・Noto Sans JP）でレンダリングし、テンプレート選択で出力形式を切り替える「出力プレビュー」機能。
allowed-tools: [file_edit]
meta:
  domain: frontend
  role: preview-component
  tech_stack: react, react-markdown, tailwind-css
  phase: 2
  estimated_time: 60min
  dependencies: [editor-state-store]
---

# このスキルでやること

「プレビュー/出力設定」画面を実装する。単なる見た目確認ではなく、**最終出力（PDF/印刷）のためのスタイル設定画面**として位置づける。

# 設計思想（UX方針変更 2026-02）

## 従来の「常時プレビュー」からの変更

```
【従来】
┌───────────────┬───────────────┐
│   エディタ    │   プレビュー   │  ← 常に50%ずつ表示
└───────────────┴───────────────┘

【新方針】
┌─────────────────────────────────┐
│         BlockNote エディタ       │  ← 執筆中はエディタのみ
│       （WYSIWYG = 見たままで編集）│
└─────────────────────────────────┘
           ↓ 「プレビュー/出力」ボタン
┌─────────────────────────────────┐
│  📄 出力プレビュー（モーダル）    │
│  ┌──────────┬─────────────────┐ │
│  │テンプレート│   印刷プレビュー │ │
│  │  設定     │                 │ │
│  └──────────┴─────────────────┘ │
└─────────────────────────────────┘
```

## なぜ変更するか

1. **BlockNoteがWYSIWYG**: 編集中に見た目が整っているので、常時プレビューは冗長。
2. **プレビューの目的が変わった**: 「確認」→「最終出力の設定」。
3. **画面を広く使える**: エディタに集中できる。

# 対応するテンプレート（初期版）

| テンプレートID | 名前 | 特徴 |
|--------------|------|------|
| `official` | 公文書 | A4縦、明朝体、鏡文（様式）あり |
| `contract` | 契約書 | 甲乙表記、署名欄、条項番号 |
| `minutes` | 議事録 | 日時・場所・出席者・議題・決定事項 |
| `plain` | シンプル | 装飾なし、ゴシック体 |

# 作成するファイル

## `src/components/_features/preview/PreviewModal.tsx`

```tsx
'use client';

import { useState, useMemo } from 'react';
import { X, Printer, Download, FileText } from 'lucide-react';
import { useEditorStore } from '@/stores/editorStore';
import { PreviewRenderer } from './PreviewRenderer';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TemplateId = 'official' | 'contract' | 'minutes' | 'plain';

const TEMPLATES: { id: TemplateId; name: string; icon: string }[] = [
  { id: 'official', name: '公文書', icon: '📄' },
  { id: 'contract', name: '契約書', icon: '📝' },
  { id: 'minutes', name: '議事録', icon: '📋' },
  { id: 'plain', name: 'シンプル', icon: '📃' },
];

export function PreviewModal({ isOpen, onClose }: PreviewModalProps) {
  const { markdown } = useEditorStore();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('official');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-[90vw] h-[90vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">出力プレビュー</h2>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg hover:bg-slate-200">
              <Printer className="w-4 h-4" />
              印刷
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
              <Download className="w-4 h-4" />
              PDF出力
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ボディ */}
        <div className="flex-1 flex overflow-hidden">
          {/* 左: テンプレート選択 */}
          <div className="w-64 border-r bg-slate-50 p-4">
            <h3 className="text-sm font-medium text-slate-500 mb-3">テンプレート</h3>
            <div className="space-y-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left ${
                    selectedTemplate === t.id
                      ? 'bg-teal-100 text-teal-700'
                      : 'hover:bg-slate-100'
                  }`}
                >
                  <span className="text-xl">{t.icon}</span>
                  <span className="text-sm">{t.name}</span>
                </button>
              ))}
            </div>

            {/* 差し込み設定（将来） */}
            <h3 className="text-sm font-medium text-slate-500 mt-6 mb-3">差し込み設定</h3>
            <p className="text-xs text-slate-400">（将来実装）</p>
          </div>

          {/* 右: プレビュー */}
          <div className="flex-1 bg-slate-200 p-8 overflow-auto">
            <PreviewRenderer
              markdown={markdown}
              template={selectedTemplate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
```

## `src/components/_features/preview/PreviewRenderer.tsx`

```tsx
'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface PreviewRendererProps {
  markdown: string;
  template: 'official' | 'contract' | 'minutes' | 'plain';
}

// テンプレートごとのスタイルクラス
const TEMPLATE_STYLES: Record<string, string> = {
  official: 'font-serif text-base leading-relaxed',
  contract: 'font-serif text-sm leading-loose',
  minutes: 'font-sans text-sm',
  plain: 'font-sans text-base',
};

export function PreviewRenderer({ markdown, template }: PreviewRendererProps) {
  const baseStyle = TEMPLATE_STYLES[template] || TEMPLATE_STYLES.plain;

  return (
    <div className="bg-white shadow-lg mx-auto" style={{ width: '210mm', minHeight: '297mm' }}>
      <article className={`p-12 ${baseStyle}`}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {markdown}
        </ReactMarkdown>
      </article>
    </div>
  );
}
```

# 使用例

```tsx
// app/hybrid/page.tsx での使用

import { useState } from 'react';
import { PreviewModal } from '@/components/_features/preview/PreviewModal';

function Page() {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <>
      <button onClick={() => setShowPreview(true)}>
        プレビュー/出力
      </button>
      <PreviewModal isOpen={showPreview} onClose={() => setShowPreview(false)} />
    </>
  );
}
```

# 禁止事項

- **常時分割表示**: BlockNote使用時はプレビュー不要。モーダルで十分。
- **テンプレート設定のハードコード**: 将来的にはJSON/DBから取得可能に。
- **PDF生成のブラウザ依存**: 将来は `react-pdf` や サーバーサイドで。

# 完了条件

- [ ] `PreviewModal.tsx` が作成されている
- [ ] `PreviewRenderer.tsx` が作成されている
- [ ] テンプレート切り替えでスタイルが変わる
- [ ] A4サイズ（210mm x 297mm）でプレビューされる
- [ ] 印刷/PDF出力ボタンが配置されている（機能はスタブでOK）

# 次のスキル

- `lineage-visualization`: 履歴・監査モードの実装
