# Implementation History

Detailed session records for all completed feature specs and refinements.

---

## Feature Spec 27: Real Test Assignments

Connected admin assignment and employee assigned-test visibility through Supabase `test_assignments`, while preserving mock fallback for existing demo IDs and empty/offline data.

- Added `src/features/tests/lib/supabase-assignments.ts` — server-only helpers for loading UUID-backed assignment page data, active employee members, assignment summaries, assigned employee lists, and duplicate-aware assignment creation.
- Added `src/app/api/admin/tests/[id]/assign/route.ts` — validates UUID route ids and request bodies, derives organization from the test, requires published tests, validates selected users as active employee members, and creates/skips `not_started` assignments.
- Added `src/features/employee/tests/lib/supabase-employee-assignments.ts` — server-only demo employee assignment loader using seeded employee `b0000000-0000-4000-8000-000000000002`, mapped into the existing employee dashboard/tests UI model.
- Extended `src/lib/supabase/types.ts` with `profiles`, `organization_members`, and `test_assignments`.
- Updated `src/app/(admin)/admin/tests/[id]/assign/page.tsx` — mock IDs still use the local mock flow; Supabase UUIDs load real tests, assignable employees, and existing assignments.
- Updated `src/features/tests/components/assign-employees-page.tsx` and `assign-employee-list.tsx` — accepts server-fed employees/assignments, prevents selecting already-assigned employees, calls the real assign API for Supabase tests, and keeps mock assignment behavior for mock tests.
- Updated `src/app/(admin)/admin/tests/[id]/page.tsx` and `saved-test-detail-page.tsx` — saved test details show assignment counts, failed count, assigned employees, and an Assign to Employees action for published Supabase tests.
- Updated `src/app/(employee)/employee/dashboard/page.tsx` and `src/app/(employee)/employee/tests/page.tsx` — both pages read Supabase assignments first and fall back to existing mock assignments when Supabase returns empty or fails.
- Updated employee deadline formatting/model helpers so assignments without deadlines display safely and do not appear overdue.
- Decision 039 recorded in `context/decisions.md`.

## Feature Spec 26: Backend Data Integration for Admin Documents and Tests

Replaced mock-first data usage on admin documents and tests pages with Supabase-backed reads while preserving mock fallback for demo ids and offline recovery.

- Added `src/features/documents/lib/supabase-documents.ts` — server-only list and detail fetch helpers; maps `documents` and `document_chunks` to existing `MockDocumentDetail` shape for reuse of current UI components.
- Added `src/features/tests/lib/supabase-tests.ts` — server-only tests list fetch with source document title join; maps rows to `ResolvedMockTest` for the tests table and KPI section.
- Added `src/features/documents/components/backend-fallback-banner.tsx` — user-facing fallback copy when Supabase is empty or unavailable.
- Updated `src/app/(admin)/admin/documents/page.tsx` — Supabase-first documents list with mock fallback on empty/error.
- Updated `src/app/(admin)/admin/documents/[id]/page.tsx` — Supabase detail for UUID/mapped ids; mock fallback for known demo ids.
- Updated `src/app/(admin)/admin/documents/[id]/generate-test/page.tsx` — loads Supabase document detail for API-backed UUID routes before mock fallback.
- Updated `src/features/documents/components/generate-test-setup.tsx` — back navigation uses route document id for UUID/mock route consistency.
- Updated `src/app/(admin)/admin/tests/page.tsx` — Supabase-first tests list including saved generated tests; mock fallback on empty/error.
- Updated `src/features/tests/components/tests-list-page.tsx` — optional fallback banner slot.
- Updated `src/app/(admin)/admin/tests/[id]/page.tsx` — safe Supabase error handling before `notFound()`.
- Updated `src/features/tests/lib/supabase-test-detail.ts` — returns `null` on fetch errors instead of throwing.
- Marked `/admin/documents` and `/admin/tests` as `force-dynamic` so Supabase list data is fetched per request, not baked in at build time.
- Extended `MockDocumentDetail` with optional `extractedText`; mapped `documents.extracted_text` in `supabase-documents.ts`.
- Updated `document-detail.tsx` to prefer full `extractedText` in preview and Full Extracted Text tab, with chunk-based fallback for mock docs.
- Updated `supabase/seed.sql` to aggregate demo chunk content into `documents.extracted_text`; applied on remote demo DB via MCP.
- Decision 037 recorded in `context/decisions.md`.
- Validation: `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` pass.

## Feature Spec 25: Save Reviewed Generated Test to Supabase

Persisted reviewed AI-generated test drafts from the publish page into Supabase `tests` and `test_questions`, completing the first backend-backed test creation flow.

- Added `src/features/tests/schemas/publish-generated-test-schema.ts` — Zod request/response validation for publish payload, question option rules, and approved-question requirements.
- Added `POST /api/admin/tests/publish-generated` at `src/app/api/admin/tests/publish-generated/route.ts` — server-only route using admin Supabase client; derives `organization_id` from `documents`; inserts published test and non-rejected questions; updates `ai_generation_runs.test_id` and merges `output_summary` best-effort.
- Added `src/features/tests/lib/publish-generated-test-api-client.ts` — browser client with friendly error handling.
- Extended `src/features/tests/lib/generated-test-mapper.ts` with `mapReviewedDraftToPublishRequest()` — merges stored AI draft with reviewed question state, preserving option IDs and applying edits.
- Extended `src/lib/supabase/types.ts` with `tests` and `test_questions` table types.
- Updated `src/features/tests/components/publish-test-page.tsx` — AI drafts call real publish API with loading/error states, clear `ontera.generatedTestDraft` on success, redirect to saved test; mock fallback unchanged.
- Added `src/features/tests/lib/supabase-test-detail.ts` — server-only fetch helper for saved tests and questions.
- Added `src/features/tests/components/saved-test-detail-page.tsx` — minimal Supabase-backed test detail view.
- Updated `src/app/(admin)/admin/tests/[id]/page.tsx` — mock IDs first, then Supabase UUID fallback.
- Decision 033 recorded in `context/decisions.md`.
- Validation: `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` pass.

### Post-Review Fix Pass

- Publish API validates `sourceChunkId` against `document_chunks` for the selected document and organization; invalid references return `422`.
- `generationRunId` is validated against `document_id` and `organization_id` before save; post-save update is scoped the same way.
- Test detail route returns `notFound()` for non-UUID ids before calling Supabase.
- Added `getPublishableQuestions()`; AI publish preview shows approved and edited questions that will be saved.
- Cached `useResolvedReviewData` snapshots for `useSyncExternalStore` to fix React infinite-loop console error on review/publish pages.

## Feature Spec 24: Connect Generate Test Page to Real AI API

Connected the admin generate-test page to the real AI generation API with temporary draft handoff to the review page.

