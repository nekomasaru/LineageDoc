# LineaDoc AI Technical Specification

## Overview
LineaDoc AI は、自治体業務（起案、広報、答弁作成、論理チェック）を強力に支援する公務特化型の高度な AI 機能群です。
Vertex AI Premium (Gemini 2.5 Flash) を基盤とし、行政文書の品位保持、Markdown 構造の最適化、および Mermaid 記法による可視化をサポートします。

## Core Components

### 1. Multi-level AI Tooltip (`AISelectionTooltip.tsx`)
テキスト選択時に表示される多階層型のフローティングメニュー。
- **Primary Menu**: 要約、文体、分析、生成、構造
- **Sub-menus (Hierarchical)**:
  - **文体**: 公用文、丁寧、簡潔、やさしい日本語
  - **分析**: 要件、論理性、ToDo抽出、解説
  - **構造**: 構造化（Markdown）、箇条書き、通知・案内
- **Behavior**: 選択されたアクションとサブオプション（文体トーン等）を `appStore` の `pendingAction/Options` にブリッジし、アシスタントパネルを起動する。

### 2. LineaDoc AI Chat (`AIChatPane.tsx`)
目的別に整理されたコマンドバーと対話型 UI を提供。
- **LineaDoc AI エージェント**: 公務実務の文脈を理解し、対話を通じて文書作成を支援する主体。
- **AI ブランチ**: AI の提案に基づき、履歴ノードを分岐・生成する機能的マイルストーン。
- **Command Bar (Horizontal Scroll)**:
  - **推敲・磨き上げ**: 公用文、要約、校正、やさしい、構造化
  - **整理・分析・生成**: ToDo、要件、論理性、解説、短く、長く
  - **履歴・統合操作**: AI指示（モーダル）、マイルストーン保存
- **Structured Output**: Markdown テーブルや Mermaid ダイアグラムを積極的に活用し、視覚的な資料作成を支援。

### 3. Prompt Engineering (`promptTemplates.ts`)
自治体実務に特化した高度なプロンプト群。
- **Gov-Specific Logic**: 貴職、供覧、内規などの適切な専門語彙の検討、および公用文作成要領に基づいた表現の自動適用。
- **Action Categories**: `Editing`, `Gov Tasks`, `Generation`, `Analysis` の 4 分類で管理。

### 4. Unified Editor Integrations
Monaco および BlockNote の両エディタで完全に同一の体験を提供。
- **Expanded Slash Commands**:
  - `/summarize`, `/formal`, `/plain`, `/qa`, `/notice`, `/outline`, `/todo`, `/points`, `/consistency`, `/explain`, `/format` 等
- **Mention Menu (@)**: BlockNote において、**LineaDoc AI エージェント**としてアイコン付きの視覚的なアクション選択メニューを提供。

## State Management (`appStore.ts`)
`AIContext` を拡張し、サブオプションの受渡しに対応。
```typescript
interface AIContext {
    selectedText: string;
    source: 'monaco' | 'blocknote' | null;
    pendingAction?: string | null;
    pendingOptions?: any; // トーン設定などの付加情報
    sessionMessages: AIChatMessage[];
}
```

## Design Philosophy (自治体特化設計指針)

### 1. Human-in-the-Loop (人間主導の最終判断)
AI は「代筆者」ではなく「専門家補佐（エージェント）」として振る舞う。
- **Propose-and-Review**: 自動置換ではなく、常に人間が提案を吟味し、承認するプロセスを UI 上で提供する。
- **Diff Visibility**: 原文との差分を視覚化し、「何をなぜ変えたか」を職員が理解した上で決裁できるようにする。

### 2. AI Branching (履歴の並行管理)
AI の提案を既存の文章に上書きするのではなく、新しい「ブランチ」として生成することで、試行錯誤のプロセスを全て保存する。

