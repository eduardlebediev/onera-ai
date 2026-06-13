# Feature: Production Bugfixes

## Goal

Fix known runtime bugs that break the review/publish flow, loading states, and edge cases discovered during smoke testing.

## User story

As an admin, when I navigate through the app, I want all pages to render without console errors, infinite loops, or broken loading states, so that the demo feels polished and stable.

## Scope

### In scope

1. **Fix `useResolvedReviewData` infinite loop** — wrap `buildResolvedState()` in `useMemo` to create a stable snapshot reference
2. **Fix employee take page loading flash** — ensure `isStartingAttempt` transitions smoothly without loader flicker before redirect
3. **Fix add/remove follow-up topic status** — ensure weak topic completion state persists correctly when switching between follow-up and results
4. **Fix assign page "invalid uuid" for mock tests** — ensure mock test IDs (doc-1, test-1) are handled correctly in UUID validation

### Out of scope

- New features or UI redesign
- Database changes

## Technical details

### Bug 1: `useResolvedReviewData` infinite loop

File: `src/features/tests/lib/use-resolved-review-data.ts`

Root cause: `useSyncExternalStore(getSnapshot)` returns a new object reference on every call. React detects `{} !== {}` and re-renders infinitely.

Fix: add `useMemo`:

```ts
const snapshot = useMemo(
  () => buildResolvedState(documentId, fallbackReviewData),
  [documentId, fallbackReviewData]
)
return useSyncExternalStore(() => () => {}, () => snapshot, () => getServerState(...))
```

### Bug 2: Employee take page loading flash

File: `src/features/employee/tests/[id]/take/page.tsx`

Root cause: SSR renders loading state, then client hydrates and shows the same loading state before redirect.

Fix: ensure async `startEmployeeTestAttempt` resolves before first render, or add a minimum loading duration to prevent flash.

### Bug 3: Follow-up topic status

File: `src/features/employee/tests/components/test-answer-review.tsx`

Root cause: switching between follow-up cards can reset topic completion state.

Fix: stabilize the `completedTopics` state so each topic retains its completion status independently.

### Bug 4: Mock test UUID validation

File: `src/features/documents/lib/demo-document-ids.ts` and affected API routes

Root cause: some API routes validate UUID format but mock tests use `doc-1`, `test-1` IDs.

Fix: ensure API routes handle mock IDs gracefully (fallback to existing mock behavior) without throwing UUID validation errors.

## Acceptance criteria

- WHEN admin opens review page, THEN no "getSnapshot should be cached" console error
- WHEN admin opens publish page, THEN no infinite re-render loop
- WHEN employee opens take page, THEN loading state transitions smoothly without flicker
- WHEN employee completes a follow-up and returns to results, THEN topic status is preserved
- WHEN admin uses mock test IDs (doc-1, test-1), THEN no UUID validation errors in API
- THEN `npm run lint`, `typecheck`, `format:check`, `build` pass

## Constraints

- Minimal changes: no component logic rewrites
- Do not change API contracts or database schema
- Keep mock fallback working for demo IDs