- Added demo document ID resolution between mock ids (`doc-1`, `doc-4`) and seeded Supabase UUIDs for Security Guidelines and Customer Support Escalation Guide.
- Added `src/features/tests/lib/generated-test-api-client.ts` — browser client for `POST /api/admin/generate-test` with friendly error handling.
- Added `src/features/tests/lib/generated-test-session.ts` — stores generated draft in `sessionStorage` under `ontera.generatedTestDraft`.
- Added `src/features/tests/lib/generated-test-mapper.ts` — maps API response to existing `MockTestReviewData` / `ReviewQuestion` shape.
- Added `src/features/tests/types/generated-test.ts` for stored draft typing.
- Updated `generate-test-setup.tsx` — real API call, loading/disabled states, error UI with mock preview fallback, navigation to review with `source=ai` query params.
- Updated `test-review-page.tsx` — loads AI draft from session storage with mock fallback; shows draft review copy.
- Updated `review-question-detail.tsx` — supports multiple correct answers and source chunk labels.
- Extended `ReviewQuestion` with optional `correctAnswers`; `MockTestReviewData` with optional `description`.
- Question count form bounds aligned to API (`3`–`10`).
- Decision 032 recorded in `context/decisions.md`.
- Validation: `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` pass.

### Post-Review Fix Pass

- Run-scoped review session keys (`ontera-review-{documentId}-{generationRunId}`) and run-scoped AI question ids prevent draft state leaking across generations.
- `clearReviewSessionsForDocument()` runs when a new AI draft is saved.
- `StoredGeneratedTestDraftSchema` validates session storage before use.
- `useResolvedReviewData` hydrates review/publish data client-side via `useSyncExternalStore` (server fallback mock, client reads session).
- Publish route and page load AI draft review state the same way as the review page.
- `review-question-detail.tsx` supports multiple correct answers; edit save syncs `correctAnswers`.

## Feature Spec 23: AI Generate Test API from Retrieved Document Chunks

Added a backend-only API endpoint that generates grounded employee knowledge test drafts from retrieved document chunks.

- Created `context/feature-specs/23-ai-generate-test-api-from-retrieved-chunks.md`.
- Installed `ai`, `@ai-sdk/openai`, and `zod`.
- Extended `src/lib/supabase/types.ts` with `documents` and `ai_generation_runs` table types.
- Added `src/features/tests/schemas/generated-test-schema.ts` with request, draft, response, LLM output, and post-validation helpers.
- Added `src/features/tests/lib/generate-test-prompt.ts` for grounded prompt and retrieval query construction.
- Added `src/features/tests/lib/retrieve-document-context.ts` for document lookup, pgvector retrieval via `match_document_chunks`, and chunk-index fallback.
- Added `POST /api/admin/generate-test` at `src/app/api/admin/generate-test/route.ts`:
  - Validates request input with Zod.
  - Creates and updates `ai_generation_runs` for pending, completed, and failed states.
  - Retrieves embedded chunks before calling OpenAI structured generation with `gpt-4.1-mini`.
  - Returns draft JSON without saving to `tests` or `test_questions`.
- Decision 031 recorded in `context/decisions.md`.
- Validation: `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` pass.
- Manual curl verification for Security Guidelines document returns HTTP 200 with 5 grounded questions and valid `sourceChunkId` references.
- No frontend integration in this spec; mock UI remains unchanged.

### Post-Review Fix Pass

- Classified AI SDK structured-output parse/validation failures as `422` invalid generated output instead of provider/server failures.
- Normalized returned draft metadata (`difficulty`, `language`, `targetRole`, `passingScore`) from trusted request/default values instead of model output.
- Derived `sourceChunkTitle` from retrieved chunk metadata for valid source chunk references.
- Fixed the LLM output schema so all OpenAI response-format properties are required (`passingScore` no longer uses a Zod default in the LLM schema).
- Validation and curl re-test pass after the runtime schema fix.

## Feature Spec 22: Embedding Script for Demo Document Chunks

Added a server-side embedding script that fills demo `document_chunks.embedding` values and verifies pgvector retrieval.

- Created `context/feature-specs/22-embedding-script-demo-chunks.md`.
- Installed `openai` and dev dependency `tsx`.
- Added `embed:demo-chunks` npm script with `NODE_OPTIONS='--conditions=react-server'` so the existing `server-only` admin helper can be imported from a standalone Node script.
- Extended `src/lib/supabase/types.ts` with minimal `document_chunks` table types and `match_document_chunks` RPC types.
- Added `scripts/embed-demo-chunks.ts`:
  - Loads `.env.local` via `@next/env`.
  - Validates `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and `OPENAI_API_KEY`.
  - Uses `createAdminClient()` from `src/lib/supabase/admin.ts`.
  - Fetches chunks where `embedding IS NULL`.
  - Builds embedding input from title, topic, and content.
  - Calls OpenAI `text-embedding-3-small` and updates `document_chunks.embedding`.
  - Merges `metadata.embedding_model` and `metadata.embedded_at` without overwriting unrelated metadata.
  - Runs verification queries for phishing email and P1 incident escalation via `match_document_chunks`.
- `src/lib/supabase/admin.ts` already had `import "server-only";` — no change required.
- `.env.example` already documented `OPENAI_API_KEY`.
- Updated `context/architecture.md` to document server-only admin access via `SUPABASE_SECRET_KEY`.
- Decisions 029 and 030 recorded in `context/decisions.md`.
- Validation: `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm run build`, and `npm run embed:demo-chunks` pass.
- Runtime verification: embedded 10 demo chunks; phishing query top result was Phishing Response; P1 incident query returned Severity Levels / Incident Triage in top matches.

### Post-Review Fix Pass

- Replaced deprecated `SUPABASE_SERVICE_ROLE_KEY` with `SUPABASE_SECRET_KEY` (`sb_secret_...`) for server-only admin access in `src/lib/supabase/admin.ts`, `scripts/embed-demo-chunks.ts`, and `.env.example`.
- Decision 030 recorded in `context/decisions.md`.

## Feature Spec 21: Supabase Backend Foundation

Added the first backend foundation for the RAG demo slice without changing mock frontend behavior.

- Created `context/feature-specs/21-supabase-pgvector-backend-foundation.md`.
- Added `.env.example` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `OPENAI_API_KEY`.
- Added Supabase helpers in `src/lib/supabase/`:
  - `client.ts` — browser client via `createBrowserClient`
  - `server.ts` — server client via `createServerClient` + Next.js cookies
  - `types.ts` — placeholder `Database` type (TODO: generate from Supabase)
- Added `supabase/config.toml` and migration `00001_initial_schema.sql`:
  - Extensions: `pgcrypto`, `vector` (extensions schema)
  - Tables: organizations, profiles, organization_members, documents, document_chunks, tests, test_questions, test_assignments, test_attempts, test_answers, ai_generation_runs
  - `document_chunks.embedding` as `extensions.vector(1536)` with HNSW cosine index
  - `updated_at` trigger on all tables with `updated_at`
  - RLS enabled on all public tables (restrictive — no broad policies)
  - `match_document_chunks` RPC for cosine similarity search
- Added `supabase/seed.sql` with demo org, auth users, profiles, members, 2 documents, 10 chunks (embeddings null).
- Applied migration to remote Supabase via MCP; seeded org/documents/chunks remotely (auth user seed blocked by MCP — run `supabase db reset` locally or seed auth users via dashboard SQL when needed).
- `@supabase/supabase-js` and `@supabase/ssr` were already in `package.json`.
- Supabase CLI is not installed locally — migration files created manually.
- Client helpers use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local` and retain `NEXT_PUBLIC_SUPABASE_ANON_KEY` as a compatibility fallback.
- Validation: `npm run lint`, `npm run typecheck`, and `npm run format:check` pass.
- Decision 027 recorded in `context/decisions.md`.

