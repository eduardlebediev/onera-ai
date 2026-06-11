# Feature Spec 26: Backend Data Integration for Admin Documents and Tests

## Goal

Replace mock-first data usage in the main admin documents and tests pages with Supabase-backed data.

The AI/RAG generation flow already works:

```
Document
→ Chunks
→ Embeddings
→ pgvector retrieval
→ AI-generated draft
→ Admin review
→ Saved published test
```

Now the admin interface should treat Supabase as the primary source of truth for documents and tests.

## Scope

Backend-backed admin pages:

- `/admin/documents`
- `/admin/documents/[id]`
- `/admin/tests`
- `/admin/tests/[id]`

These pages should read from Supabase first. Mock data should remain only as fallback/dev fixture.

## Current Context

Already completed:

- Spec 21 — Supabase backend foundation
- Spec 22 — Embedding script for demo chunks
- Spec 23 — AI Generate Test API
- Spec 24 — Generate Test page connected to real AI API
- Spec 25 — Reviewed generated tests saved to Supabase

Current Supabase tables: `documents`, `document_chunks`, `tests`, `test_questions`, `ai_generation_runs`.

## Important Rules

- Use `tests`, not `quizzes`.
- Do not add Prisma.
- Do not rewrite the whole UI.
- Do not remove mock data yet.
- Do not implement auth UI in this spec.
- Do not implement assignments in this spec.
- Do not implement employee attempts/results in this spec.

## Main User Flow

1. Admin opens Documents → sees Supabase documents
2. Admin opens document detail → sees document metadata, chunks/topics, generate action
3. Admin opens Tests → sees Supabase published tests
4. Admin opens saved test detail → sees real test questions from Supabase

Mock fallback should still work for older demo ids.

## Files to Inspect First

- `src/app/(admin)/admin/documents/page.tsx`
- `src/app/(admin)/admin/documents/[id]/page.tsx`
- `src/app/(admin)/admin/tests/page.tsx`
- `src/app/(admin)/admin/tests/[id]/page.tsx`
- `src/features/documents/`
- `src/features/tests/`
- `src/features/tests/lib/supabase-test-detail.ts`
- `src/lib/supabase/admin.ts`
- `src/lib/supabase/types.ts`
- `context/progress-tracker.md`
- `context/history.md`
- `context/decisions.md`

Reuse existing components where possible. Do not redesign pages.

## Required New/Updated Helpers

Create or update backend read helpers:

- `src/features/documents/lib/supabase-documents.ts`
- `src/features/tests/lib/supabase-tests.ts`

These helpers should be server-only. Use `import "server-only"`. Use the server/admin Supabase client only in server modules. Do not import server-only helpers into Client Components.

## 1. Documents List from Supabase

Route: `/admin/documents`

Expected behavior:

1. Fetch documents from Supabase.
2. Show Supabase documents first.
3. Keep mock documents as fallback when Supabase returns empty/error.
4. Do not break existing UI cards/table.

Data needed: `id`, `title`, `description`, `source_type`, `file_name`, `status`, `created_at`, `updated_at`.

Optional derived fields: chunk count, topics count. If possible, include chunk count from `document_chunks`.

## 2. Document Detail from Supabase

Route: `/admin/documents/[id]`

Expected behavior:

1. If id is Supabase UUID, fetch real document.
2. If id is known mock id, resolve to Supabase UUID when mapped.
3. If Supabase document exists, render it.
4. If not found, fallback to existing mock detail.
5. Show chunks/topics from `document_chunks` when available.

Data needed: document metadata, `document_chunks` ordered by `chunk_index`, topics derived from `chunks.topic`.

Generate Test action should work for Supabase UUID documents. Keep existing mock id support for `doc-1`, `doc-4` or the current mapping file.

## 3. Tests List from Supabase

Route: `/admin/tests`

Expected behavior:

1. Fetch tests from Supabase.
2. Include saved AI-generated tests.
3. Show status, difficulty, question_count, source document, created/published date.
4. Keep mock tests fallback if Supabase has no tests.

