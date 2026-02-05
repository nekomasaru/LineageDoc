# LineaDoc: AI-Powered Document Lineage - Technical Specification

## Tech Stack

- **Frontend**: Next.js 16.1.6 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Editor**: `@monaco-editor/react` ^4.7.0, `@blocknote/react` ^0.22.0
- **UI Framework**: `@blocknote/mantine` (Rich Editor UI)
- **Markdown**: `react-markdown` ^10.1.0, `remark-gfm` ^4.0.1, `gray-matter` (Frontmatter), `mammoth` (docx import), `html-to-docx` (docx export)
- **Layout**: `react-resizable-panels` ^2.0.0
- **Graph**: `react-force-graph-2d` ^1.29.0
- **Icons**: `lucide-react`

## Application Identity & Localization

### 1. Branding (Teal Blue)
- **Primary Color**: Teal (`teal-600`)
- **Logo**: SVG-based Vector Logo ("LD" monogram).
- **Favicon**: Dynamically generated via `next/og` (`src/app/icon.tsx`) to match the logo perfectly.
- **Naming & Pronunciation**:
  - **公式表記**: LineaDoc（発音: `/ˈlɪn.i.ə dɑk/`）
  - **カタカナ表記**: リニアドック
  - **発音ガイド**: "LIN-ee-uh DOK" (Like "linear" + "dock")
  - **ブランドガイドライン**: 「LineaDoc is pronounced as 'LIN-ee-uh DOK', rhyming with 'linear clock'.」

### 2. Internationalization (i18n)
- **Strategy**: React Context (`LanguageContext`).
- **Supported Languages**: Japanese (`ja`), English (`en`).
- **Persistance**: Local state (resets on reload, currently).
- **Scope**: Covers all static UI text, modals, and messages.

## Directory Structure (Current)

```
/linea-doc
  /src
    /app
      icon.tsx        # Dynamic Favicon Generation
      page.tsx        # Main application controller (State routing, Layout)
      layout.tsx      # Global layout & Font configuration (Noto Sans JP)
      globals.css     # Global styles & Tailwind directives
    /components
      /_features
        /ai
          AiInstructionModal.tsx # AI command trigger modal
          AIChatPane.tsx         # [NEW] AI Chat integration UI
        /editor
          MonacoWrapper.tsx  # Editor component with custom scroll handling
          BlockNoteEditorPane.tsx # WYSIWYG editor
          SplitEditorLayout.tsx # Layout switcher (Rich/Code)
        /export
          ExportModal.tsx    # Format selection for export
        /preview
          PreviewPane.tsx    # Markdown preview with A4 paper style
        /legal
          LegalModal.tsx     # License info modal (Integrated into Settings)
        /settings
          SettingsModal.tsx  # Application preferences & Hotkey config
        /lineage
          LineagePanel.tsx   # History visualization (SVG Graph + List)
      /_ui
        AIAssistantIcon.tsx # [NEW] Rich animated AI icon
    /stores
      appStore.ts           # Global UI state (Hub/Spoke/Modals)
      documentStore.ts      # Metadata-driven document management
      projectStore.ts       # Team/Project hierarchy
      editorStore.ts        # Markdown & Mode state
      qualityStore.ts       # Governance check results
      settingsStore.ts      # User preferences & Hotkeys (Persisted)
    /lib
      lineage-utils.ts       # Graph layout algorithms
      editor/editorSync.ts   # Sync logic between Rich and Code
    /hooks
      useHotkeys.ts          # Global hotkey listener
```

## Data Models

### Linea Event (History Node)
The core data structure representing a snapshot in the document history.

```typescript
interface LineaEvent {
  id: string;              // UUID v4
  parentId: string | null; // Parent event ID (forms a DAG)
  timestamp: string;       // ISO8601
  type: 'user_edit' | 'ai_suggestion' | 'ai_branch' | 'save';
  content: string;         // Full document content
  summary?: string;        // Change summary / Branch comment
  version?: number;        // Sequential version number (v1, v2...)
}
```

### Document Meta
```typescript
interface Document {
  id: string;
  projectId: string;
  title: string;
  rawContent: string;
  mdSchema?: string;       // MDSchema definition (YAML/DSL)
  attributes?: Record<string, any>;
}
```

### Visualization Models
Structures used for rendering the history graph.

```typescript
interface LayoutNode {
  event: LineaEvent;
  column: number;          // Horizontal position (branch index)
  yIndex: number;          // Vertical position (chronological order)
}

interface LayoutLink {
  sourceId: string;
  targetId: string;
  sourceColumn: number;
  targetColumn: number;
  sourceY: number;
  targetY: number;
}
```

## Implementation Details

### 1. Linea Visualization System
A hybrid rendering approach combining SVG for the graph connections and HTML for interactive elements.

- **Layout Algorithm**: Chronological Root-to-Leaf.
  - Nodes are sorted by timestamp (newest top).
  - Main lineage path stays in Column 0.
  - Branches are assigned new columns to avoid overlapping.
- **Diff Engine**:
  - **Normalization**: Compares content after stripping YAML Frontmatter to avoid metadata noise.
  - **Lines**: Normalizes line endings (`\r\n` -> `\n`) and ignores whitespace to prevent false positives.
- **Layering Architecture** (z-index):
  - `z-10`: **SVG Layer** (Background) - Draws connection lines and node circles. `pointer-events-none`.
  - `z-20`: **List Layer** (Foreground) - The scrollable list of history items alongside the graph.
  - `z-30`: **Comment Overlay** (Interaction) - Clickable comment labels positioned over the graph. Container is `pointer-events-none` but children are `pointer-events-auto`.

