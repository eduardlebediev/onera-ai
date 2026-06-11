# Feature Spec 28: Employee Test Taking and Attempt Persistence

## Goal

Replace mock/local employee test-taking behavior with Supabase-backed attempts and answers.

The goal is to complete this real backend flow:

```
Admin assigns published test
→ Employee sees assigned test
→ Employee starts test
→ test_attempt is created
→ Employee answers questions
→ Employee submits
→ test_answers are saved
→ score is calculated server-side
→ test_attempt is completed
→ result page reads persisted result
```

Do not implement advanced analytics in this spec.
Do not implement auth UI in this spec.
Do not implement AI follow-up persistence in this spec.

## Context

Already completed:

- Spec 21 — Supabase backend foundation
- Spec 22 — Embedding script
- Spec 23 — AI Generate Test API
- Spec 24 — Generate Test page connected to real AI API
- Spec 25 — Save reviewed generated test to Supabase
- Spec 26 — Backend Data Integration for Admin Documents and Tests
- Spec 27 — Real Test Assignments

Current tables already exist: `test_assignments`, `test_attempts`, `test_answers`, `tests`, `test_questions`, `profiles`, `organization_members`.

Current employee routes already exist:

- `/employee/dashboard`
- `/employee/tests`
- `/employee/tests/[id]/take`
- `/employee/tests/[id]/result`

Current app may still use a hardcoded demo employee until auth is implemented.

Temporary demo employee id: `b0000000-0000-4000-8000-000000000002`.

Add TODOs where needed: `Replace hardcoded demo employee with authenticated user after auth spec.`

## Scope

Backend-backed employee flow:

- `/employee/tests`
- `/employee/tests/[id]/take`
- `/employee/tests/[id]/result`

Required behavior:

- Employee can open an assigned Supabase test.
- Employee can answer saved `test_questions`.
- Employee can submit answers.
- Server saves attempt and answers.
- Server calculates score.
- Result page reads persisted attempt/result.
- Mock fallback remains for old mock tests.

## Important Rules

- Employee can only take assigned tests.
- Use `test_attempts`, not local-only state.
- Use `test_answers`, not local-only result data.
- Score must be calculated server-side.
- Do not trust client-provided correct answers.
- Do not expose correct answers before submit.
- Do not expose `SUPABASE_SECRET_KEY` to client code.
- Do not import admin Supabase client into Client Components.
- Keep mock fallback for old mock test ids.
- Do not implement full auth yet.
- Do not add Prisma.

## Files to Inspect First

Inspect:

- `src/app/(employee)/employee/tests/page.tsx`
- `src/app/(employee)/employee/tests/[id]/take/page.tsx`
- `src/app/(employee)/employee/tests/[id]/result/page.tsx`
- `src/features/employee/tests/`
- `src/features/tests/`
- `src/lib/supabase/`
- `src/lib/supabase/types.ts`

Reuse existing UI as much as possible. Do not redesign the employee flow.

## Backend Helpers

Create or update:

- `src/features/employee/tests/lib/supabase-employee-tests.ts`
- `src/features/employee/tests/lib/supabase-employee-attempts.ts`

Server-only helpers should start with `import "server-only"`.

## API Route: Start Attempt

Create `POST /api/employee/tests/[id]/start`.

Behavior:

1. Use demo employee id for now.
2. Verify test exists.
3. Verify test is assigned to employee.
4. If assignment status is `not_started`, set it to `in_progress`.
5. Create `test_attempt` if no active attempt exists.
6. Return attempt id and test id.

Rules:

- Do not create attempt for unassigned test.
- Do not create duplicate active attempts when one already exists.
- Derive `organization_id` from assignment/test.

## API Route: Submit Attempt

Create `POST /api/employee/tests/[id]/submit`.

Request body:

```json
{
  "attemptId": "uuid",
  "answers": [
    {
      "questionId": "uuid",
      "selectedOptionIds": ["uuid"]
    }
  ]
}
```

Behavior:

1. Validate request with Zod.
2. Verify attempt belongs to demo employee.
3. Verify attempt belongs to the selected test.
4. Load `test_questions` from Supabase.
5. Compare submitted answers with `correct_answer` from DB.
6. Insert `test_answers`.
7. Calculate score.
8. Mark `test_attempt` completed.
9. Mark `test_assignment` completed/failed based on `passing_score`.
10. Return attempt id, score, passed, redirectTo.

