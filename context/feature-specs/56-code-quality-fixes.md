# Feature: Code Quality Fixes

## Goal

Reduce code duplication, split oversized files, generate proper database types, and improve component rendering performance.

## Scope

### In scope

1. Move duplicate `parseOptions` / `parseCorrectAnswer` functions (currently in 6 files) into one shared helper
2. Split `supabase-employee-attempts.ts` (1056 lines) into smaller files by responsibility
3. Generate Supabase types from the database instead of maintaining 793 lines of hand-written types
4. Split `employee-management-page.tsx` (686 lines) into separate components for table and modals
5. Add React.memo to table row components across documents, tests, and employees

### Out of scope

- TanStack Table migration
- Other large file splits
- Logic or behavior changes

## File changes

### 1. Shared helpers

- New: `src/shared/db/parse-json-fields.ts` — `parseOptions`, `parseCorrectAnswer`, `parseUserAnswer`
- Update 6 files to import from shared instead of local copy

### 2. Split attempt file

- Create: `create-attempt.ts` (start), `submit-attempt.ts` (submit + scoring), `attempt-result.ts` (result load), `attempt-feedback.ts` (AI feedback)
- Keep common types in original file

### 3. Types

- Run: `supabase gen types typescript --linked > src/lib/supabase/types.ts`

### 4. Split employee page

- Create: `employees-table.tsx`, `invite-employee-modal.tsx`, `bulk-assign-modal.tsx`

### 5. React.memo

- Add `React.memo` to row renderers in `documents-table.tsx`, `tests-list-page.tsx`, `employees-table.tsx`

## Acceptance criteria

- WHEN code builds, THEN no type errors from generated types
- WHEN importing parseOptions, THEN it comes from shared module
- WHEN viewing employee list, THEN rows render without performance lag
- THEN `npm run lint`, `typecheck`, `format:check`, `build` pass

## Constraints

- No logic or behavior changes — refactor only
- Keep backward-compatible exports during split
- Generated types go through `supabase gen types`