### Post-Review Fix Pass

- Secured `set_updated_at` with `set search_path = ''` in the squashed initial migration.
- Added missing RLS table comments on remote DB via follow-up migration.
- Hardened `supabase/seed.sql`: org/chunks always seed; auth block wrapped in exception handler with required token columns; profiles/members/documents use conditional inserts.
- Extracted shared env helpers to `src/lib/supabase/env.ts`.
- Documented `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.example`; `NEXT_PUBLIC_SUPABASE_ANON_KEY` remains a code-level compatibility fallback only.

### Org-Scoping and Service-Role Fix Pass

- Added `src/lib/supabase/admin.ts` — server-only service-role client using `SUPABASE_SERVICE_ROLE_KEY` and `@supabase/supabase-js`.
- Documented `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.example`.
- Strengthened schema with composite `(id, organization_id)` uniqueness and org-scoped composite foreign keys; `test_assignments.user_id` and `test_attempts.user_id` are `NOT NULL`.
- Folded org-scoping changes into the squashed `00001_initial_schema.sql` migration.
- Updated `context/architecture.md` for `organization_members.role`, `test_questions` / `test_answers`, and `tests.source_document_id`.
- Decision 028 recorded in `context/decisions.md`.

### Migration Cleanup

- Squashed backend foundation migrations into a single fresh-database migration: `supabase/migrations/00001_initial_schema.sql`.
- Removed old timestamped migration files.
- Kept final schema in direct `CREATE TABLE` statements with `pgcrypto` and `vector` in the `extensions` schema.
- Changed nullable `SET NULL` source links (`source_document_id`, `source_chunk_id`, `assignment_id`) to simple single-column foreign keys while keeping required org-scoped cascade relationships composite.
- Added the required `import "server-only"` guard to `src/lib/supabase/admin.ts`.
- Installed `server-only` package for the admin client import guard.
- Validation: `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` pass.

### Remote DB Synchronization

- User-approved destructive reset of the remote demo project's `public` schema via Supabase MCP `execute_sql`.
- Reapplied `supabase/migrations/00001_initial_schema.sql` and `supabase/seed.sql` on the remote database.
- Verified remote state: 11 public tables, RLS enabled on all, `pgcrypto` and `vector` in `extensions`, HNSW cosine index on `document_chunks.embedding`, `set_updated_at()` with `search_path = ''`, `match_document_chunks()` as `SECURITY INVOKER`.
- Confirmed nullable source links use single-column FKs (`source_document_id`, `source_chunk_id`, `assignment_id`); old composite nullable FKs removed.
- Seed counts on remote: 1 organization, 2 documents, 10 document chunks; profiles and organization_members seeded when auth user block succeeds.
- Aligned `supabase_migrations.schema_migrations` to a single `00001` / `initial_schema` record.
- Supabase advisors: expected `RLS enabled no policy` INFO notices only; no unexpected `SECURITY DEFINER` warnings from this migration.

## Feature Spec 20: Role-Based Route Structure and Employee Dashboard

Refactored the clickable MVP into role-based URLs and added an employee dashboard.

- Moved admin routes into `src/app/(admin)/admin/...` (`/admin/dashboard`, `/admin/documents`, `/admin/tests`, review, publish, detail, assign).
- Moved employee routes into `src/app/(employee)/employee/...` and added `/employee/dashboard`.
- Updated all admin internal links from `/documents` and `/tests` to `/admin/...`; employee take/result links unchanged.
- Repointed global navbar links and role switcher to `/admin/dashboard` and `/employee/dashboard`.
- Deleted orphan stub routes: `/analytics`, `/employees`, `/progress`, `/my-tests`.
- Added employee dashboard feature module:
  - `employee-dashboard-kpi.ts` — explicit KPI objects (Assigned, Due Soon, Completed, Average Score, Weak Topics).
  - `employee-dashboard-model.ts` — next required test, recent feedback, learning focus, quick actions.
  - Dashboard UI sections: header, KPIs, next test, recent feedback, learning focus, quick actions.
- Enriched `test-5` weak topics in mock results for learning-focus demo (Escalation Paths, Incident Reporting, P0 Routing).
- Root `/` redirects to `/admin/dashboard`.
- Decision 026 recorded in `context/decisions.md`.
- Validation: `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` pass.

### Post-Review Fix Pass

- Fixed Quick Actions card text overflow (`whitespace-normal`, `min-w-0`, `line-clamp-2`) so descriptions stay within each action card.
- Removed non-functional search and notifications buttons from the top navbar.
- Aligned employee dashboard KPI-to-widget vertical spacing with the system `gap-2` rhythm used across dashboard grids.

## Feature Spec 19: Clickable Demo Polish

Polished the clickable MVP into a coherent, demo-ready flow centered on the Security Guidelines story.

- Rethemed canonical mock data (`doc-1`, `test-1`, review, results, follow-up, dashboard) to Security Guidelines with aligned topics, chunks, questions, and weak topics.
- Renamed dashboard `quizCount` → `testCount`; removed residual Quiz wording in user-facing copy.
- Wired dashboard CTAs (Generate Test, document rows, test performance, AI review drafts) to real demo routes.
- Hid off-path nav items (Employees, Analytics, Progress); added friendly not-found pages for invalid document/test IDs.
- Added `review-session.ts` and `take-session.ts` for lightweight sessionStorage continuity (review → publish, take → result).
- Set demo employee `test-1` assignment to `not_started` so Start Test appears in My Tests.
- Added local loading states on generate preview, publish, assign, submit, and follow-up check.
- Improved empty/invalid states (no assigned tests, no approved questions, all-correct follow-up, generate setup hint).
- Added helper copy on review, publish, result, and answer review screens; deduped generate-test primary CTA.
- Validation: `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` pass.

## Feature Spec 18: Publish Test Flow

Replaced the `/tests/publish` placeholder with a full mock publish confirmation flow using local UI state only.

- Extended `MockTestReviewData` in `generated-test-review.ts` with `passingScore` and `selectedChunksCount` for `doc-1`, `doc-2`, and fallback documents.
- Added `publish-test-model.ts` — `buildPublishContext()`, readiness checks, `isPublishReady()`, approved-question filter, and `resolvePublishedTestId()` mapping to existing published mock tests.
- Added UI components:
  - `publish-test-page.tsx` — orchestrator with local `published` and `draftSaved` state; desktop two-column layout (summary + approved questions | readiness + actions).
  - `publish-test-summary.tsx` — final test summary with readiness-driven publish badge, source document, metadata, and review counts.
  - `publish-readiness-card.tsx` — required and informational readiness checks with ready/needs-attention status.
  - `publish-approved-questions.tsx` — approved-questions preview with topic, difficulty, skill, goal, and source chunk; rejected note.
  - `publish-success-state.tsx` — success message, published badge, summary, and next actions (Open Test Detail, Assign to Employees, View All Tests).
