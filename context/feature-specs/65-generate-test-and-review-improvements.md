# Feature: Generate Test and Review Improvements

## Goal

Simplify test generation setup, improve target-audience selection and review UX, and fix validation and persistence bugs that blocked draft approval and publishing.

## User story

As an admin generating and reviewing AI tests, I want to pick source documents and real employees, approve questions in bulk, and publish without validation or save errors, so the generate-to-publish flow works reliably end to end.

## Scope

### Generate test setup

- Remove topic/chunk filtering; use all embedded chunks from selected documents
- Load real org employees as target audience (multi-select, ID-backed selection)
- Show target audience as names only (no email); move summary row to bottom
- Unify form control styling (inputs, selects, buttons)

### AI validation and context

- Relax choice-question option rules (at least 2 options, not exactly 4)
- Normalize LLM question types and correct-answer shape before validation
- Scope document-chunk retrieval to the admin's organization

### Review page

- Remove fixed page height; allow natural content flow
- Cap question list at 800px with internal scroll
- Replace per-question Approve with header "Approve all"
- Move question action buttons to top toolbar in detail panel

### Persistence fixes

- Resolve existing draft questions on PATCH (by id, clientId, or orderIndex) to avoid duplicate inserts
- Preserve `sourceDocumentId` on question updates
- Create employee assignment rows on publish for selected target employees or all active employees
- Fix Supabase RPC `this` binding for publish and attempt submit

## Out of scope

- Topic/chunk picker UI
- Per-question approve in list
- Schema migrations

## Acceptance criteria

- WHEN admin selects documents and employees and generates a test, THEN all embedded chunks are used and target audience shows names without email
- WHEN AI returns varying option counts or question types, THEN draft validation passes or normalizes safely
- WHEN admin clicks "Approve all", THEN questions update without duplicate-key errors
- WHEN admin publishes an approved draft, THEN publish succeeds via RPC
- WHEN a generated test targets all employees, THEN active employees receive assignment rows on publish
- THEN `npm run lint`, `typecheck`, and `build` pass
