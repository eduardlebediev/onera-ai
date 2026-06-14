# Architecture Context

## Stack

| Layer             | Current Technology                                        | Role                                                                                                 |
| ----------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Framework         | Next.js 16 App Router + TypeScript                        | Full-stack routes, layouts, route handlers, and server components                                    |
| UI                | React 19, Tailwind CSS v4, shadcn/ui v4, Radix primitives | Admin and employee dashboards with reusable project UI                                               |
| Auth              | Supabase Auth + `@supabase/ssr`                           | Invite-only identity, session refresh, and role-gated route access                                   |
| Database          | Supabase Postgres                                         | Organization-scoped records for documents, tests, assignments, attempts, analytics, and AI run state |
| Vector Search     | Supabase pgvector (`extensions.vector`)                   | Document chunk embeddings and semantic retrieval through `match_document_chunks`                     |
| File Storage      | Supabase Storage                                          | Private uploaded source documents in the `documents` bucket                                          |
| AI                | Vercel AI SDK 6 + OpenAI SDK                              | Topic extraction, AI chunking, embeddings, question generation, grading, feedback, and follow-ups    |
| Validation        | Zod 4                                                     | Runtime validation for route inputs, forms, and structured AI output                                 |
| Deployment Target | Vercel                                                    | Public demo deployment target                                                                        |

---

## System Boundaries

- `src/app/` owns App Router route groups, layouts, pages, middleware-connected auth refresh, and API route handlers.
- `src/app/(auth)/` owns login and access-denied routes.
- `src/app/(admin)/admin/*` owns admin pages for dashboard, documents, generation, review, publish, tests, assignment, and analytics.
- `src/app/(employee)/employee/*` owns employee dashboard, assigned tests, test taking, results, and progress.
- `src/app/api/admin/*` owns admin-only mutations: document upload/download/archive/delete/versioning, test generation, review question mutation/regeneration, publishing, assignment, metadata, archive/restore/delete.
- `src/app/api/employee/*` owns employee-only mutations: starting attempts, submitting attempts, generating follow-ups, and answering follow-ups.
- `src/features/auth/` owns current user resolution, role redirects, and API auth guards.
- `src/features/documents/` owns document upload, extraction, chunking, embeddings, topics, versioning, archive/delete, impact analysis, and Supabase document loaders.
- `src/features/tests/` owns generation settings, RAG retrieval, draft persistence, review editing, publish flow, source validity, assignment, saved test detail, and lifecycle actions.
- `src/features/employee/tests/` owns employee assignment loading, take/submit/result flows, scoring, AI feedback, persisted follow-ups, and employee progress.
- `src/features/analytics/` owns admin dashboard and analytics loaders derived from Supabase tables.
- `src/lib/supabase/` owns browser, SSR server, admin, environment, and local database type helpers.
- `src/shared/ai/` owns shared embedding helpers.
- `src/shared/ui/` and `src/shared/components/` own reusable UI primitives and shell components.
- `context/` owns project context, decisions, progress tracking, and implementation history for AI-assisted development.

---

## Current Supabase State

The live Supabase project currently exposes these `public` tables with RLS enabled:

- `organizations`
- `profiles`
- `organization_members`
- `documents`
- `document_chunks`
- `document_topics`
- `document_version_events`
- `tests`
- `test_documents`
- `test_questions`
- `test_assignments`
- `test_attempts`
- `test_answers`
- `ai_generation_runs`
- `follow_up_questions`
- `follow_up_answers`

Installed extensions used by the app:

- `extensions.vector` for pgvector embeddings and HNSW vector search.
- `extensions.pgcrypto` for UUID generation.
- `extensions.uuid-ossp` is installed in the project, but application schema should prefer `gen_random_uuid()`.

Migration notes:

