---
name: editor-logic-md2bn
description: Markdown文字列をBlockNoteのブロック形式（JSON）に変換するパーサーを実装する。
allowed-tools: [file_edit]
meta:
  domain: frontend
  role: data-conversion
  tech_stack: "@blocknote/core"
  day: 2
  estimated_time: 50min
  dependencies: [editor-comp-blocknote]
---

# このスキルでやること

Markdown文字列をBlockNoteのブロック形式（JSON配列）に変換する関数を実装する。
モード切替時（Code → Rich）や、初期ロード時に使用される。

# 設計思想

## データフロー

```
┌─────────────────┐
│  Markdown文字列  │  ← Supabaseから取得 / Monacoから取得
│  (string)       │
└────────┬────────┘
         │ markdownToBlocks()
         ↓
┌─────────────────┐
│  BlockNote Blocks│  ← BlockNoteエディタが使用
│  (Block[])      │
└─────────────────┘
```

## BlockNote標準関数の使用

BlockNote v0.15以降では `tryParseMarkdownToBlocks` 関数が提供されている：

```typescript
import { tryParseMarkdownToBlocks } from '@blocknote/core';
```

# 作成するファイル

## `src/lib/editor/markdownToBlocks.ts`

```typescript
import { Block, BlockNoteEditor } from '@blocknote/core';

/**
 * Markdown文字列をBlockNoteのブロック配列に変換する
 * 
 * @param markdown - 変換するMarkdown文字列
 * @param editor - BlockNoteエディタインスタンス（コンテキスト用）
 * @returns BlockNote形式のブロック配列
 */
export async function markdownToBlocks(
  markdown: string,
  editor: BlockNoteEditor
): Promise<Block[]> {
  try {
    // BlockNote標準の変換関数を使用
    const blocks = await editor.tryParseMarkdownToBlocks(markdown);
    return blocks;
  } catch (error) {
    console.error('Markdown to Blocks conversion failed:', error);
    // フォールバック: 単一の段落ブロックとして処理
    return [
      {
        type: 'paragraph',
        content: markdown,
      },
    ];
  }
}
```

# 変換の注意点

## サポートされるMarkdown構文

| Markdown | BlockNoteブロック | 備考 |
|----------|------------------|------|
| `# 見出し` | heading (level 1) | ✅ 完全サポート |
| `## 見出し` | heading (level 2) | ✅ 完全サポート |
| `- リスト` | bulletListItem | ✅ 完全サポート |
| `1. 番号` | numberedListItem | ✅ 完全サポート |
| `> 引用` | quote (カスタム) | ⚠️ 要カスタムブロック |
| `\`\`\`code\`\`\`` | codeBlock | ✅ 完全サポート |
| `![alt](url)` | image | ✅ 完全サポート |
| `| 表 |` | table | ✅ 完全サポート |

## 公文書特有の構文

LineaDocでは公文書形式（見出し番号など）を扱う。これらはMarkdown標準ではないため、カスタム処理が必要になる可能性がある：

```markdown
# 1. 目的
## 1.1 背景
### 1.1.1 経緯
```

→ 現時点では標準のheadingブロックとして処理し、番号はテキストの一部として扱う。

# 使用例

```tsx
// BlockNoteEditorPane.tsx 内での使用

import { markdownToBlocks } from '@/lib/editor/markdownToBlocks';

useEffect(() => {
  if (mode === 'rich' && editor) {
    markdownToBlocks(markdown, editor).then((blocks) => {
      editor.replaceBlocks(editor.document, blocks);
    });
  }
}, [mode]);
```

# エラーハンドリング

## 変換失敗時のフォールバック

```typescript
try {
  const blocks = await editor.tryParseMarkdownToBlocks(markdown);
  return blocks;
} catch (error) {
  // 1. エラーログ
  console.error('Conversion failed:', error);
  
  // 2. ユーザー通知（オプション）
  // toast.error('Markdownの解析に失敗しました');
  
  // 3. フォールバック: 生のテキストとして表示
  return [{
    type: 'paragraph',
    content: [{ type: 'text', text: markdown }],
  }];
}
```

# 禁止事項

- **同期的な変換関数として実装しない**: `tryParseMarkdownToBlocks` は非同期。必ず `async/await` を使用。
- **エディタインスタンスなしで呼び出さない**: BlockNoteのコンテキストが必要。
- **空文字列を未処理で渡さない**: 空の場合は空配列 `[]` を返す。

# テスト方法

```typescript
// テストケース
const testCases = [
  { input: '# 見出し', expected: 'heading' },
  { input: '- リスト項目', expected: 'bulletListItem' },
  { input: '```\ncode\n```', expected: 'codeBlock' },
  { input: '', expected: [] }, // 空文字列
];
```

# 完了条件

- [ ] `src/lib/editor/markdownToBlocks.ts` が作成されている
- [ ] `tryParseMarkdownToBlocks` を使用している
- [ ] エラー時にフォールバックが動作する
- [ ] 空文字列を適切に処理できる
- [ ] BlockNoteEditorPaneから正しく呼び出せる

# 次のスキル

- `editor-logic-bn2md`: 逆方向の変換（Blocks → Markdown）
