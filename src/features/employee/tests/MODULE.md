# Employee Tests Module

## Purpose

Owns the employee-facing My Tests experience: assigned test list, progress summary, filters, and navigation to test-taking and result placeholders.

## Contains

- feature-specific components
- feature-specific mock data
- feature-specific types
- feature-specific helpers

## Does Not Contain

- shared UI primitives
- admin test management logic
- real auth or assignment persistence
- test-taking or scoring logic

## Conventions

- Keep feature-specific logic colocated here.
- Use mock data until backend integration is planned.
- Reuse admin test metadata from `src/features/tests/mock/tests.ts` where appropriate.
- Avoid generic file names for domain logic.

## Related Routes

- `/employee/tests`
- `/employee/tests/[id]/take`
- `/employee/tests/[id]/result`

## Future Boundaries

- Supabase integration should load assignments for the authenticated employee only.
- Test-taking flow belongs in a future attempts slice; this module links to it.
- Backend persistence should not be mixed directly into UI components.
