# Feature: Mock Cleanup — Real Product Feel

## Goal

Remove all visible mock data and "coming soon" placeholders so the app feels like a real product, not a prototype. After this spec, every page shows either real Supabase data or a meaningful empty state.

## User story

As a demo reviewer, when I open the app for the first time, I want to see real-looking data or helpful empty states, not "Coming soon" buttons or mock documents that don't exist. As an admin, when I have no documents yet, I want to see "Upload your first document" with a button, not mock data.

## Scope

### In scope

1. **Remove "Coming soon" / disabled buttons** — find and remove/hide all `title="Coming soon"` disabled UI controls
2. **Demo seed data** — add tests, questions, assignments, attempts, answers, document_topics to seed.sql so a fresh DB shows real data
3. **Empty states** — replace mock fallback with genuine empty state components on documents, tests, dashboard pages
4. **Employee dashboard** — replace mock `getEmployeeTestAttemptByTestId` with real attempt data from Supabase

### Out of scope

- Background ingestion (separate spec)
- Demo login buttons (separate spec)
- Retake flow (separate spec)
- Full design system changes

## 1. Remove "Coming Soon" Buttons

Find all `title="Coming soon"` or `disabled` with "coming soon" tooltip and either:

- Wire to real functionality if it exists (Delete, Archive, Restore — already implemented in lifecycle spec)
- Remove the button entirely if no real functionality exists (Edit Metadata, Share, Export)

Affected files from audit:

- `document-detail.tsx` — Edit Metadata, Share (remove DropdownMenuItems)
- `documents-table.tsx` — Retry, Delete (remove or wire)
- `tests-list-page.tsx` — "New Test" button (remove or keep but not disabled)
- `dashboard-header.tsx` — Export button (remove)
- `test-detail-page.tsx` — Publish, Archive, Restore (wire to real lifecycle APIs)
- Delete unused `PlaceholderPage` component

## 2. Demo Seed Data

Extend `supabase/seed.sql` to include:

- `document_topics` for both demo documents
- One published `tests` row with `test_questions` and `test_documents`
- One `test_assignments` for the demo employee
- One completed `test_attempts` with `test_answers`
- `ai_generation_runs` row for the published test

## 3. Empty States

Replace mock fallback on these pages with proper empty state components:

- `/admin/documents` — "No documents yet. Upload your first document." + Upload button
- `/admin/tests` — "No tests yet. Generate your first test from a document."
- `/employee/tests` — "No tests assigned yet."
- `/employee/progress` — "Complete your first test to see progress."
- `/admin/analytics` — "Complete some tests to see analytics."

## 4. Employee Dashboard Real Data

Update `src/features/employee/tests/lib/employee-dashboard-model.ts`:

- Replace `getEmployeeTestAttemptByTestId` (mock import) with real Supabase query
- Compute "recent feedback" from latest completed attempt
- Compute "learning focus" / weak topics from real answer data
- Build `resultHref` with correct `?attemptId=` parameter
- Keep mock import only as dev fallback if Supabase empty/errors

## Acceptance criteria

- WHEN admin opens any page, THEN no "Coming soon" disabled buttons are visible
- WHEN admin runs seed.sql and opens the app, THEN documents, tests, assignments, and results show real data
- WHEN admin has no documents, THEN "Upload your first document" empty state appears
- WHEN admin has no tests, THEN "Generate your first test" empty state appears
- WHEN employee completes a test, THEN dashboard shows real feedback and learning focus
- WHEN employee has no tests, THEN "No tests assigned yet" empty state appears
- THEN `npm run lint`, `typecheck`, `format:check`, `build` pass

## Constraints

- Keep mock files in codebase (remove in later spec) — only change what pages render
- Empty states link to real actions (Upload, Generate Test)
- Seed data uses existing fixed UUIDs from seed.sql
- Reuse existing `BackendFallbackBanner` or create new shared empty state component
