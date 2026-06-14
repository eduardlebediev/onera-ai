# Feature Spec: Generate Test Setup from Document

## Goal

Create a clickable setup screen where an admin configures a new employee knowledge test based on a selected document.

This screen prepares the test generation flow, but does not call real AI and does not create real database records yet.

## User Flow

Admin starts from a document detail page.

Flow:

Document Detail
→ Click "Generate Test"
→ Generate Test Setup
→ Configure test settings
→ Select topics and chunks
→ Click "Generate Test Preview"
→ Navigate to Test Review placeholder / next flow

## Requirements

### 1. Add entry point from Document Detail

On the full Document Detail page, add a primary action:

Generate Test

The action should navigate to:

```
/documents/[id]/generate-test
```

Use the selected document id from mock data.

### 2. Create Generate Test Setup route

Create a new route:

```
/documents/[id]/generate-test
```

The page should load the document from existing mock data.

If document id does not exist, show a simple not-found or empty state.

### 3. Show source document context

At the top of the page, show a source document summary:

- document title
- document status
- short description
- uploaded date
- detected topics count
- chunks count

The admin should clearly understand which document will be used as the source.

### 4. Add test setup form

Create a form-like UI with mock/local state.

Fields:

- Test title
- Difficulty: easy / medium / hard
- Target role
- Question count
- Language: English / German
- Passing score

Use existing UI components and project design tokens.

No form library is required unless already used.

### 5. Add topic selection

Show detected document topics as selectable items.

Each topic should show:

- topic name
- short description or topic summary if available
- selected / not selected state

Admin should be able to select and deselect topics.

At least one topic should be selected by default.

### 6. Add chunk selection

Show document chunks as selectable cards.

Each chunk card should show:

- chunk index or title
- short content preview
- topic
- selected / not selected state

Admin should be able to select and deselect chunks.

Selected chunks should be visually clear.

### 7. Add setup summary panel

Add a right-side summary panel on desktop and stacked summary on mobile.

Show:

- selected document
- selected topics count
- selected chunks count
- question count
- difficulty
- language
- target role
- estimated generation scope

This summary should update from local state.

### 8. Add actions

Primary action:

Generate Test Preview

Secondary actions:

Back to Document
Reset

For now, Generate Test Preview should navigate to the next planned route or placeholder:

```
/tests/review?documentId=[id]
```

or another route that matches the existing app structure.

If the review route does not exist yet, create a simple placeholder page that says:

Test Review Flow will be implemented next.

### 9. Use mock data only

Use existing mock document data if available.

Extend mock data only if needed with:

- topics
- chunks
- target roles
- default generation settings

Keep mock data colocated with the documents feature if that structure already exists.

### 10. Responsive layout

Desktop layout:

- Main content: setup form, topics, chunks
- Right panel: setup summary

Mobile layout:

- Document summary
- Setup form
- Topic selection
- Chunk selection
- Setup summary
- Actions

## Design Requirements

Use the current Ontera AI design system:

- existing buttons
- cards
- badges
- inputs
- typography CSS classes
- responsive spacing tokens
- clean admin dashboard style

Keep the screen polished but not overdesigned.

## Do Not Implement

- real AI generation
- Supabase
- database writes
- real document processing
- embeddings
- pgvector
- real auth
- test review logic
- publish logic
- employee test-taking flow

## Files Likely Involved

- `src/app/documents/[id]/generate-test/page.tsx`
- `src/features/documents/components/generate-test-setup.tsx`
- `src/features/documents/components/generate-test-form.tsx`
- `src/features/documents/components/topic-selector.tsx`
- `src/features/documents/components/chunk-selector.tsx`
- `src/features/documents/components/generate-test-summary.tsx`
- `src/data/mock/documents.ts` (extend)
- `context/progress-tracker.md`

## Verification

- Document Detail page has a working Generate Test action
- `/documents/[id]/generate-test` route works
- source document context renders correctly
- admin can update test title
- admin can change difficulty
- admin can change target role
- admin can change question count
- admin can change language
- admin can select and deselect topics
- admin can select and deselect chunks
- summary panel updates from local state
- reset action restores default values
- back action returns to document detail
- Generate Test Preview navigates to placeholder or next review route
- no backend or AI logic is added
- `npm run lint` passes
- `npm run typecheck` passes
- `npm run format:check` passes
- `context/progress-tracker.md` is updated
