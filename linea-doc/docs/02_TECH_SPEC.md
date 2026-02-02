# LineaDoc: AI-Powered Document Lineage - Technical Specification

## Tech Stack

- **Frontend**: Next.js 16.1.6 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Editor**: `@monaco-editor/react` ^4.7.0
- **Markdown**: `react-markdown` ^10.1.0, `remark-gfm` ^4.0.1
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
        /editor
          MonacoWrapper.tsx  # Editor component with custom scroll handling
        /preview
          PreviewPane.tsx    # Markdown preview with A4 paper style
        /lineage
          LineagePanel.tsx   # History visualization (SVG Graph + List)
        /welcome
          WelcomeScreen.tsx  # Initial launch screen
      /_shared
        AlertDialog.tsx      # Generic alert dialog
        BranchCommentModal.tsx # Branch creation modal
        InputModal.tsx       # Generic input modal (e.g., Comment edit)
        ConfirmModal.tsx     # Generic confirmation modal (e.g., Reset)
        Logo.tsx             # SVG Logo Component
        GuideModal.tsx       # Help/Manual Modal
    /hooks
      useLineage.ts          # History management logic & Persistence
    /lib
      types.ts               # Shared type definitions
      lineage-utils.ts       # Graph layout algorithms
      LanguageContext.tsx    # i18n Logic
      defaultMarkdown.ts     # Initial content templates
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

### 5. Future AI Integration (Planned)
- **Supabase**: Cloud persistence and vector store for knowledge base.
- **Vertex AI**: Intelligent suggestions and automated summarization.

### 6. External Components & Licensing
- **shadcn/ui**: If introduced, ensure compliance with the MIT License by maintaining license headers and providing appropriate attribution in the application's documentation or "About" section.
