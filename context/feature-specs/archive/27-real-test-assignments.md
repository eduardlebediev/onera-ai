# Feature Spec 27: Real Test Assignments

## Goal

Replace mock assignment behavior with Supabase-backed test assignments.

The goal is to make this flow real:

```
Admin opens published test
→ Assigns test to employee
→ Row is created in test_assignments
→ Employee dashboard/tests page shows assigned test
```

This spec should connect admin assignment and employee assigned-test visibility through Supabase.

Do not implement full employee attempt/result persistence in this spec.
Do not implement auth UI in this spec.
Do not implement invite flow in this spec.

## Context

Already completed:

- Spec 21 — Supabase backend foundation
- Spec 22 — Embedding script
- Spec 23 — AI Generate Test API
- Spec 24 — Generate Test page connected to real AI API
- Spec 25 — Save reviewed generated test to Supabase
- Spec 26 — Backend Data Integration for Admin Documents and Tests

Current tables already exist: `organization_members`, `profiles`, `tests`, `test_questions`, `test_assignments`.

Current goal: make assignments real.

## Scope

Backend-backed assignment flow:

- `/admin/tests/[id]/assign`
- `/admin/tests/[id]`
- `/employee/dashboard`
- `/employee/tests`

Required behavior:

- Admin can assign a published Supabase test to real organization members.
- Employee-facing pages can read assigned tests from Supabase.
- Mock assignment fallback remains for old mock tests.

## Important Rules

- Use `test_assignments`, not mock-only assignment state.
- Use `organization_members` as the source of assignable employees.
- Use `profiles` for employee name/email.
- Do not create teams.
- Do not create public registration.
- Do not implement full auth yet.
- Do not implement employee test attempt persistence yet.
- Do not add Prisma.
- Do not expose `SUPABASE_SECRET_KEY` to client code.
- Use server-side helpers/API routes for writes.
- Keep mock fallback for old mock ids.

## Files to Inspect First

- `src/app/(admin)/admin/tests/[id]/assign/page.tsx`
- `src/app/(admin)/admin/tests/[id]/page.tsx`
- `src/app/(employee)/employee/dashboard/page.tsx`
- `src/app/(employee)/employee/tests/page.tsx`
- `src/features/tests/`
- `src/features/employee/`
- `src/features/assignments/`
- `src/lib/supabase/`
- `src/lib/supabase/types.ts`

Reuse existing UI. Do not redesign.

## Backend Helpers

Create or update:

- `src/features/tests/lib/supabase-assignments.ts`
- `src/features/employee/tests/lib/supabase-employee-assignments.ts`

These helpers should be server-only where they use admin/server Supabase access. Use `import "server-only"`.

## API Route: Assign Test

Create `POST /api/admin/tests/[id]/assign` at `src/app/api/admin/tests/[id]/assign/route.ts`.

Request body:

```json
{
  "userIds": ["uuid"],
  "deadline": "ISO string (optional)"
}
```

Behavior:

1. Validate test id.
2. Fetch test from Supabase.
3. Derive `organization_id` from test.
4. Validate selected users are active employee members of the same organization.
5. Insert rows into `test_assignments`.
6. Avoid duplicate assignments.
7. Return created/skipped assignments.

Status: `not_started`.

Do not trust client-provided `organization_id`.

## Assign Page

Route: `/admin/tests/[id]/assign`

Expected behavior:

1. If test id is Supabase UUID, load test from Supabase.
2. Load assignable employees from `organization_members` + `profiles`.
3. Show existing assignments.
4. Allow selecting employees.
5. Submit to real assign API.
6. Show success/error state.
7. Keep mock fallback for mock test ids.

Assignable employees: `organization_members.role = employee`, `organization_members.status = active`, `organization_members.organization_id = test.organization_id`.

Existing assignments should prevent duplicate selection or show already assigned state.

## Test Detail Page

Route: `/admin/tests/[id]`

For Supabase-backed tests, show assignment summary:

- assigned count
- not started count
- in progress count
- completed count
- failed count

If simple, also show assigned employees list. Do not build advanced analytics yet.

## Employee Dashboard Integration

