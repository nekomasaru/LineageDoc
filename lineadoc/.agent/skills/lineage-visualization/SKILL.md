---
name: linea-visualization
description: 変更履歴（Linea）のタイムライン表示やDiff可視化の実装、グラフ描画ロジック。
allowed-tools: [file_edit]
meta:
  domain: frontend
  role: visualization
  tech_stack: react, svg, diff
  phase: 3
  estimated_time: 90min
  dependencies: [history-ui-timeline]
---

# このスキルでやること

LineaDoc のコア機能である「変更履歴の可視化（リネージグラフ）」を実装する。
SVGベースのグラフ描画と、バージョン間のDiff表示を提供する。

# 設計思想

## LineaDocのコアバリュー

> **「AI-Powered Document Lineage」** — 文書作成の「プロセス」と「変更履歴」を可視化するエディタ。

「Linea」= ラテン語で「線」。文書の変遷を一本の線で繋ぐイメージ。

## 可視化の種類

1. **タイムライングラフ**: 時系列での変更履歴（縦軸：時間、横軸：分岐）
2. **Diffビュー**: 2つのバージョン間の差分表示
3. **ミニマップ**: 現在位置の概要表示

# UIレイアウト

```
┌─────────────────────────────────────────────────────────┐
│                         Linea Panel                     │
├───────────────────────┬─────────────────────────────────┤
│                       │                                 │
│   ●──── v12           │   Diff View (v11 → v12)         │
│   │                   │                                 │
│   ●──── v11           │   - 削除された行                │
│   │                   │   + 追加された行                │
│   ●──── v10           │                                 │
│   │                   │                                 │
│   ├──●─ v9 (branch)   │                                 │
│   │  │                │                                 │
│   ●──┴─ v8            │                                 │
│   │                   │                                 │
│   ●──── v1            │                                 │
│                       │                                 │
└───────────────────────┴─────────────────────────────────┘
```

# 作成するファイル

## `src/lib/lineage-utils.ts`（既存を拡張）

```typescript
import { Version } from '@/lib/database.types';

interface LayoutNode {
  version: Version;
  x: number;  // 横位置（分岐インデックス）
  y: number;  // 縦位置（時系列）
}

interface LayoutLink {
  sourceId: string;
  targetId: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  isBranch: boolean;
}

/**
 * バージョン履歴からグラフレイアウトを計算する
 */
export function calculateLayout(versions: Version[]): {
  nodes: LayoutNode[];
  links: LayoutLink[];
} {
  // 時系列でソート（新しい順）
  const sorted = [...versions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const nodes: LayoutNode[] = sorted.map((v, i) => ({
    version: v,
    x: 0, // 基本は x=0（メインライン）
    y: i,
  }));

  const links: LayoutLink[] = [];

  // 親子関係からリンクを生成
  for (let i = 0; i < nodes.length - 1; i++) {
    links.push({
      sourceId: nodes[i].version.id,
      targetId: nodes[i + 1].version.id,
      sourceX: nodes[i].x,
      sourceY: nodes[i].y,
      targetX: nodes[i + 1].x,
      targetY: nodes[i + 1].y,
      isBranch: false,
    });
  }

  return { nodes, links };
}
```

## `src/components/_features/lineage/LineageGraph.tsx`

```tsx
'use client';

import { useMemo } from 'react';
import { calculateLayout } from '@/lib/lineage-utils';
import { Version } from '@/lib/database.types';

interface LineageGraphProps {
  versions: Version[];
  currentVersionId?: string;
  onVersionClick?: (version: Version) => void;
}

const NODE_RADIUS = 12;
const NODE_SPACING_Y = 90; // 広幅に変更して要約・ラベルの視認性を確保
const NODE_SPACING_X = 40;
const LEFT_MARGIN = 60;

export function LineageGraph({
  versions,
  currentVersionId,
  onVersionClick,
}: LineageGraphProps) {
  const { nodes, links } = useMemo(
    () => calculateLayout(versions),
    [versions]
  );

  const width = 200;
  const height = nodes.length * NODE_SPACING_Y + PADDING * 2;

  return (
    <svg
      width={width}
      height={height}
      className="overflow-visible"
    >
      {/* 接続線 */}
      <g className="links">
        {links.map((link) => (
          <path
            key={`${link.sourceId}-${link.targetId}`}
            d={`
              M ${PADDING + link.sourceX * NODE_SPACING_X} ${PADDING + link.sourceY * NODE_SPACING_Y}
              L ${PADDING + link.targetX * NODE_SPACING_X} ${PADDING + link.targetY * NODE_SPACING_Y}
            `}
            stroke={link.isBranch ? '#94a3b8' : '#0d9488'}
            strokeWidth={2}
            fill="none"
          />
        ))}
      </g>

      {/* ノード */}
      <g className="nodes">
        {nodes.map((node) => (
          <g
            key={node.version.id}
            transform={`translate(${PADDING + node.x * NODE_SPACING_X}, ${PADDING + node.y * NODE_SPACING_Y})`}
            onClick={() => onVersionClick?.(node.version)}
            className="cursor-pointer"
          >
            <circle
              r={NODE_RADIUS}
              fill={node.version.id === currentVersionId ? '#0d9488' : '#fff'}
              stroke="#0d9488"
              strokeWidth={2}
            />
            <text
              x={NODE_RADIUS + 8}
              y={4}
              className="text-xs fill-slate-600"
            >
              v{node.version.version_number}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}
```

      </div>
    </div>
  );
}