- Local canonical migrations live in `supabase/migrations/00001_initial_schema.sql` through `00010_test_lifecycle_tombstones.sql`.
- The remote migration history contains `00001_initial_schema` plus timestamped follow-up migrations for auth/RLS, document ingestion, versioning, archive/delete, multi-document tests, document topics, review editor state, adaptive follow-ups, and test lifecycle tombstones.
- Before relying on a new Supabase column or table, verify the target database schema or apply the matching migration. Missing column errors are schema drift until proven otherwise.
- Regenerate or manually update `src/lib/supabase/types.ts` after schema changes that affect application code.

---

## Storage Model

### Supabase Postgres

Postgres is the source of truth for:

- organization and membership data;
- uploaded document metadata, processing state, version history, archive/delete state, extracted text, chunks, topics, and embeddings;
- AI generation runs and recoverable review draft summaries;
- tests, test source documents, questions, review state, publishing state, source validity, archive/delete lifecycle state;
- individual assignments, attempts, answers, AI feedback, adaptive follow-up questions, and follow-up answers;
- derived analytics through server-side loaders, not stored aggregate tables.

### Supabase Storage

Uploaded files are stored in the private `documents` bucket.

- Supported upload extensions: `.pdf`, `.docx`, `.pptx`, `.txt`, `.md`.
- Storage path pattern: `{organizationId}/{documentId}/{safeFileName}`.
- Original files are not rendered inline.
- Admin downloads use short-lived signed URLs created server-side.
- Storage writes and deletes use the server-only Supabase admin client.

### Supabase pgvector

Document chunks live in `document_chunks`.

- `document_chunks.embedding` stores `extensions.vector(1536)` embeddings from `text-embedding-3-small`.
- `document_chunks_embedding_hnsw_idx` supports cosine similarity search.
- `match_document_chunks` accepts query embedding, organization filter, optional document filter, match count, and threshold.
- The app does not use a separate vector database or universal embeddings table.

---

## Core Entities

### organizations

Company or workspace container for all org-owned application data.

Fields:

- `id`
- `name`
- `slug`
- `created_at`
- `updated_at`

### profiles

Application profile linked to Supabase Auth users.

Fields:

- `id`
- `email`
- `full_name`
- `avatar_url`
- `created_at`
- `updated_at`

Organization role lives in `organization_members.role`, not on `profiles` or Auth metadata.

### organization_members

Invite-only membership and role within an organization.

Fields:

- `id`
- `organization_id`
- `user_id`
- `invited_email`
- `role` - `admin` | `employee`
- `status` - `invited` | `active` | `disabled`
- `department`
- `job_title`
- `invited_by`
- `invited_at`
- `accepted_at`
- `created_at`
- `updated_at`

### documents

Uploaded, demo, or manual source documents.

Documents are immutable after processing. Uploading a new version creates a new `documents` row in the same version family instead of overwriting extracted text, chunks, embeddings, or topics on an existing processed row.

Fields:

- `id`
- `organization_id`
- `title`
- `description`
- `source_type` - `demo` | `upload` | `manual`
- `file_name`
- `file_url`
- `storage_path`
- `file_type`
- `file_size_mb`
- `extracted_text`
- `extraction_method`
- `processing_error`
- `processed_at`
- `status` - `uploaded` | `processing` | `ready` | `failed` | `archived` | `deleted`
- `parent_document_id`
- `version_number`
- `is_latest`
- `replaced_by_document_id`
- `change_message`
- `ai_change_summary`
- `archived_at`
- `archived_by`
- `deleted_at`
- `deleted_by`
- `deletion_reason`
- `created_by`
- `created_at`
- `updated_at`

### document_chunks

Document sections used for topic display, generation context, and semantic retrieval.

Fields:

- `id`
- `organization_id`
- `document_id`
- `chunk_index`
- `title`
- `topic`
- `content`
- `token_count`
- `embedding`
- `metadata`
- `created_at`
- `updated_at`

Each chunk belongs to one document and one organization. Chunk rows cascade when their document is deleted.

