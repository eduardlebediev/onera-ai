# Feature Spec 35: Multi-document Test Generation

## Goal

Allow admins to generate and publish tests from one or multiple source documents.

Current behavior supports one main source document through `tests.source_document_id`.

The new behavior should support:

```
Document A + Document B + Document C
→ selected topics/chunks from multiple documents
→ AI-generated test draft
→ questions reference source chunks
→ published test stores all source documents
→ test detail shows all source documents
```

This spec should keep backward compatibility with existing single-document tests.

## Product Value

The original product concept says: "Admin can select one or multiple documents."

This matters because many real company knowledge tests are based on several documents:

```
Security Policy
+ Deployment Handbook
+ Incident Response Guide
→ one combined knowledge test for developers
```

## Scope

Implement:

- `test_documents` join table
- multi-document selection in Generate Test flow
- topic/chunk selection across multiple documents
- generate-test API accepts multiple document IDs
- publish API saves all source documents
- test detail shows all source documents
- question source labels show document + topic/chunk
- backward compatibility with `tests.source_document_id`

Do not implement: document archive/delete, document versioning, open question AI grading, team-based assignments, advanced test repair workflow, automatic regeneration after source deletion, production cleanup.

Spec 34 already handles archived/deleted source invalidation. This spec should make that model work better for tests with multiple source documents.

## Database Migration

Create: `supabase/migrations/00007_multi_document_tests.sql`

```sql
create table if not exists public.test_documents (
  test_id uuid not null references public.tests(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete restrict,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),

  primary key (test_id, document_id)
);

create index if not exists test_documents_document_id_idx
  on public.test_documents(document_id);

create index if not exists test_documents_organization_id_idx
  on public.test_documents(organization_id);
```

Backfill existing tests:

```sql
insert into public.test_documents (test_id, document_id, organization_id)
select id, source_document_id, organization_id
from public.tests
where source_document_id is not null
on conflict do nothing;
```

Keep `tests.source_document_id` for backward compatibility.

New rule:

- Single-document tests: write `tests.source_document_id` + one `test_documents` row
- Multi-document tests: write `tests.source_document_id` = first selected, write all into `test_documents`

## RLS

Add RLS policies for `test_documents`. Admins can read test-document links in their organization. Employees can read test-document links only for assigned tests if needed.

Minimum: server-side admin reads work, test detail can show source documents, employee result pages do not break.

## Generate Test Page

Existing route: `/admin/documents/[id]/generate-test`.

Keep working. If opened from a document, preselect that document. Admin can add more ready documents.

## Document Selection Rules

Only selectable documents: `status = ready`, `is_latest = true`, not archived, not deleted, has chunks, has embeddings.

Reject: processing, failed, archived, deleted, old versions, documents from another organization.

Minimum: at least one document selected, maximum 5 for MVP.

## Topic and Chunk Selection

Update Generate Test setup so it can show topics/chunks grouped by document.

Admin can select: whole document, specific topics, specific chunks.

Minimum: admin selects documents, system uses chunks from all selected documents.

Preferred: admin can select topics/chunks from selected documents. If `document_topics` exists, show AI-extracted topics first.

## Generate Test API Update

Update `POST /api/admin/generate-test`.

New request shape:

```ts
{
  documentIds: string[];
  selectedTopicIds?: string[];
  selectedChunkIds?: string[];
  questionCount: number;
  difficulty: "easy" | "medium" | "hard";
  targetRole?: string;
  language: "en" | "de";
  questionTypes: Array<"single_choice" | "multiple_choice" | "true_false">;
}
```

Backward compatibility: if old client sends `documentId`, normalize to `documentIds = [documentId]`.

Validation: `documentIds` required, max 5, all belong to admin organization, all ready, no archived/deleted/old versions.

## Retrieval Behavior

Retrieve chunks across all selected documents. If `selectedChunkIds` exist, use as primary context. If `selectedTopicIds` exist, load chunks related to those topics. If only `documentIds`, retrieve best chunks across selected documents.

Use selected/retrieved chunks only. Do not send full documents to AI.

## AI Prompt Update

Context format example:

```
[Document: Security Guidelines]
[Topic: Access Control]
[Chunk ID: ...]
Content...

[Document: Deployment Handbook]
[Topic: Rollback Rules]
[Chunk ID: ...]
Content...
```

