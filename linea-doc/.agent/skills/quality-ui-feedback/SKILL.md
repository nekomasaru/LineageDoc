---
name: quality-ui-feedback
description: エディタ下部にLintエラーや警告を表示するパネルを作成する。
allowed-tools: [file_edit]
meta:
  domain: frontend
  role: ui-component
  tech_stack: react, tailwind-css
  phase: 2
  estimated_time: 40min
  dependencies: [quality-logic-lint]
---

# このスキルでやること

Valeによる文体チェック結果（エラー・警告・提案）をエディタ下部のパネルに表示するUIコンポーネントを作成する。

# 設計思想

## UIレイアウト

```
┌─────────────────────────────────────────────────────┐
│  [📝 リッチ編集]  [</> ソースコード]                  │
├─────────────────┬───────────────────────────────────┤
│                 │                                   │
│   エディタ       │         プレビュー                │
│                 │                                   │
├─────────────────┴───────────────────────────────────┤
│  [⚠️ 3件の指摘]  [▲ 折りたたみ]                      │  ← 問題パネル
│  ─────────────────────────────────────────────────  │
│  ⛔ 行5: '等々' は使用を避けてください               │
│  ⚠️ 行12: '行なう' は '行う' に統一してください       │
│  💡 行18: 見出しには番号を含めることを推奨します      │
└─────────────────────────────────────────────────────┘
```

# 作成するファイル

## `src/components/_features/editor/LintPanel.tsx`

```tsx
'use client';

import { useState } from 'react';
import { AlertCircle, AlertTriangle, Lightbulb, ChevronUp, ChevronDown } from 'lucide-react';

interface LintIssue {
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'suggestion';
  message: string;
  rule: string;
}

interface LintPanelProps {
  issues: LintIssue[];
  isLoading?: boolean;
  onIssueClick?: (issue: LintIssue) => void;
}

export function LintPanel({ issues, isLoading, onIssueClick }: LintPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const suggestionCount = issues.filter(i => i.severity === 'suggestion').length;
  
  if (issues.length === 0 && !isLoading) {
    return null; // 問題がなければ表示しない
  }
  
  return (
    <div className="border-t border-slate-200 bg-white">
      {/* ヘッダー */}
      <div
        className="flex items-center justify-between px-4 py-2 bg-slate-50 cursor-pointer hover:bg-slate-100"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-4 text-sm">
          {isLoading ? (
            <span className="text-slate-500">チェック中...</span>
          ) : (
            <>
              {errorCount > 0 && (
                <span className="flex items-center gap-1 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  {errorCount}
                </span>
              )}
              {warningCount > 0 && (
                <span className="flex items-center gap-1 text-amber-600">
                  <AlertTriangle className="w-4 h-4" />
                  {warningCount}
                </span>
              )}
              {suggestionCount > 0 && (
                <span className="flex items-center gap-1 text-blue-600">
                  <Lightbulb className="w-4 h-4" />
                  {suggestionCount}
                </span>
              )}
              <span className="text-slate-500">{issues.length}件の指摘</span>
            </>
          )}
        </div>
        
        <button className="text-slate-400 hover:text-slate-600">
          {isCollapsed ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>
      
      {/* 問題リスト */}
      {!isCollapsed && (
        <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
          {issues.map((issue, index) => (
            <button
              key={index}
              onClick={() => onIssueClick?.(issue)}
              className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-start gap-3"
            >
              <span className="flex-shrink-0 mt-0.5">
                {getSeverityIcon(issue.severity)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-xs font-mono">
                    行{issue.line}
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className={`text-xs ${getSeverityTextColor(issue.severity)}`}>
                    {issue.rule}
                  </span>
                </div>
                <p className="text-sm text-slate-700 truncate">
                  {issue.message}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function getSeverityIcon(severity: string) {
  switch (severity) {
    case 'error':
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    default:
      return <Lightbulb className="w-4 h-4 text-blue-500" />;
  }
}

function getSeverityTextColor(severity: string) {
  switch (severity) {
    case 'error':
      return 'text-red-600';
    case 'warning':
      return 'text-amber-600';
    default:
      return 'text-blue-600';
  }
}
```

# SplitEditorLayoutへの統合

```tsx
// src/components/_features/editor/SplitEditorLayout.tsx

import { LintPanel } from './LintPanel';

export function SplitEditorLayout() {
  const [lintIssues, setLintIssues] = useState<LintIssue[]>([]);
  const [isLinting, setIsLinting] = useState(false);
  
  // 問題クリック時にエディタの該当行へジャンプ
  const handleIssueClick = (issue: LintIssue) => {
    // Monaco の場合
    if (mode === 'code' && monacoRef.current) {
      monacoRef.current.revealLineInCenter(issue.line);
      monacoRef.current.setPosition({ lineNumber: issue.line, column: issue.column });
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* モード切替タブ */}
      <EditorModeSwitcher />
      
      {/* エディタ + プレビュー */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左ペイン */}
        {/* 右ペイン */}
      </div>
      
      {/* 問題パネル */}
      <LintPanel
        issues={lintIssues}
        isLoading={isLinting}
        onIssueClick={handleIssueClick}
      />
    </div>
  );
}
```

# アクセシビリティ

```tsx
<button
  role="listitem"
  aria-label={`${issue.severity}: 行${issue.line} - ${issue.message}`}
  ...
>
```

# スタイリングルール（ui-component-basic準拠）

| 要素 | スタイル |
|------|---------|
| エラー | `text-red-600`, `bg-red-50` |
| 警告 | `text-amber-600`, `bg-amber-50` |
| 提案 | `text-blue-600`, `bg-blue-50` |
| パネル背景 | `bg-white`, `border-slate-200` |
| ホバー | `hover:bg-slate-50` |

# 禁止事項

- **問題がないときにパネルを表示しない**: 0件のときは `null` を返す。
- **長大なリストのパフォーマンス問題**: `max-h-48 overflow-y-auto` で制限。
- **アクセシビリティの無視**: キーボードナビゲーション、スクリーンリーダー対応。
- **エラーをすべて同じ色で表示**: severity ごとに色分け必須。

# 完了条件

- [ ] `LintPanel.tsx` が作成されている
- [ ] エラー/警告/提案ごとに色分け表示される
- [ ] 折りたたみ/展開が動作する
- [ ] 問題クリックでエディタの該当行にジャンプする
- [ ] 問題が0件の場合は非表示になる
- [ ] ローディング状態が表示される

# 次のスキル

- `history-ui-timeline`: 履歴表示パネルの実装
