# Implementation History

Detailed session records for all completed feature specs and refinements.

---

## Feature Spec 48: Mock Cleanup — Real Product Feel

**Branch:** `feature/48-mock-cleanup-real-product-feel`

Removed visible mock fallbacks and dead demo links so primary pages render Supabase data, real empty states, or load-error states.

### Seed Data

- Extended `supabase/seed.sql` with demo `document_topics` for both seeded documents.
- Added one published security-guidelines test with approved questions, `test_documents`, one employee assignment, one completed failed attempt, persisted answers, AI feedback text, and an `ai_generation_runs` audit row.

### Mock Fallback Cleanup

- Removed mock document/test fallbacks from admin documents, tests, dashboard, saved test detail, assign, review, and publish route paths.
- Replaced empty Supabase results with real empty states for admin documents, admin tests, dashboard cards, review, and publish.
- Removed hardcoded direct mock links such as `doc-1` and `test-1` from user-facing empty/not-found states.
- Deleted the unused backend fallback banner that advertised demo fallback data.

### Employee Dashboard

- Replaced dashboard-level mock attempt lookup with Supabase-backed completed-attempt and answer-topic queries.
- Recent feedback now links to the persisted result with `?attemptId=`.
- Learning focus is derived from real incorrect answer topics, with mock attempt data kept only for non-UUID local demo test ids.

### Review Fixes

- Filtered dashboard AI Review rows to only show generation runs with recoverable review drafts, so published seed audit rows are not shown as pending drafts.
- Ensured learning-focus explanations come from missed answers rather than earlier correct answers in the same topic.
- Added a schema-drift fallback for employee assignment, take/start, and result loaders when `tests.max_attempts` is missing, defaulting employee attempt limits to 3 until migration `00011_retake_and_transactions.sql` is applied.

### Verification

- `npm run lint` passes.
- `npm run typecheck` passes.
- `npm run format:check` passes.
- `npm run build` passes. Build still reports the existing Next.js middleware-to-proxy deprecation warning.

### Files changed

- `supabase/seed.sql`
- `src/app/(admin)/admin/documents/page.tsx`
- `src/app/(admin)/admin/documents/[id]/page.tsx`
- `src/app/(admin)/admin/documents/[id]/not-found.tsx`
- `src/app/(admin)/admin/tests/page.tsx`
- `src/app/(admin)/admin/tests/[id]/page.tsx`
- `src/app/(admin)/admin/tests/[id]/assign/page.tsx`
- `src/app/(admin)/admin/tests/[id]/not-found.tsx`
- `src/app/(admin)/admin/tests/review/page.tsx`
- `src/app/(admin)/admin/tests/publish/page.tsx`
- `src/app/(admin)/admin/dashboard/page.tsx`
- `src/app/(employee)/employee/dashboard/page.tsx`
- `src/features/analytics/components/admin-dashboard.tsx`
- `src/features/analytics/components/ai-drafts-list.tsx`
- `src/features/analytics/components/dashboard-header.tsx`
- `src/features/analytics/components/recent-documents-card.tsx`
- `src/features/analytics/components/test-completions-chart.tsx`
- `src/features/analytics/components/test-performance-table.tsx`
- `src/features/analytics/lib/supabase-admin-dashboard.ts`
- `src/features/employee/tests/components/employee-dashboard.tsx`
- `src/features/employee/tests/lib/employee-dashboard-model.ts`
- `src/features/employee/tests/lib/supabase-employee-assignments.ts`
- `src/features/employee/tests/lib/supabase-employee-attempts.ts`
- `src/features/employee/tests/lib/supabase-employee-tests.ts`
- `src/features/employee/tests/lib/supabase-schema-drift.ts`
- `src/features/tests/components/tests-list-page.tsx`
- `src/features/tests/lib/publish-test-model.ts`
- `src/features/tests/lib/supabase-review-drafts.ts`
- `src/features/documents/components/backend-fallback-banner.tsx` (deleted)
- `context/progress-tracker.md`

---

## Feature Spec 47: Background Ingestion + Demo Login + Dead-UI Cleanup

**Branch:** `feature/47-background-ingestion-and-demo-login`

Moved initial document ingestion off the upload response path, added gated one-click demo login, and removed residual dead UI controls.

### Background Ingestion

- Split initial upload into fast storage via `storeUploadedDocument()` and background processing via `ingestDocument()`.
- Upload now creates the document row, stores the original file in the private `documents` bucket, returns `processing`, and starts fire-and-forget extraction, chunking, embeddings, and topic extraction.
- Background ingestion reads from the stored original file so failed processing can be retried without another browser upload.

### Processing UI and Failed Actions

- Added polling-based route refresh for document list and detail pages while documents are `processing`.
- Added failed-document Retry through `POST /api/admin/documents/[id]/retry`.
- Enabled failed-document Delete by allowing failed uploads through the existing permanent-delete path while preserving archive-first deletion for ready documents.

### Demo Login and Dead-UI Cleanup

- Added `NEXT_PUBLIC_ENABLE_DEMO_LOGIN` to gate demo buttons on the login page.
- Added one-click Demo admin and Demo employee forms using seeded credentials through the existing `loginAction`.
- Removed or replaced residual dead controls on document detail, documents table, tests list, dashboard, and legacy test detail; deleted the unused `PlaceholderPage`.

### Review Fixes

- Retry now marks the document `processing` before returning so immediate route refreshes do not briefly render stale `failed` state.

### Verification

- `npm run lint` passes.
- `npm run typecheck` passes.
- `npm run build` passes.
- `npm run format:check` still fails on pre-existing unrelated `.docs/48-mock-cleanup-real-product-feel.md`.

### Files changed