- Updated `/tests/publish` route to resolve document via `documentId` query param (same fallback pattern as review route) and render `PublishTestPage`.
- Added shared `document-status-style.ts` and `summary-row.tsx`; reused in review, publish, and assign summary panels.
- Decision 025 recorded in `context/decisions.md`.
- Post-review polish: publish summary badge reflects readiness state; removed duplicate Back to Review link; simplified summary card header layout.
- Validation: `npm run lint`, `npm run typecheck`, and `npm run format:check` pass.

## Feature Spec 17: Follow-up Question Flow

Extended the employee test result page with a lightweight mock follow-up question flow for incorrect answers.

- Added `src/features/employee/tests/mock/follow-up-questions.ts` with `FollowUpQuestion` records for `test-1-q5` (Leave Policies) and `test-5-q2` (Escalation Paths), plus `FollowUpTopicStatus` and lookup helper.
- Updated `test-result-model.ts` to attach optional `followUp` to incorrect `AnswerReviewItem` entries.
- Added UI components:
  - `follow-up-question-card.tsx` — explanation, metadata, single-choice selection, submit, and feedback handoff.
  - `follow-up-answer-feedback.tsx` — "Topic understood" / "Review recommended" feedback with correct answer, explanation, and next actions.
- Updated `test-answer-review.tsx` — "Check understanding" action on incorrect answers with inline expandable follow-up card.
- Updated `test-weak-topics.tsx` — local follow-up status badges (Needs review, Follow-up completed, Topic understood).
- Updated `test-result-page.tsx` — client-side topic-keyed completion state lifted to page level.
- Updated `src/features/employee/tests/MODULE.md` boundaries.
- Decision 024 recorded in `context/decisions.md`.
- Post-review polish: restored unrelated plan doc deletion, switched UI copy to ASCII punctuation, renamed retry CTA to "Try again".
- Validation: `npm run lint`, `npm run typecheck`, and `npm run format:check` pass.

## Feature Spec 16: Test Result and AI Feedback

Replaced the `/employee/tests/[id]/result` placeholder with a full mock result page showing score, pass/fail status, answer breakdown, weak topics, and AI feedback.

- Added `src/features/employee/tests/mock/test-results.ts` with colocated mock attempt records for `test-1` (passed 80%), `test-2` (passed 100%), and `test-5` (failed 67%), including employee answers, weak topics, and mock AI feedback grounded in real question ids.
- Added `test-result-model.ts` — `getEmployeeTestResult()` merges assignment metadata, `mockTests` questions, and attempt records into a full result; builds answer-review items with correct/incorrect status, explanations, topics, and source chunk references.
- Added `test-result-kpi-stats.ts` — keyed KPI objects (Score, Correct answers, Wrong answers, Weak topics, Time spent) with explicit `icon`, `tone`, and `status` properties.
- Added UI components:
  - `test-result-page.tsx` — desktop two-column layout (main + sidebar); mobile stacked order per spec.
  - `test-result-summary.tsx` — title, source document, score, pass/fail badge, completed date, question counts.
  - `test-result-kpi-section.tsx` — 5 keyed KPI cards reusing shared `KPI_TONE_STYLES`.
  - `test-ai-feedback.tsx` — performance summary, understood well, needs improvement, recommended next step.
  - `test-weak-topics.tsx` — topic name, missed count, explanation, recommended review action.
  - `test-answer-review.tsx` — all questions with employee/correct answers, status, explanation, topic, source chunk.
  - `test-result-actions.tsx` — Back to My Tests, Review Source Material, Retake Test navigation.
  - `test-result-not-found.tsx` — not-found state for invalid or unassigned test ids.
- Updated `/employee/tests/[id]/result` route to resolve mock result data and render the page.
- Updated `src/features/employee/tests/MODULE.md` boundaries.
- Decision 023 recorded in `context/decisions.md`.
- Validation: `npm run lint`, `npm run typecheck`, and `npm run format:check` pass.

### Post-Review Fix Pass

- Removed contradictory `SLA Definitions` weak topic from `test-5`; weak topics and AI feedback now align with the single incorrect answer (Escalation Paths).
- Aligned `test-1` and `test-2` assignment records to `completed` with scores matching derived results (80%, 100%).
- Score and pass/fail are now derived from answer review in `test-result-model.ts`; removed redundant `score`/`passed` fields from attempt mock records.
- Extracted shared `getPassFailBadgeClass()` in `employee-test-model.ts`; result summary and answer review reuse it.
- Replaced duplicate `formatTestResultCompletedDate` with existing `formatEmployeeTestDeadline`.

## Feature Spec 15: Employee Test Taking Flow

Replaced the `/employee/tests/[id]/take` placeholder with a full mock test-taking experience using local client state.

- Extended `employee-tests.ts` with `getEmployeeAssignedTestById()` and `getEmployeeTakeableTestById()` — merges assignment metadata with questions from `mockTests`; returns null for unassigned or missing tests.
- Added `test-taking-state.ts` — answer map type, progress helpers, question-type formatting, and local score calculation against `passingScore`.
- Added UI components:
  - `test-taking-page.tsx` — client container with question index, answer map, prev/next/submit navigation, and incomplete-submit warning.
  - `test-question-card.tsx` — one question at a time with topic/type badges, source hint, and selectable answer options (single choice and true/false).
  - `test-progress-panel.tsx` — progress bar, answered/unanswered counts, question navigator (current/answered/unanswered), and test context sidebar.
  - `test-taking-not-found.tsx` — simple not-found state for invalid or unassigned test ids.
- Updated `/employee/tests/[id]/take` route to resolve takeable test and render the flow; submit navigates to the existing result placeholder.
- Updated `src/features/employee/tests/MODULE.md` boundaries.
- Decision 022 recorded in `context/decisions.md`.
- Validation: `npm run lint`, `npm run typecheck`, and `npm run format:check` pass.

### Post-Review Fix Pass

- Removed dead `calculateLocalTestScore()` call from submit handler; helper retained in `test-taking-state.ts` for the result spec.
- Documented MVP single-select answer behavior in `test-question-card.tsx` (true_false and single_choice only).
- Excluded unrelated navbar centering change from the feature commit scope.

## Feature Spec 14: Employee My Tests

Built the employee-facing My Tests dashboard with mock assignments, KPI summary, filters, priority indicators, and placeholder take/result routes.

- Added `src/features/employee/tests/` module with colocated mock data for demo employee `emp-6` (Alex Turner).
- Mock assignments include deadlines, estimated time, required flags, progress, and scores; test metadata resolves from `mockTests` via `resolveMockTest()`.
- Added domain helpers:
  - `employee-test-model.ts` — display status (including overdue), filters, status badges, and action resolution (Start/Continue/View Results/Review).
  - `employee-test-kpi-stats.ts` — keyed KPI stats and overall progress summary.
  - `employee-test-format.ts` — deadline and estimated-time formatting.
  - `employee-test-indicators.ts` — priority indicators (overdue, due soon, required, low score).
