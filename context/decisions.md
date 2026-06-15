# Decisions

## 068 — Documents can be directly archived or deleted

Admin document archive and delete actions support every non-deleted Supabase-backed document, including seeded demo documents and ready uploaded documents. Archiving remains optional and is not a prerequisite for permanent deletion.

## 067 — Employee nudges are append-only audit events

Admin reminder nudges from the employee management page are recorded in `employee_nudge_events` with organization scope, target employee, acting admin, channel, reason, and timestamp. Employees can see only their own reminder events on the employee dashboard; actual Slack or email delivery remains out of scope until a future integration spec.

## 066 — Document uploads store first and ingest in background

Initial document uploads create the document row, store the original file in the private `documents` bucket, and return `processing` before extraction, chunking, embeddings, and topic extraction run fire-and-forget. Background ingestion reads the stored original file so failed upload processing can be retried without another browser upload.

## 065 — Publish and submit multi-row writes use transactional RPCs

Publishing generated tests uses `publish_generated_test` to atomically insert the published test, source document joins, and questions with `created_by` set to the acting admin. Employee submit uses `complete_test_attempt` to atomically insert answers, complete the attempt, and update assignment status; best-effort AI feedback stays outside the critical transaction.

## 064 — Failed assignments are retakeable up to max_attempts

Failed assignments can start a new attempt while preserving prior completed attempts until the test-level `max_attempts` limit is reached. Passed assignments cannot be retaken, retakes are blocked when the source test is inactive or source-invalid, and the database enforces at most one in-progress attempt per employee/test.

## 063 — Archived tests with attempts are tombstoned on delete

Draft/review tests without attempts can be hard-deleted. Published tests cannot be deleted directly. Archived tests with attempts are marked `status = deleted`, inactive, and retain delete audit metadata so employee history and completed results remain available without showing the test in admin lifecycle lists.

## 062 — Follow-up questions and answers persist per attempt

Adaptive follow-ups are stored in `follow_up_questions` and `follow_up_answers`, keyed by `(attempt_id, original_question_id)` with one answer per follow-up. Generate persists after successful AI validation and returns a public payload without `correctOptionId`; answer validates ownership, persists once, and returns correctness plus explanation. Result loaders hydrate persisted follow-ups so reload restores generated and answered state.

## 061 — Admin analytics reads require explicit organization scope

Admin dashboard, analytics, and test-progress helpers use the server-only Supabase admin client but must receive `organizationId` from `requireAdminUser()` and filter every org-owned query with `.eq("organization_id", organizationId)`. Missing organization scope throws instead of returning cross-org data.

## 060 — Open question grading is best-effort on submit

Open-ended answers are graded by AI during attempt submit using the question's stored `expectedAnswer`. If grading fails or times out, the answer is marked incorrect with a "needs manual review" note persisted in `user_answer`. Submit, scoring, and attempt completion must succeed regardless of grading outcome.

## 059 — Manual review questions skip source chunk validation

Questions added manually in the review editor do not require `source_chunk_id` for publish. AI-generated questions remain grounded through chunk references; manual questions are stored with `source_status = manual_kept` and approved by default once the form is filled.

## 058 — Draft tests persist at generation for review mutations

`POST /api/admin/generate-test` writes a draft `tests` row and `test_questions` immediately, returning `testId` to the client. Review editor add/delete/regenerate/edit/approve/reject operations mutate those rows through `PATCH /api/admin/tests/[id]/questions`, with `review_status` on each question tracking admin review state before publish.

## 057 — Demo route IDs resolve before API UUID validation

Mock route ids such as `doc-1`, `doc-4`, and `test-*` must not fail generic UUID validation at API boundaries. Known mock test ids return local-demo-flow responses; mapped demo document route ids resolve to seeded Supabase UUIDs via `resolveApiDocumentId()` before auth and data access; mock-only document ids return local-demo-flow responses. Employee take/result pages keep the same mock fallback for non-UUID test ids.

## 056 — Follow-up questions are generated on demand without persistence

Employee result pages generate one single-choice follow-up question at click time for an incorrect saved answer. Generated follow-ups are Zod-validated and mapped to the existing result-page UI type, but are not written to `follow_up_questions` or `follow_up_answers` until a future persistence spec explicitly adds that behavior.

