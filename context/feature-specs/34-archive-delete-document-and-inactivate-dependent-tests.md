# Feature Spec 34: Archive Document, Permanent Delete and Inactivate Dependent Tests

## Goal

Add safe document archive and permanent delete behavior.

The goal is to let admins remove documents from active use without silently breaking tests, questions, assignments, attempts, and historical results.

```
ready document
→ admin archives it
→ document is removed from future test generation
→ dependent tests become inactive / source_archived
→ admin can permanently delete archived document content
→ dependent tests/questions show source_deleted
→ completed results remain accessible
```

## Product Rules

### Rule 1 — Archive comes before delete

A document cannot be permanently deleted directly.

Lifecycle:

```
ready / failed
→ archived
→ deleted
```

Archive means:

- Document is not available for new test generation.
- Original file, extracted text, chunks, topics, and history remain.
- Dependent tests become inactive until reviewed.

Permanent delete means:

- Original file is removed from Storage.
- Extracted text is cleared.
- Chunks and topics are removed.
- Document row remains as a tombstone with status = deleted.
- Dependent tests/questions remain inactive and show source_deleted.

### Rule 2 — Do not fully remove the document row

Keep the `documents` row so old tests can show: "Source document was deleted."

### Rule 3 — Completed results stay accessible

Archiving/deleting a document must not break completed test attempts, employee result pages, admin historical result views, or old score data.

### Rule 4 — New attempts are blocked

If a test depends on an archived/deleted source document:

- Test becomes inactive
- Admin cannot assign it
- Employee cannot start it
- Completed results remain readable

## Scope

Implement:

- archive document action
- permanent delete archived document action
- document impact summary
- test inactivation when source document is archived/deleted
- question source invalidation
- admin UI warnings
- employee start protection for inactive tests
- context documentation updates

Do not implement:

- document version upload
- multi-document generation
- test_documents table
- question repair workflow
- AI regeneration
- restore deleted document content
- bulk archive/delete
- production cleanup

Future multi-document behavior should be prepared through question-level source tracking, but actual multi-document generation is out of scope.

## Database Migration

Create: `supabase/migrations/00006_document_archive_delete_and_test_inactivation.sql`

### Documents Table Updates

```sql
alter table public.documents
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references public.profiles(id) on delete set null,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.profiles(id) on delete set null,
  add column if not exists deletion_reason text;
```

Allow status: `uploaded`, `processing`, `ready`, `failed`, `archived`, `deleted`.

### Tests Table Updates

```sql
alter table public.tests
  add column if not exists is_active boolean not null default true,
  add column if not exists source_validity text not null default 'valid',
  add column if not exists source_invalid_reason text,
  add column if not exists source_invalid_at timestamptz;
```

Allowed `source_validity`: `valid`, `outdated`, `source_archived`, `source_deleted`, `needs_review`.

### Test Questions Table Updates

```sql
alter table public.test_questions
  add column if not exists source_document_id uuid references public.documents(id) on delete set null,
  add column if not exists is_active boolean not null default true,
  add column if not exists source_status text not null default 'valid',
  add column if not exists source_invalid_reason text;
```

Allowed `source_status`: `valid`, `document_outdated`, `document_archived`, `document_deleted`, `source_missing`, `manual_kept`.

Backfill:

```sql
update public.test_questions tq
set source_document_id = dc.document_id
from public.document_chunks dc
where tq.source_chunk_id = dc.id
  and tq.source_document_id is null;
```

## Archive API

`POST /api/admin/documents/[id]/archive`

Responsibilities:

1. Verify current user is active admin.
2. Verify document belongs to admin organization.
3. Reject demo documents where `source_type = demo`.
4. Reject already deleted documents.
5. Set `documents.status = archived`.
6. Set `archived_at` and `archived_by`.
7. Find dependent tests and questions.
8. Mark dependent tests inactive/source_archived.
9. Mark affected questions inactive/document_archived.
10. Return impact summary.

Do not delete storage file, extracted_text, chunks, topics, tests, questions, assignments, attempts, or answers.

## Permanent Delete API

`DELETE /api/admin/documents/[id]`

Rules: only archived documents can be permanently deleted. Demo documents cannot. Document row must remain.

Responsibilities:

1. Verify current user is active admin.
2. Verify document belongs to admin organization.
3. Verify `document.status = archived`.
4. Reject `source_type = demo`.
5. Calculate impact summary.
6. Remove original file from Supabase Storage if `storage_path` exists.
7. Delete `document_chunks` for this document.
8. Delete `document_topics` for this document if table exists.
9. Clear heavy document fields.
10. Set `documents.status = deleted`.
11. Set `deleted_at` and `deleted_by`.
12. Save optional `deletion_reason`.
13. Mark dependent tests inactive/source_deleted.
14. Mark affected questions inactive/document_deleted.
15. Clear `test_questions.source_chunk_id` where it referenced deleted chunks.
16. Return impact summary.

Clear: `storage_path = null`, `extracted_text = null`, `processing_error = null`.

Keep tombstone: `id`, `organization_id`, `title`, `file_name`, `file_type`, `version_number`, `parent_document_id`, `status`, `created_at`, `deleted_at`, `deleted_by`, `deletion_reason`.

