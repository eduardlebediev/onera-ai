# Tests Module

## Purpose

Owns test-focused UI and feature logic for generating, reviewing, listing, and viewing test details with mock data.

## Contains

- feature-specific components
- feature-specific mock data
- feature-specific types
- feature-specific helpers
- feature-specific schemas when needed

## Does Not Contain

- shared UI primitives
- unrelated business logic
- cross-feature utilities
- backend persistence logic unless explicitly scoped

## Conventions

- Keep feature-specific logic colocated here.
- Keep presentational components small.
- Use mock data until backend integration is planned.
- Move only truly reusable code to `src/shared/*`.
- Avoid generic file names for domain logic.

## Related Routes

- `/tests`
- `/tests/[id]`
- `/tests/[id]/assign`
- `/tests/review`
- `/tests/publish`
- `/employee/tests`
- `/employee/tests/[id]/take`
- `/employee/tests/[id]/result`

## Future Boundaries

- Supabase integration should be added through a service boundary.
- AI-generated output should be validated before use.
- Backend persistence should not be mixed directly into UI components.