## 055 — Completed generation runs persist review-draft recovery data

Completed AI generation runs store the validated draft, source document summaries, and retrieved chunk summaries in `ai_generation_runs.output_summary.review_draft`. Review and publish pages recover the latest `completed` run for a document when sessionStorage is unavailable; summary-only, failed, or pending runs fall back to visible demo data.

## 054 — Employee attempt feedback is persisted with best-effort generation on submit

After an employee submits a test, AI feedback is generated once from scored answers and persisted to `test_attempts.ai_feedback` as a versioned JSON envelope. Generation runs best-effort with a bounded timeout; submit and scoring must succeed even when feedback generation, validation, or persistence fails. Result pages read stored feedback first and fall back to `buildDynamicAiFeedback()` template output.

## 053 — Multi-document tests use question-level source tracking

In multi-document tests, each question tracks its source through `source_chunk_id` and `source_document_id`. If one source document becomes archived or deleted, only questions linked to that document are marked source-invalid, while the test becomes inactive until admin review. Valid questions from other documents remain stored for future repair flows.

## 052 — Tests support multiple source documents through test_documents

Tests keep `tests.source_document_id` for backward compatibility, but new generated tests can reference multiple source documents through `test_documents`. Generated questions remain grounded through `source_chunk_id`, and publish validation ensures every approved question references a chunk from one of the selected documents.

## 051 — Supabase loaders tolerate unreleased migration schema drift

When new Supabase columns are added in a migration that may not yet be applied to every target database, read paths must not hard-fail on missing columns. Document and test loaders attempt the full post-migration select first, then fall back to a legacy select and normalize new fields to safe defaults. Write paths that require the new schema (archive, delete, source invalidation) return a migration-required error instead of a generic server failure, and the UI disables those actions when archive/delete metadata is unavailable.

## 050 — Source-invalid tests become inactive until reviewed

When a source document is archived or deleted, dependent tests become inactive and receive a source validity state. Affected questions are marked inactive with an invalid source status. Existing completed results remain available, but new assignments and new attempts are blocked until an admin reviews or repairs the test.

## 049 — Document deletion is archive-first and tombstone-based

Documents must be archived before permanent deletion. Permanent deletion removes the uploaded file, extracted text, chunks, and topics, but keeps a lightweight document tombstone so tests can show that their source document was deleted.

## 048 — Regeneration from a new document version creates a new draft, not a mutation of published tests

When a new document version is uploaded, existing tests generated from older versions remain unchanged and valid. Admins may generate a new AI draft from the latest version, but the system does not delete old questions, rewrite published tests, change assignments, or alter completed results automatically.

## 047 — Documents use immutable versions with visible change history

Documents are not overwritten in place. Uploading an updated file creates a new document row with its own extracted text, chunks, embeddings, topics, version metadata, and history event. Old versions remain available for historical tests and results. The UI shows a document version timeline, latest/old version badges, and outdated source warnings for tests generated from older versions.

## 046 — Document topics are extracted as a separate AI step

Uploaded documents receive AI-extracted learning topics after text extraction, chunking, and embeddings. Topics are stored separately from chunks so the UI can present document-level learning concepts and future generation/recommendation flows can use better topic data than raw chunk headings alone.

## 045 — Uploaded documents use private storage, signed downloads, and AI text extraction

Real uploaded documents are stored as original files in a private Supabase Storage bucket. The app does not render original documents inline; instead, admins can download originals through short-lived signed URLs. Text is extracted once after upload, saved to `documents.extracted_text`, chunked, embedded with `text-embedding-3-small`, and then reused through the existing pgvector retrieval and AI test generation flow.

## 044 — RLS membership helpers use security definer to avoid policy recursion

Organization-scoped RLS checks (`is_active_org_admin`, `is_active_org_member`, assignment helpers) run as `security definer` functions that still gate on `auth.uid()`. This avoids infinite recursion when policies on `organization_members` need to read `organization_members`, while keeping authorization tied to the current authenticated user.

## 043 — Ontera AI uses invite-only access with organization membership roles

Ontera AI does not support public registration. Authenticated users must have an active `organization_members` row. The application role is resolved from `organization_members.role`, not from `profiles` or `user_metadata`. Admin routes require admin membership, employee routes require employee membership, and Supabase RLS policies protect organization-scoped data.

