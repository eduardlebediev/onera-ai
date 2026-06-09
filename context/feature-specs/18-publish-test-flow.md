# Feature Spec: Publish Test Flow

## Goal

Replace the current `/tests/publish` placeholder with a real clickable mock publish flow.

The admin should be able to review the final test summary, confirm that the test is ready, publish it locally, see a success state, and continue to the published test detail page.

This task uses mock data and local UI state only. No backend, Supabase, persistence, or real AI logic.

## Current State

The project already has:

- `/documents/[id]/generate-test`
- `/tests/review`
- `/tests/publish` placeholder
- `/tests`
- `/tests/[id]`
- `/tests/[id]/assign`
- mock documents
- mock tests
- mock generated review data

This task should implement the real publish page only.

## User Flow

Test Review → Continue to Publish → Publish Test Summary → Confirm Publish → Published Success State → Open Test Detail

## Requirements

### 1. Replace Publish placeholder route

Update:

```
src/app/tests/publish/page.tsx
```

The page should no longer show:

```
Publish Test Flow will be implemented next.
```

Instead, it should render a real publish confirmation flow.

The route may continue to support:

```
/tests/publish?documentId=[id]
```

If `documentId` is provided, use it to resolve the source document and mock reviewed test data.

If no `documentId` is provided, use a sensible default mock document/test so the page still works in demo mode.

### 2. Create feature-local publish UI

Create publish-related components inside the tests feature area, for example:

```
src/features/tests/components/publish-test-page.tsx
src/features/tests/components/publish-test-summary.tsx
src/features/tests/components/publish-readiness-card.tsx
src/features/tests/components/publish-approved-questions.tsx
src/features/tests/components/publish-success-state.tsx
```

Use the existing feature structure if there is already a better place.

### 3. Load mock reviewed test data

Use existing mock review data from the Test Review flow where possible.

The publish page should show a final version of the reviewed test, including:

- test title
- source document
- difficulty
- target role
- language
- passing score
- selected topics
- selected chunks count
- total generated questions
- approved questions
- rejected questions
- edited questions

If existing mock review data does not include everything, extend mock data lightly.

Do not create a new disconnected mock story if existing data can be reused.

### 4. Show final test summary

At the top of the page, show a clear summary:

- test title
- status: Ready to publish
- source document
- question count
- difficulty
- target role
- language
- passing score

This should feel like a final admin confirmation screen.

### 5. Add publish readiness check

Show a readiness card with explicit checks.

Example checks:

- Source document selected
- At least one approved question
- Passing score configured
- Topics selected
- Questions reviewed

Each check should show:

- label
- status: ready / needs attention
- short helper text

The test is publishable only if required checks pass.

Minimum required checks:

- source document exists
- test title exists
- at least one approved question exists
- passing score exists
- at least one topic exists

### 6. Show approved questions preview

Show only approved questions in the publish preview.

Each approved question item should show:

- question text
- topic
- difficulty
- tested skill
- pedagogical goal
- source chunk reference

Rejected questions should not be included in the published question list.

If helpful, show a small note:

```
Rejected questions will not be included in the published test.
```

### 7. Add publish actions

Add these actions:

- Publish Test
- Back to Review
- Save as Draft
- Cancel

Behavior:

- Publish Test changes local UI state to success state
- Back to Review navigates to `/tests/review?documentId=[id]`
- Save as Draft can show a lightweight local draft confirmation
- Cancel navigates to `/tests`

No database write.

### 8. Disable publish if not ready

If readiness checks fail:

- disable Publish Test
- show clear helper text explaining what is missing

Example:

```
Approve at least one question before publishing this test.
```

### 9. Add success state

After clicking Publish Test, show a success state:

```
Test published successfully
```

Success state should show:

- test title
- published status badge
- source document
- approved question count
- target role
- passing score
- next actions

### 10. Add next actions after success

After publish success, show:

- Open Test Detail
- Assign to Employees
- View All Tests

Behavior:

- Open Test Detail navigates to `/tests/[id]`
- Assign to Employees navigates to `/tests/[id]/assign`
- View All Tests navigates to `/tests`

Use an existing published mock test id where possible.

If the reviewed/generated test is not actually persisted, route to the closest matching existing published mock test and keep the copy honest enough for a frontend prototype.

### 11. Keep local state simple

Use local component state for:

- publish success
- draft saved confirmation
- readiness display if needed

Do not introduce global state.

Do not add Zustand, Redux, server actions, API routes, or persistence.

### 12. Keep mock data colocated

If new mock publish data is needed, place it under the tests feature, for example:

```
src/features/tests/mock/publish-test.ts
```

Prefer reusing existing generated review mock data.

## Design Requirements

Use current Ontera AI design system:

- Card
- Badge
- Button
- typography CSS classes
- responsive spacing tokens
- existing admin layout
- existing KPI/readiness card patterns if available

Suggested layout:

Desktop:

- Main area: final summary + approved questions preview
- Side panel: readiness checks + publish actions

Mobile:

- Summary
- Readiness checks
- Approved questions
- Actions

The page should feel like a final review/confirmation step, not like another editing screen.

## Do Not Implement

- no Supabase
- no database writes
- no real publish persistence
- no real auth
- no real AI generation
- no assignment logic
- no employee flow changes
- no complex draft management
- no backend routes
- no global state library

## Files Likely Involved

- `src/app/tests/publish/page.tsx`
- `src/features/tests/components/publish-test-page.tsx`
- `src/features/tests/components/publish-test-summary.tsx`
- `src/features/tests/components/publish-readiness-card.tsx`
- `src/features/tests/components/publish-approved-questions.tsx`
- `src/features/tests/components/publish-success-state.tsx`
- `src/features/tests/mock/publish-test.ts` (if needed)
- `context/progress-tracker.md`
- `context/history.md`

## Verification

- `/tests/publish` is no longer a placeholder
- `/tests/publish?documentId=[id]` works
- missing documentId still shows a valid demo state
- source document is resolved correctly
- final test summary renders
- readiness checks render
- publish button is disabled when required checks fail
- approved questions preview renders
- rejected questions are not shown as published questions
- Back to Review navigates correctly
- Cancel navigates to `/tests`
- Save as Draft shows a local confirmation
- Publish Test shows success state
- success actions navigate correctly
- no backend or real persistence is added
- `npm run lint` passes
- `npm run typecheck` passes
- `npm run format:check` passes
- `context/progress-tracker.md` is updated
- `context/history.md` is updated

---

Note: "Next planned step: Follow-up Question Flow" — this is already completed. This publish flow is the next logical step after the Test Review Flow.