- `.env.example`
- `src/app/api/admin/documents/upload/route.ts`
- `src/app/api/admin/documents/[id]/retry/route.ts`
- `src/app/(admin)/admin/documents/page.tsx`
- `src/app/(admin)/admin/documents/[id]/page.tsx`
- `src/features/documents/lib/upload-document.ts`
- `src/features/documents/lib/document-delete.ts`
- `src/features/documents/lib/document-upload-api-client.ts`
- `src/features/documents/schemas/document-upload-schema.ts`
- `src/features/documents/components/document-processing-refresher.tsx`
- `src/features/documents/components/documents-table.tsx`
- `src/features/documents/components/document-detail.tsx`
- `src/features/auth/components/login-form.tsx`
- `src/features/analytics/components/dashboard-header.tsx`
- `src/features/tests/components/tests-list-page.tsx`
- `src/features/tests/components/test-detail-page.tsx`
- `src/shared/ui/placeholder-page.tsx`
- `context/architecture.md`, `context/decisions.md`, `context/progress-tracker.md`, `context/history.md`

---

## Feature Spec 46: Retake + Transactional Reliability

**Branch:** `feature/46-retake-and-transactional-reliability`

Added capped retakes for failed employee assignments and transactional RPCs for multi-row publish and submit writes.

### Database

- Added `supabase/migrations/00011_retake_and_transactions.sql` with `tests.max_attempts`, a partial unique index for one in-progress attempt per employee/test, and two service-role-only `security definer` RPCs.
- `publish_generated_test` atomically inserts the published test, source document joins, and questions.
- `complete_test_attempt` atomically inserts answers, completes the attempt, and updates the assignment status.

### Employee Retakes

- Failed assignments can start a new attempt until `max_attempts` completed attempts is reached.
- Passed assignments remain blocked from retake.
- Result pages and My Tests show retake actions only when the policy allows them, while preserving prior attempts for progress/history.

### Admin Publish and Submit Reliability

- `POST /api/admin/tests/publish-generated` now calls the transactional publish RPC and sets `tests.created_by` to the acting admin.
- Employee submit keeps scoring and best-effort AI feedback in application code, but moves critical answer/attempt/assignment persistence into the transactional submit RPC.

### Review Fixes

- Restricted transactional RPC execution to `service_role` instead of all authenticated users.
- Added the in-progress attempt uniqueness guard to prevent concurrent retake starts from creating multiple active attempts.
- Aligned My Tests retake eligibility with the existing source validity assignment rules.

### Verification

- `npm run lint` passes.
- `npm run typecheck` passes.
- Scoped Prettier check for changed code files passes.
- `npm run build` passes.
- Full `npm run format:check` still fails on pre-existing unrelated `.docs/48-mock-cleanup-real-product-feel.md`.

### Files changed

- `supabase/migrations/00011_retake_and_transactions.sql`
- `src/app/api/admin/tests/publish-generated/route.ts`
- `src/app/api/employee/tests/[id]/start/route.ts`
- `src/features/employee/tests/lib/supabase-employee-attempts.ts`
- `src/features/employee/tests/lib/supabase-employee-assignments.ts`
- `src/features/employee/tests/lib/supabase-employee-tests.ts`
- `src/features/employee/tests/lib/employee-test-model.ts`
- `src/features/employee/tests/lib/test-result-model.ts`
- `src/features/employee/tests/components/employee-tests-page.tsx`
- `src/features/employee/tests/components/test-result-actions.tsx`
- `src/features/employee/tests/components/test-result-page.tsx`
- `src/features/employee/tests/mock/employee-tests.ts`
- `src/lib/supabase/types.ts`
- `context/architecture.md`, `context/decisions.md`, `context/progress-tracker.md`, `context/history.md`

---

## Feature Spec 45: Test Lifecycle Management

**Branch:** `feature/45-test-lifecycle-management`

Added admin lifecycle management for saved tests, including metadata edits, archive, restore, protected delete behavior, archived list visibility, and assignment protections.

### Database

- Added `supabase/migrations/00010_test_lifecycle_tombstones.sql` with `tests.deleted_at`, `deleted_by`, and `deletion_reason`, plus `status = deleted` for archived-test tombstones.
- Applied the migration to the configured Supabase project and verified the new columns exist.

### API and Server Logic

- Added `PATCH /api/admin/tests/[id]` for org-scoped metadata updates: title, description, difficulty, passing score, and target role.
- Added `POST /api/admin/tests/[id]/archive` and `POST /api/admin/tests/[id]/restore`; archive is idempotent, restore keeps source-invalid tests inactive.
- Added `DELETE /api/admin/tests/[id]`; draft/review tests without attempts hard-delete, published tests return `409`, and archived tests with attempts are tombstoned.
- Tightened saved-test list, detail, and assignment loaders to filter by organization and hide `deleted` tombstones from admin lifecycle pages.

### UI

- Added saved-test detail actions for inline metadata editing, archive confirmation with lifecycle impact summary, one-click restore feedback, and strong delete confirmation.
- Kept archived tests visible in the admin tests filter/badges while blocking archived or inactive tests from assignment.

### Review Fixes

- Prevented restore from reactivating tests whose source document validity is blocking.
- Switched lifecycle confirmation impact to exact server-computed counts instead of approximate assignment-summary counts.

### Verification

- `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` pass.

### Context

- Updated `context/architecture.md`, `context/decisions.md`, and `context/progress-tracker.md`.

### Files changed

- `supabase/migrations/00010_test_lifecycle_tombstones.sql`
- `src/app/api/admin/tests/[id]/route.ts`
- `src/app/api/admin/tests/[id]/archive/route.ts`
- `src/app/api/admin/tests/[id]/restore/route.ts`
- `src/features/tests/lib/test-lifecycle.ts`
- `src/features/tests/lib/test-lifecycle-api-client.ts`
- `src/features/tests/schemas/test-lifecycle-schema.ts`
- `src/features/tests/components/saved-test-lifecycle-actions.tsx`
- `src/features/tests/components/saved-test-detail-page.tsx`
- `src/features/tests/lib/supabase-tests.ts`
- `src/features/tests/lib/supabase-test-detail.ts`
- `src/features/tests/lib/supabase-assignments.ts`
- `src/lib/supabase/types.ts`
- `context/architecture.md`, `context/decisions.md`, `context/progress-tracker.md`, `context/history.md`