## 042 — Admin progress reads assignments and attempts from Supabase

Admin progress and result views use `test_assignments`, `test_attempts`, and `test_answers` as the source of truth for backend-backed tests. The dashboard and test detail pages show real completion status, scores, recent attempts, and simple weak topics where available. Mock analytics remain fallback only until auth/RLS and full reporting are implemented.

## 041 — Completed employee assignments are not retakeable

Supabase-backed employee test-taking allows start/submit only while `test_assignments.status` is `not_started` or `in_progress`. Completed or failed assignments cannot reopen the take flow or create new attempts until a future retake spec explicitly adds that behavior.

## 040 — Employee attempts and answers persist in Supabase

Employee test-taking for Supabase-backed assigned tests uses `test_attempts` and `test_answers` as the source of truth. The server validates assignment ownership, calculates score from `test_questions.correct_answer`, saves answers, completes the attempt, and updates assignment status. Mock/local employee flows remain fallback only for old mock tests until auth and RLS are implemented.

## 039 — Test assignments use Supabase as source of truth

Published tests are assigned to employees through `test_assignments`. Assignable employees come from active `organization_members` with role `employee`, joined with `profiles`. Employee dashboard and employee tests pages read Supabase assignments first, while mock assignments remain only as fallback/dev fixture until auth and attempt persistence are implemented.

## 038 — Full document text lives in extracted_text; chunks stay for RAG

`documents.extracted_text` stores the complete assembled document content for display. `document_chunks` remain the source for topics, generate-test selection, and pgvector retrieval. Demo seed data hydrates `extracted_text` from ordered chunks; the document detail UI prefers `extractedText` when present and falls back to chunk rendering for mock-only documents.

## 037 — Admin documents and tests use Supabase as primary source

Admin documents and tests pages now read from Supabase first. Mock data remains as fallback/dev fixture for old demo ids and offline demo recovery, but Supabase-backed documents, saved tests, and test questions are the primary source for admin core pages.

## 033 — Reviewed AI drafts persist as published tests

Reviewed AI-generated drafts are persisted only after admin review. The save flow writes one row to `tests` and approved questions to `test_questions`, derives `organization_id` from the source document, updates `ai_generation_runs.test_id`, and redirects to the saved test detail page. Employee attempts/results remain out of scope for the demo slice.

## 032 — Generate Test page uses real AI API with temporary draft handoff

The admin generate-test page calls `POST /api/admin/generate-test` to create a real AI-generated draft from retrieved document chunks. The draft is stored in `sessionStorage` (`ontera.generatedTestDraft`) and consumed by review and publish pages. Review edits use run-scoped session keys when `generationRunId` is present. Generated tests are not persisted to `tests` / `test_questions`; admin review remains required before publishing.

## 031 — AI test generation uses retrieved document chunks as grounded context

AI-generated test drafts are created only after retrieving embedded document chunks through the `match_document_chunks` RPC. The generation endpoint uses structured output validation and requires each generated question to reference a source chunk. Generated questions are returned as a draft and are not automatically published.

## 030 — Use SUPABASE_SECRET_KEY for server-only admin access

Server-side Supabase admin access uses `SUPABASE_SECRET_KEY` (`sb_secret_...`) from Dashboard → Settings → API Keys. Never expose this key through `NEXT_PUBLIC_*` env vars or import the admin client in client components. Prefer the new publishable/secret API keys over legacy `anon` / `service_role` JWT keys.

## 029 — Demo chunks use OpenAI text-embedding-3-small

Demo document chunks are embedded with OpenAI `text-embedding-3-small`. The database stores embeddings in `document_chunks.embedding` as `extensions.vector(1536)`. Embeddings are generated by a server-side script using the Supabase admin client (`SUPABASE_SECRET_KEY`) and are verified through the `match_document_chunks` RPC before AI question generation is implemented.

## 028 — Squash backend foundation into a single initial migration

Express the backend foundation as one fresh-database migration (`supabase/migrations/00001_initial_schema.sql`) instead of iterative timestamped migrations. Final schema uses direct `CREATE TABLE` statements; `pgcrypto` and `vector` live in the `extensions` schema; nullable source links use single-column `ON DELETE SET NULL` foreign keys while required org-scoped relationships stay composite with `ON DELETE CASCADE`.