- Added UI components:
  - `employee-tests-page.tsx` — header with employee name/role, progress summary, KPI section, filter tabs, card list.
  - `employee-test-card.tsx` — task-style card with metadata, indicators, and status-based actions.
  - `employee-tests-kpi-section.tsx` — 5 keyed KPI cards.
- Replaced `/employee/tests` placeholder with full page; added `/employee/tests/[id]/take` and `/employee/tests/[id]/result` placeholders.
- Updated employee nav "My Tests" link from `/my-tests` to `/employee/tests`.
- Added `src/features/employee/tests/MODULE.md`; updated tests `MODULE.md` related routes.
- Decision 021 recorded in `context/decisions.md`.
- Validation: `npm run lint`, `npm run typecheck`, and `npm run format:check` pass.

### Post-Review Fix Pass

- Split mis-scoped `employee-test-kpi-stats.ts` into focused lib files: `employee-test-format.ts`, `employee-test-indicators.ts`, and KPI-only `employee-test-kpi-stats.ts`.
- Reused `TestDifficulty` from tests mock instead of inline union on `EmployeeAssignedTest`.
- Added `isEmployeeTestFinished()` helper; KPI completed count, overall progress, and completed filter now share one definition.
- Consolidated deadline math via `getDaysUntilDeadline()` in `employee-test-format.ts`; removed duplicate overdue/due-soon date logic.
- Removed redundant completed-filter condition in `filterEmployeeTests()`.
- Extracted shared `KPI_TONE_STYLES` to `src/shared/lib/kpi-tone-styles.ts`; admin and employee KPI sections consume the same tone map.
- Consolidated duplicate status badge classes in `employee-test-model.ts` via `EMPLOYEE_TEST_STATUS_BADGE_CLASS`.

## Feature Spec 13: Assign Test to Employees

Built the mock admin assignment flow connecting test detail to employee selection, configuration, and success state.

- Added colocated mock employees and per-test assignment data in `src/features/tests/mock/employees.ts` (10 employees, assignment status per test).
- Added assignment domain helpers in `src/features/tests/lib/assign-employees-model.ts` (filters, enrichment, summary builder, default settings).
- Replaced `/tests/[id]/assign` placeholder with full assignment workflow:
  - `assign-employees-page.tsx` — client container with selection, filter, settings, confirm, and success states.
  - `assign-test-context.tsx` — test summary card at top of assign page.
  - `assign-employee-list.tsx` — selectable employee table with filter tabs (All / Not assigned / In progress / Completed / At risk).
  - `assign-settings-panel.tsx` — deadline, optional note, reminder placeholder toggle, selected count.
  - `assign-summary-panel.tsx` — live summary with disabled confirm when zero selected.
  - `assign-not-published.tsx` — guard for non-published tests on assign route.
- Updated test detail entry points:
  - Draft tests show disabled "Assign to Employees" button and helper text.
  - `test-assignments-section.tsx` disables assign CTA for non-published tests.
- Added `/employee/tests` placeholder route for success-state "View Employee Tests" navigation.
- Decision 020 recorded in `context/decisions.md`.
- Validation: `npm run lint`, `npm run typecheck`, and `npm run format:check` pass on `src/`.

### Post-Review Fix Pass

- Added `formatAssignmentDeadline()` and `canConfirmAssignment()` helpers; success state and summary panel no longer render `Invalid Date` for empty deadlines; confirm is disabled without a deadline.
- Reconciled `test-1` and `test-2` assignment counts in `mock/tests.ts` with `mockTestEmployeeAssignments` records.
- Extracted shared `AssignBreadcrumb` component; removed duplicated breadcrumb markup.
- Scoped deselect actions to visible rows only (`onDeselectAllVisible`, "Deselect visible" label).

## Feature Spec 12: Tests List and Test Detail

Built the admin Tests management area with mock data only — list page, detail page, and assign placeholder route.

- Added colocated mock model in `src/features/tests/mock/tests.ts` with 5 tests (2 published, 2 draft, 1 archived), document-grounded questions, assignments summary, and results summary.
- Added KPI helpers and UI: `src/features/tests/lib/test-kpi-stats.ts`, `src/features/tests/components/tests-kpi-section.tsx` (5 keyed KPI cards).
- Replaced `/tests` placeholder with `TestsListPage` — KPI section, status filter tabs (All/Draft/Published/Archived), and table with View details links.
- Added `/tests/[id]` detail page with header, status-dependent action bar, settings, questions preview, source document, assignments placeholder, and results summary.
- Added `/tests/[id]/assign` placeholder route.
- Added `src/features/tests/MODULE.md`.
- Validation: `npm run lint`, `npm run typecheck`, and `npm run format:check` pass on `src/`.

### Post-Review Fix Pass

- Source document title/status now resolved from `mockDocuments` via `resolveMockTest()`; mock tests store only `documentId`, `topicsUsed`, and `chunksUsed` (Decision 017 alignment).
- Extracted shared helpers: `test-format.ts`, `test-status-style.tsx`, `test-source-document.ts`.
- Unified test status styling for list and detail; added `aria-pressed` on list filter tabs; standardized difficulty capitalization; documented mock-phase `Edit draft` link behavior.

## Post-Review Fix Pass: Resolve All Review Findings

Systematically fixed all blocking and non-blocking issues found in the prior code review of the Test Review and Generate Test features.

### Fix 1 — Review page hardcoded metadata and CTAs

- `TestReviewPage` now receives and uses `sourceDocumentTitle` and `sourceDocumentStatus` props (the latter was ignored before).
- Status badge is driven by a `STATUS_BADGE` lookup record, covering all four `DocumentStatus` values.
- Hardcoded `"Security Policy v2.1.pdf"` removed; file icon uses `text-muted-foreground` rather than red (file type is unknown without model).
- Live progress indicator added: "X of Y questions approved — approve at least one to publish."
- `reviewData.questionCount` was replaced by `questions.length` to reflect the live array.
- **Test Setup** button now uses `Button asChild` → `Link` to `/documents/${documentId}/generate-test`.
- **Continue to Publish** button is disabled when `approvedQuestions === 0`; navigates to `/tests/publish?documentId=…` when enabled.
- `src/app/tests/publish/page.tsx` updated to accept `documentId` search param and show back link.

### Fix 2 — Review mock data re-grounded to source documents

- Rewrote `doc-1` mock review questions: all 8 questions now match `doc-1` chunks and topics (`Onboarding Steps`, `Code of Conduct`, `Benefits & Compensation`, `Leave Policies`).
- Removed all security-policy content (Access Control, MFA, Data Classification) that was misaligned with the HR/onboarding document.
- Fixed all `whyUseful` copy-paste errors (e.g., access-control question citing onboarding deadlines).
- Normalized `questionCount` to `questions.length` throughout.
- `selectedTopics` aligned with actual chunk topics.
- `doc-2` mock review questions similarly aligned to Safety & Compliance Training Manual chunks.
- Added `buildFallbackReviewData()` for documents with no dedicated mock set.