### 3. Contextual Heritage & File Preservation (前例踏襲と資料保持)
自治体業務の根幹である「前例参照」を容易にする。
- **資料保持ポリシー**: 文書に関連付けられた外部資料（PDF/docx等）は、単なるインデックス対象としてではなく、**「関連ファイル」として保持・閲覧可能**な状態で残す。
- **ライフサイクル管理**: ユーザーは不要になった資料をいつでも**削除・交換**できる。
- **一時引用**: ドラッグ＆ドロップによる一時的な参考資料引用をプロンプトの不可欠な要素とする。

### 4. Session-based Context (セッション限定の文脈)
AI とのチャットログは**永続化せず、セッション限定**とする。
- **Ephemeral Dialogue**: ログを別日に残さないことで、UI のノイズを抑え、常に最新の文章状態に基づいた新鮮な対話を提供する。
- **Global Context Integration**: ログは消えても、AI は常にドキュメント全体および**プロジェクト内の他ドキュメント**の文脈を理解した上で回答する。

### 5. Context Hierarchy & Weighted Priority (コンテキストの優先順位)
AI が複数の情報源を扱う際、以下の「4層の階層構造」に基づいて判断の重みを管理する。

1.  **Layer 1: Governance Rules (絶対規程)**: ガバナンス設定（公用文ルール、禁止語彙）。**最優先の制約（Hard Constraint）**。
2.  **Layer 2: Project Identity (事実背景)**: プロジェクト内の他ドキュメントや関連資料。**事実の根拠（Factual Grounding）**。
3.  **Layer 3: User Intent (対話文脈)**: 現在のチャットでの具体的な指示。**挙動の調整（Instruction）**。
4.  **Layer 4: External Knowledge (外部補足)**: インターネット検索。Layer 1〜3 で解決できない「最新の数値」等のみを補う。**補助的知識（Supplementary）**。

### 6. Search Grounding & Hallucination Guard (検索と信頼性)
- **Dynamic Search**: 統計データや最新法改正などに対してのみ Google 検索（Grounding）を活用。
- **Source Attribution**: ネット情報を使用する場合、必ずソースを明示。
- **Conflict Resolution**: ネット情報と内部資料（Layer 2）が矛盾する場合、**常に内部資料を正**とする。

### 7. Lineage-Aware Retrieval (歴史を理解する AI)
- **History Grounding**: 最新の文書状態だけでなく、過去の「変更意図」や「マイルストーン」を検索対象に含める。
- **Intent Analysis**: ユーザーの「なぜこの表現なの？」という問いに対し、過去の履歴イベント（vXからvYへの変更理由）を基に背景を解説する。
- **No-Go Backguard**: 過去の失敗や修正の経緯をコンテキストに含めることで、一度修正された不適切な表現への「先祖返り」を防止する。
- **Ghost Editing Alert (Preventative UX)**: 過去のマイルストーンで「不適切」とされた表現に似た入力を検知した際、リアルタイムで警告（インジケーター）を表示。

### 7. Transparency and Trust (透明性と信頼)
AI の動作原理、データの扱い、セキュリティ対策（日本リージョン・学習非利用）を UI を通じて「見える化」する。

## Detailed Roadmap

### Phase 1: 高度なUI/UXと信頼醸成
- **Propose-and-Review UI**: Monaco (Inline Diff) および BlockNote (Suggestion Cards) での差分表示と採択 UI。
- **Reference File Sidebar**: 資料の保持・プレビュー・AIコンテキストへの注入。
- **セキュリティバッジ**: 「国内リージョン・学習非利用」の常態表示。
- **Contextual Chat**: 過去の対話履歴（セッションベース）をプロンプトに含め、文脈を維持した継続的な指示出しを可能にする。
- **Semantic History Rail**: AI要約の自動生成とマイルストーン属性の管理。
- **Unified AI Command Bar**: AI指示モーダルと保存通知（Toast）の統合。