---

## Feature Spec 44: Employee Progress Page

**Branch:** `feature/44-employee-progress-page`

Added a Supabase-backed `/employee/progress` page for authenticated employees to review completed tests, average score, topic strengths, weak topics, and attempt history.

### Progress Loader

- Added `src/features/employee/tests/lib/supabase-employee-progress.ts` to load completed `test_attempts` for the current employee and organization, fetch related test titles, join answer records to `test_questions.topic`, and derive strengths (`>80%`) and weak topics (`<60%`).
- Exposed shared completed-attempt stats so employee profile metrics can use real attempts.

### Employee UI

- Added `src/app/(employee)/employee/progress/page.tsx` using `requireEmployeeUser()` and the server loader.
- Added `EmployeeProgressPage` with overview KPI cards, strengths and weak-topic lists, an attempt history table, an empty state for employees with no attempts, an all-understood weak-topic state, and a load-error state.
- Added the Progress link to the employee navbar and updated the employee module manifest.

### Assignment Metrics

- Updated `getSupabaseEmployeeAssignments()` so `completedTestsCount` and `averageScore` on the employee profile are computed from real completed attempts instead of hardcoded zeros.

### Review

- Spec-first review found no Critical, Major, or Minor issues. No fix-pass code changes were needed.

### Verification

- `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` pass.

---

## Feature Spec 43: Adaptive Follow-up Persistence

**Branch:** `43-adaptive-follow-up-persistence`

Persisted AI-generated follow-up questions and employee answers so follow-up state survives page reload.

### Database

- Added idempotent migration `00009_adaptive_follow_up_persistence.sql` with `follow_up_questions` and `follow_up_answers` tables, unique `(attempt_id, original_question_id)`, and org-scoped RLS policies aligned with `test_answers`.

### API

- Updated `POST /api/employee/tests/[id]/follow-up` to return existing persisted follow-ups or generate, validate, persist, and respond without `correctOptionId`.
- Added `POST /api/employee/tests/[id]/follow-up/[followUpId]/answer` to validate option selection, persist one answer, and return stored results on duplicate submit.

### Result Hydration

- Extended `getPersistedEmployeeTestResult()` with `followUpsByOriginalQuestionId`.
- Result page components restore follow-up cards, submitted feedback, and weak-topic status after reload.

### UI

- `FollowUpQuestionCard` submits through the answer API for Supabase attempts and keeps mock-local grading for demo tests.
- `TestAnswerReview` hydrates persisted follow-ups and preserves in-session submitted state.

### Review Fixes

- Replaced invalid Zod `.omit()` on refined schema with explicit public output schema.
- Added duplicate-submit race handling on follow-up answer insert.
- Synced local follow-up state after submit so collapse/re-expand preserves answered feedback.

### Verification

- `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` pass.

---

## Feature Spec 42: Admin Analytics Page + Org-Scoped Reads

**Branch:** `feature/42-admin-analytics-and-org-scoping`

Added a dedicated Supabase-backed `/admin/analytics` page and tightened admin analytics reads so dashboard and test progress data are scoped to the authenticated admin's organization.

### Analytics Page

- Added `src/features/analytics/lib/supabase-analytics.ts` to load org-scoped tests, assignments, attempts, answers, questions, and profiles, then derive team average score, completion rate, weak topics, difficult questions, failed employees, best performers, and per-test performance.
- Added `src/app/(admin)/admin/analytics/page.tsx` and `src/features/analytics/components/admin-analytics-page.tsx` with overview KPI cards, weak topic and difficult question tables, employee performance lists, per-test performance reuse, and the required empty states.

### Org-Scoped Reads

- Updated `getAdminDashboardFromSupabase()` and related dashboard queries to require an organization id and filter org-owned Supabase tables by `organization_id`.
- Updated `getSupabaseTestProgress()` to require an organization id and filter assignments, attempts, questions, and answers by `organization_id`.
- Wired dashboard and saved test detail routes to pass the organization id from `requireAdminUser()`.

### Navigation

- Added the admin Analytics nav link and dashboard "View Analytics" quick action.
- Updated the analytics module manifest route list.

### Review Fixes

- Replaced index-based analytics KPI icon mapping with label-keyed metadata to match the project KPI convention and avoid icon drift if KPI order changes.

### Verification

- `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` pass.

### Context

- Recorded decision 061 in `context/decisions.md`.

### Files changed

- `src/app/(admin)/admin/analytics/page.tsx`
- `src/app/(admin)/admin/dashboard/page.tsx`
- `src/app/(admin)/admin/tests/[id]/page.tsx`
- `src/features/analytics/components/admin-analytics-page.tsx`
- `src/features/analytics/components/dashboard-header.tsx`
- `src/features/analytics/lib/supabase-analytics.ts`
- `src/features/analytics/lib/supabase-admin-dashboard.ts`
- `src/features/analytics/MODULE.md`
- `src/features/tests/lib/supabase-test-progress.ts`
- `src/shared/ui/top-navbar.tsx`
- `context/feature-specs/42-admin-analytics-and-org-scoping.md`
- `context/progress-tracker.md`, `context/decisions.md`, `context/history.md`

---

## Feature Spec 41: Review Editor Enhancements

**Branch:** `feature/41-review-editor-enhancements`

Added admin review editor controls for manual add/delete/regenerate, open-ended question support, and persisted draft question review state.

### Database and API

- Added migration `00008_review_editor_enhancements.sql` with idempotent `review_status` on `test_questions`.
- Extended `POST /api/admin/generate-test` to persist draft `tests` + `test_questions` rows and return `testId`.
- Added `PATCH /api/admin/tests/[id]/questions` for upsert/delete draft questions.
- Added `POST /api/admin/tests/[id]/questions/[questionId]/regenerate` for single AI question regeneration.

### Review UI