### document_topics

AI-extracted document-level learning topics.

Fields:

- `id`
- `organization_id`
- `document_id`
- `topic`
- `description`
- `confidence`
- `source`
- `created_at`

Topics are separate from chunks so document detail pages and generation filters can use stable topic summaries without treating chunk headings as the only topic model.

### document_version_events

Append-only visible history for initial uploads and new versions.

Fields:

- `id`
- `organization_id`
- `document_id`
- `previous_document_id`
- `event_type` - `initial_upload` | `new_version`
- `created_by`
- `change_message`
- `ai_change_summary`
- `created_at`

### tests

Test metadata and lifecycle state.

Fields:

- `id`
- `organization_id`
- `source_document_id`
- `title`
- `description`
- `status` - `draft` | `review` | `published` | `archived` | `deleted`
- `difficulty` - `easy` | `medium` | `hard`
- `language` - `en` | `de`
- `target_role`
- `question_count`
- `passing_score`
- `created_by`
- `published_at`
- `is_active`
- `source_validity` - `valid` | `outdated` | `source_archived` | `source_deleted` | `needs_review`
- `source_invalid_reason`
- `source_invalid_at`
- `deleted_at`
- `deleted_by`
- `deletion_reason`
- `created_at`
- `updated_at`

`tests.source_document_id` remains the primary/backward-compatible source reference. Multi-document tests also store all selected sources in `test_documents`.

### test_documents

Join table linking tests to one or more source documents.

Fields:

- `test_id`
- `document_id`
- `organization_id`
- `created_at`

Primary key: `(test_id, document_id)`. Existing single-document tests are backfilled from `tests.source_document_id`. Loaders can fall back to `tests.source_document_id` when join rows are missing.

### test_questions

Questions belonging to a test.

Fields:

- `id`
- `organization_id`
- `test_id`
- `source_chunk_id`
- `source_document_id`
- `question_text`
- `question_type` - `single_choice` | `multiple_choice` | `true_false` | `open_question`
- `options`
- `correct_answer`
- `explanation`
- `topic`
- `difficulty`
- `order_index`
- `is_active`
- `source_status` - `valid` | `document_outdated` | `document_archived` | `document_deleted` | `source_missing` | `manual_kept`
- `source_invalid_reason`
- `review_status` - `pending` | `approved` | `edited` | `rejected`
- `created_at`
- `updated_at`

Employee take flows must not expose `correct_answer` before submit.

### test_assignments

Individual test assignments for employees.

Fields:

- `id`
- `organization_id`
- `test_id`
- `user_id`
- `assigned_by`
- `status` - `not_started` | `in_progress` | `completed` | `failed`
- `deadline`
- `created_at`
- `updated_at`

Team assignments are out of scope for MVP.

### test_attempts

Employee attempts against assigned tests.

Fields:

- `id`
- `organization_id`
- `test_id`
- `user_id`
- `assignment_id`
- `status` - `in_progress` | `completed` | `abandoned`
- `score`
- `passed`
- `ai_feedback`
- `started_at`
- `completed_at`
- `created_at`
- `updated_at`

Completed attempts are historical records and must remain readable even if a test is later archived, deleted as a tombstone, or edited.

### test_answers

Employee answers to original test questions.

Fields:

- `id`
- `organization_id`
- `attempt_id`
- `question_id`
- `user_answer`
- `is_correct`
- `ai_explanation`
- `created_at`

Open-ended grading is best-effort. Submit must still complete if AI grading fails.

### ai_generation_runs

Audit and recovery state for AI test generation.

Fields:

- `id`
- `organization_id`
- `document_id`
- `test_id`
- `status` - `pending` | `completed` | `failed`
- `model`
- `embedding_model`
- `input_config`
- `retrieved_chunk_ids`
- `output_summary`
- `error_message`
- `created_by`
- `created_at`
- `completed_at`

