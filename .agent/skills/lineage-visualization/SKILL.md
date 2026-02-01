---
name: lineage-visualization
description: 変更履歴（Lineage）のタイムライン表示やDiff可視化の実装。
allowed-tools: [file_edit]
meta:
  domain: frontend
  role: visualization
  tech_stack: tailwind-custom
---

# このスキルでやること

タイムライン表示や、差分（Diff）の視覚化コンポーネントを作成する。

# UIパターン

1. **タイムライン (LineagePanel)**:
   - 画面右端、またはドロワー内に「イベントの時系列リスト」を表示する。
   - アイコン: ユーザー変更（UserIcon）、AI提案（BotIcon）、保存（SaveIcon）。
   - **操作**:
     - クリック: 任意の履歴バージョンを表示（読み取り専用）。
     - **キーボード**: 矢印キー（↑↓）で履歴を順送り/逆送り（エディタ非フォーカス時）。
     - **最新化**: 任意の過去バージョンを最新版として復元コピー。
     - **リセット**: 現在のコンテンツを維持したまま履歴を全消去して `v1` に再設定。

2. **カラーコーディング (エディタ差分)**:
   - **保存済み変更** (vN-1 -> vN):
     - 追加: 青色 (`bg-blue-600` opacity)
     - 削除: 赤色 (`bg-red-500` opacity) + 行番号マージンの赤バー
   - **未保存の変更** (vN -> Editing):
     - 追加: 緑色 (`bg-green-500` opacity)
     - 削除: オレンジ/黄色 (`bg-amber-500` opacity)
   - AI提案: 青系 (`bg-blue-50`)

# データ扱い

- 履歴データは `LineageEvent[]` 型として受け取る。
- 日付表示は `date-fns` を使い `yyyy年MM月dd日 HH:mm` 形式で統一する。