Data needed: `tests.id`, `tests.title`, `tests.description`, `tests.status`, `tests.difficulty`, `tests.language`, `tests.question_count`, `tests.passing_score`, `tests.source_document_id`, `tests.published_at`, `documents.title` as source document title.

Saved generated tests should be visible immediately after Spec 25 publish flow.

## 4. Test Detail from Supabase

Route: `/admin/tests/[id]`

Some support already exists from Spec 25. Improve/complete it:

1. Mock test ids still render mock detail.
2. UUID test ids fetch Supabase test + questions.
3. Saved test detail shows complete real data.
4. Friendly not-found state if neither mock nor Supabase test exists.

Data needed: test metadata, source document title, `test_questions` ordered by `order_index`, `options`, `correct_answer`, `explanation`, `topic`, `source_chunk_id`.

Do not implement assignment persistence yet. Assignment button can remain existing UI/navigation.

## 5. Type Updates

Update `src/lib/supabase/types.ts`. Add minimal table types needed for: `documents`, `document_chunks`, `tests`, `test_questions`. Do not attempt full generated database types unless already configured.

## 6. Loading/Error/Empty States

For server-rendered pages:

- Supabase success → render backend data
- Supabase empty → render useful empty state or mock fallback
- Supabase error → log server-side and fallback to mock where safe

Do not expose raw Supabase errors in UI. Suggested user-facing copy: `Could not load backend data. Showing demo fallback.` Use only if needed.

## 7. Keep Mock Fallback

Do not delete mock files. Mock fallback is still useful for: old demo ids, offline demo, development fixture, AI failure recovery. But Supabase should be primary source for core admin pages.

## 8. Out of Scope

Do not implement: real assignments, employee dashboard backend integration, employee test taking persistence, `test_attempts`, `test_answers`, auth UI, invite flow, RLS policy rollout, PDF upload, PDF parsing, teams, advanced analytics, Prisma, large redesign.

## Manual Test

Run `npm run dev`. Test:

- `/admin/documents`
- `/admin/documents/c0000000-0000-4000-8000-000000000001`
- `/admin/documents/c0000000-0000-4000-8000-000000000002`
- `/admin/tests`
- `/admin/tests/{saved-test-uuid}`

Also test fallback:

- `/admin/documents/doc-1`
- `/admin/tests/test-1`

Expected: Supabase documents render, Supabase saved tests render, saved generated test appears in tests list, saved test detail shows real questions, mock ids still work, no crashes.

## Validation

Run:

```bash
npm run lint
npm run typecheck
npm run format:check
npm run build
```

## Context Updates

Create this file (`context/feature-specs/26-backend-data-integration-admin-documents-tests.md`).

Update:

- `context/progress-tracker.md`
- `context/history.md`
- `context/decisions.md`

Add decision:

```
## 037 — Admin documents and tests use Supabase as primary source

Admin documents and tests pages now read from Supabase first. Mock data remains as fallback/dev fixture for old demo ids and offline demo recovery, but Supabase-backed documents, saved tests, and test questions are the primary source for admin core pages.
```

Update progress:

Completed:

- Backend Data Integration for Admin Documents and Tests

Next Up:

- Real Test Assignments
- Employee Test Taking and Attempt Persistence

## Acceptance Criteria

- `/admin/documents` reads Supabase documents first.
- `/admin/documents/[id]` can render Supabase document details.
- Document detail shows chunks/topics when available.
- `/admin/tests` reads Supabase tests first.
- Saved generated tests appear in tests list.
- `/admin/tests/[id]` renders Supabase UUID-backed saved tests.
- Mock fallback still works for old demo ids.
- No assignments persistence added.
- No employee attempt persistence added.
- No auth UI added.
- No API keys exposed to client code.
- `lint`, `typecheck`, `format:check`, and `build` pass.

## Next Step

Feature Spec 27: Real Test Assignments
