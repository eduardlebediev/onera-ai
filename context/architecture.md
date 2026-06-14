# Architecture Context

## Stack

| Layer         | Technology                                        | Role                                                           |
| ------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| Framework     | Next.js App Router + TypeScript                   | Full-stack application framework                               |
| UI            | React + Tailwind CSS + shadcn/ui                  | Dashboard interface and reusable UI components                 |
| Auth          | Supabase Auth (invite-only)                       | User identity, admin/employee role access                      |
| Database      | Supabase Postgres                                 | Stores users, documents, tests, assignments, attempts, answers |
| Vector Search | Supabase pgvector                                 | Stores document chunk embeddings for semantic search           |
| File Storage  | Supabase Storage                                  | Stores uploaded source documents                               |
| Validation    | Zod                                               | Runtime validation for forms, API inputs, and AI outputs       |
| AI            | Vercel AI SDK with OpenAI/Anthropic/Groq provider | Topic extraction, test generation, feedback generation         |
| Deployment    | Vercel                                            | Public demo deployment                                         |

---

## System Boundaries

- src/app/ — Next.js routes, layouts, pages, route handlers, and server actions.
- src/features/documents/ — document upload, document list, document detail, extracted topics, processing states.
- src/features/tests/ — test generation, test review, test editor, test detail, test publishing.
- src/features/assignments/ — assigning published tests to employees.
- src/features/attempts/ — employee test-taking flow, answers, scoring, result screen.
- src/features/analytics/ — admin dashboard metrics, weak topics, test performance.
- src/shared/ai/ — AI client, prompt templates, structured output schemas, provider configuration.
- src/shared/db/ — Supabase clients, database types, query helpers.
- src/shared/ui/ — reusable UI components, layout primitives, empty/loading/error states.
- src/shared/lib/ — generic utilities, formatting helpers, error helpers.
- context/ — project context files and feature specs for AI-assisted development.

---

## Storage Model

### Supabase Postgres

Stores structured application data:

- user profiles;
- uploaded document metadata;
- document chunks;
- document topics;
- tests;
- test-document relations;
- questions;
- test assignments;
- test attempts;
- answers;
- follow-up questions;
- follow-up answers.

### Supabase Storage

Stores uploaded source files in a private `documents` bucket:

- PDFs, DOCX, PPTX, TXT, MD;
- path pattern `{organizationId}/{documentId}/{safeFileName}`;
- access via server admin client and short-lived signed download URLs only.

### Supabase pgvector

Document chunks live in Postgres in the document_chunks table.

The embedding column stores vector embeddings for semantic search.

For MVP, do not create a separate vector database or a separate universal embeddings table.

---

## Core Entities

### profiles

Application user profile linked to Supabase Auth.

Fields:

- id
- email
- full_name
- avatar_url
- created_at
- updated_at

Organization role lives in `organization_members.role`, not on `profiles`.

### organization_members

Membership and role within an organization.

Fields:

- organization_id
- user_id
- role — admin | employee
- status — invited | active | disabled
- department
- job_title

### documents

Uploaded internal company documents.

Documents are immutable after processing. Uploading an updated file creates a new `documents` row in the same version family instead of overwriting `extracted_text`, chunks, embeddings, or topics on an existing row.

Fields:

- id
- organization_id
- title
- description
- source_type — demo | upload | manual
- file_name
- storage_path
- file_type
- file_size_mb
- extracted_text
- extraction_method
- processing_error
- processed_at
- status — uploaded | processing | ready | failed | archived | deleted
- archived_at
- archived_by
- deleted_at
- deleted_by
- deletion_reason
- parent_document_id — null for v1, root v1 id for later versions
- version_number
- is_latest
- replaced_by_document_id
- change_message
- ai_change_summary
- created_by
- created_at
- updated_at

### document_version_events

Append-only document version history events.

Fields:

- id
- organization_id
- document_id
- previous_document_id
- event_type — initial_upload | new_version
- created_by
- change_message
- ai_change_summary
- created_at

### document_chunks

Chunks extracted from documents and used for semantic search.

Fields:

- id
- document_id
- content
- topic
- embedding
- chunk_index
- created_at

### document_topics

AI-extracted learning topics stored separately from chunks for document-level presentation and future generation flows.

Fields:

- id
- organization_id
- document_id
- topic
- description
- confidence
- source — ai | chunk
- created_at

### tests

Test metadata.

Fields:

- id
- organization_id
- source_document_id
- title
- description
- difficulty — easy | medium | hard
- target_role
- question_count
- passing_score
- language — en | de
- status — draft | review | published | archived | deleted
- is_active — whether the test can be assigned or started
- source_validity — valid | outdated | source_archived | source_deleted | needs_review
- source_invalid_reason
- source_invalid_at
- deleted_at
- deleted_by
- deletion_reason
- created_by
- created_at
- updated_at