Completed runs can store a `review_draft` summary in `output_summary` so review pages can recover draft context when session storage is unavailable.

### follow_up_questions

AI-generated adaptive follow-up questions after incorrect answers.

Fields:

- `id`
- `organization_id`
- `attempt_id`
- `original_question_id`
- `question_text`
- `options`
- `correct_answer`
- `topic`
- `explanation_before_question`
- `explanation_after_answer`
- `learning_goal`
- `difficulty`
- `source_chunk_reference`
- `created_at`

There is at most one persisted follow-up question per `(attempt_id, original_question_id)`.

### follow_up_answers

Employee answers to adaptive follow-up questions.

Fields:

- `id`
- `organization_id`
- `follow_up_question_id`
- `user_answer`
- `is_correct`
- `created_at`

There is at most one answer per follow-up question.

---

## Auth and Access Model

- Ontera AI is invite-only. There is no public registration or self sign-up.
- Users authenticate through Supabase Auth with email/password for MVP.
- `src/middleware.ts` refreshes Supabase SSR cookies with `@supabase/ssr` when Supabase public environment variables are configured.
- `getAuthenticatedSession()` calls `supabase.auth.getUser()`, loads `profiles`, and loads an active `organization_members` row.
- `getCurrentUser()` returns only users with an active membership.
- `/admin/*` layouts require active admin membership through `requireAdminUser()`.
- `/employee/*` layouts require active employee membership through `requireEmployeeUser()`.
- Admin users who open employee routes redirect to `/admin/dashboard`; employee users who open admin routes redirect to `/employee/dashboard`.
- API routes use `requireAdminApiUser()` or `requireEmployeeApiUser()` and return `401` or `403` instead of redirecting.
- The application role is resolved from `organization_members.role`. Do not use `user_metadata` or profile fields for authorization decisions.
- Server-side privileged data access uses `createAdminClient()` with `SUPABASE_SECRET_KEY`; this module is marked `server-only`.
- SSR/browser user clients use `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- RLS is enabled on all public application tables. Policies are organization-scoped for admins and self/assignment-scoped for employees.
- RLS helper functions are `security definer` to avoid policy recursion, but they must keep authorization tied to `auth.uid()`.
- Employee take/result loaders may use server admin access to join private data, but they must enforce user and organization scope and strip `correct_answer` before submit.

---

## Data Access Patterns

- Prefer server components and server loaders for Supabase-backed pages.
- Route handlers own mutations and validate request bodies before doing work.
- Admin reads that use `createAdminClient()` must receive `organizationId` from `requireAdminUser()` and filter every organization-owned query by it.
- Employee reads that use `createAdminClient()` must receive `userId` and `organizationId` from `requireEmployeeUser()` or `requireEmployeeApiUser()`.
- Avoid broad `select()` lists when a migration may not be applied everywhere. Add explicit missing-column fallbacks only for known schema drift windows.
- Mock data remains as fallback only for legacy demo IDs and offline/demo recovery. Supabase is the primary source for backend-backed documents, tests, assignments, attempts, progress, and analytics.

---

## Main Flows

### Document Ingestion

1. Admin uploads a supported file through `POST /api/admin/documents/upload`.
2. The server creates a `documents` row with `status = processing`.
3. The original file is uploaded to private Supabase Storage at `{organizationId}/{documentId}/{safeFileName}`.
4. Text is extracted, AI chunking is attempted, and deterministic chunking is used as fallback.
5. Chunks are embedded with `text-embedding-3-small` and inserted into `document_chunks`.
6. Document topics are extracted best-effort into `document_topics`.
7. The document is marked `ready` with `extracted_text`, or `failed` with a safe processing error and best-effort storage cleanup.
8. Initial uploads and new versions write `document_version_events`.

### Test Generation and Review

1. Admin selects one or more ready documents and generation settings.
2. `POST /api/admin/generate-test` validates the admin, organization, source documents, selected topics/chunks, and request body.
3. The backend retrieves grounded context through explicit chunk/topic selections and/or `match_document_chunks`.
4. Vercel AI SDK generates structured output with `gpt-4.1-mini`.
5. Zod validates the AI output and source chunk references.
6. A draft `tests` row and `test_questions` rows are persisted immediately for review mutations.
7. `ai_generation_runs` records input config, retrieved chunks, output summary, model, embedding model, and completion/failure state.
8. Admin review can edit, approve, reject, add, delete, and regenerate questions before publishing.
9. Publishing validates approved question readiness and source grounding, then marks the test published.

### Test Assignment and Taking

1. Admin assigns published, active tests to individual employees through `test_assignments`.
2. Employee pages load only the current employee's assignments.
3. Starting a Supabase-backed test creates or resumes an in-progress `test_attempts` row.
4. Take flow receives safe question payloads without `correct_answer`.
5. Submit validates assignment/user/organization ownership, scores objective answers, grades open questions best-effort, stores `test_answers`, completes the attempt, updates assignment status, and persists AI feedback best-effort.
6. Result and progress pages hydrate persisted attempts, answers, AI feedback, topics, and follow-ups.

### Lifecycle and Source Validity

- Documents can be archived and then permanently deleted.
- Permanent document deletion removes storage, extracted text, chunks, and topics, but keeps a lightweight document tombstone.
- New document versions create new document rows; existing published tests remain tied to their original source version.
- Source archive/delete/version changes can mark tests inactive or source-invalid without mutating completed attempts.
- Published tests can be archived and restored.
- Published tests cannot be deleted directly.
- Draft/review tests without attempts can be hard-deleted.
- Archived tests with attempts are tombstoned with `status = deleted`, `is_active = false`, and delete audit metadata.

---

## AI Boundary

AI output is untrusted and must be validated before being persisted or shown as final.

AI may generate:

- document chunks when AI chunking succeeds;
- document topics;
- test questions;
- regenerated single questions;
- open-question grading;
- personalized attempt feedback;
- adaptive follow-up questions.

AI must not:

- publish tests automatically;
- bypass admin review;
- mutate production data without an explicit user action;
- generate questions unrelated to selected source documents;
- expose correct answers before submit;
- claim external work was completed.

The test generation flow is:

```text
Selected document(s) -> document chunks/topics -> pgvector retrieval -> AI structured output -> Zod validation -> persisted draft test -> admin review/edit -> publish
```

---

## Invariants

1. AI-generated questions must remain draft/review material until an admin publishes the test.
2. Supabase is the primary backend source for real documents, tests, assignments, attempts, analytics, and persisted follow-ups.
3. Every organization-owned Supabase query must be scoped by `organization_id` when using the admin client.
4. App roles come from active `organization_members` rows, never from user-editable Auth metadata.
5. RLS stays enabled on all public application tables.
6. `SUPABASE_SECRET_KEY` is server-only and must never be imported into client components or exposed through `NEXT_PUBLIC_*`.
7. Uploaded originals stay in the private `documents` storage bucket and are exposed only through short-lived signed URLs.
8. Document chunks belong to one document and store embeddings in `document_chunks.embedding`.
9. Tests reference source documents through `tests.source_document_id` and, for multi-document tests, `test_documents`.
10. Generated questions should reference `source_chunk_id` and `source_document_id`; manual review questions can use `source_status = manual_kept`.
11. Employees can only start and complete tests assigned to them.
12. Employee question payloads must not include `correct_answer` before submit.
13. Completed attempts, answers, results, and follow-ups must remain readable even if source tests or documents are later edited, archived, or tombstoned.
14. Open-question grading, AI feedback, topic extraction, and follow-up generation are best-effort where documented; core submit/persistence flows should still succeed when non-critical AI work fails.
15. Team assignments, organization management UI, enterprise SSO, payments, certificates, external integrations, and advanced reporting remain out of scope for MVP.