- Added `ManualQuestionForm` and wired add/delete/regenerate into `test-review-page`, `review-question-list`, and `review-question-detail`.
- Persisted review edits through the new PATCH route when a draft test id is available; sessionStorage remains the optimistic cache.

### Open questions and grading

- Added `open_question` to `QuestionTypeSchema` and generation prompt rules.
- Employee take flow renders textarea for open questions; submit stores `openText` answers.
- Added AI grading via `grade-open-question.ts` with non-fatal fallback to incorrect + "needs manual review".

### Second review fixes

- Fixed persisted review edits/status updates to preserve the question's existing `order_index` instead of overwriting edited questions with index `0`.
- Marked filled manual questions as approved and allowed manual non-open questions through publish validation without a source chunk.
- Included `open_question` in default AI generation question types and persisted open-question grading fallback rationale so result review can show the manual-review note.

### Verification

- `npm run lint`, `typecheck`, `format:check`, and `build` pass.

### Context

- Recorded decisions 058–060 in `context/decisions.md`.

---

## Feature Spec 40: Production Bugfixes

**Branch:** `feature/40-production-bugfixes`

Fixed runtime bugs found during smoke testing across review/publish hydration, employee test-taking, follow-up topic status, and mock ID handling.

### Review and employee runtime fixes

- Updated `src/features/tests/lib/use-resolved-review-data.ts` so the client snapshot returned to `useSyncExternalStore` is memoized, preventing React's uncached `getSnapshot` warning and infinite re-render loop on review/publish pages.
- Updated `src/features/employee/tests/components/test-taking-page.tsx` with a short minimum Supabase attempt-start loading duration to prevent loader flicker before the page transitions to the test UI.
- Restored local demo take/result fallbacks for non-UUID test ids in `src/app/(employee)/employee/tests/[id]/take/page.tsx` and `src/app/(employee)/employee/tests/[id]/result/page.tsx`.
- Updated `src/features/employee/tests/components/test-answer-review.tsx` to use existing mock follow-up records when no persisted attempt is available and to persist completion status against the original weak topic.

### Mock ID API handling

- Extended `src/features/documents/lib/demo-document-ids.ts` with mock test/document ID helpers.
- Updated employee start/submit/follow-up and admin assignment APIs so known mock test IDs return local-demo-flow responses instead of UUID validation errors.
- Updated admin document download/archive/delete/version APIs to resolve API-backed demo document route IDs such as `doc-1` before validation, while mock-only documents return local-demo-flow responses.

### Post-review fixes

- Fixed a review finding where the first pass handled `test-*` IDs but still allowed `doc-1` to fail document API UUID validation.
- Formatted the new spec file and review-fix routes so repo-wide Prettier checks pass.

### Context and validation

- Updated `context/progress-tracker.md` and recorded decision 057 in `context/decisions.md`.
- Validation: `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` pass.

### Files changed

- `context/feature-specs/40-production-bugfixes.md`
- `src/features/tests/lib/use-resolved-review-data.ts`
- `src/features/employee/tests/components/test-taking-page.tsx`
- `src/features/employee/tests/components/test-answer-review.tsx`
- `src/app/(employee)/employee/tests/[id]/take/page.tsx`
- `src/app/(employee)/employee/tests/[id]/result/page.tsx`
- `src/features/documents/lib/demo-document-ids.ts`
- `src/app/api/admin/documents/[id]/download-url/route.ts`
- `src/app/api/admin/documents/[id]/archive/route.ts`
- `src/app/api/admin/documents/[id]/route.ts`
- `src/app/api/admin/documents/[id]/versions/route.ts`
- `src/app/api/admin/tests/[id]/assign/route.ts`
- `src/app/api/employee/tests/[id]/start/route.ts`
- `src/app/api/employee/tests/[id]/submit/route.ts`
- `src/app/api/employee/tests/[id]/follow-up/route.ts`
- `context/progress-tracker.md`, `context/decisions.md`, `context/history.md`

---

## Feature Spec 39: Follow-up and Block Retake

**Branch:** `feature/39-follow-up-and-block-retake`

Replaced preloaded mock follow-ups on the employee result page with on-demand AI-generated follow-up questions, and tightened Supabase-backed retake prevention for completed or failed assignments.

### AI follow-up generation

- Added `src/features/employee/tests/schemas/follow-up-question-schema.ts` — Zod schemas for generated follow-up requests and final `FollowUpQuestion`-shaped output.
- Added `src/features/employee/tests/lib/generate-follow-up-question.ts` — server-only Vercel AI SDK helper using `@ai-sdk/openai`, `FOLLOW_UP_QUESTION_MODEL`, output validation, and bounded timeout.
- Added `src/app/api/employee/tests/[id]/follow-up/route.ts` — employee-only API route that verifies the completed attempt, question ownership, organization scope, and incorrect saved answer before generating a follow-up without persistence.
- Added `src/features/employee/tests/lib/follow-up-question-api-client.ts` — client helper with response validation and friendly retryable errors.

### Result UI and retake blocking

- Updated `src/features/employee/tests/components/test-answer-review.tsx` — incorrect answers now generate follow-ups on "Check understanding" click, with loading, retryable error, and existing follow-up card/feedback UI reuse.
- Updated `src/features/employee/tests/lib/test-result-model.ts` and `src/features/employee/tests/lib/supabase-employee-attempts.ts` — removed mock follow-up attachment and threaded persisted `attemptId` into result UI.
- Updated `src/features/employee/tests/components/test-result-actions.tsx` — result-page "Retake Test" is disabled with the tooltip "Test already completed".
- Updated `src/features/employee/tests/lib/supabase-employee-tests.ts` and `src/features/employee/tests/lib/supabase-employee-attempts.ts` — completed/failed assignments are explicitly not takeable; start/submit assignment updates guard against status races and avoid changing already finished assignments.

### Context and validation