## Test Inactivation Rules

When document is archived:

```
tests.is_active = false
tests.source_validity = source_archived
tests.source_invalid_reason = "Source document was archived"
tests.source_invalid_at = now()
```

When document is permanently deleted:

```
tests.is_active = false
tests.source_validity = source_deleted
tests.source_invalid_reason = "Source document was deleted"
tests.source_invalid_at = now()
```

## Question Invalidation Rules

When document is archived:

```
test_questions.is_active = false
test_questions.source_status = document_archived
test_questions.source_invalid_reason = "Source document was archived"
```

When document is permanently deleted:

```
test_questions.is_active = false
test_questions.source_status = document_deleted
test_questions.source_invalid_reason = "Source document was deleted"
test_questions.source_chunk_id = null
```

Question text/options/correct answer/explanation remain intact.

## Impact Summary Helper

Create: `src/features/documents/lib/document-impact.ts`

```ts
{
  documentId: string
  affectedTestCount: number
  affectedQuestionCount: number
  activeAssignmentCount: number
  completedAttemptCount: number
  affectedTests: Array<{
    testId: string
    title: string
    status: string
    sourceValidity: string
    affectedQuestionCount: number
    activeAssignmentCount: number
    completedAttemptCount: number
  }>
}
```

## Server Helpers

- `src/features/documents/lib/document-archive.ts`
- `src/features/documents/lib/document-delete.ts`
- `src/features/documents/lib/document-impact.ts`
- `src/features/tests/lib/test-source-invalidation.ts`

All server-only: `import "server-only"`.

## UI: Documents List

Show statuses: `ready`, `processing`, `failed`, `archived`, `deleted`.

Default: show active/latest non-deleted documents. Archived/deleted documents visibly marked with disabled generation actions.

Filters: Active, Archived, Deleted, All.

## UI: Document Detail

Action visibility:

- `ready`/`failed` uploaded document → Archive visible
- `archived` document → Permanently delete visible
- `deleted` document → No destructive actions
- `demo` document → Archive/delete disabled

Archive confirmation: "Archiving this document will remove it from future test generation and make dependent tests inactive until reviewed. Existing completed results will remain available."

Permanent delete confirmation: "This permanently removes the uploaded file, extracted text, chunks, and topics. The document row will remain as a deleted reference. Tests and questions that used this document will stay inactive and show that the source document was deleted. Completed results will remain available."

Deleted document detail shows tombstone. No Download, Generate, Archive, Upload new version, Extracted text, Chunks, or Topics.

## UI: Test List and Test Detail

When inactive/invalid: badge "Inactive", "Source archived", "Source deleted". Disable Assign. Show warning with reason.

Employee cannot start inactive tests. API returns 409.

## Employee Behavior

Update `/api/employee/tests/[id]/start`: if test inactive → `409`, message: "This test is no longer active because its source document is invalid."

Employee tests page: `not_started` → blocked. `in_progress` → blocked. `completed` → accessible.

## Generation and Download

Archived/deleted documents not available for generation. Deleted documents: no download URL.

## Out of Scope

Multi-document tests, question repair editor, AI regeneration, restore, bulk operations, hard delete.

## Manual Test

1. Archive uploaded document → confirm status, tests inactive, results accessible.
2. Permanent delete archived document → confirm storage/chunks removed, tombstone remains.
3. Demo document → confirm archive/delete disabled.
4. Employee → cannot start inactive test, completed results still open.

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
## 049 — Document deletion is archive-first and tombstone-based

Documents must be archived before permanent deletion. Permanent deletion removes the uploaded file, extracted text, chunks, and topics, but keeps a lightweight document tombstone so tests can show that their source document was deleted.
```

```
## 050 — Source-invalid tests become inactive until reviewed

When a source document is archived or deleted, dependent tests become inactive and receive a source validity state. Affected questions are marked inactive with an invalid source status. Existing completed results remain available, but new assignments and new attempts are blocked until an admin reviews or repairs the test.
```

## Acceptance Criteria

- Admin can archive uploaded non-demo documents.
- Demo documents cannot be archived.
- Archived documents cannot be selected for new test generation.
- Archiving does not remove storage file, extracted text, chunks, or topics.
- Archiving marks dependent tests inactive/source_archived.
- Archiving marks affected questions inactive/document_archived.
- Admin can permanently delete only archived uploaded documents.
- Permanent delete removes original file from Storage.
- Permanent delete removes document chunks.
- Permanent delete removes document topics if present.
- Permanent delete clears extracted text and storage path.
- Permanent delete keeps document row as deleted tombstone.
- Deleted documents cannot be downloaded.
- Deleted documents cannot be used for generation.
- Dependent tests remain inactive/source_deleted.
- Affected questions are inactive/document_deleted.
- Inactive tests cannot be assigned.
- Employee cannot start inactive tests.
- Completed employee results remain accessible.
- Future multi-document behavior is prepared through question-level source tracking.
- `lint`, `typecheck`, `format:check`, and `build` pass.

## Next Step

Feature Spec 35: Multi-document Test Generation
