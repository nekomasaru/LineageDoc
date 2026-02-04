# Governance & Quality (MDSCHEMA / Textlint) Implementation Plan

## Goal
LineaDoc provides professional-grade document quality assurance based on public document standards. This plan implements the automated checking system (Governance Layer).

## Proposed Changes

### 1. Quality Store & Logic
#### [MODIFY] [qualityStore.ts](file:///c:/Users/fate_/LineaDoc/lineadoc/src/stores/qualityStore.ts)
- Implement `runValidation(content, attributes)` function.
- Integrate MDSCHEMA (JSON Schema based validation for frontmatter).
- Coordinate with `/api/lint` for textlint/vale results.

#### [NEW] [md-schema.ts](file:///c:/Users/fate_/LineaDoc/lineadoc/src/lib/quality/md-schema.ts)
- Definition of mandatory structures for public documents (e.g., must have `title`, `author`, `status`).

### 2. UI Components
#### [NEW] [QualityPanel.tsx](file:///c:/Users/fate_/LineaDoc/lineadoc/src/components/_layout/panels/QualityPanel.tsx)
- Display linting results (Errors, Warnings, Suggestions).
- "Jump to line" feature (already wired in SplitEditorLayout).

#### [MODIFY] [RightContextPanel.tsx](file:///c:/Users/fate_/LineaDoc/lineadoc/src/components/_layout/RightContextPanel.tsx)
- Add "Quality/Governance" tab icon (ShieldCheck).

### 3. Server Logic
#### [NEW] [api/lint/route.ts](file:///c:/Users/fate_/LineaDoc/lineadoc/src/app/api/lint/route.ts)
- Wrapper for `textlint` or `vale` execution on the server side.

## Verification Plan
1. Enter invalid frontmatter (e.g., missing author).
2. Type "I think..." (informal) and verify textlint suggests formal phrasing.
3. Click an error card to verify the editor scrolls to the specific line.