- Updated `.env.example`, `src/features/employee/tests/MODULE.md`, `context/progress-tracker.md`, and `context/decisions.md`.
- Supabase schema verification confirmed the remote database has the existing columns used by the follow-up and retake guards.
- Validation: `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` pass after implementation and after the review fix pass.

### Post-review fixes

- Classified generated follow-up post-validation failures as retryable generation failures instead of generic server errors.
- Added guarded assignment status updates so completed or failed assignments are not changed during start/submit race conditions.

### Files changed

- `.env.example`
- `src/app/api/employee/tests/[id]/follow-up/route.ts`
- `src/features/employee/tests/schemas/follow-up-question-schema.ts`
- `src/features/employee/tests/lib/generate-follow-up-question.ts`
- `src/features/employee/tests/lib/follow-up-question-api-client.ts`
- `src/features/employee/tests/components/test-answer-review.tsx`
- `src/features/employee/tests/components/test-result-actions.tsx`
- `src/features/employee/tests/components/test-result-page.tsx`
- `src/features/employee/tests/lib/test-result-model.ts`
- `src/features/employee/tests/lib/supabase-employee-tests.ts`
- `src/features/employee/tests/lib/supabase-employee-attempts.ts`
- `src/features/employee/tests/MODULE.md`
- `context/progress-tracker.md`, `context/decisions.md`, `context/history.md`

---

## Feature Spec 38: Review Page Supabase Backing

**Branch:** `feature/38-review-page-supabase-backing`

Added Supabase-backed review-page recovery for completed AI generation runs when the sessionStorage draft is unavailable.

### Generation persistence

- Updated `src/app/api/admin/generate-test/route.ts` — completed `ai_generation_runs.output_summary` now includes `review_draft` with the validated draft, source document summaries, and retrieved chunk summaries while preserving existing summary fields.

### Review fallback

- Added `src/features/tests/lib/supabase-review-drafts.ts` — server-only helper `getLatestGenerationRunForDocument(documentId)` and validated mapper for latest completed run recovery.
- Updated `src/app/(admin)/admin/tests/review/page.tsx` — loads Supabase review data for API-backed document ids and falls back to mock review data when no recoverable completed run exists.
- Updated `src/features/tests/lib/use-resolved-review-data.ts` and `src/features/tests/components/test-review-page.tsx` — sessionStorage remains highest priority, Supabase fallback is treated as an AI draft, and mock fallback shows the required demo banner.

### Context and validation

- Updated `context/progress-tracker.md`; recorded decision 055 in `context/decisions.md`.
- Validation: `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` pass.

### Post-review fixes

- Filtered recovered review runs to latest `completed` generation run so failed/pending runs do not hide a valid draft.
- Passed recovered generation `runId` through the review-to-publish link.
- Updated `src/app/(admin)/admin/tests/publish/page.tsx` and `src/features/tests/components/publish-test-page.tsx` — publish uses validated Supabase `review_draft` when sessionStorage is unavailable.

### Files changed

- `context/feature-specs/38-review-page-supabase-backing.md`
- `src/app/api/admin/generate-test/route.ts`
- `src/features/tests/lib/supabase-review-drafts.ts`
- `src/app/(admin)/admin/tests/review/page.tsx`
- `src/app/(admin)/admin/tests/publish/page.tsx`
- `src/features/tests/lib/use-resolved-review-data.ts`
- `src/features/tests/components/test-review-page.tsx`
- `src/features/tests/components/publish-test-page.tsx`
- `context/progress-tracker.md`, `context/decisions.md`, `context/history.md`

---

---

---

---

## Feature Spec 37: Admin Dashboard Widgets from Supabase

**Branch:** `feature/37-admin-dashboard-widgets-from-supabase`

Replaced mock recent documents and AI drafts widgets on `/admin/dashboard` with Supabase-backed data, with per-widget mock fallback and `BackendFallbackBanner`.

### Loader and page

- Extended `src/features/analytics/lib/supabase-admin-dashboard.ts` — fetch latest 5 `documents` and `ai_generation_runs`, map to `MockDocument` / `MockAiDraft`, return `AdminDashboardSupabaseResult` with isolated widget and metrics loading.
- Updated `src/app/(admin)/admin/dashboard/page.tsx` — per-widget real-data fallback for documents, drafts, and metrics; banner when any section falls back.

### UI and types

- Updated `src/data/mock/admin-dashboard.ts` — optional AI draft metadata (`documentId`, `status`, `model`, `createdAt`, action metadata).
- Updated `src/features/analytics/components/ai-drafts-list.tsx` — show status/model/date in existing row subtitle; real generation runs link to their source document instead of unhydrated mock review data.

### Post-review fixes

- Recent document rows now count linked tests through both `tests.source_document_id` and `test_documents`, so dashboard actions do not treat every real document as testless.
- Archived/deleted/uploaded recent documents use display-status-aware badges and actions, preventing generate-test links for non-ready rows.
- Restored Feature Spec 36 in `context/progress-tracker.md` after adding Feature Spec 37.

### Context and validation

- Added `context/feature-specs/37-admin-dashboard-widgets-from-supabase.md`.
- Validation: `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` pass.

## Feature Spec 36: AI Test Feedback

**Branch:** `feature/36-ai-test-feedback`

Added personalized AI feedback generation on employee test submit, persistence to `test_attempts.ai_feedback`, and result-page read with template fallback.

### Schema and generator

- Added `src/features/employee/tests/schemas/attempt-feedback-schema.ts` — Zod output schema, versioned JSON envelope, serialize/parse helpers.
- Added `src/features/employee/tests/lib/generate-attempt-feedback.ts` — server-only structured AI feedback via Vercel AI SDK with best-effort wrapper and `ATTEMPT_FEEDBACK_MODEL` default `gpt-4.1-mini`.

### Submit and result integration

- Updated `src/features/employee/tests/lib/supabase-employee-attempts.ts` — generate feedback after scoring/completion (non-fatal), persist validated envelope to `test_attempts.ai_feedback`, read stored feedback on result load with `buildDynamicAiFeedback()` fallback.
- Extended attempt selects to include `ai_feedback`.