## `src/components/_features/lineage/DiffView.tsx`

```tsx
'use client';

import { useMemo } from 'react';
import { diffLines, Change } from 'diff';

interface DiffViewProps {
  oldContent: string;
  newContent: string;
  oldLabel?: string;
  newLabel?: string;
}

export function DiffView({
  oldContent,
  newContent,
  oldLabel = '変更前',
  newLabel = '変更後',
}: DiffViewProps) {
  const changes = useMemo(() => {
    // 比較前の正規化（フロントマターの除去、改行コードの統一）
    const normalize = (text: string) => text.replace(/^---[\s\S]*?---\n?/, '').replace(/\r\n/g, '\n');
    return diffLines(normalize(oldContent), normalize(newContent), { ignoreWhitespace: true });
  }, [oldContent, newContent]);

  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    changes.forEach((change) => {
      if (change.added) added += change.count ?? 0;
      if (change.removed) removed += change.count ?? 0;
    });
    return { added, removed };
  }, [changes]);

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* ... Header & Render Logic ... */}
      <div className="overflow-x-auto">
        <pre className="p-4 text-sm font-mono">
          {changes.map((change, i) => (
             <div
               key={i}
               className={`
                 px-2 -mx-2
                 ${change.added ? 'bg-green-50 text-green-800' : ''}
                 ${change.removed ? 'bg-red-50 text-red-800' : ''}
               `}
             >
               <span className="select-none text-slate-400 mr-2">
                 {change.added ? '+' : change.removed ? '-' : ' '}
               </span>
               {change.value}
             </div>
          ))}
        </pre>
      </div>
    </div>
  );
}
```

# 差分の正確な計算

差分表示の精度を高めるため、以下の正規化処理を行うこと。

1.  **Frontmatterの除外**: 内容の比較前に `gray-matter` 等を用いてYAMLフロントマターを除去し、本文のみを評価する。
2.  **改行コードの正規化**: `\r\n` を `\n` に置換して比較する。
3.  **空白の無視**: `diffLines` のオプションで `ignoreWhitespace: true` を指定することを検討する。

# ツリー上でのインタラクション

1.  **コメント編集**: 木構造に表示されるコメントラベルに `onClick` イベントを付与し、既存のサマリーを編集可能にする。
2.  **Sibling Branching (並列分岐)**: 最新ノードに対してAI指示を行った際、自動的に一つ前のノードを親として分岐させるロジックの管理。
5.  **AI Merge Flow (外部同期)**:
    -   外部（Word/PDF）で編集された文書を再インポートした際、既存の履歴を上書きせず、並列な **「外部ブランチ」** としてグラフに挿入。
    -   AIが外部編集の内容を現在の正本と比較し、マージを支援する。
6.  **キーボードナビゲーション**:
    -   上下矢印キーで履歴（バージョン）を選択・移動できること。
    -   選択時は自動的にツリーコンテナにフォーカスを維持し、連続的なキー操作を可能にする。
    -   画面外のノードを選択した際は、自動的にスクロールして表示範囲内に入れる。
7.  **Milestone Management**:
    -   **Visualization**: `isMilestone` フラグを持つノードは拡大され、Starアイコンを表示。周囲に破線のガイドラインを表示する。
    -   **AI Summary**: AIによる自動要約（`aiSummary`）がある場合、リストビュー内でカード形式で表示。キラキラ（✨）による視覚支援を伴う。
    -   **De-emphasis**: 重要度が低い（importance=1）の下書きノードは透過処理を行い、重要な転換点（マイルストーン）とのコントラストを強調する。

# パッケージインストール

```bash
npm install diff
npm install -D @types/diff
```

# 禁止事項

- **巨大なDiffの直接レンダリング**: 1000行以上は折りたたみ or ページネーション。
- **SVGの直接DOM操作**: Reactの宣言的レンダリングを使用。
- **アニメーションの過剰使用**: シンプルなトランジションに留める。

# 完了条件

- [ ] `lineage-utils.ts` のレイアウト計算が動作する
- [ ] `LineageGraph.tsx` がSVGでグラフを描画する
- [ ] `DiffView.tsx` が差分を表示する
- [ ] バージョンクリックでDiff表示が更新される
- [ ] 追加/削除行が色分け表示される
- [ ] キーボード（上下キー）でバージョン選択・移動ができる
- [ ] 選択に合わせてツリーが自動スクロールする

# 次のスキル

- AI連携フェーズへ（Phase 3以降）
