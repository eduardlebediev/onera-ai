# Code Standards

## General

- Keep modules small and single-purpose.
- Prefer clear code over clever abstractions.
- Fix root causes instead of layering workarounds.
- Do not mix unrelated concerns in one component, hook, or route.
- Keep each implementation step small enough to review.
- Add comments only when they explain why, not what.
- Avoid speculative abstractions until a pattern appears twice.

## TypeScript

- Strict TypeScript is required.
- Avoid `any`; use explicit types, `unknown`, or narrowed domain types.
- Validate all unknown external input at system boundaries.
- Use discriminated unions for status/state where useful.
- Prefer domain-specific types over loose primitives when they improve clarity.
- Do not suppress TypeScript errors to make code pass.

## Next.js

- Use App Router conventions.
- Default to Server Components where interactivity is not required.
- Add `use client` only when browser interactivity, local state, or client hooks are required.
- Keep route handlers focused on a single responsibility.
- Do not put long business logic directly in route handlers; delegate to services.
- Use server-side environment variables for AI API keys.

## React

- Keep components focused and composable.
- Separate container/data logic from presentational components when complexity grows.
- Model loading, empty, success, and error states explicitly.
- Avoid deeply nested conditional rendering.
- Use accessible labels and semantic HTML.

## Styling

- Use Tailwind utility classes and project design tokens.
- Prefer consistent spacing, radius, borders, and typography.
- Do not hardcode random colors in components.
- Use shadcn/ui components where appropriate.
- Keep UI polished but avoid overengineering animations.

## API Routes

- Validate request input before any logic runs.
- Return consistent response shapes.
- Handle errors explicitly.
- Do not leak internal error details to the client.
- Enforce auth and ownership before any mutation.
- Never trust AI-generated data without validation.

## AI Integration

- Keep prompts in dedicated files or functions.
- Keep AI provider details behind a service boundary.
- Validate structured AI output with Zod.
- Store useful AI run metadata where relevant.
- Add fallback/error states for AI failures.
- Do not directly execute or persist AI suggestions without approval.

## Data and Storage

- Metadata and relationships belong in the database.
- Large generated artifacts are out of scope for MVP.
- Keep database writes explicit and easy to audit.
- Prefer transactions where multiple dependent writes are required.
- Use consistent naming for database fields and domain types.
## File Organization

- `src/app/` — Next.js routes, layouts, pages, route handlers, and server actions
- `src/features/auth/` — login flow, demo auth, role-based access helpers
- `src/features/documents/` — document upload, document list, document detail, extracted text, topics, processing states
- `src/features/quizzes/` — quiz generation, quiz review, quiz editor, quiz detail, quiz publishing
- `src/features/assignments/` — assigning published quizzes to employees and tracking assignment status
- `src/features/attempts/` — employee test-taking flow, answers, scoring, result page, AI feedback
- `src/features/analytics/` — admin dashboard metrics, weak topics, quiz performance, employee progress summaries
- `src/shared/ai/` — AI client, provider configuration, prompt templates, structured output schemas
- `src/shared/db/` — Supabase clients, database types, query helpers, persistence helpers
- `src/shared/ui/` — reusable shared UI components, layout primitives, empty/loading/error states
- `src/shared/lib/` — generic utilities, formatting helpers, error helpers
- `src/data/mock/` — temporary mock data for frontend-first development
- `context/` — project context, feature specs, and progress documentation

## Testing

Prioritize tests around business-critical behavior:

- AI quiz generation schema validation
- invalid AI output handling
- admin review and publish flow
- quiz assignment logic
- employee answer validation
- score calculation
- pass/fail calculation based on `passing_score`
- AI feedback input preparation
- employee access only to assigned quizzes
- admin-only access to documents, quiz publishing, assignments, and analytics

Avoid spending time on brittle snapshot tests for MVP.