### UI and env

- Updated `src/features/employee/tests/components/test-ai-feedback.tsx` — added "AI-generated" caption next to heading (no new props).
- Updated `.env.example` with `ATTEMPT_FEEDBACK_MODEL=gpt-4.1-mini` and `ATTEMPT_FEEDBACK_TIMEOUT_MS=15000`.

### Context and validation

- Added `context/feature-specs/36-ai-test-feedback.md`.
- Validation: `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` pass.
- Decision 054 recorded in `context/decisions.md`.

### Post-review fixes

- Added `AbortSignal.timeout()` around attempt feedback generation (default 15s via `ATTEMPT_FEEDBACK_TIMEOUT_MS`) so slow AI calls cannot block submit indefinitely.
- Formatted `.docs/spec-template.md` so repo-wide `format:check` passes.

## Feature Spec 35: Multi-document Test Generation

**Branch:** `feature/35-multi-document-test-generation`

Added multi-document test generation, publish persistence, saved test detail source-document display, and source-invalidation compatibility while keeping single-document flows backward-compatible.

### Database and types

- Added `supabase/migrations/00007_multi_document_tests.sql` — `test_documents` join table, indexes, backfill from `tests.source_document_id`, and RLS policies for admin/employee reads.
- Extended `src/lib/supabase/types.ts` with `test_documents` table types.
- Applied migration `multi_document_tests` (`20260613100945`) to the remote Supabase project via MCP; backfill created 1 `test_documents` row from existing tests.

### Server helpers and generation

- Added server-only helpers: `selectable-documents.ts`, `source-document-validation.ts`, `test-documents.ts`, `multi-document-generation.ts`.
- Updated generation schemas, multi-document retrieval, prompt grounding with document labels, and `POST /api/admin/generate-test` to accept `documentIds` (legacy `documentId` preserved).
- Updated publish schema and `POST /api/admin/tests/publish-generated` to validate multi-document sources, insert `test_documents` rows, and set per-question `source_document_id` from chunk ownership.

### Admin UI

- Added `MultiDocumentSelector` and `DocumentTopicSelectionGroup` on the generate-test page; admins can select up to five ready latest documents with grouped topic/chunk selection.
- Updated review/publish draft storage, source labels (`Document → Topic`), and saved test detail to show all source documents and per-question source labels.

### Source invalidation compatibility

- Extended `test-source-invalidation.ts`, `document-impact.ts`, and `document-affected-tests.ts` to resolve dependent tests through `test_documents` when a non-primary source is archived or deleted.

### Post-review fixes

- Tightened generated-test publish validation so a generation run must publish with the exact selected document set and every non-rejected generated question must keep a source chunk.
- Locked the route document in the multi-document selector so it remains preselected as required by the spec.
- Fixed generate-test selection availability by treating non-null Supabase vector values as embedded chunks and removing the global UI pointer-events block that prevented adding source documents while a selection warning was visible.
- Simplified the multi-document selector with compact checkbox rows, a scrollable list (`max-h-[280px]`), and selected documents pinned to the top for easier review.

### Context and validation

- Added `context/feature-specs/35-multi-document-test-generation.md`.
- Updated `context/architecture.md`; recorded decisions 052 and 053.
- Validation: `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` pass.

## Feature Spec 34: Archive Document, Permanent Delete and Inactivate Dependent Tests

**Branch:** `feature/34-archive-delete-document-and-inactivate-dependent-tests`

Added archive-first document lifecycle, permanent tombstone delete, dependent test/question source invalidation, and assignment/start protections while preserving completed results.

### Database and types

- Added `supabase/migrations/00006_document_archive_delete_and_test_inactivation.sql` — `documents` archive/delete audit columns, extended `documents.status` values (`archived`, `deleted`), `tests` activity/source-validity fields, `test_questions` source-document tracking, backfill of `source_document_id`, and indexes including `archived_by` / `deleted_by`.
- Extended `src/lib/supabase/types.ts`, `src/data/mock/documents.ts`, and test mock/domain types for archived/deleted documents and source validity.

### Server logic and APIs

- Added server-only helpers: `document-impact.ts`, `document-archive.ts`, `document-delete.ts`, `document-archive-delete-schema.ts`, `test-source-invalidation.ts`, `test-source-validity-style.ts`.
- Added `POST /api/admin/documents/[id]/archive` and `DELETE /api/admin/documents/[id]` with impact summaries.
- Blocked archived/deleted documents from generation, publish, and permanent-delete download; blocked inactive tests from assignment and employee starts with `409`.
- Applied migration `00006` to the live Supabase project (`document_archive_delete_and_test_inactivation`, `document_archive_delete_actor_indexes`).

### Admin and employee UI

- Added `DocumentLifecycleActions` with archive/delete confirmation dialogs, impact summary, and result dialog.
- Updated document detail, drawer, table (status filters: Active/Archived/Deleted/All), generate-test guards, and test list/detail/assignment UI for source validity and inactive states.
- Updated employee dashboard, test cards, and start/take paths to block inactive tests while preserving completed results.

### Post-implementation fixes

- Added Supabase migration-safety rules to `context/ai-workflow-rules.md` and schema-drift fallbacks in `supabase-documents.ts` and `supabase-tests.ts` (decision 051).
- Migration-aware archive/delete guards: disable actions when pre-`00006` fallback is active; API returns migration-required `409`.
- Fixed stale document drawer/list state after successful archive/delete by applying lifecycle status overrides locally before `router.refresh()`.

### Context and validation

- Added `context/feature-specs/34-archive-delete-document-and-inactivate-dependent-tests.md`.
- Updated `context/architecture.md`; recorded decisions 049, 050, and 051.
- Validation: `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` pass.

## Feature Spec 33: Document Versioning and Change History

Added immutable document versions, version history, new-version uploads, affected-test awareness, and outdated source warnings without mutating existing tests or historical chunks.