### Fix 3 — Filter bar, question list, and accessibility

- `ReviewFilterBar` is now a fully controlled component — no internal state; accepts `activeTab`, `onTabChange`, `searchQuery`, `onSearchChange`, `topics`, `topicFilter`, `onTopicFilterChange`.
- Filter + search state lifted to `TestReviewPage`; `filteredQuestions` derived via `useMemo`.
- `handleStatusFilterChange` selects the first matching question when tab changes.
- `ReviewQuestionList` renders question rows as `<button type="button">` with `aria-pressed`, proper focus ring, and quick-approve button with full `aria-label`.
- Empty state ("No questions match the current filters") added.
- Fake pagination controls replaced with a simple "Showing N questions" footer.
- Inline-approve button separated from row click to allow independent interaction.
- All search/filter controls have `<label>` (`sr-only` or visible) and `aria-label` attributes.

### Fix 4 — Review question detail: full edit mode, disabled regenerate, no hardcoded pages

- Added local edit mode with `isEditing` state covering all spec-required fields: question text, options, correct answer, and explanation.
- Options render as editable text inputs in edit mode; each row has a circle selector to mark the correct answer (green checkmark when selected).
- `correctAnswer` is stored as the option string value; editing the text of the selected correct option keeps the pointer in sync.
- Save trims all fields, persists `options` and `correctAnswer` together, and falls back to the first option if the pointer becomes orphaned.
- Edit → Save saves via `onSaveEdit` callback (sets `status: "edited"`); Cancel discards.
- Regenerate button is always `disabled` with a tooltip: "Regenerate is not yet implemented".
- Hardcoded "Pages 6–12" removed; source chunk reference is read from `question.sourceChunkReference`.
- `whyUseful` and `difficulty` added to sidebar.
- Navigation arrow buttons and edit inputs have proper `aria-label`.

### Fix 5 — Topic-chunk synchronization and generate-test guards

- `handleClearAllChunks` now clears both `selectedChunkIds` and `selectedTopics`.
- `handleToggleChunk` on deselect uses new `deriveTopicsFromChunks()` helper to prune orphaned topics — topics whose last chunk was removed are no longer shown as selected.
- Added `canGenerateTest(document)` and `getGenerateBlockReason(document)` to `generate-test-model.ts`.
- Generate Test Preview button is `disabled` when `selectedChunkIds.length === 0` or doc is not ready.
- Non-ready documents show an orange alert banner with the block reason above the form.
- Form sections are `opacity-50 pointer-events-none` for non-ready documents.
- `getDefaultSelectedChunkIds` returns `[]` when `selectedTopics` is empty (was incorrectly falling back to `chunks.slice(0, 3)`).
- `getDefaultSelectedTopics` returns `[]` when document has no chunks.
- `GenerateTestSummary` sidebar button also respects `canPreview`.

### Fix 6 — Document detail data-driven rendering

- Status badge now reflects actual `document.status` via a `STATUS_CONFIG` record.
- File metadata (type, size) reads from model; hardcoded `Security Policy v2.1.pdf`, `PDF`, `2.4 MB`, `128 pages` removed.
- Tab counts `Topics (…)` and `Versions (…)` are real: `document.topics.length`, `document.versions.length`.
- Topics tab renders all `document.topics` dynamically.
- Extracted text preview and full text tab render `document.chunks`.
- Versions tab renders `document.versions` dynamically.
- Document Details sidebar shows real `fileType`, `fileSizeMb`, `uploadedAt`, `chunks.length`, `topics.length`.
- Processing Status timeline now driven by `document.status`; failed state renders an error notice.
- Download and Delete buttons explicitly disabled (coming soon).
- Edit Metadata / Share dropdown items explicitly disabled.
- Generate Test button disabled for non-ready documents.

### Fix 7 — Documents table data-driven rendering

- `FILE_TYPE_BY_DOCUMENT_ID` hardcoded lookup removed; uses `document.fileType` from the model.
- `"2.4 MB"` hardcoded file size replaced with `formatFileSize(document.fileSizeMb)`.
- `document.topicsCount` replaced with `document.topics.length`.
- "Generate Assessment" label changed to "Generate Test" for terminology consistency.
- Generate Test button now uses `Button asChild` → `Link` to the generate-test route.
- Retry and Delete buttons (failed state) explicitly disabled (coming soon).
- `fileType: DocumentFileType` and `fileSizeMb: number` added as required fields on `MockDocumentDetail`.
- All five mock documents updated with correct `fileType` and `fileSizeMb` values.

---

## Feature Spec 11: Test Review Flow with Mock Generated Questions

Closed with post-review fix pass. All verification checklist items pass (`lint`, `typecheck`, `format:check`).

- Replaced the `/tests/review` placeholder with a document-aware review route:
  - `src/app/tests/review/page.tsx` reads `documentId` from query params, resolves a source document from mock data, and loads generated test review data.
- Added the next-step placeholder route:
  - `src/app/tests/publish/page.tsx` displays "Publish Test Flow will be implemented next."
- Added feature-local mock test review data for generated questions:
  - `src/features/tests/mock/generated-test-review.ts` defines review question types/statuses and mock review payloads connected to source documents.
  - Includes options, correct answer, explanation, topic, source chunk reference, tested skill, pedagogical goal, difficulty, usefulness rationale, and review statuses.
  - Added fallback mock generation to keep the review screen functional for documents without a dedicated mock review set.
- Built review UI components under the tests feature:
  - `src/features/tests/components/test-review-page.tsx` renders the review header (title, source document, difficulty, role, count, language, progress), local question state, and continue action.
  - `src/features/tests/components/review-question-card.tsx` renders per-question metadata and local actions for approve, reject, and edit.
  - Edit mode supports local changes for question text, answer options, correct answer, and explanation, then marks the question as `edited`.
  - `src/features/tests/components/review-summary-panel.tsx` renders live counts (total, approved, rejected, edited, remaining), source document, and selected topics.
- Continue action behavior:
  - Primary action "Continue to Publish" navigates to `/tests/publish`.
  - The action is disabled and warning UI is shown when zero questions are approved.
- Context update:
  - `context/progress-tracker.md` moved Feature Spec 11 to Completed and cleared In Progress.
- Validation:
  - `npm run lint` passes.
  - `npm run typecheck` passes.
  - `npm run format:check` passes.

## Feature Spec 10: Generate Test Setup from Document

- Added the Generate Test entry point from the full document detail page:
  - `src/features/documents/components/document-detail.tsx` links the primary action to `/documents/[id]/generate-test` with label "Generate Test".
  - `src/features/documents/components/document-drawer.tsx` passes through the same detail component for drawer previews.
- Added the document-scoped generate test setup route:
  - `src/app/documents/[id]/generate-test/page.tsx` resolves the source document from mock data and uses `notFound()` for unknown ids.
