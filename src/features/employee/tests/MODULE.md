# Employee Tests Module

## Purpose

Owns the employee-facing My Tests experience: assigned test list, progress summary, filters, test-taking flow, test result with mock AI feedback, and mock follow-up questions for weak topics.

## Contains

- feature-specific components
- feature-specific mock data
- feature-specific types
- feature-specific helpers

## Does Not Contain

- shared UI primitives
- admin test management logic
- real auth or assignment persistence
- real AI feedback generation or persistence
- real follow-up question generation or persistence

## Conventions

- Keep feature-specific logic colocated here.
- Use mock data until backend integration is planned.
- Reuse admin test metadata from `src/features/tests/mock/tests.ts` where appropriate.
- Test-taking uses local client state only; questions resolve from `mockTests`.
- Test results use colocated mock attempt records in `mock/test-results.ts`; no state is passed from the take flow.
- Follow-up questions use colocated mock records in `mock/follow-up-questions.ts`, keyed by original incorrect question id; completion state is local client state only and drives weak-topic status badges.
- Avoid generic file names for domain logic.

## Related Routes

- `/employee/dashboard` — employee home with KPIs, next test, feedback, and learning focus
- `/employee/tests`
- `/employee/tests/[id]/take` — mock test-taking flow with local state
- `/employee/tests/[id]/result` — mock result page with score, answer review, weak topics, AI feedback, and inline follow-up questions for incorrect answers

## Future Boundaries

- Supabase integration should load assignments for the authenticated employee only.
- Backend persistence for attempts and answers belongs in a future attempts slice.
- Backend persistence should not be mixed directly into UI components.
