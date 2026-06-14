# Feature: Employee Progress Page

## Goal

Add an `/employee/progress` page showing completed tests, average score, strengths, weak topics, and full attempt history sourced from Supabase.

## User story

As an employee, I want to see my test history, average score, strengths, and weak topics in one place so that I can track my learning progress over time.

## Scope

### In scope

1. `/employee/progress` page route with server-side Supabase loader
2. Metrics: completed tests count, average score, strengths (topics with >80% correct), weak topics (topics with <60% correct)
3. Full attempt history: test title, score, passed/failed, completed date
4. Progress nav link in employee navbar
5. Compute `completedTestsCount` and `averageScore` from real attempts (replace hardcoded `0` from mock)
6. Empty state for new employees with no attempts

### Out of scope

- Dashboard feedback rewrite
- Follow-up question history on progress page
- Charts or visualizations
- Admin view of employee progress (already on admin analytics)

## UX/UI requirements

- New page at `/employee/progress` matching existing employee shell
- Sections: Overview (KPI cards: tests completed, avg score, strengths count, weak topics count), Strengths list, Weak topics list, Attempt history table
- Strengths/weak topics derived from `test_answers.is_correct` grouped by `test_questions.topic`
- Empty state: "Complete your first test to see progress here."

## Data/API requirements

- New helper: `src/features/employee/tests/lib/supabase-employee-progress.ts`
- Requires `userId` from `requireEmployeeUser()`
- Queries: completed `test_attempts` for user, join `test_questions.topic` through `test_answers`, aggregate per-topic correctness
- Update `supabase-employee-assignments.ts` to compute `completedTestsCount` and `averageScore` from real attempts

## Edge cases

- No completed tests → empty state
- No wrong answers → no weak topics ("All topics understood")
- Single attempt → single row in history
- Mixed results across topics → correct strengths/weak topics computed

## Acceptance criteria

- WHEN employee opens `/employee/progress`, THEN page shows completed tests, average score, strengths, weak topics from real attempts
- WHEN employee has no attempts, THEN empty state is shown
- WHEN employee completes a test, THEN progress page updates
- WHEN all answers correct, THEN weak topics shows "All topics understood"
- THEN `npm run lint`, `typecheck`, `format:check`, `build` pass

## Constraints

- Reuse existing `KpiCard` component
- Server component + loader pattern
- Own-user data only (employee cannot see others)
- No new dependencies
