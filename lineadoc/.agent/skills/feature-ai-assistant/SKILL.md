---
name: feature-ai-assistant
description: LineaDocの公務特化型AIアシスタント機能（多階層ツールチップ、カテゴリー化タスク、スラッシュコマンド）の管理と拡張。
---

# feature-ai-assistant

このスキルは、LineaDoc の AI アシスタント（正式名称：LineaDoc AI）を保守・拡張するための手順を提供します。
Vertex AI Premium (Gemini 2.5 Flash) を活用し、公務員を強力にサポートする「AI エージェント」としての UI/UX と高度なプロンプトの整合性を維持することを目的とします。

## 関連ファイル
- **UI**: `src/components/_features/ai/AIChatPane.tsx`, `AISelectionTooltip.tsx`
- **Logic**: `src/lib/ai/promptTemplates.ts`
- **Store**: `src/stores/appStore.ts` (AIContext: `sessionMessages`, `pendingAction`, `pendingOptions`)
- **Editor**: `src/components/_features/editor/MonacoWrapper.tsx`, `BlockNoteEditorPane.tsx`

## 主要なタスク

### 1. AI アクションの追加・更新
1. `promptTemplates.ts` の `AIActionType` に新しい型を追加。
2. `PROMPT_TEMPLATES` にカテゴリー別のプロンプト定義を追加 (`Editing`, `Gov Tasks`, `Generation`, `Analysis`)。
   - **重要**: 公用文作成要領を意識し、行政語彙の自動適用や論理的整合性を最優先する。
3. `AIChatPane.tsx` の `handleSend` (Mock) および `actionLabels` に分岐を追加。
4. `AISelectionTooltip.tsx` の該当するサブメニュー（Style, Analyze, Structure等）または `AIChatPane.tsx` のコマンドバーに反映。

### 2. 多階層 UI のメンテナンス
- `AISelectionTooltip` にサブメニューを追加する場合、`activeMenu` ステートに応じたレンダリングロジックを更新する。
- 階層化されたアクションは、`onAction` を通じて `pendingAction` と `pendingOptions` (例: `{ tone: 'concise' }`) の両方を設定し、アシスタントに詳細な指示が伝わるようにする。

### 3. スラッシュコマンド・メンションの同期
- 新しいアクションは、Monaco の `cmdMap` と BlockNote の `getMentionMenuItems` の両方に必ず追加し、エディタ間の機能格差をなくす。
- 現在の標準コマンド: `/summarize`, `/formal`, `/plain`, `/qa`, `/notice`, `/outline`, `/todo`, `/points`, `/consistency`, `/explain`, `/format`

### 4. 高度な構造化出力の維持
- 表形式の変換や Mermaid ダイアグラムの生成がプロンプトに含まれる場合、出力が Markdown として有効であることを常に検証する。

## 開発ガイドライン

- **Human-in-the-Loop**: AI の提案は常に「差分（Diff）」として提示し、ユーザーが個別に承認/却下できるインターフェースを維持する。
- **LineaDoc AI エージェントとしての自覚**: 単なるチャットではなく、行政実務のパートナーとして信頼感のある（しかし謙虚な）トーンを維持する。
- **Context Hierarchy Management**: AI プロンプト構築時、[Governance > Project Docs > User Intent > External Search] の順で重み付けを行い、内部事実と矛盾する外部情報の採用を厳格に制限する。
- **Hybrid RAG Management**: 
  - 権限管理（RLS）が重要な内部データは **Supabase pgvector** を優先。
  - 大規模アーカイブや外部検索は **Vertex AI Search** を適材適所で組み合わせる。
- **Search & Source**: 外部情報の引用（Grounding）時は必ず「根拠のバッジ」やソース（URL等）を表示し、ネット情報と内部データの区別を明確にする。
- **Session-based Context**: チャットログは永続化せずセッション限定とするが、対話中はドキュメント全体およびプロジェクト内の他ドキュメントを常に文脈に含める。
- **Unified Experience**: Monaco・BlockNote 両エディタで、一貫した AI 操作を提供する。
- **Security Transparency**: 「日本リージョン」「学習非利用」などの信頼性を UI を通じて能動的に提示する。
- **Gov-Specialization**: 日本の自治体実務（公用文ルール、論理性チェック等）を深く理解したプロンプトを維持する。