- Built the mock-only setup experience in the documents feature:
  - `generate-test-model.ts` centralizes setup defaults, option labels, topic summaries, and default topic/chunk selection helpers.
  - `generate-test-setup.tsx` owns local state for settings, selected topics, and selected chunks; provides reset, select-all/clear-all chunk handlers, and a redesigned page layout.
  - `generate-test-form.tsx` renders Test Configuration fields (title, difficulty, target role, question count, passing score, language) with bounded numeric parsing.
  - `topic-selector.tsx` renders selectable topic cards with summaries from `getTopicSummary()` and Lucide check icons.
  - `chunk-selector.tsx` renders selectable chunk rows from real `DocumentChunk` mock fields with wired Select All / Clear All actions.
  - `generate-test-summary.tsx` shows generation summary rows (question count, distribution, difficulty, target role, topics, chunks, language, estimated time) and preview CTA.
- Redesigned the setup page to match the reference layout:
  - Top header with Back to Document, Reset, and Generate Test Preview actions.
  - Horizontal source document summary card with status badge, description, and topic/chunk counts.
  - Two-column layout (`lg:col-span-8` main form + `lg:col-span-4` sticky summary sidebar).
- Added the next-flow placeholder:
  - `src/app/tests/review/page.tsx` displays "Test Review Flow will be implemented next."
  - Generate Test Preview navigates to `/tests/review?documentId=[id]`.
- Added feature spec and module context:
  - `context/feature-specs/10-generate-test-setup.md`
  - `src/features/documents/MODULE.md` lists `/documents/[id]/generate-test` as a related route.
- Post-review compliance fixes:
  - Removed hardcoded chunk title/page metadata; chunk UI reads mock chunk fields only.
  - Restored `passingScore` in settings with clamped input.
  - Reset restores default settings, topics, and chunks.
  - Document summary uses `document.description` instead of hardcoded file metadata.
- Validation:
  - `npm run lint` passes.
  - `npm run typecheck` passes.
  - `npm run format:check` passes.

## Feature Spec 09: Refactor UI Primitives from Base UI to Radix

- Replaced Base UI primitives in shared UI:
  - `src/shared/ui/button.tsx` now uses Radix `Slot` with `asChild`.
  - `src/shared/ui/input.tsx` and `src/shared/ui/badge.tsx` now use native/Radix-slot based shadcn patterns.
  - `src/shared/ui/separator.tsx` now uses `@radix-ui/react-separator`.
  - `src/shared/ui/dropdown-menu.tsx` now uses `@radix-ui/react-dropdown-menu`.
- Updated Dropdown usage callsites for Radix semantics:
  - `src/shared/ui/top-navbar.tsx` migrated from `render` to `asChild` with `Link`.
  - `src/features/documents/components/document-detail.tsx` uses `DropdownMenuTrigger asChild`.
- Removed Typography component usage and switched to typography utility classes:
  - Deleted `src/shared/ui/typography.tsx`.
  - Updated all active consumers in `src/app/documents` and `src/features/{analytics,documents}` plus `src/shared/ui/kpi-card.tsx`.
- Refactored Documents KPI rendering:
  - `src/features/documents/lib/document-kpi-stats.ts` now returns explicit KPI metadata (`id`, `icon`, `tone`, optional `status`).
  - `src/features/documents/components/documents-kpi-section.tsx` now maps typed KPI items; removed index-based/manual card duplication.
- Removed unnecessary client-only guard in chart:
  - `src/features/analytics/components/test-completions-chart.tsx` no longer uses local `useIsClient`.
  - Kept `src/shared/ui/chart.tsx` wrapper and added a short comment documenting the shadcn/Recharts wrapper rationale.
- Dependency updates:
  - Removed `@base-ui/react`.
  - Added `@radix-ui/react-dropdown-menu`, `@radix-ui/react-separator`, `@radix-ui/react-slot`.
  - Updated lockfile.
- Context updates:
  - Updated `context/ui-context.md` typography guidance to utility-class usage.
  - Updated `context/progress-tracker.md` to mark Feature Spec 09 completed.
- Validation:
  - `npm run lint -- src` passes.
  - Scoped Prettier check on active project files passes.
  - Full-repo checks (`npm run lint`, `npm run typecheck`, `npm run format:check`) still fail due pre-existing `example/Ontera AI prototype/*` issues outside this spec scope.
- Follow-up fixes after review:
  - `src/shared/ui/separator.tsx`: replaced Base UI-oriented selectors (`data-horizontal`/`data-vertical`) with Radix `data-[orientation=...]` selectors to restore default visible sizing.
  - `src/features/analytics/components/kpi-cards.tsx`: replaced index-based KPI metadata mapping with stable `label`-based metadata map to prevent icon/value-label drift when stat ordering changes.

## Feature Spec 08: Improve Agent Context

- `AGENTS.md`:
  - Removed the stray output instruction line.
  - Kept required workflow guidance for context-first implementation and progress-tracker updates.
- Terminology normalization:
  - Updated active context docs to Tests-first wording in `context/project-overview.md`, `context/architecture.md`, `context/code-standards.md`, and `context/progress-tracker.md`.
  - Replaced legacy terms with preferred mappings (`quiz_documents`→`test_documents`, `quiz_assignments`→`test_assignments`, `quiz_attempts`→`test_attempts`, test generation/review wording).
- Standards and context docs:
  - Added `## Colocation` and `## File Naming` sections in `context/code-standards.md`.
  - Added `context/decisions.md` and `context/invariants.md` for faster agent orientation and invariant checks.
- Module manifests:
  - Added `src/features/documents/MODULE.md`.
  - Added `src/features/analytics/MODULE.md`.
  - Deferred `src/features/tests/MODULE.md` because `src/features/tests/` does not exist yet; recorded in `context/progress-tracker.md`.
- Validation:
  - Ran `npm run lint` and `npm run typecheck`.
  - Both commands fail due to pre-existing errors in `example/Ontera AI prototype/*`, unrelated to this documentation-only spec.

## Feature Spec 07: Redesign Documents Page with Document Detail Page

- Deleted old `documents-table.tsx`, `documents-kpi-section.tsx`, and `document-kpi-stats.ts`.
- Rebuilt `documents-table.tsx` to match the exact visual reference, including the search bar, status filter, sortable columns, and file type icons.
- Rebuilt `documents-kpi-section.tsx` and `document-kpi-stats.ts` to match the new 4-card KPI row with percentage indicators.
- Preserved existing search, filter, and sort behavior.
- Ensured no comments, no emojis, and strict adherence to the design system.
- `npm run lint` and `npm run typecheck` pass with zero errors in `src/`.
- Deleted old `document-detail.tsx`, `document-content.tsx`, and `document-drawer.tsx`.
- Rebuilt `document-detail.tsx` from scratch matching the provided design exactly, using Tailwind v4 and existing shared UI components.
- Rebuilt `document-drawer.tsx` to wrap `DocumentDetail` in a bottom/full-width slide-over.
- Ensured no comments, no emojis, and strict adherence to the design system.
- `npm run lint` and `npm run typecheck` pass with zero errors in `src/`.