### 2. Interaction & Modals
Browser native dialogs (`alert`, `confirm`, `prompt`) are replaced with custom React modals for better UX.

- **InputModal**: Used for editing comments.
- **ConfirmModal**: Used for destructive or significant actions (e.g., History Reset, Version Restoration).
- **BranchCommentModal**: Specialized modal for capturing reasons during branching or branch-tip edits.
- **Comment Editing**: Inline editing enabled by clicking comment labels directly within the history tree.

### 3. Editor & Preview Synchronization
Bi-directional scroll synchronization ensures the editor and preview pane stay aligned.

- **Editor -> Preview**:
  - Monaco `onScroll` triggers calculation of line number at top of viewport.
  - Preview scrolls to element matching `data-line="{lineNumber}"`.
- **Preview -> Editor**:
  - Preview `onScroll` calculates current visible line.
  - Monaco `revealLine` updates editor viewport.
- **Loop Prevention**: Uses `isScrollingFromExternal` ref flag to break infinite scroll loops.

### 4. Data Persistence & Isolation
- **Storage**: `localStorage` (Keyed by `documentId`).
- **Isolation**: `useLinea` hook uses `loadedId` guarding to prevent data leakage during document transitions.
  - `effectivelyLoaded` (isLoaded && documentId === loadedId) フラグにより、同期不全状態での保存・取得を遮断。
- **Initialization**: Automatically creates `v1` from template content on first load.

### 5. Template & Governance System
- **Template Schema**: `initialContent` and `initialSchema` (DSL) are injected upon creation.
- **MDSCHEMA Engine**: Validates document structure against the DSL defined in the `Document` meta.
- **Textlint Engine**: Integrated via local API for Japanese prose quality.
- **Typography**: `globals.css` により A4 プレビュー用の H1-H4 スタイルを定義し、公文書の階層構造を視覚化。

### 6. AI Assistant & Selection Synchronization
アシスタントパネル（AIChatPane）とエディタ間の高度な連携。

- **Selection Logic**:
  - **Monaco**: `onDidChangeCursorSelection` を監視し、選択テキストと範囲を取得。
  - **BlockNote**: `onSelectionChange` (useEffect) を監視し、ブロック内のテキストを抽出。
  - **Debounce**: エディタのパフォーマンス低下を防ぐため、1000msのデバウンス処理を介して `appStore.aiContext` を更新。
- **Context Awareness**: 
  - 右パネルには「どのエディタから（Source）」「どのテキストが（SelectedText）」選択されているかが表示される。
- **Direct Reflection (Apply)**: 
  - `AIChatPane` のメッセージにある「適用」ボタンにより実行。
  - `SplitEditorLayout` を介して、各エディタの `replaceSelection` 命令を呼び出し、現在の選択範囲をAIの提案内容で書き換える。

### 7. Future AI & Governance Integration (Phase 4-5)

#### Quality & Governance (Hierarchical Management)
- **Administrative Selection**: Unified sidebar for selecting **Team (Organization-wide)**, **Project-specific**, or **Document Template (e.g., Minutes, Knowledge)** as governance targets.
- **Hierarchy Priority**: Rules are inherited and overridden in the following order: `Team Standard` < `Project Custom` < `Template Standard` < `Document Override`.
- **MDSCHEMA**: Structural validation (headings, required metadata) specific to the document purpose.
- **Textlint/Vale**: Prose quality checks with toggleable rules per target.
- **Custom Dictionary**:
  - **Correction**: Normalizing terms (e.g., "AIv" -> "AI").
  - **Exclusion**: Permitting specific variants (e.g., allow specific Kanji variants like "﨑" or "髙").
- **Template-level Rules**: Pre-defined governance for standard business documents (Minutes, Reports, etc.) managed at the Team level.

#### AI Architecture
- **Knowledge Base**: Supabase Vector + Vertex AI Search による関連文書の検索。
- **Lineage Evolution**: AIによる変更履歴の自動要約と、分岐案の自動生成。
- **Template System**: 業務別の公文書テンプレート管理。

### 6. External Components & Licensing

## 7. Office & PDF Interoperability (Planned Phase 1-4)

### 1. Inbound Pipeline
- **docx**: `mammoth.js` for semantic HTML extraction. 見出し(#)・段落・リスト構造を抽出。
- **PDF**: Vertex AI (Gemini 2.5 Flash) for visual structure and layout analysis (Planned).
- **Merge**: "External Sync" flow where re-imported docs appear as AI-suggested branches (Planned).

### 2. Outbound Pipeline
- **Web-based docx**: Server side `html-to-docx` based on the A4 CSS template. 
  - **Stability**: Base64 -> Blob 変換に Data URL スキームを採用し、Windows環境でのバイナリ破損を防止。
- **Professional docx**: Server-side `Pandoc` using custom reference templates for official government formats (Planned).

### 3. Visual Auditing
- Multi-modal verification comparing the **Rendered PDF layout** against **Markdown source** to detect numbering errors or structural mismatches visually.

### 4. Implementation Checkpoints (Go/No-Go)
- **CP1 (After Phase 1)**: `mammoth.js` 抽出精度の評価。不十分な場合はAI解析を前倒しするか、インポート範囲を制限。
- **CP2 (After Phase 2)**: Gemini解析のコスト・精度評価。実運用コストが許容不可の場合は、マージ支援をテキストベースに縮退。
- **CP3 (After Phase 3)**: 視覚校正の誤検知率評価。ノイズが多い場合は「警告」表示のみに留め、自動修正は行わない。
