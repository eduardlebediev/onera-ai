# Feature: Retake + Transactional Reliability

## Goal

Allow employees to retake a failed test and make multi-row write operations (publish, submit) atomic so partial failures cannot leave orphaned or inconsistent data.

## User story

As an employee who failed a test, I want to retake it so that I can improve my score. As a system, writes to multiple tables should be atomic so that a partial failure doesn't leave orphaned data.

## Scope

### In scope

1. Retake policy: failed assignments are retakeable (configurable max attempts), passed are not
2. Update `startEmployeeTestAttempt()` to create new attempt for retakes
3. "Retake Test" button on result page works for Supabase tests (currently dead end)
4. My Tests "Failed/Retake Needed" status section
5. Wrap publish (test + test_documents + questions) in a single Postgres transaction via RPC
6. Wrap submit (answers + attempt + assignment) in a single RPC
7. Set `created_by` on published tests to the acting admin

### Out of scope

- Unlimited retakes (capped)
- Admin-configurable attempt count per test (future)
- Automatic retake reminders
- Transactional writes for other paths (archive, delete)

## UX/UI requirements

- Failed test → "Retake" button on result page and My Tests
- Retake creates new attempt, previous attempt preserved in history
- Progress page shows all attempts
- Passed test → no retake option
- No visible changes for transactional writes (behind the scenes)

## Data/API requirements

- Retake: `startEmployeeTestAttempt()` allows new attempt if assignment is `failed`
- New migration `00009_retake_and_transactions.sql`:
  - `alter table public.tests add column if not exists max_attempts int;`
  - `create or replace function publish_generated_test(...)` — atomic insert test + test_documents + questions
  - `create or replace function complete_test_attempt(...)` — atomic insert answers + update attempt + update assignment
- Routes call RPC and map errors to status codes
- `created_by` populated from `requireAdminApiUser()`

## Edge cases

- Retake after passed → blocked (per policy)
- Retake while attempt in progress → blocked
- Concurrent double-submit → exactly one completed attempt (via RPC)
- Publish fails mid-way → no orphan test (via RPC)
- Max attempts reached → retake blocked with clear message

## Acceptance criteria

- WHEN employee fails a test, THEN "Retake" button appears and creates new attempt
- WHEN employee passed a test, THEN retake is blocked
- WHEN employee has used all attempts, THEN retake is blocked with message
- WHEN publish fails, THEN no partial data remains (transactional)
- WHEN submit fails, THEN no orphan answers (transactional)
- THEN published test has `created_by` set to admin
- THEN `npm run lint`, `typecheck`, `format:check`, `build` pass

## Constraints

- Reuse existing start/submit logic, extend with retake guard
- Transactional RPCs: `security definer`, org-scoped, revoked from public
- Retake preserves all prior attempts for progress/history
- Max attempts default: 3 (configurable via env or DB)