- Added `supabase/migrations/00005_document_versioning.sql` — document version metadata, `document_version_events`, indexes, and admin RLS policies.
- Extended `src/lib/supabase/types.ts` with document version columns and `document_version_events`.
- Added server-only document version helpers:
  - `src/features/documents/lib/document-versioning.ts`
  - `src/features/documents/lib/document-version-events.ts`
  - `src/features/documents/lib/document-change-summary.ts`
  - `src/features/documents/lib/document-affected-tests.ts`
- Refactored `src/features/documents/lib/upload-document.ts` so first uploads and version uploads share validation, storage, extraction, chunking, embeddings, and topic extraction.
- Added `POST /api/admin/documents/[id]/versions` for upload-new-version flow with best-effort AI change summaries and affected tests response.
- Updated document upload schemas/client helpers for version upload responses.
- Updated `src/features/documents/lib/supabase-documents.ts` and document models to load latest-only document lists and real version history.
- Added document version UI components and wired document detail/list badges, history, latest/old banners, upload-new-version controls, and an "Update document" dropdown action on document detail.
- Extended `POST /api/admin/generate-test` with optional template test regeneration from the latest ready source version.
- Added old-version warning behavior to the generate setup page.
- Updated saved test detail loading/UI to show outdated source warnings and actions to open old/latest document versions or generate a new draft.
- Updated `context/architecture.md` and recorded decisions 047 and 048.
- Validation: `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` pass.

## Feature Spec 32: AI Document Topic Extraction

Added a separate AI topic extraction step after document upload processing, with durable storage in `document_topics`, chunk-topic fallback, and admin document detail UI.

- Added `context/feature-specs/32-ai-document-topic-extraction.md`.
- Added `supabase/migrations/00004_document_topics.sql` — `document_topics` table, indexes, and admin SELECT RLS policy.
- Added `src/features/documents/schemas/document-topics-schema.ts` — Zod schemas and topic normalization helpers.
- Added `src/features/documents/lib/extract-document-topics.ts` — structured AI topic extraction via Vercel AI SDK.
- Added `src/features/documents/lib/persist-document-topics.ts` — best-effort AI persistence with chunk fallback.
- Updated `src/features/documents/lib/upload-document.ts` — topic step after chunk insert, non-fatal on failure.
- Updated `src/features/documents/lib/supabase-documents.ts` — load `document_topics` for list/detail mapping.
- Updated `src/data/mock/documents.ts` — `DocumentTopic` type and optional `documentTopics` on detail model.
- Updated `src/features/documents/components/document-detail.tsx` — AI-extracted topics section with description and confidence.
- Extended `src/lib/supabase/types.ts` with `document_topics` table types.
- Decision 046 recorded in `context/decisions.md`.
- Validation: `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` pass.

### Post-Review Fix Pass

- Kept Generate Test topic selection chunk-backed so AI document topic names do not break chunk matching.
- Enforced 5–10 AI topics in structured output validation.
- Filtered generic topic names from chunk fallback topics.
- Added a temporary missing-table fallback for `document_topics` reads so existing document pages keep using chunk-derived topics until `00004_document_topics.sql` is applied.
- Added `src/features/documents/lib/chunk-extracted-text-ai.ts` and wired AI chunking into upload ingestion with heuristic fallback.
- Updated AI chunking prompt to reuse topic names across related chunks and cap distinct topics to 5–7.
- Fixed corrupted `supabase-documents.ts` module structure after missing-table fallback patch.

## Feature Spec 31: Real Document Upload, Download Link and AI Text Extraction

Added the first real admin document upload and ingestion pipeline with private Supabase Storage, one-time text extraction, chunking, embeddings, signed downloads, and admin UI integration.

- Added `context/feature-specs/31-real-document-upload-download-and-ai-text-extraction.md`.
- Added `context/document-ingestion.md`.
- Added `supabase/migrations/00003_document_upload_ingestion.sql` — upload metadata columns and private `documents` storage bucket.
- Added `src/shared/ai/chunk-embeddings.ts` — shared embedding helpers reused by upload ingestion and `scripts/embed-demo-chunks.ts`.
- Added server-only ingestion helpers under `src/features/documents/lib/`:
  - `upload-document.ts`, `extract-document-text.ts`, `clean-extracted-text.ts`, `chunk-extracted-text.ts`, `embed-document-chunks.ts`, `document-download-url.ts`, `document-file-types.ts`, `document-upload-api-client.ts`
- Added `src/features/documents/schemas/document-upload-schema.ts`.
- Added `POST /api/admin/documents/upload` and `POST /api/admin/documents/[id]/download-url`.
- Added `DocumentUploadButton` and `DocumentDownloadButton` client components.
- Updated admin documents list/detail UI, Supabase document mapping, and generate-test gating to require embedded chunks.
- Updated `.env.example` with `MAX_UPLOAD_MB` and `DOCUMENT_TEXT_EXTRACTION_MODEL`.
- Decision 045 recorded in `context/decisions.md`.
- Validation: `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` pass.

### Post-Review Fix Pass

- Applied `00003_document_upload_ingestion.sql` to remote Supabase after documents page failed with missing `documents.file_type` column.
- Verified private `documents` storage bucket exists on remote project.

## Feature Spec 30: Invite-only Auth and RLS Policies

Added invite-only Supabase Auth with organization membership roles, route protection, API authorization, and RLS policies. Replaced hardcoded demo employee identity and mock role switcher with authenticated user context.

