# Feature Spec: Add Documents Mock Pages with Quick Preview

## Goal

Create the Documents page with mock data, quick document preview in a Drawer, and a full document detail page.

## Requirements

- Add mock documents data
- Create `/documents` page
- Show document list with:
  - title
  - status
  - uploaded date
  - topics count
  - generated tests count
  - quick preview action
- Open document preview in shadcn Drawer / vaul
- Drawer should show:
  - document title
  - status
  - short description
  - detected topics
  - small chunks preview
  - linked tests summary
- Drawer actions:
  - `Open full page`
  - `Close`
- Create `/documents/[id]` full detail page
- Full page should show:
  - document metadata
  - all topics
  - document chunks preview
  - linked tests placeholder
  - future action placeholder: Generate Test

## Do Not Implement

- real upload
- Supabase
- AI
- embeddings
- test generation
- test review
- publish logic

## Files Likely Involved

- `src/app/documents/page.tsx`
- `src/app/documents/[id]/page.tsx`
- `src/data/mock/documents.ts`
- `src/features/documents/components/` — list, drawer, detail
- `context/progress-tracker.md`

## Verification

- `/documents` works
- document drawer opens and closes
- drawer has full page link
- `/documents/[id]` works
- mock data renders correctly
- `npm run lint` passes
- `npm run typecheck` passes
- `context/progress-tracker.md` is updated
