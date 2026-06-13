# Feature Spec 33: Document Versioning and Change History

## Goal

Add document versioning and visible change history without changing, overwriting, or deleting existing document content.

When an admin uploads an updated document, the system should create a new document version instead of modifying the old one.

```txt
Document v1
→ tests generated from v1
→ admin uploads updated file
→ Document v2 is created
→ old tests stay linked to v1
→ new tests use v2 by default
→ old tests show "newer version available"
```

This spec should make document history visible in the product, similar to a lightweight Git-style history:

```txt
Version timeline
Change message
AI change summary
Previous / latest version links
Affected tests summary
Outdated source warning
```

Do not implement archive/delete in this spec.
Do not implement multi-document tests in this spec.
Do not mutate published tests automatically.

---

## Core Product Rule

Documents are immutable after processing.

A new upload creates a new document version.
Old document versions remain available for historical tests, questions, attempts, and results.

```txt
Never overwrite old extracted_text.
Never overwrite old chunks.
Never overwrite old embeddings.
Never rewrite published test questions automatically.
```

---

## Scope

Implement only:

```txt
document version metadata
upload new version flow
document history timeline
admin change message
AI change summary between versions
latest / old version UI badges
newer version links
affected tests summary after upload
outdated source warning on tests
generation uses latest ready version by default
optional "Generate new draft from latest version" action
```

Do not implement:

```txt
archive document
permanent delete document
multi-document tests
test_documents table
hard delete
document restore
visual side-by-side diff viewer
branches / merge / conflict resolution
automatic mutation of published tests
automatic deletion of old test questions
```

---

## Existing Context

Current backend already has:

```txt
documents
document_chunks
document_chunks.embedding
tests.source_document_id
test_questions.source_chunk_id
document upload pipeline
text extraction
chunking
embeddings
AI test generation
admin review
publish flow
employee attempts/results
```

Important current limitation:

```txt
documents do not have version metadata
old and new document versions are not connected
test detail cannot show that source document is outdated
admin cannot see document change history
```

---

## Database Migration

Create migration:

```txt
supabase/migrations/00005_document_versioning.sql
```

---

## Documents Table Changes

Add versioning and history fields:

```sql
alter table public.documents
  add column if not exists parent_document_id uuid references public.documents(id) on delete set null,
  add column if not exists version_number integer not null default 1,
  add column if not exists is_latest boolean not null default true,
  add column if not exists replaced_by_document_id uuid references public.documents(id) on delete set null,
  add column if not exists change_message text,
  add column if not exists ai_change_summary text;
```

Field meaning:

```txt
parent_document_id:
  Root document version for this version family.
  v1 has parent_document_id = null.
  v2/v3/... point to the root v1 id.

version_number:
  Human-readable version number.

is_latest:
  True only for the latest version in the version family.

replaced_by_document_id:
  Points from older version to the next version.

change_message:
  Admin-written note about why the new version was uploaded.

ai_change_summary:
  AI-generated summary of what changed between previous and new extracted text.
```

---

## Document Version Events Table

Create:

```sql
create table if not exists public.document_version_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  previous_document_id uuid references public.documents(id) on delete set null,
  event_type text not null,
  created_by uuid references public.profiles(id) on delete set null,
  change_message text,
  ai_change_summary text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists document_version_events_document_id_idx
  on public.document_version_events(document_id);

create index if not exists document_version_events_previous_document_id_idx
  on public.document_version_events(previous_document_id);

create index if not exists document_version_events_organization_id_idx
  on public.document_version_events(organization_id);
```

Allowed `event_type` values for this spec:

```txt
initial_upload
new_version
```

Future specs may add:

```txt
archived
deleted
restored
```

---

## RLS

Add RLS policies for `document_version_events`.

Admin users can read events for documents in their organization.

Suggested policy scope:

```txt
admin select document_version_events in own organization
admin insert document_version_events in own organization through server flow
```

If current implementation uses server-only admin client for this flow, still add policies for future user-scoped reads.

---

## Versioning Model

Each document version is a separate row in `documents`.

### First upload

```txt
version_number = 1
parent_document_id = null
is_latest = true
replaced_by_document_id = null
change_message = null or "Initial upload"
```

Create a `document_version_events` row:

```txt
event_type = initial_upload
document_id = v1 id
previous_document_id = null
```

### New version upload

When admin uploads a new version from an existing document:

```txt
1. Resolve root document:
   - if current document parent_document_id is null → current document is root
   - else parent_document_id is root

2. Find latest version in the same family.

3. Create new documents row:
   - parent_document_id = root document id
   - version_number = latest.version_number + 1
   - is_latest = true
   - source_type = upload
   - status = processing/ready depending on pipeline
   - change_message = admin-provided message

4. Run existing upload pipeline:
   - upload original file
   - extract text
   - clean text
   - chunk text
   - generate embeddings
   - extract AI topics if available

5. Mark previous latest:
   - is_latest = false
   - replaced_by_document_id = new document id

6. Save AI change summary if possible.

7. Create document_version_events row:
   - event_type = new_version
   - document_id = new document id
   - previous_document_id = previous latest id
   - change_message = admin message
   - ai_change_summary = AI summary
```

Do not update old document chunks.

Do not update old published tests.

---

## Change Summary

When a new version is uploaded, generate a short AI change summary.

Create:

```txt
src/features/documents/lib/document-change-summary.ts
```

Input:

```txt
previous document title
previous extracted_text
new extracted_text
admin change_message
```

Output:

```ts
{
  summary: string;
  keyChanges: string[];
}
```

Store compact text in:

```txt
documents.ai_change_summary
document_version_events.ai_change_summary
```

Rules:

```txt
Do not block document version creation if AI change summary fails.
If AI summary fails, leave ai_change_summary null.
Do not send very large full documents without limits.
Limit input length if needed.
Use safe server-side OpenAI call only.
```

Prompt intent:

```txt
Compare the previous and new extracted text of an internal company document.
Summarize the most important changes for a manager who may need to update employee knowledge tests.
Do not invent changes.
Return concise bullet points.
```

---

## Upload New Version API

Create:

```txt
POST /api/admin/documents/[id]/versions
```

Request format:

```txt
multipart/form-data
```

Fields:

```txt
file
changeMessage optional string
```

Do not use:

```json
{
  "updateExistingTests": true
}
```

Reason: uploading a new version and changing existing tests should be separate actions.

Responsibilities:

```txt
1. Verify current user is active admin.
2. Verify source document belongs to admin organization.
3. Reject demo documents if source_type = demo.
4. Reject archived/deleted documents if those statuses already exist.
5. Validate file type and size using existing document upload rules.
6. Resolve root document and latest version.
7. Create new document row as next version.
8. Upload original file to private Storage.
9. Extract text.
10. Clean text.
11. Create chunks.
12. Generate embeddings.
13. Extract AI topics if Spec 32 exists.
14. Generate AI change summary if possible.
15. Mark previous latest as not latest.
16. Set previous latest replaced_by_document_id = new document id.
17. Create document_version_events row.
18. Find affected tests that use the previous document version.
19. Return new document id, version number, change summary, and affected tests.
```

Response:

```ts
{
  documentId: string
  versionNumber: number
  previousDocumentId: string
  isLatest: true
  aiChangeSummary: string | null
  affectedTests: Array<{
    testId: string
    title: string
    status: string
    questionCount: number
  }>
  requiresDecision: boolean
}
```

`requiresDecision` is true when affected tests exist.

---

## Affected Tests

Affected tests are tests where:

```txt
tests.source_document_id = previousDocumentId
```

For this spec, multi-document tests are not supported yet.

Return affected tests only for admin awareness.

Do not change those tests automatically.

---

## Admin Decision After Upload

After the new version is created, show a post-upload decision UI.

Message:

```txt
A new version of this document is ready.
Some existing tests were generated from the previous version.
What would you like to do?
```

Actions:

```txt
1. Keep existing tests
2. Generate new draft from latest version
3. Decide later
```

### Keep existing tests

Behavior:

```txt
Old tests remain fully functional.
Old tests stay linked to old document version.
New test generation uses new latest version by default.
Old tests show banner: "A newer version of this source document exists."
```

### Generate new draft from latest version

Behavior:

```txt
Create a new AI-generated draft from the latest document version.
Redirect admin to review page.
Old published test remains unchanged.
Old questions are not deleted.
Old assignments/results remain unchanged.
```

If multiple affected tests exist:

```txt
Show affected tests list.
Admin chooses which test to use as template, or chooses "Generate new test from latest version".
```

Suggested behavior for using old test as template:

```txt
Reuse old test settings:
- title as base
- difficulty
- target_role
- question_count
- passing_score
- language
```

But source context comes from the new document version.

### Decide later

Behavior:

```txt
Close modal.
Document version is already created.
Affected tests continue to show outdated source warning.
```