## 027 — Supabase backend foundation with restrictive RLS and server-only admin access

Keep RLS enabled on public Supabase tables by default. User-scoped app access goes through `@supabase/ssr` clients with `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; internal RAG/embedding jobs use a server-only service-role client and must never expose that key to the browser. Organization ownership is enforced with composite foreign keys for required cascade relationships; nullable source links use single-column `ON DELETE SET NULL` foreign keys to avoid nulling required `organization_id`.

## 026 — Role-based route groups with global demo navbar

Admin routes live under `src/app/(admin)/admin/...` (`/admin/dashboard`, `/admin/documents`, `/admin/tests`, etc.). Employee routes live under `src/app/(employee)/employee/...` (`/employee/dashboard`, `/employee/tests`, take/result). Route groups are organizational only. The global `TopNavbar` and `RoleProvider` remain in the root layout; nav links and the role switcher navigate to `/admin/...` or `/employee/...` dashboards. No auth middleware or legacy redirects. Orphan stub routes (`/analytics`, `/employees`, `/progress`, `/my-tests`) were removed.

## 025 — Publish test flow uses static review mock data and local UI state

The `/tests/publish` flow lives in `src/features/tests/` with helpers in `lib/publish-test-model.ts` and colocated publish UI components. Publish reads `getMockTestReviewData()` on load (same static source as review route); review-page approve/reject edits are not passed across routes. Readiness checks gate the Publish action; success routes to the closest existing published mock test id (`doc-1` -> `test-1`, `doc-2` -> `test-2`). No Supabase, persistence, or global state.

## 024 — Follow-up questions use inline mock flow with topic-keyed local state

The result-page follow-up flow lives in `src/features/employee/tests/` with colocated mock follow-up records in `mock/follow-up-questions.ts`, keyed by `originalQuestionId`. Incorrect answers in answer review expose a "Check understanding" action that expands an inline card (explanation, single-choice question, feedback). Entry point is answer review only; weak topics reflect completion status via local state keyed by topic (`needs_review`, `follow_up_completed`, `topic_understood`). No AI generation, persistence, or new routes.

## 023 — Employee test results use colocated mock attempt records

The `/employee/tests/[id]/result` page lives in `src/features/employee/tests/` with colocated mock attempt records in `mock/test-results.ts`. Results merge assignment metadata, `mockTests` questions, and explicit attempt data (answers, weak topics, AI feedback). Score and pass/fail are derived from employee answers against question correct answers — not stored independently on attempt records. No state is passed from the take flow; both passed and failed states are represented via static mock records. KPI presentation uses keyed objects with explicit `tone` and `status` properties.

## 022 — Employee test-taking uses feature-local mock state and assignment gate

The `/employee/tests/[id]/take` flow lives in `src/features/employee/tests/` with colocated helpers and components. Only tests assigned to the demo employee (`emp-6`) are takeable; questions resolve from `mockTests`. Answer selection, navigation, progress, and local score calculation use client-side state only — no persistence or result-page state passing until the result spec lands.

## 021 — Employee My Tests uses dedicated feature module and mock current employee

The `/employee/tests` page lives in `src/features/employee/tests/` with colocated mock assignments for a fixed demo employee (`emp-6`). Assignment deadlines, scores, progress, and required flags are enriched in employee mock data while test metadata resolves from `mockTests`. Employee nav "My Tests" links to `/employee/tests`. Test-taking and result routes are placeholders only. Shared KPI tone styles live in `src/shared/lib/kpi-tone-styles.ts`.

## 020 — Assign test flow uses feature-local mock employees and client state

The `/tests/[id]/assign` flow uses colocated mock data in `src/features/tests/mock/employees.ts` for employee profiles and per-test assignment status. Assignment confirmation updates client-side state only — no Supabase or persistence. Employee selection uses accessible selectable rows (no checkbox primitive installed). Success navigation links to `/employee/tests` as the next planned employee route.

## 019 — Tests list/detail use colocated mock tests model

`mockTests` in `src/features/tests/mock/tests.ts` is the single source of truth for the tests list and test detail pages. Source document title and status are resolved from `mockDocuments` via `resolveMockTest()` — mock tests store only `documentId`, `topicsUsed`, and `chunksUsed`. KPI presentation metadata is keyed by stable ids (not index-mapped). Publish, archive, restore, and assignment actions remain mock/placeholder until backend slices land.

## 018 — Review question edits store correctAnswer as option text, not index

In the mock review edit flow, `correctAnswer` remains the option string value (aligned with `ReviewQuestion.correctAnswer`), not a numeric index. The edit UI uses a per-option selector button; when option text changes, the correct-answer pointer follows if that option was selected. On save, if the pointer no longer matches any option, it falls back to the first resolved option.

## 017 — Document model owns fileType and fileSizeMb; components must not hardcode per-ID metadata

`fileType` (pdf|docx|pptx|txt) and `fileSizeMb` are first-class fields on `MockDocumentDetail`. Components must read these from the model and must not maintain a per-document-ID mapping in component code. This ensures the table, detail page, and any drawer all render consistent, data-driven values with zero component-level hardcoding.

## 016 — Generate test setup stays mock-only with feature-local state

The `/documents/[id]/generate-test` flow uses client-side local state and `generate-test-model.ts` helpers only. No Supabase, AI calls, or persistence are added until the test generation backend slice is implemented. Topic and chunk selection stay synchronized in the UI (topic toggles related chunks; chunk select-all syncs topics).

## 015 — Dashboard KPI metadata should be keyed, not index-mapped

Analytics KPI presentation metadata (icon, value label, trend treatment, color intent) should be mapped by a stable key/label rather than array index. This prevents UI drift when KPI ordering changes from API or backend sorting.

## 014 — Add MODULE manifests for major feature folders

Major existing feature folders should include lightweight `MODULE.md` manifests that define ownership, boundaries, route scope, and future integration constraints. This improves navigation and reduces cross-feature drift for AI-assisted implementation.

## 013 — Use Tests instead of Quizzes

We use "Tests" as the product term because it sounds more appropriate for an enterprise employee knowledge platform. "Quiz" can feel too informal or game-like.

## 012 — Build mock frontend flow before backend

We build the clickable mock flow first to validate the product experience before adding Supabase, pgvector, AI calls, and persistence.

## 011 — Keep AI output behind admin review

AI-generated test questions must stay in draft/review state until an admin approves and publishes them.

## 010 — Tests-first terminology in context docs

All active context docs use "Tests" terminology (test_documents, test_assignments, test_attempts, test generation, test review) to reduce ambiguity for AI agents.

## 009 — Document detail uses shadcn Tabs for navigation

The document detail page uses shadcn `Tabs` component for tabbed navigation between Overview, Extracted Text, Topics, Metadata, and Versions.

## 008 — shadcn/ui components live in src/shared/ui

All shadcn/ui generated components are placed in `src/shared/ui/`. `components.json` aliases (`components` → `@/shared`, `ui` → `@/shared/ui`) ensure future `shadcn add` commands generate into the same directory.

## 007 — shadcn v4 base-nova style

shadcn v4.10.0 uses the `base-nova` style (the renamed "New York" style). Underlying design tokens and component approach are equivalent to previous versions.

## 006 — Tailwind v4 oklch with hsl compatibility

Tailwind v4 uses oklch colors natively. Ontera AI palette tokens use `hsl()` format in CSS custom properties, which is fully compatible with the `@theme inline` mapping.

## 005 — Mock role context without auth wiring

`src/shared/lib/role-context.tsx` uses React Context + `useState` to toggle between Admin and Employee roles client-side. No auth integration yet.

## 004 — Semantic color tokens replace hardcoded hex

Shell colors use `bg-foreground`, `text-background`, `bg-background` tokens. `--primary` is aligned to brand orange (`oklch(0.659 0.189 40)` ≈ `#eb5f24`). No brand-specific tokens (e.g. `navbar-black`) were introduced.

## 003 — Drawer scroll via inner wrapper

Document drawer scroll behaviour is stabilised by constraining drawer height and moving scrolling to an inner `overscroll-contain` wrapper, preventing page background scroll interference.

## 002 — Status badge aligned with actions

Document detail header layout places the status badge aligned with top action controls, not crowding the title line.

## 001 — Grid spacing convention

Card grids use `gap-2` (matching dashboard). Vertical section spacing uses `gap-6`. Document detail card stacks use `space-y-2`.
