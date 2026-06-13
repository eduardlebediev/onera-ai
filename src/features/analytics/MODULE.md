# Analytics Module

## Purpose

Owns admin-facing analytics views, KPIs, and performance summaries built from dashboard-oriented domain data.

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

- `/admin/dashboard`
- `/admin/analytics`

## Future Boundaries

- Supabase integration should be added through a service boundary.
- AI-generated output should be validated before use.
- Backend persistence should not be mixed directly into UI components.