## Feature Spec 06: Documents Mock Pages with Quick Preview

- `src/data/mock/documents.ts` — typed mock data for 5 documents with status, topics, chunks, and linked tests.
- `src/features/documents/components/documents-table.tsx` — client-side documents table with title search, status filter, sortable title/status/uploaded columns, file-type icons, title-triggered drawer previews, and quick preview actions.
- `src/features/documents/components/document-drawer.tsx` — right-side vaul Drawer showing document title, status, description, detected topics, content chunk preview, linked tests summary, empty states, custom triggers, and "Open Full Page" / "Close" actions.
- `src/features/documents/components/document-detail.tsx` — full detail presentation component scoped to the documents feature boundary.
- `src/app/documents/page.tsx` — `/documents` route using `DocumentsTable`; replaces placeholder.
- `src/app/documents/[id]/page.tsx` — thin `/documents/[id]` route that resolves mock data and renders `DocumentDetail`.

## Feature Spec 05: Responsive Design Tokens and Typography

- Added responsive spacing and typography CSS variables in `src/app/globals.css`.
- Created `src/shared/ui/typography.tsx` with reusable CVA-backed variants: `h1`, `h2`, `h3`, `p`, `muted`, `small`, and `label`.
- Created `src/shared/ui/kpi-card.tsx` with KPI-specific CVA variants (trend indicators, value colors).
- Created `src/shared/ui/section.tsx`, `src/shared/ui/content-card.tsx`, `src/shared/ui/page-shell.tsx` layout primitives.
- `page-shell.tsx`, `section.tsx`, `content-card.tsx` were later removed in favour of the `.page-shell` CSS class and raw Tailwind composition.

## Feature Spec 04: Admin Dashboard with Mock Data

- `src/data/mock/admin-dashboard.ts` — typed mock data for all dashboard sections (KPI stats, documents, tests, weak topics, recent activity).
- `src/app/dashboard/page.tsx` — full admin dashboard Server Component replacing the placeholder; sections: header with Upload Document + Create Test actions, 5-card KPI grid, Recent Documents (with status badges + topic pills), Test Performance (with completion progress bar + score), Weak Topics (with correctness bar), Recent Activity (with type-mapped icons).
- Uses existing shadcn/ui Card, Badge, Button; Lucide icons; design tokens only — no charts library, no backend logic.
- `npm run lint` and `npm run typecheck` pass cleanly.

### Refactor: Analytics Feature Components

- `src/app/dashboard/page.tsx` is now a thin route component that imports mock dashboard data and renders `AdminDashboard`.
- Dashboard UI was split into `src/features/analytics/components/` sections: admin dashboard container, header, KPI grid, recent documents, AI review, test performance, and test completions.
- Shared dashboard formatting helpers live in `src/features/analytics/lib/dashboard-formatters.ts`; mock data remains in `src/data/mock/admin-dashboard.ts`.
- Visible dashboard copy now consistently uses Tests where user-facing labels require the generic assessment term.
- `npm run lint`, `npm run typecheck`, and `npm run build` pass.

### Visual Alignment

- Dashboard spacing, grid gaps, KPI card sizing, header scale, and card/table typography were aligned closer to the provided dashboard reference while preserving the feature component structure.
- App shell keeps the dark navbar fixed above an inner-scrolling page surface with the documented `rounded-t-[24px]` layout radius.
- Dashboard primary CTA uses a black pill style; secondary CTA stays light/outline.
- Mock KPI microcopy was adjusted for the score trend and weak-topic summary.
- Dashboard cards now share one 12-column grid instead of separate row grids.
- Base `Card` styling centralizes the subtle border, card background, radius, and soft shadow.
- Global foreground/dark theme tokens were adjusted toward the black example palette (`#171717`, `#0a0a0a`, `#ededed`).
- Dashboard card vertical padding was tightened, and the completions chart was widened.

### Active Employees KPI

- Added an `Active Employees` KPI for employees who completed at least one test in the last 7 days.
- Updated `KpiGrid` to render six equal-width KPI cards on large screens.

### Recharts Test Completions Chart

- Added `weeklyCompletions` mock data; replaced static SVG with an `AreaChart` using Recharts.
- Installed `recharts`; chart wrapper in `src/shared/ui/chart.tsx`.
- `npm run lint`, `npm run typecheck`, and `npm run build` pass.

### Reusable KPI Card

- Extracted dashboard KPI card into `src/shared/ui/kpi-card.tsx`.
- Renamed `KpiGrid` → `KpiSection`; feature component maps mock stats to `KpiCard`.
- Updated `AdminDashboard` imports.

## Feature Spec 01: Set up shadcn/ui Design System

- Initialized shadcn/ui v4.10.0 (base-nova style, CSS variables, RSC, TSX).
- Added core components: `button`, `card`, `badge`, `input`, `separator`, `dropdown-menu`, `drawer` — all in `src/components/ui/`.
- Configured `src/app/globals.css` with Ontera AI color tokens (orange primary `hsl(18 84% 53%)`, light gray background `hsl(0 0% 96%)`, border `hsl(214 32% 91%)`, `--radius: 0.625rem`).
- Fixed `@theme inline` to reference `--font-geist-sans` for both `--font-sans` and `--font-heading`.
- `src/lib/utils.ts` has `cn()` using `clsx` + `tailwind-merge`.
- `src/app/page.tsx` replaced with component gallery.
- `npm run lint` and `npm run build` pass cleanly.

## Feature Spec 02: Add Prettier, ESLint and Husky

- Added `prettier`, `eslint-config-prettier`, `husky`, `lint-staged` as devDependencies.
- `.prettierrc` configured with project rules (no semi, double quotes, 100 print width, es5 trailing comma).
- `.prettierignore` / `eslint.config.mjs` / `package.json` scripts updated.
- Husky pre-commit hook runs `lint-staged`.
- Ran `prettier --write .` to format entire codebase.
- `npm run lint`, `npm run typecheck`, `npm run format:check` all pass.

## Feature Spec 03: Build Initial App Shell

- `src/shared/lib/role-context.tsx` — `RoleProvider` + `useRole` hook; mock role toggle (admin | employee).
- `src/shared/ui/top-navbar.tsx` — dark near-black navbar with logo, nav links, orange active underline, icons, role-switcher.
- `src/app/layout.tsx` — wraps app in `RoleProvider`, renders `TopNavbar`.
- `src/app/page.tsx` — redirects to `/dashboard`.
- Placeholder pages for admin and employee routes.
- `src/shared/ui/placeholder-page.tsx` — shared placeholder layout.

### App Shell Improvements

- Mobile navbar: desktop links hidden below `md`; compact shadcn `DropdownMenu` (hamburger) exposes nav links on small screens.
- Fixed malformed role-switcher JSX.
- shadcn paths consolidated to `src/shared/ui/` only; `components.json` aliases updated; empty `src/components/` removed.
- Hardcoded shell colors replaced with semantic tokens/classes.
- `npm run lint` and `npm run typecheck` pass.
