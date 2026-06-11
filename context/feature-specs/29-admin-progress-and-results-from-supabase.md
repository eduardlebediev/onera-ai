# Feature Spec 29: Admin Progress and Results from Supabase

## Goal

Replace mock admin progress/result data with Supabase-backed assignment and attempt data.

The goal is to make admin reporting real:

```
Admin assigns test
→ Employee completes assigned test
→ Attempt and answers are saved
→ Admin sees real progress, completion status, scores, and weak topics
```

Do not implement advanced analytics in this spec.
Do not implement auth/RLS rollout in this spec.
Do not implement teams in this spec.

## Context

Already completed:

- Spec 21 — Supabase backend foundation
- Spec 22 — Embedding script
- Spec 23 — AI Generate Test API
- Spec 24 — Generate Test page connected to real AI API
- Spec 25 — Save reviewed generated test to Supabase
- Spec 26 — Backend Data Integration for Admin Documents and Tests
- Spec 27 — Real Test Assignments
- Spec 28 — Employee Test Taking and Attempt Persistence

Current backend tables: `tests`, `test_questions`, `test_assignments`, `test_attempts`, `test_answers`, `profiles`, `organization_members`, `documents`.

Current admin routes: `/admin/dashboard`, `/admin/tests`, `/admin/tests/[id]`.

The next goal is to make admin progress/result views read Supabase data.

## Scope

Backend-backed admin progress:

- `/admin/dashboard`
- `/admin/tests/[id]`
- optional: `/admin/progress` if route already exists

Required behavior:

- Admin dashboard shows real assignment/attempt metrics.
- Test detail shows assigned employees and completion status.
- Test detail shows latest score/result per employee.
- Weak topics are derived from incorrect answers where possible.
- Mock fallback remains for old mock data.

## Important Rules

- Use Supabase as primary source for admin progress data.
- Keep mock fallback only for old demo ids/dev fixture.
- Do not add a new analytics system.
- Do not add charts unless existing chart components already support it.
- Do not implement teams.
- Do not implement auth UI.
- Do not expose `SUPABASE_SECRET_KEY` to client code.
- Use server-side helpers for Supabase reads.
- Do not add Prisma.
- Do not redesign the whole dashboard.

## Files to Inspect First

- `src/app/(admin)/admin/dashboard/page.tsx`
- `src/app/(admin)/admin/tests/[id]/page.tsx`
- `src/features/tests/`
- `src/features/employee/`
- `src/features/analytics/`
- `src/lib/supabase/`
- `src/lib/supabase/types.ts`

Reuse existing dashboard/test detail components where possible.

## Backend Helpers

Create or update:

- `src/features/tests/lib/supabase-test-progress.ts`
- `src/features/analytics/lib/supabase-admin-dashboard.ts`

If `src/features/analytics/` does not exist or is not used, place dashboard helper in `src/features/tests/lib/supabase-admin-progress.ts`.

Server-only helpers should start with `import "server-only"`.

## Admin Dashboard Metrics

Route: `/admin/dashboard`

Fetch real Supabase metrics where available.

Minimum metrics:

- published tests count
- assigned tests count
- completed assignments count
- in-progress assignments count
- average score
- recent attempts

Suggested derived values:

- `totalTests = count of published tests`
- `totalAssignments = count of test_assignments`
- `completedAssignments = assignments with status completed/failed`
- `completionRate = completedAssignments / totalAssignments`
- `averageScore = avg(test_attempts.score where completed)`

Keep existing mock dashboard fallback if Supabase returns empty/error.

## Test Detail Progress Section

Route: `/admin/tests/[id]`

For Supabase UUID-backed tests, show a progress/result section.

Minimum content: assigned employees, assignment status, latest attempt status, score, passed/failed, completed_at, deadline if available.

Data sources: `test_assignments`, `profiles`, `test_attempts`.

Recommended display: Employee, Status, Score, Result, Completed.

Do not build advanced filtering/sorting unless simple.

## Weak Topics

Derive simple weak topics from wrong answers. Use `test_answers.is_correct = false` join `test_questions.topic`. Show: topic, wrong answer count.

This can be simple. If no wrong answers exist: "No weak topics yet".

Do not implement AI feedback generation here.

## Recent Attempts

On admin dashboard, optionally show recent attempts: employee name/email, test title, score, passed/failed, completed_at.

Only add this if it fits existing UI.

## Status Rules

Assignment status display should use: `not_started`, `in_progress`, `completed`, `failed`.

Attempt status display should use: `in_progress`, `completed`, `abandoned`.

If assignment is completed but no attempt exists, show safe fallback "Completed". Do not crash on partial data.

## Data Safety

Do not trust client-provided `organization_id`. For this spec, because auth is not implemented yet, use server-side admin reads and derive organization/test ids from database records.

Add `TODO` comments where production admin authorization will be needed.

## Mock Fallback

Keep fallback for: old mock test ids, empty Supabase state, offline demo, development fixtures.

But for UUID-backed saved tests and assignments, Supabase should be primary source.

## Out of Scope

Do not implement: full auth/current user, invite flow, RLS policy rollout, teams, advanced analytics, exports, PDF upload, AI feedback generation, follow-up persistence, Prisma, large redesign.

## Manual Test

Run `npm run dev`.

Preconditions: a Supabase test exists, assigned to demo employee, demo employee has completed at least one attempt.

Test:

1. Open `/admin/dashboard` — confirm real metrics appear where available
2. Open `/admin/tests`
3. Open a Supabase saved test UUID
4. Confirm assignment/progress section appears
5. Confirm employee status and score are shown
6. Confirm weak topics are shown if there are wrong answers

Fallback test: `/admin/tests/test-1`, `/admin/dashboard` with empty Supabase state. Expected: mock fallback still works, no crashes.

## Supabase Verification Queries

```sql
select status, count(*)
from public.test_assignments
group by status;

select status, passed, avg(score)
from public.test_attempts
group by status, passed;

select tq.topic, count(*) as wrong_count
from public.test_answers ta
join public.test_questions tq on tq.id = ta.question_id
where ta.is_correct = false
group by tq.topic
order by wrong_count desc;
```

## Validation

```bash
npm run lint
npm run typecheck
npm run format:check
npm run build
```

## Context Updates

Create this file (`context/feature-specs/29-admin-progress-and-results-from-supabase.md`).

Update:

- `context/progress-tracker.md`
- `context/history.md`
- `context/decisions.md`

Add decision:

```
## 040 — Admin progress reads assignments and attempts from Supabase

Admin progress and result views use `test_assignments`, `test_attempts`, and `test_answers` as the source of truth for backend-backed tests. The dashboard and test detail pages show real completion status, scores, recent attempts, and simple weak topics where available. Mock analytics remain fallback only until auth/RLS and full reporting are implemented.
```

Update progress:

Completed:

- Admin Progress and Results from Supabase

Next Up:

- Invite-only Auth and RLS Policies
- Optional: Real Document Upload and Markdown Extraction

## Acceptance Criteria

- `/admin/dashboard` can show Supabase-backed progress metrics.
- `/admin/tests/[id]` shows assignment/progress data for Supabase UUID tests.
- Assigned employees are shown with status and latest score when available.
- Weak topics are derived from incorrect persisted answers.
- Recent attempts are shown if implemented in existing UI.
- Mock fallback still works.
- No auth UI added.
- No teams added.
- No advanced analytics added.
- No API keys exposed to client code.
- `lint`, `typecheck`, `format:check`, and `build` pass.

## Next Step

Feature Spec 30: Invite-only Auth and RLS Policies