`tests.source_document_id` remains the primary/backward-compatible source reference (first selected document for multi-document tests). Multi-document tests also store all selected sources in `test_documents`.

### test_documents

Join table linking tests to one or more source documents.

Fields:

- test_id
- document_id
- organization_id
- created_at

Primary key: `(test_id, document_id)`. Existing single-document tests are backfilled from `tests.source_document_id`. When `test_documents` rows are missing, loaders fall back to `tests.source_document_id`.

### test_questions

Questions belonging to a test.

Fields:

- id
- test_id
- source_chunk_id
- source_document_id
- is_active
- source_status — valid | document_outdated | document_archived | document_deleted | source_missing | manual_kept
- source_invalid_reason
- question_text
- question_type — single_choice | multiple_choice | true_false | open_question
- options
- correct_answer
- explanation
- topic
- order_index
- created_at
- updated_at

### test_assignments

Individual test assignments for employees.

Fields:

- id
- organization_id
- test_id
- user_id — required for MVP individual assignments
- assigned_by
- status — not_started | in_progress | completed | failed
- deadline
- created_at
- updated_at

### test_attempts

Employee test attempts.

Fields:

- id
- organization_id
- test_id
- user_id — required for MVP individual attempts
- assignment_id
- score
- passed
- ai_feedback
- started_at
- completed_at
- created_at

### test_answers

Employee answers to test questions.

Fields:

- id
- attempt_id
- question_id
- user_answer
- is_correct
- ai_explanation
- created_at

### follow_up_questions

Adaptive AI-generated follow-up questions after wrong answers.

Fields:

- id
- answer_id
- original_question_id
- question_text
- type
- options
- correct_answer
- explanation
- topic
- created_at

### follow_up_answers

Employee answers to follow-up questions.

Fields:

- id
- follow_up_question_id
- attempt_id
- user_answer
- is_correct
- created_at

---

## Auth and Access Model

- Ontera AI is invite-only. No public registration or self sign-up.
- Users authenticate through Supabase Auth (email/password for MVP).
- Application-specific user data lives in `profiles`.
- Organization membership and role live in `organization_members`.
- `organization_members.role` controls access within an organization:
  - admin can manage documents, tests, assignments, and analytics;
  - employee can only see assigned tests and personal results.
- App role is resolved server-side via `getCurrentUser()` / `getAuthenticatedSession()` from auth user + active membership. Do not use `user_metadata` as role source.
- `/admin/*` requires active admin membership; `/employee/*` requires active employee membership. Unauthenticated users redirect to `/login`.
- Internal backend jobs (embedding generation, RAG retrieval, privileged mutations) use a server-only Supabase admin client with `SUPABASE_SECRET_KEY` (`sb_secret_...`) — never exposed to the browser.
- User-scoped reads use the SSR server client with the publishable/anon key and RLS where practical.
- Employees must not access other employees' attempts, answers, or analytics.
- Admin-only mutations must be checked server-side.
- RLS is enabled on all public tables with organization-scoped policies (`00002_auth_rls_policies.sql`). Employee take flow must not expose `correct_answer` before submit — use server helpers that strip answers.
- Demo auth setup: see `context/auth-demo-setup.md`.

---

## AI Boundary

AI output is untrusted and must be validated before use.

AI may generate:

- document topics;
- test questions;
- answer explanations;
- personalized feedback;
- adaptive follow-up questions.

AI must not:

- publish tests automatically;
- bypass admin review;
- mutate production data without explicit user action;
- generate questions unrelated to selected source documents;
- claim that external work was completed.

The test generation flow must be:

text Selected document(s) → document chunks → semantic retrieval with pgvector → AI structured output → Zod validation → draft test → admin review/edit → publish

---

## Invariants

1. AI-generated questions must stay in draft state until reviewed and published by an admin.
2. Each document chunk must belong to one document.
3. Document chunk embeddings are stored in document_chunks.embedding using Supabase pgvector.
4. Tests reference source documents through `tests.source_document_id` and, for multi-document tests, `test_documents`. Each generated question should reference `source_chunk_id` and `source_document_id` when grounded in document context.
5. Employees can only complete assigned tests.
6. Test attempts must belong to one user, one test, and preferably one assignment.
7. Completed attempts must not break if a test is edited later.
8. AI output must be validated with Zod before being saved or shown as final.
9. The MVP should prioritize one complete flow over many incomplete features.
10. Teams are out of scope for MVP; test assignments are individual for now.
11. Do not add integrations, payments, enterprise SSO, or advanced permissions before the core MVP works.
