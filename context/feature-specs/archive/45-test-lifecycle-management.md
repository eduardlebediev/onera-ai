# Feature: Test Lifecycle Management

## Goal

Allow admins to edit, archive, restore, and delete published tests so they have full control over the test lifecycle after publishing.

## User story

As an admin, I want to archive outdated tests, restore archived ones, delete draft or archived tests, and edit test metadata so that I can manage tests throughout their lifecycle.

## Scope

### In scope

1. `PATCH /api/admin/tests/[id]` — update title, description, difficulty, passing score, target role
2. `POST /api/admin/tests/[id]/archive` — flip status to `archived`
3. `POST /api/admin/tests/[id]/restore` — flip status back to `published`
4. `DELETE /api/admin/tests/[id]` — delete draft/archived tests (blocked if attempts exist)
5. UI actions on `SavedTestDetailPage`: Edit, Archive, Restore, Delete with confirm dialogs
6. Tests list shows archived filter/badge
7. Archived tests hidden from assignable list

### Out of scope

- Edit questions after publish (covered by review editor)
- Bulk operations
- Automatic archive after inactivity

## UX/UI requirements

- Edit button opens inline form for metadata fields
- Archive shows confirm dialog with impact summary
- Restore is one-click with success feedback
- Delete shows strong confirmation for archived/draft tests
- Block delete for published tests with attempts — show clear message
- Archived badge on test detail and list

## Data/API requirements

- Archive: update `test.status = 'archived'`, set `is_active = false`
- Restore: update `test.status = 'published'`, set `is_active = true`
- Delete: guard against published tests with attempts (return 409), then soft delete or hard delete based on status
- All routes require admin auth + org verification

## Edge cases

- Archive published test with active assignments → warn, keep assignments (employee blocked by inactive test)
- Delete draft test with no attempts → allowed
- Delete archived test with completed attempts → warn, but allowed (tombstone)
- Edit test that has active assignments → metadata change propagates to take flow
- Archive already archived test → idempotent (no-op)
- Delete from wrong org → 404

## Acceptance criteria

- WHEN admin archives a published test, THEN status becomes `archived`, test is hidden from assign
- WHEN admin restores an archived test, THEN status becomes `published`, assignable again
- WHEN admin edits test metadata, THEN changes persist and reflect in take flow
- WHEN admin deletes a draft/archived test, THEN test is removed (or tombstoned)
- WHEN admin tries to delete a published test with attempts, THEN request is blocked with 409
- WHEN admin views tests list, THEN archived tests show archived badge
- THEN `npm run lint`, `typecheck`, `format:check`, `build` pass

## Constraints

- Reuse existing confirm dialog pattern from document archive/delete
- Block delete for published tests with attempts (data safety)
- Archived tests should still show in result/history for employees
- Org-scoped routes (admin cannot manage another org's tests)