Rule: each generated question must reference a `source_chunk_id`. With multiple documents this is critical.

## AI Output Validation

Keep Zod structured output. Add validation: every `sourceChunkId` must belong to one of the selected documents. If validation fails, return safe error.

## Review Flow Update

Generated draft must carry: `documentIds`, source documents summary, question source document label, question source topic/chunk label.

Review page should show source labels per question: `Source: Deployment Handbook → Rollback Rules`.

## Publish API Update

Update `POST /api/admin/tests/publish-generated`.

Publishing should:

1. Validate admin membership.
2. Validate selected document IDs.
3. Validate all documents belong to organization.
4. Validate all approved source chunks belong to selected documents.
5. Insert `tests` row.
6. Set `tests.source_document_id = first selected document` for compatibility.
7. Insert all selected documents into `test_documents`.
8. Insert approved questions.
9. Preserve `source_chunk_id` on each question.
10. Set `test_questions.source_document_id` from the chunk document.
11. Update `ai_generation_runs.test_id`.

Single-document behavior should still work.

## Test Detail UI

Show section "Source Documents". For each: title, version, status, badges, open link.

If no `test_documents` rows exist, fallback to `tests.source_document_id`.

Question list shows per-question source: `Security Guidelines → Access Control`.

## Employee Flow

No major UI changes. Questions load from `test_questions`. Inactive questions excluded. Completed results preserved.

## Multi-document + Deleted Source Behavior

If one source is archived/deleted: affected questions inactive, test becomes inactive/needs_review, valid questions from other documents remain.

Minimum: test detail shows which document caused invalidation.

## Backward Compatibility

Existing tests backfilled with one `test_documents` row. Fallback: if `test_documents` empty, use `tests.source_document_id`.

## Server Helpers

- `src/features/tests/lib/test-documents.ts`
- `src/features/tests/lib/multi-document-generation.ts`
- `src/features/tests/lib/source-document-validation.ts`
- `src/features/documents/lib/selectable-documents.ts`

All server-only: `import "server-only"`.

## Client Components

- `src/features/documents/components/multi-document-selector.tsx`
- `src/features/documents/components/document-topic-selection-group.tsx`
- `src/features/tests/components/test-source-documents-section.tsx`

Keep UI simple.

## Manual Test

1. Generate test from two documents → confirm questions reference chunks from both.
2. Publish → confirm `test_documents` has two rows, detail shows both.
3. Single-document backward compatibility → still works.
4. Archived/deleted documents rejected.
5. Multi-document + deleted source → test inactive, affected questions invalid.

## Validation

```bash
npm run lint
npm run typecheck
npm run format:check
npm run build
```

## Context Updates

Create this file. Update `progress-tracker.md`, `history.md`, `decisions.md`, `architecture.md`.

Add decisions:

```
## 051 — Tests support multiple source documents through test_documents

Tests keep `tests.source_document_id` for backward compatibility, but new generated tests can reference multiple source documents through `test_documents`. Generated questions remain grounded through `source_chunk_id`, and publish validation ensures every approved question references a chunk from one of the selected documents.
```

```
## 052 — Multi-document tests use question-level source tracking

In multi-document tests, each question tracks its source through `source_chunk_id` and `source_document_id`. If one source document becomes archived or deleted, only questions linked to that document are marked source-invalid, while the test becomes inactive until admin review. Valid questions from other documents remain stored for future repair flows.
```

## Acceptance Criteria

- `test_documents` table exists.
- Existing single-document tests are backfilled into `test_documents`.
- Generate Test supports selecting multiple ready latest documents.
- Archived/deleted/failed/processing documents cannot be selected.
- Generate Test API accepts `documentIds`.
- Generate Test API remains backward-compatible with old `documentId`.
- AI generation retrieves chunks from all selected documents.
- AI prompt includes document labels.
- Generated questions reference source chunks from selected documents.
- Review page shows source document labels per question.
- Publish API inserts `test_documents` rows.
- Publish API validates question sources against selected documents.
- Test detail shows all source documents.
- Test detail falls back to `tests.source_document_id` if needed.
- Existing single-document flow still works.
- Existing employee attempts/results still work.
- Multi-document tests are compatible with source invalidation from Spec 34.
- `lint`, `typecheck`, `format:check`, and `build` pass.
