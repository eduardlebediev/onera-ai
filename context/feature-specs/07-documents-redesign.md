# Feature Spec: Redesign Documents Page with Document Detail Page

## Goal

Redesign the Documents List Page and Document Detail Page. Use mock data only.

## Requirements

### Documents List Page (`/documents`)

**Header**:

- Page title "Documents" + description
- "Upload Document" button (disabled, `title="Coming soon"`)

**KPI Section** above the table (rendered at page level, not inside table):

- 4 cards: Total Documents, Ready, Processing, Failed
- Each card shows count + trend percentage indicator

**Search and Filters**:

- Text search field filtering by title (client-side, instant)
- Status filter dropdown: All, Ready, Processing, Failed, Uploaded
- Sortable column headers toggle asc/desc with arrow indicator

**Documents Table**:

- Columns: file type icon + title (clickable), status badge, topics count, tests count, uploaded date, actions
- Title click opens Drawer
- Actions: "Quick Preview" button opening the same Drawer
- Row hover state, empty state on no filter results

### Document Preview Drawer

- Controlled Drawer (`open`/`onOpenChange` props), no internal trigger
- Wraps full `DocumentDetail` component as content
- Opens from right side

### Document Detail Page (`/documents/[id]`)

**Breadcrumbs**: Documents > {document title}

**Header**:

- Document title (h1)
- Metadata row: status badge (with icon), file type, file size, page count, upload date, uploader
- Actions: "Download" (outline), "Generate Assessment" (default, Sparkles icon), More actions dropdown (Edit Metadata, Share)

**Tabbed Navigation** (underline style, orange active indicator):

- Overview (default active)
- Extracted Text
- Topics (N)
- Metadata
- Versions (N)

**Overview tab content** — 3-column grid with `gap-2`, card stacks with `space-y-2`:

Left column (lg:col-span-2):

- **Document Summary** card — AI-generated summary with "Show more" button
- **Processing Status** card — timeline (Uploaded → Processing → AI Analysis → Ready), each step with checkmark icon + timestamp
- **Extracted Text Preview** card — hardcoded text sections (1. Purpose, 2. Scope, 3. Access Control), "View full text" button

Right column:

- **AI-Detected Topics** card — colored badges with dot icons, "+4 more" overflow, "Edit topics" (outline sm)
- **Document Details** card — key-value grid (File Name, Type, Size, Pages, Language, Created, Last Modified)
- **Delete Document** button (destructive, full width)

### Spacing

- Card grids: `gap-2` (matching dashboard)
- Card stacks: `space-y-2`
- Consistent with dashboard conventions

## Do Not Implement

- real upload, Supabase, AI, embeddings
- real test generation, download, delete
- real auth

## Files

- `src/app/documents/page.tsx`
- `src/app/documents/[id]/page.tsx`
- `src/features/documents/components/documents-table.tsx`
- `src/features/documents/components/document-drawer.tsx`
- `src/features/documents/components/document-detail.tsx`
- `src/features/documents/components/documents-kpi-section.tsx`
- `src/features/documents/lib/document-kpi-stats.ts`
- `src/data/mock/documents.ts`
- `context/progress-tracker.md` and `context/history.md`

## Verification

- `/documents` renders KPI, search, filter, sortable table
- Drawer opens/closes wrapping DocumentDetail
- `/documents/[id]` renders breadcrumbs, header, tabs, overview
- Mock data separated from UI
- `npm run lint` and `npm run typecheck` pass
