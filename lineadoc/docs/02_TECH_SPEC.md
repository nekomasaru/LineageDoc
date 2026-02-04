# LineaDoc: AI-Powered Document Lineage - Technical Specification

## Tech Stack

- **Frontend**: Next.js 16.1.6 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Editor**: `@monaco-editor/react` ^4.7.0, `@blocknote/react` ^0.22.0
- **UI Framework**: `@blocknote/mantine` (Rich Editor UI)
- **Markdown**: `react-markdown` ^10.1.0, `remark-gfm` ^4.0.1, `gray-matter` (Frontmatter)
- **Layout**: `react-resizable-panels` ^2.0.0
- **Graph**: `react-force-graph-2d` ^1.29.0
- **Icons**: `lucide-react`

## Application Identity & Localization

### 1. Branding (Teal Blue)
- **Primary Color**: Teal (`teal-600`)
- **Logo**: SVG-based Vector Logo ("LD" monogram).
- **Favicon**: Dynamically generated via `next/og` (`src/app/icon.tsx`) to match the logo perfectly.

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
        /editor
          MonacoWrapper.tsx  # Editor component with custom scroll handling
          BlockNoteEditorPane.tsx # WYSIWYG editor
          SplitEditorLayout.tsx # Layout switcher (Rich/Code)
        /export
          ExportModal.tsx    # Format selection for export
        /preview
          PreviewPane.tsx    # Markdown preview with A4 paper style
        /lineage
          LineagePanel.tsx   # History visualization (SVG Graph + List)
    /stores
      appStore.ts           # Global UI state (Hub/Spoke/Modals)
      documentStore.ts      # Metadata-driven document management
      projectStore.ts       # Team/Project hierarchy
      editorStore.ts        # Markdown & Mode state
      qualityStore.ts       # Governance check results
    /lib
      lineage-utils.ts       # Graph layout algorithms
      editor/editorSync.ts   # Sync logic between Rich and Code
```

## Data Models

### Linea Event (History Node)
The core data structure representing a snapshot in the document history.

```typescript
interface LineaEvent {
  id: string;              // UUID v4
  parentId: string | null; // Parent event ID (forms a DAG)
  timestamp: string;       // ISO8601
  type: 'user_edit' | 'ai_suggestion' | 'save';
  content: string;         // Full document content
  summary?: string;        // Change summary / Branch comment
  version?: number;        // Sequential version number (v1, v2...)
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
- **Layering Architecture** (z-index):
  - `z-10`: **SVG Layer** (Background) - Draws connection lines and node circles. `pointer-events-none`.
  - `z-20`: **List Layer** (Foreground) - The scrollable list of history items alongside the graph.
  - `z-30`: **Comment Overlay** (Interaction) - Clickable comment labels positioned over the graph. Container is `pointer-events-none` but children are `pointer-events-auto`.

### 2. Interaction & Modals
Browser native dialogs (`alert`, `confirm`, `prompt`) are replaced with custom React modals for better UX.

- **InputModal**: Used for editing comments.
- **ConfirmModal**: Used for destructive actions (e.g., History Reset).
- **BranchCommentModal**: Specialized modal for creating new branches.

### 3. Editor & Preview Synchronization
Bi-directional scroll synchronization ensures the editor and preview pane stay aligned.

- **Editor -> Preview**:
  - Monaco `onScroll` triggers calculation of line number at top of viewport.
  - Preview scrolls to element matching `data-line="{lineNumber}"`.
- **Preview -> Editor**:
  - Preview `onScroll` calculates current visible line.
  - Monaco `revealLine` updates editor viewport.
- **Loop Prevention**: Uses `isScrollingFromExternal` ref flag to break infinite scroll loops.

### 4. Data Persistence
- **Storage**: `localStorage` (Key: `lineage-doc-storage`).
- **Logic**: Encapsulated in `useLineage` hook.
- **Resilience**: Automatically initializes with a default event if storage is empty.

### 5. Future AI & Governance Integration (Phase 4-5)

#### Quality & Governance (Currently Implementing)
- **MDSCHEMA**: 公文書固有の構造チェック（章立て、メタデータ必須項目）。
- **Textlint/Vale**: 用語統一、不適切な表現の自動検出。
- **AIGovernance**: 指示内容がガイドラインに沿っているかの事前検証。

#### AI Architecture
- **Knowledge Base**: Supabase Vector + Vertex AI Search による関連文書の検索。
- **Lineage Evolution**: AIによる変更履歴の自動要約と、分岐案の自動生成。
- **Template System**: 業務別の公文書テンプレート管理。

### 6. External Components & Licensing
- **shadcn/ui**: 導入時は MIT License を遵守し、ライセンス表記を維持すること。