Scoring: `correct answers / total questions * 100`.

For question types:

- `single_choice` → exactly one selected option id must match
- `true_false` → exactly one selected option id must match
- `multiple_choice` → selected option set must match correct option set

Do not expose correct answers before submit.

## Employee Take Page

Route: `/employee/tests/[id]/take`

Expected behavior for Supabase UUID tests:

1. Verify assignment exists for demo employee.
2. Load test and questions from Supabase.
3. Hide correct answers from client state before submit.
4. On page load or Start button, call start attempt API.
5. Let employee answer questions.
6. Submit to submit API.
7. Redirect to `/employee/tests/[id]/result?attemptId={attemptId}`

For mock ids: keep existing mock/local take flow.

## Employee Result Page

Route: `/employee/tests/[id]/result`

Expected behavior:

1. If `attemptId` query param exists, fetch persisted attempt/result.
2. Show score, passed/failed, answers, explanations.
3. Show wrong answers and correct explanations if available.
4. If no persisted attempt exists, fallback to existing mock result.

Saved result should show: test title, score, passed status, questions, employee answer, correct answer, is_correct, explanation, topic.

## Employee Tests Page

Route: `/employee/tests`

Update if needed:

- Assigned Supabase tests should link to `/employee/tests/{testId}/take`.
- Completed Supabase tests should link to `/employee/tests/{testId}/result?attemptId={latestAttemptId}`.
- Status should come from `test_assignments`.

## Data Types

Update `src/lib/supabase/types.ts`. Add minimal types for: `test_attempts`, `test_answers`, `test_assignments`, `tests`, `test_questions`.

## Mock Fallback

Keep fallback for: old mock test ids, offline demo, no Supabase assignment, development fixtures.

But for UUID-backed assigned tests, Supabase should be primary source.

## Out of Scope

Do not implement: real auth/current user, invite flow, RLS policies rollout, AI follow-up persistence, advanced AI feedback, admin analytics dashboard, teams, PDF upload, Prisma, large redesign.

## Manual Test

Run `npm run dev`.

Admin side precondition: a published Supabase test exists, assigned to demo employee.

Test employee flow:

1. Open `/employee/tests`
2. Open assigned Supabase test
3. Start/take test
4. Answer questions
5. Submit
6. Confirm redirect to result page
7. Confirm score/result is persisted

Supabase verification:

```sql
select id, test_id, user_id, status, score, passed, completed_at
from public.test_attempts
order by created_at desc
limit 10;

select attempt_id, question_id, user_answer, is_correct
from public.test_answers
order by created_at desc
limit 20;
```

Expected: completed attempt exists, answers exist, score is calculated, assignment status updated.

## Validation

```bash
npm run lint
npm run typecheck
npm run format:check
npm run build
```

## Context Updates

Create this file (`context/feature-specs/28-employee-test-taking-and-attempt-persistence.md`).

Update:

- `context/progress-tracker.md`
- `context/history.md`
- `context/decisions.md`

Add decision:

```
## 039 — Employee attempts and answers persist in Supabase

Employee test-taking for Supabase-backed assigned tests uses `test_attempts` and `test_answers` as the source of truth. The server validates assignment ownership, calculates score from `test_questions.correct_answer`, saves answers, completes the attempt, and updates assignment status. Mock/local employee flows remain fallback only for old mock tests until auth and RLS are implemented.
```

Update progress:

Completed:

- Employee Test Taking and Attempt Persistence

Next Up:

- Admin Progress and Results from Supabase
- Invite-only Auth and RLS Policies

## Acceptance Criteria

- Employee can take a Supabase assigned test.
- Start attempt creates or reuses an active `test_attempt`.
- Submit saves rows to `test_answers`.
- Score is calculated server-side.
- `test_attempts.status` becomes `completed`.
- `test_attempts.score` and `passed` are saved.
- `test_assignments.status` updates to `completed` or `failed`.
- Result page can read persisted attempt/result.
- Mock fallback still works.
- Correct answers are not exposed before submit.
- No auth UI added.
- No API keys exposed to client code.
- `lint`, `typecheck`, `format:check`, and `build` pass.

## Next Step

Feature Spec 29: Admin Progress and Results from Supabase
