# Employee Tests Module

## Purpose

Owns the employee-facing My Tests experience: assigned test list, progress summary, filters, test-taking flow, test result with mock AI feedback, and mock follow-up questions for weak topics.

## Contains

- feature-specific components
- feature-specific mock data
- feature-specific types
- feature-specific helpers
- Supabase-backed attempt persistence for UUID assigned tests

## Does Not Contain

- shared UI primitives
- admin test management logic
- real auth or assignment persistence
- real AI feedback generation or persistence
- real follow-up question generation or persistence

## Conventions

- Keep feature-specific logic colocated here.
- Supabase UUID assigned tests use server-only helpers and employee API routes for attempts/answers.
- Mock test ids (`test-1`, etc.) keep local sessionStorage take/result fallback.
- Reuse admin test metadata from `src/features/tests/mock/tests.ts` where appropriate.
- Avoid generic file names for domain logic.

## Related Routes

- `/employee/dashboard` — employee home with KPIs, next test, feedback, and learning focus
- `/employee/tests`
- `/employee/tests/[id]/take` — Supabase UUID tests use persisted attempts; mock ids use local state
- `/employee/tests/[id]/result` — persisted results via `?attemptId=` for Supabase tests; mock/sessionStorage fallback otherwise

## Future Boundaries

- Supabase integration should load assignments for the authenticated employee only.
- Auth and RLS will replace the hardcoded demo employee id.
- Backend persistence should not be mixed directly into UI components.