- Added `context/feature-specs/30-invite-only-auth-and-rls-policies.md`.
- Added `context/auth-demo-setup.md` — local demo user setup and verification queries.
- Added `supabase/migrations/00002_auth_rls_policies.sql` — organization-scoped RLS policies and helper functions.
- Added `src/features/auth/lib/current-user.ts` — resolve auth user, profile, and active membership.
- Added `src/features/auth/lib/require-auth.ts` — layout guards and API auth helpers with org verification.
- Added `src/features/auth/actions/login.ts` and `src/features/auth/components/login-form.tsx`.
- Added `src/middleware.ts` — Supabase SSR session refresh.
- Added `/login`, `/access-denied`, and `POST /auth/logout`.
- Added `src/shared/components/app-shell.tsx` — authenticated shell with role-aware navbar.
- Updated admin/employee layouts — require role membership; wrap content in `AppShell`.
- Updated `src/shared/ui/top-navbar.tsx` — authenticated user menu with sign out; removed mock role switcher.
- Removed `src/shared/lib/role-context.tsx`.
- Updated employee Supabase libs and pages — use authenticated `userId` instead of hardcoded demo employee id.
- Updated admin APIs (`generate-test`, `publish-generated`, `assign`) and employee APIs (`start`, `submit`) — enforce membership and organization ownership.
- Decision 043 recorded in `context/decisions.md`.

### Post-Review Fix Pass

- Applied `00002_auth_rls_policies.sql` to remote Supabase — RLS was enabled from `00001` but policies were missing, blocking authenticated reads of `profiles` and `organization_members`.
- Switched RLS helper functions to `security definer` with `auth.uid()` checks to avoid recursion on `organization_members` policies.
- Removed employee direct SELECT on `test_questions` so `correct_answer` is not exposed via the Data API.
- Removed mock assignment fallback for authenticated employee routes; Supabase-backed flows always use the signed-in user and organization.
- Threaded `organizationId` through employee start/submit/result helpers and API routes for org-scoped assignment verification.
- Added `context/auth-demo-setup.md` with migration requirement and demo credential placeholders.
- Validation: `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` pass.

## Feature Spec 29: Admin Progress and Results from Supabase

Replaced mock admin progress/result data with Supabase-backed assignment and attempt reads for the admin dashboard and UUID test detail pages, while preserving mock fallback for demo ids and empty/error Supabase states.

- Added `context/feature-specs/29-admin-progress-and-results-from-supabase.md`.
- Added `src/features/analytics/lib/supabase-admin-dashboard.ts` — server-only dashboard KPIs, test performance rows, weekly completions, and recent attempts from `tests`, `test_assignments`, `test_attempts`, `test_answers`, and `profiles`.
- Added `src/features/tests/lib/supabase-test-progress.ts` — server-only per-test employee progress, results summary, weak topics, and recent attempts.
- Added `src/features/analytics/components/recent-attempts-card.tsx` — dashboard recent attempts card.
- Updated `src/app/(admin)/admin/dashboard/page.tsx` — Supabase-first dashboard with mock fallback and `BackendFallbackBanner`.
- Updated `src/features/analytics/components/admin-dashboard.tsx` — optional recent attempts section.
- Updated `src/app/(admin)/admin/tests/[id]/page.tsx` — loads test progress for UUID saved tests.
- Updated `src/features/tests/components/saved-test-detail-page.tsx` — employee score/result/completed fields and `TestResultsSection` for weak topics and recent attempts.
- Decision 042 recorded in `context/decisions.md`.

### Post-Review Fix Pass

- Restored missing `Feature Spec 28` entry in `context/progress-tracker.md`.
- Fixed weak-topic correctness on test detail to aggregate from persisted `test_answers` per topic instead of dividing wrong answers by question count.
- Validation: `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` pass.

## Feature Spec 28: Employee Test Taking and Attempt Persistence

Replaced mock/sessionStorage employee test-taking for Supabase UUID assigned tests with persisted `test_attempts` and `test_answers`, while preserving mock fallback for old demo test ids.

- Added `src/features/employee/tests/lib/supabase-employee-tests.ts` — server-only assignment verification and sanitized question loading without `correct_answer`.
- Added `src/features/employee/tests/lib/supabase-employee-attempts.ts` — start/reuse active attempts, server-side scoring, answer persistence, assignment status updates, and persisted result assembly.
- Added `src/features/employee/tests/lib/employee-attempt-api-client.ts` — browser client for start/submit employee attempt APIs.
- Added `src/features/employee/tests/schemas/submit-attempt-schema.ts` — Zod request/response validation for submit flow.
- Added `POST /api/employee/tests/[id]/start` and `POST /api/employee/tests/[id]/submit` route handlers.
- Extended `src/lib/supabase/types.ts` with `test_attempts` and `test_answers`.
- Updated `src/features/employee/tests/lib/supabase-employee-assignments.ts` — joins latest completed attempt metadata for score, pass/fail, and result links.
- Updated `src/features/employee/tests/lib/test-taking-state.ts` — mock vs Supabase takeable test unions and Supabase option-id answer progress helpers.
- Updated `src/app/(employee)/employee/tests/[id]/take/page.tsx` — UUID tests load Supabase take payload; mock ids keep existing flow.
- Updated `src/features/employee/tests/components/test-taking-page.tsx` — starts attempt on load for Supabase tests, submits to API, redirects to persisted result URL.
- Updated `src/features/employee/tests/components/test-question-card.tsx` — supports mock text answers and Supabase option-id selection including multiple choice.
- Updated `src/app/(employee)/employee/tests/[id]/result/page.tsx` — reads persisted results when `attemptId` query param is present.
- Updated `src/features/employee/tests/lib/employee-test-model.ts` — completed/failed Supabase tests link with `?attemptId=`.
- Decision 040 recorded in `context/decisions.md`.
- Validation: `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` pass.

### Post-Review Fix Pass

- Relaxed submit schema `selectedOptionIds` to `z.string().min(1)` so AI/publish option ids like `opt-a` validate correctly (not UUIDs).
- Blocked retakes for `completed`/`failed` assignments in take loading and start-attempt API (`409`).
- Hardened submit: reject duplicate answer rows, complete attempt with `status = in_progress` guard, rollback answers on race loss, idempotent redirect for already-completed attempts.
- Fixed Supabase “Submit anyway” by allowing empty answer arrays and sending all question ids with `[]` for unanswered questions.
- Handled duplicate start-attempt race by re-fetching active attempt after insert failure.

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