Do not implement “Cancel upload entirely” in this spec.

Reason:

```txt
By the time extraction/chunking/embeddings completed, upload is already processed.
Rollback/delete version should be a future explicit action, not hidden behind cancel.
```

---

## Generate New Draft From Latest Version API

Prefer reusing existing generation endpoint:

```txt
POST /api/admin/generate-test
```

Add support for optional template test id:

```ts
{
  documentId: string;
  templateTestId?: string;
  questionCount: number;
  difficulty: "easy" | "medium" | "hard";
  targetRole?: string;
  language: "en" | "de";
  questionTypes: Array<"single_choice" | "multiple_choice" | "true_false">;
}
```

If `templateTestId` is provided:

```txt
1. Verify admin can access template test.
2. Read generation-relevant settings from template test.
3. Use latest document version chunks as source.
4. Generate new draft.
5. Redirect to review.
```

Do not publish automatically.

---

## Document History UI

Update:

```txt
/admin/documents/[id]
```

Add section or tab:

```txt
History
```

Show version timeline:

```txt
v3 Latest
Uploaded by Admin
Uploaded at date
Change message
AI change summary
Open version
Compare with previous optional

v2
Uploaded by Admin
Uploaded at date
Change message
AI change summary
Open version

v1
Initial upload
Uploaded by Admin
Uploaded at date
Open version
```

Minimum required:

```txt
version number
latest badge
old version badge
created/upload date
change message
AI change summary if available
link to open version
link to newer version if available
```

Optional:

```txt
Compare with previous
```

Do not build full visual diff in this spec unless trivial.

---

## Document List UI

Update:

```txt
/admin/documents
```

Show version information:

```txt
Version number
Latest badge
Old version badge if not latest
```

Default list should prefer:

```txt
status = ready
is_latest = true
```

But old versions should still be reachable through:

```txt
document detail history
newer/older version links
```

Minimum acceptable:

```txt
Document list shows latest versions.
Document detail history allows access to old versions.
```

---

## Document Detail UI

For any document detail page, show:

```txt
version number
latest badge
old version badge
newer version link if available
upload new version action
history section/tab
```

If current document is not latest:

```txt
Show banner:
A newer version of this document exists.
```

Action:

```txt
Open latest version
```

If current document is latest:

```txt
Show:
This is the latest version.
```

---

## Generate Test Behavior

Generation should default to latest ready document versions.

Normal generation selection should prefer:

```txt
status = ready
is_latest = true
```

If admin opens Generate Test from an old version directly:

```txt
Show warning:
This is not the latest version. Use latest version instead?
```

Actions:

```txt
Use latest version
Continue with this version
```

Continuing with old version is allowed, but should be explicit.

---

## Test Detail Warning

Update:

```txt
/admin/tests/[id]
```

If a test was generated from a source document where:

```txt
documents.is_latest = false
or documents.replaced_by_document_id is not null
```

Show warning:

```txt
This test was generated from an older document version.
A newer version of the source document exists.
```

Actions:

```txt
Open source document version
Open latest document version
Generate new draft from latest version
```

Do not deactivate the test only because a newer version exists.

Do not mutate the test automatically.

---

## Test Status Rules

A newer document version does not make a test invalid.

Status meaning:

```txt
old source version exists → test is outdated, but still valid
source archived/deleted later → test may become inactive in future specs
```

For this spec:

```txt
Outdated warning only.
No test inactivation.
No assignment blocking.
No employee blocking.
```

---

## Server Helpers

Create/update:

```txt
src/features/documents/lib/document-versioning.ts
src/features/documents/lib/document-version-events.ts
src/features/documents/lib/document-change-summary.ts
src/features/documents/lib/document-affected-tests.ts
```

All server-only helpers must include:

```ts
import "server-only"
```

Possible helper responsibilities:

```txt
getDocumentVersionFamily(documentId)
getLatestDocumentVersion(rootDocumentId)
createDocumentVersion()
createDocumentVersionEvent()
getAffectedTestsForDocumentVersion()
getDocumentHistory()
summarizeDocumentChanges()
```

---

## Client Components

Create/update:

```txt
src/features/documents/components/upload-document-version-button.tsx
src/features/documents/components/document-version-history.tsx
src/features/documents/components/document-version-badge.tsx
src/features/documents/components/document-version-decision-dialog.tsx
```

Keep UI simple.

Do not create large new design system components unless needed.

---

## Backward Compatibility

Existing documents should behave as version 1.

Migration defaults:

```txt
version_number = 1
is_latest = true
parent_document_id = null
```

Existing tests should continue working.

Existing single-document generate/publish flow should continue working.

Existing employee attempts/results should continue working.

---

## Important Safety Rules

Do not:

```txt
delete old test_questions
delete old chunks
delete old embeddings
replace old source_chunk_id
change completed attempts
change historical results
auto-publish regenerated tests
```

Always:

```txt
create new document version
create new chunks
create new embeddings
keep old test history intact
show warnings instead of silently mutating data
```

---

## Manual Test

### Test 1 — Upload new version

```txt
1. Login as admin.
2. Open a ready uploaded document.
3. Click Upload new version.
4. Upload updated file.
5. Add change message.
6. Confirm new document row is created.
7. Confirm new version_number = old + 1.
8. Confirm new version is_latest = true.
9. Confirm old version is_latest = false.
10. Confirm old version replaced_by_document_id points to new version.
11. Confirm new chunks and embeddings exist.
```

### Test 2 — History

```txt
1. Open latest document detail.
2. Open History tab/section.
3. Confirm v1 and v2 are listed.
4. Confirm latest badge appears on newest version.
5. Confirm old version can be opened.
6. Confirm old version shows newer version warning.
```

### Test 3 — Affected tests

```txt
1. Generate and publish a test from document v1.
2. Upload document v2.
3. Confirm upload response/dialog lists affected test.
4. Choose Keep existing tests.
5. Open old test detail.
6. Confirm outdated source warning appears.
7. Confirm test still works.
```

### Test 4 — Generate new draft from latest version

```txt
1. Upload document v2 after v1 has affected tests.
2. In decision dialog, choose Generate new draft from latest version.
3. Confirm AI generation uses v2 chunks.
4. Confirm admin is redirected to review page.
5. Confirm old test remains unchanged.
6. Confirm no old questions were deleted.
```

### Test 5 — Generate from old version

```txt
1. Open old document version.
2. Click Generate Test.
3. Confirm warning appears.
4. Choose Use latest version.
5. Confirm generation uses latest version.
6. Repeat and choose Continue with this version.
7. Confirm generation can still use old version only after explicit choice.
```

---

## Validation

Run:

```bash
npm run lint
npm run typecheck
npm run format:check
npm run build
```

Also verify:

```txt
No server-only helpers are imported into Client Components.
No API keys are exposed client-side.
Existing document upload still works.
Existing AI generation still works.
Existing publish flow still works.
Existing employee results still work.
```

---

## Context Updates

Create:

```txt
context/feature-specs/33-document-versioning-and-change-history.md
```

Update:

```txt
context/progress-tracker.md
context/history.md
context/decisions.md
context/architecture.md
```

Add decision:

```md
## 047 — Documents use immutable versions with visible change history

Documents are not overwritten in place. Uploading an updated file creates a new document row with its own extracted text, chunks, embeddings, topics, version metadata, and history event. Old versions remain available for historical tests and results. The UI shows a document version timeline, latest/old version badges, and outdated source warnings for tests generated from older versions.
```

Add decision:

```md
## 048 — Regeneration from a new document version creates a new draft, not a mutation of published tests

When a new document version is uploaded, existing tests generated from older versions remain unchanged and valid. Admins may generate a new AI draft from the latest version, but the system does not delete old questions, rewrite published tests, change assignments, or alter completed results automatically.
```

---

## Acceptance Criteria

- Admin can upload a new version of a document.
- New version creates a separate `documents` row.
- New version has incremented `version_number`.
- New version is marked `is_latest = true`.
- Previous latest version is marked `is_latest = false`.
- Previous latest version points to the new version through `replaced_by_document_id`.
- Old document chunks and embeddings remain unchanged.
- New document version gets its own chunks and embeddings.
- Document history section shows all versions in the version family.
- Document history shows change message and AI change summary where available.
- Old document version detail shows newer version warning.
- Latest document version detail shows latest badge.
- Existing tests from old version still open.
- Existing tests from old version show outdated source warning.
- Admin can choose to keep existing tests unchanged.
- Admin can generate a new draft from latest version.
- Regeneration does not delete old test questions.
- Regeneration does not mutate published tests.
- Generate Test prefers latest ready document versions.
- Opening Generate Test from old version shows warning.
- Existing single-document generation still works.
- Existing employee attempts/results still work.
- `lint`, `typecheck`, `format:check`, and `build` pass.

## Next Step

Feature Spec 34: Archive Document and Inactivate Dependent Tests
