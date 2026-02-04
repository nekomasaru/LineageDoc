---
name: editor-logic-bn2md
description: 編集されたブロックをMarkdown文字列にシリアライズしてストアを更新する。
allowed-tools: [file_edit]
meta:
  domain: frontend
  role: data-conversion
  tech_stack: "@blocknote/core"
  day: 2
  estimated_time: 50min
  dependencies: [editor-logic-md2bn]
---

# このスキルでやること

BlockNoteのブロック配列をMarkdown文字列に変換する関数を実装する。
BlockNote編集時のリアルタイム変換、およびモード切替時（Rich → Code）に使用される。

# 設計思想

## データフロー

```
┌─────────────────┐
│  BlockNote Blocks│  ← BlockNoteエディタの現在の状態
│  (Block[])      │
└────────┬────────┘
         │ blocksToMarkdown()
         ↓
┌─────────────────┐
│  Markdown文字列  │  ← editorStore.markdown へ保存
│  (string)       │     → Monacoで表示 / Supabaseへ保存
└─────────────────┘
```

## 「Lossy」変換の意味

BlockNote標準の `blocksToMarkdownLossy` は「非可逆（Lossy）」変換：

| BlockNote機能 | Markdown変換後 | 備考 |
|--------------|---------------|------|
| テキスト色 | ❌ 失われる | Markdownに色の概念がない |
| 背景色 | ❌ 失われる | 同上 |
| カスタムブロック | ⚠️ 要対応 | カスタム変換ロジックが必要 |
| 基本書式（太字等） | ✅ 保持 | `**bold**` 等に変換 |

**LineaDocにおいてはこれがメリット**：公文書は装飾を許さない設計のため、余計なスタイルが自動的に除去される。

# 作成するファイル

## `src/lib/editor/blocksToMarkdown.ts`

```typescript
import { Block, BlockNoteEditor } from '@blocknote/core';

/**
 * BlockNoteのブロック配列をMarkdown文字列に変換する
 * 
 * @param blocks - 変換するブロック配列
 * @param editor - BlockNoteエディタインスタンス（コンテキスト用）
 * @returns Markdown文字列
 */
export async function blocksToMarkdown(
  blocks: Block[],
  editor: BlockNoteEditor
): Promise<string> {
  try {
    // BlockNote標準の変換関数を使用
    const markdown = await editor.blocksToMarkdownLossy(blocks);
    return markdown;
  } catch (error) {
    console.error('Blocks to Markdown conversion failed:', error);
    // フォールバック: 空文字列を返す
    return '';
  }
}
```

# 変換の詳細

## 標準ブロックの変換結果

```typescript
// 入力: BlockNote Blocks
[
  { type: 'heading', props: { level: 1 }, content: [{ type: 'text', text: '見出し' }] },
  { type: 'paragraph', content: [{ type: 'text', text: '本文です。' }] },
  { type: 'bulletListItem', content: [{ type: 'text', text: 'リスト項目' }] },
]

// 出力: Markdown
`# 見出し

本文です。

- リスト項目
`
```

## インラインスタイルの変換

```typescript
// 入力
{ type: 'text', text: '太字', styles: { bold: true } }

// 出力
`**太字**`
```

# 使用例

## BlockNoteEditorPane内での使用

```tsx
import { blocksToMarkdown } from '@/lib/editor/blocksToMarkdown';
import { useDebouncedCallback } from 'use-debounce';

// Debounce付きで変換・更新
const debouncedUpdate = useDebouncedCallback(async () => {
  if (editor) {
    const md = await blocksToMarkdown(editor.document, editor);
    setMarkdown(md);
  }
}, 500);

// onChange で呼び出し
<BlockNoteView
  editor={editor}
  onChange={debouncedUpdate}
/>
```

## モード切替時の即時変換

```typescript
// editor-sync-handler で使用
async function syncBeforeModeChange() {
  const { mode } = useEditorStore.getState();
  
  if (mode === 'rich' && editor) {
    // Rich → Code 切替前に最新のMarkdownを取得
    const md = await blocksToMarkdown(editor.document, editor);
    setMarkdown(md);
  }
}
```

# パフォーマンス最適化

## Debounce の重要性

```typescript
// ❌ 悪い例: 毎キーストロークで変換
onChange={() => {
  const md = blocksToMarkdown(editor.document, editor);
  setMarkdown(md); // 高負荷
}}

// ✅ 良い例: 500ms Debounce
const debouncedUpdate = useDebouncedCallback(async () => {
  const md = await blocksToMarkdown(editor.document, editor);
  setMarkdown(md);
}, 500);
```

## プレビュー更新との連携

```
BlockNote編集
    ↓ (500ms debounce)
blocksToMarkdown()
    ↓
editorStore.setMarkdown()
    ↓ (自動リアクティブ)
PreviewPane 再レンダリング
```

# 禁止事項

- **Debounceなしでの頻繁な変換**: パフォーマンス劣化の原因。
- **同期的な関数として実装しない**: `blocksToMarkdownLossy` は非同期。
- **変換結果を直接DOMに反映しない**: 必ずストア経由で更新。
- **カスタムブロックの変換ロジック漏れ**: カスタムブロックを追加した場合は変換ロジックも追加する。

# テスト方法

```typescript
// 往復テスト（Round-trip）
const original = '# 見出し\n\n本文です。';
const blocks = await markdownToBlocks(original, editor);
const result = await blocksToMarkdown(blocks, editor);
// result と original が意味的に等価であることを確認
// （空白行の数などは異なる可能性がある）
```

# 完了条件

- [ ] `src/lib/editor/blocksToMarkdown.ts` が作成されている
- [ ] `blocksToMarkdownLossy` を使用している
- [ ] エラー時にフォールバック（空文字列）が動作する
- [ ] Debounce付きで使用できる
- [ ] モード切替時に正しくMarkdownが同期される

# 次のスキル

- `editor-sync-handler`: モード切替時の完全な同期処理
- `editor-ui-switcher`: モード切替UIの実装
