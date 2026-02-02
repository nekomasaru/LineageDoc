---
name: editor-comp-blocknote
description: BlockNoteViewを実装し、初期化時にMarkdownをパースして表示する。
allowed-tools: [file_edit]
meta:
  domain: frontend
  role: editor-component
  tech_stack: "@blocknote/react, @blocknote/core, zustand"
  day: 2
  estimated_time: 60min
  dependencies: [editor-state-store]
---

# このスキルでやること

BlockNote（Notionライクなブロックエディタ）をReactコンポーネントとして実装し、`editorStore` と連動させる。
モード切替時（`mode === 'rich'`）にのみ表示される。

# 設計思想

## 組織OSアーキテクチャにおける位置づけ

```
入力層（エディタ）
    BlockNote = 「Notionのように書ける」インターフェース
    ↓
    Markdown文字列に変換
    ↓
処理層・蓄積層（Supabase）
```

## BlockNoteの選定理由

- **Notionライク**: ブロックベースのUI、スラッシュコマンド対応
- **Markdown変換**: `blocksToMarkdownLossy` で標準Markdownに変換可能
- **カスタマイズ性**: カスタムブロック、カスタムスタイル対応
- **無料**: XLパッケージは使わず、基本機能のみ使用

# パッケージ構成

```bash
npm install @blocknote/core @blocknote/react @blocknote/mantine
```

> **注意**: BlockNote v0.15以降では `@blocknote/mantine`（UIコンポーネント）が必要な場合があります。
> スタイルが崩れる場合は公式ドキュメントを確認してください。

# 作成するファイル

## `src/components/_features/editor/BlockNoteEditorPane.tsx`

```tsx
'use client';

import { useEffect, useMemo, useCallback } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { useEditorStore } from '@/stores/editorStore';
import { markdownToBlocks, blocksToMarkdown } from './blockNoteConverters';

interface BlockNoteEditorPaneProps {
  className?: string;
}

export function BlockNoteEditorPane({ className }: BlockNoteEditorPaneProps) {
  const { markdown, setMarkdown, mode } = useEditorStore();

  // BlockNoteエディタのインスタンス作成
  const editor = useCreateBlockNote({
    // 初期コンテンツは後からセット
  });

  // 初期化時 & mode切替時にMarkdownをパース
  useEffect(() => {
    if (mode === 'rich' && editor) {
      const blocks = markdownToBlocks(markdown);
      editor.replaceBlocks(editor.document, blocks);
    }
  }, [mode]); // markdown変更時には走らせない（編集中のため）

  // ブロック変更時にMarkdownに変換してストアを更新
  const handleChange = useCallback(() => {
    if (editor) {
      const md = blocksToMarkdown(editor.document);
      setMarkdown(md);
    }
  }, [editor, setMarkdown]);

  // リッチモード以外では表示しない
  if (mode !== 'rich') {
    return null;
  }

  return (
    <div className={className}>
      <BlockNoteView
        editor={editor}
        onChange={handleChange}
        theme="light"
      />
    </div>
  );
}
```

## 変換ロジック（別スキルで詳細実装）

```tsx
// src/components/_features/editor/blockNoteConverters.ts
// 詳細は editor-logic-md2bn, editor-logic-bn2md スキルで実装

export function markdownToBlocks(markdown: string): Block[] {
  // editor-logic-md2bn で実装
  // 暫定: 空配列を返す
  return [];
}

export function blocksToMarkdown(blocks: Block[]): string {
  // editor-logic-bn2md で実装
  // 暫定: 空文字列を返す
  return '';
}
```

# UIカスタマイズ

## テーマ設定

```tsx
<BlockNoteView
  editor={editor}
  theme="light" // または "dark"
/>
```

## カスタムスタイル（globals.css）

```css
/* BlockNote のカスタマイズ */
.bn-container {
  font-family: 'Noto Sans JP', sans-serif;
}

.bn-block-content {
  padding: 4px 0;
}
```

# 禁止事項

- **Split View同時編集**: MonacoとBlockNoteを同時に表示・編集可能にしない。モード切替方式を採用。
- **ストアを介さない状態管理**: BlockNoteの内部状態をそのまま保持しない。必ずMarkdownに変換してストアに保存。
- **XLパッケージの使用**: 無料版のみ使用。AI機能は自前で実装する。
- **直接的なBlocks JSONの永続化**: Supabaseに保存するのはMarkdown文字列。Blocks JSONは保存しない。

# パフォーマンス考慮

## Debounce

BlockNote編集中のプレビュー更新は負荷が高い。`onChange` 内で `setMarkdown` を即座に呼ぶのではなく、500ms〜1000msのDebounceを推奨：

```tsx
import { useDebouncedCallback } from 'use-debounce';

const debouncedSetMarkdown = useDebouncedCallback(
  (md: string) => setMarkdown(md),
  500
);
```

# 完了条件

- [ ] `@blocknote/react`, `@blocknote/core`, `@blocknote/mantine` がインストールされている
- [ ] `BlockNoteEditorPane.tsx` が作成されている
- [ ] `mode === 'rich'` の時のみ表示される
- [ ] 編集内容が `editorStore.markdown` に反映される（Debounce付き）
- [ ] スラッシュコマンドが動作する

# 次のスキル

- `editor-logic-md2bn`: Markdown → Blocks 変換の詳細実装
- `editor-logic-bn2md`: Blocks → Markdown 変換の詳細実装
