---
name: editor-comp-monaco
description: 既存のMonaco実装をReactコンポーネントとして切り出し、Zustandストアと接続する。
allowed-tools: [file_edit]
meta:
  domain: frontend
  role: editor-component
  tech_stack: "@monaco-editor/react, zustand"
  day: 1
  estimated_time: 45min
  dependencies: [editor-state-store]
---

# このスキルでやること

既存の `MonacoWrapper.tsx` をリファクタリングし、`editorStore` と連動する新しいコンポーネントを作成する。
モード切替時（`mode === 'code'`）にのみ表示され、ストアのMarkdownを編集・同期する。

# 設計思想

## 既存実装の活用

現在の `MonacoWrapper.tsx` には以下の優れた機能がある：
- 2段階差分ハイライト（保存済み/未保存）
- スクロール同期
- 自動採番（`# ` + Space）

これらを**維持しつつ**、ストア連動を追加する。

## 責務の分離

```
┌─────────────────────────────────────────┐
│  editorStore (状態管理)                  │
│    - markdown: string                   │
│    - mode: 'rich' | 'code'              │
└─────────────────────────────────────────┘
         ↑ get/set          ↑ get/set
    ┌────┴────┐        ┌────┴────┐
    │ Monaco  │        │BlockNote│
    │Component│        │Component│
    └─────────┘        └─────────┘
```

# 作成・修正するファイル

## `src/components/_features/editor/MonacoEditorPane.tsx`

```tsx
'use client';

import { useEffect, useRef, useCallback } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useEditorStore } from '@/stores/editorStore';

interface MonacoEditorPaneProps {
  className?: string;
}

export function MonacoEditorPane({ className }: MonacoEditorPaneProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const isInternalUpdate = useRef(false);
  
  const { markdown, setMarkdown, mode, savedMarkdown } = useEditorStore();

  // エディタ初期化
  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
    
    // 初期値をセット
    editor.setValue(markdown);
    
    // フォーカス
    editor.focus();
  };

  // 編集時の処理
  const handleChange: OnChange = useCallback((value) => {
    if (isInternalUpdate.current) return;
    if (value !== undefined) {
      setMarkdown(value);
    }
  }, [setMarkdown]);

  // ストアのmarkdownが外部から変更された場合（モード切替時など）
  useEffect(() => {
    if (editorRef.current && mode === 'code') {
      const currentValue = editorRef.current.getValue();
      if (currentValue !== markdown) {
        isInternalUpdate.current = true;
        editorRef.current.setValue(markdown);
        isInternalUpdate.current = false;
      }
    }
  }, [markdown, mode]);

  // コードモード以外では表示しない
  if (mode !== 'code') {
    return null;
  }

  return (
    <div className={className}>
      <Editor
        height="100%"
        defaultLanguage="markdown"
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          wordWrap: 'on',
          lineNumbers: 'on',
          glyphMargin: true,
          folding: true,
          fontSize: 14,
          fontFamily: "'Noto Sans JP', 'Monaco', monospace",
        }}
        onMount={handleEditorMount}
        onChange={handleChange}
      />
    </div>
  );
}
```

# 既存機能の移植

以下の機能を段階的に移植する（このスキルでは基本連動のみ）：

| 機能 | 優先度 | 移植タイミング |
|------|--------|---------------|
| 基本表示・編集 | 🔴 必須 | このスキル |
| ストア連動 | 🔴 必須 | このスキル |
| 2段階差分ハイライト | 🟡 後回し | editor-sync-handler後 |
| スクロール同期 | 🟡 後回し | preview-css-engine後 |
| 自動採番 | 🟢 オプション | 後日 |

# 禁止事項

- **ストアを介さない直接的な値のやり取り**: 親コンポーネントから `value` propsで受け取らない。すべて `useEditorStore()` 経由。
- **無限ループの発生**: `setValue` と `onChange` が循環しないよう `isInternalUpdate` フラグで制御。
- **mode !== 'code' 時のレンダリング**: 非表示時はnullを返してDOMを生成しない。

# テスト方法

1. ストアに初期値をセット
2. Monacoで編集
3. `useEditorStore.getState().markdown` が更新されていることを確認
4. 外部から `setMarkdown()` を呼び、Monacoの表示が更新されることを確認

# 完了条件

- [ ] `MonacoEditorPane.tsx` が作成されている
- [ ] `mode === 'code'` の時のみ表示される
- [ ] 編集内容が `editorStore.markdown` に反映される
- [ ] ストアの変更がMonacoに反映される（双方向同期）
- [ ] 無限ループが発生しない

# 次のスキル

- `editor-ui-switcher`: このコンポーネントを表示/非表示するタブUI
- `editor-sync-handler`: モード切替時の同期処理