Route: `/employee/dashboard`

Current app may still use demo user/mock employee. For this spec, use the seeded demo employee as temporary current user until auth exists.

Demo employee id: `b0000000-0000-4000-8000-000000000002`.

Expected behavior:

1. Fetch assignments for demo employee from Supabase.
2. Show assigned tests where possible.
3. Keep existing mock fallback if no Supabase assignments exist.

Do not implement login/current user resolution yet.

Add a TODO: `Replace hardcoded demo employee with authenticated user after auth spec.`

## Employee Tests Page Integration

Route: `/employee/tests`

Expected behavior:

1. Read `test_assignments` for demo employee from Supabase.
2. Join `tests` and source documents.
3. Show assigned tests.
4. Status comes from `test_assignments.status`.
5. Existing mock fallback remains if Supabase returns empty.

Data needed: assignment id, assignment status, deadline, test id, test title, test description, test difficulty, test question_count, test passing_score, source document title.

## Assignment Status

For this spec, only create and display assignment statuses. Allowed statuses: `not_started`, `in_progress`, `completed`, `failed`.

Do not implement full attempt persistence.

Optional small behavior: when employee clicks Take Test, assignment may become `in_progress`. Only implement this if it is simple and does not require attempt persistence. Otherwise leave it for Spec 28.

## Mock Fallback

Keep fallback for: old mock test ids, no Supabase assignments, offline demo, development fixture. But Supabase should be primary source for assignment data.

## Out of Scope

Do not implement: employee test submission persistence, `test_attempts`, `test_answers`, score calculation, result persistence, auth UI, invite flow, RLS policy rollout, teams, advanced analytics, PDF upload, Prisma, large redesign.

## Manual Test

Run `npm run dev`.

Test admin assignment:

1. Open `/admin/tests`
2. Open a Supabase saved test UUID
3. Go to `/admin/tests/{id}/assign`
4. Select demo employee
5. Assign test
6. Confirm `test_assignments` row is created

Test employee visibility:

1. Open `/employee/dashboard`
2. Open `/employee/tests`
3. Confirm assigned Supabase test appears

Test fallback:

- `/admin/tests/test-1/assign`
- `/employee/tests`

Expected: mock fallback still works.

## Supabase Verification

```sql
select id, organization_id, test_id, user_id, status, deadline
from public.test_assignments
order by created_at desc
limit 10;
-- Expected: new assignment exists with status = not_started

select
  ta.id as assignment_id,
  ta.status,
  t.title,
  p.email
from public.test_assignments ta
join public.tests t on t.id = ta.test_id
join public.profiles p on p.id = ta.user_id
order by ta.created_at desc
limit 10;
```

## Validation

Run:

```bash
npm run lint
npm run typecheck
npm run format:check
npm run build
```

## Context Updates

Create this file (`context/feature-specs/27-real-test-assignments.md`).

Update:

- `context/progress-tracker.md`
- `context/history.md`
- `context/decisions.md`

Add decision:

```
## 038 — Test assignments use Supabase as source of truth

Published tests are assigned to employees through `test_assignments`. Assignable employees come from active `organization_members` with role `employee`, joined with `profiles`. Employee dashboard and employee tests pages read Supabase assignments first, while mock assignments remain only as fallback/dev fixture until auth and attempt persistence are implemented.
```

Update progress:

Completed:

- Real Test Assignments

Next Up:

- Employee Test Taking and Attempt Persistence
- Admin Progress and Results from Supabase

## Acceptance Criteria

- `/admin/tests/[id]/assign` supports Supabase UUID-backed tests.
- Assign page loads real active employee members.
- Admin can create real rows in `test_assignments`.
- Duplicate assignments are avoided.
- Test detail shows assignment summary for Supabase tests.
- `/employee/dashboard` can show Supabase assignments for demo employee.
- `/employee/tests` can show Supabase assignments for demo employee.
- Mock fallback still works.
- No employee attempt/result persistence added.
- No auth UI added.
- No API keys exposed to client code.
- `lint`, `typecheck`, `format:check`, and `build` pass.

## Next Step

Feature Spec 28: Employee Test Taking and Attempt Persistence