### Phase 2: ガバナンスと実務高度化
- **セーフティ・リンター (ガバナンス統合)**: 
  - AI 生成時にガバナンスルールをプロンプトとして動的に注入。
  - 断定回避、差別表現、公用文表記（様/殿、こと/事）等の自動検知。
- **上司視点の推敲モード**: 係長級（公用文ルール）、課長級（構成の簡潔性）などの視点切り替え。
- **ROI ダッシュボード**: 採用率・削減時間・矛盾検知数の統計。

## Golden Prompt Structure (4層階層プロンプト設計)

AI アシスタントへの指示は、以下の構造を持つ「階層型プロンプト」として動的に生成する。

```markdown
# Role & Global Rules
あなたは LineaDoc AI エージェントです。行政実務における文書作成や校正、論理性チェックなどをサポートする専門家として振る舞ってください。
以下の【Layer 優先順位】を厳守し、自治体文書としての品位と正確性を維持してください。

# Layer 1: Governance & Compliance (最優先・絶対遵守)
- [ガバナンス設定から抽出されたルール（例：断定回避、やさしい日本語、差別用語禁止）]
- これらのルールは他のいかなる情報よりも優先されます。

# Layer 2: Project Knowledge & Facts (事実の根拠)
- [プロジェクト内の他ドキュメントや関連資料のテキスト]
- 内部的な数値、固有名詞、決定事項は、外部情報よりも優先して正として扱ってください。

# Layer 3: Context & User Intent (現在の対話)
- [現在のユーザーからの具体的な指示内容]
- [直前の対話履歴（セッションベース）]

# Layer 4: External Knowledge (補助・出典明記)
- [Google 検索結果（Grounding）]
- 内部情報（Layer 2）に存在しない一般的な事実や最新の数値のみを補完してください。
- ネット情報を使用する場合は、必ず「[出典: URL]」を文末に付与してください。

# Output Constraints
- 出力は Markdown 形式のみ。
- 差分（Diff）が明確になるような構造（Propose-and-Review 形式）で出力。
```

> [!NOTE]
> RAG (検索拡張生成) の詳細な技術仕様については、[RAG Architecture Spec](file:///C:/Users/fate_/.gemini/antigravity/brain/b091b0f7-1a68-4101-b188-d500ef14cc9f/rag_architecture_spec.md) を参照してください。

## Hybrid RAG Architecture (検索拡張生成)

### 1. Primary: DIY pgvector Pipeline (内省・高精度・権限重視)
- **役割**: 現在進行中のプロジェクト文書、アップロードされた資料（PDF/docx/MD）、組織の最新内規。
- **実装**: 
  - **Ingestion**: ファイルをテキスト抽出（PDF: `pdf.js`, docx: `mammoth`）→ チャンク分割（500-1000トークン、10-20%重複）→ `text-multilingual-embedding-002` でベクトル化。
  - **Storage**: Supabase `document_chunks` テーブルに `vector(768)` 形式で保存。
  - **Security**: **PostgreSQL RLS** によるプロジェクト単位のアクセス制御。
- **メリット**: 文書の中身（ページ・セクション）まで踏み込んだ精密な検索が可能。

### 2. Secondary: Vertex AI Search (遠景・広範囲・大規模)
- **役割**: 全庁的な過去の膨大なアーカイブ、公開資料。
- **実装**: Vertex AI Search & Conversation への外部インデックス委託。
- **位置付け**: pgvector で十分な証拠が見つからない場合のフォールバック。

### 3. UI/UX への統合 (情報の透明性)
- **Source Badges**: `[文書A / p.3]` のように、情報の出典と具体的な箇所を表示。
- **Confidence Indicator**: 類似文書のヒット率が低い場合、「一般知識に基づく回答であること」を明示。

### プロンプト注入のメリット
- **決定論的制御**: LLM に対して「何が正解か」の重み付けを明示することで、自由奔放な生成を抑止。
- **透明性**: ユーザーが「なぜこの回答になったか」を理解できる。
