# Feature Spec: Employee Test Taking Flow

## Goal

Replace the current `/employee/tests/[id]/take` placeholder with a real clickable employee test-taking flow using mock data and local state.

This flow should let an employee start or continue an assigned test, answer questions step by step, see progress, and submit the test.

No backend, Supabase, real persistence, or real AI logic in this task.

## Current State

The project already has:

- `/employee/tests` page with assigned tests
- `/employee/tests/[id]/take` placeholder page
- `/employee/tests/[id]/result` placeholder page
- mock employee test assignments

This task should implement the real take page only.

## User Flow

Employee My Tests → Click Start Test / Continue → Test Taking Screen → Answer questions → Review progress → Submit Test → Navigate to Result placeholder

## Requirements

### 1. Replace Test Taking placeholder route

Update:

```
src/app/employee/tests/[id]/take/page.tsx
```

The route should load the selected assigned test from existing employee mock data.

If the test id does not exist, show a simple not-found state.

### 2. Create feature-local test-taking UI

Create test-taking components inside the employee tests feature area, for example:

```
src/features/employee/tests/components/test-taking-page.tsx
src/features/employee/tests/components/test-question-card.tsx
src/features/employee/tests/components/test-progress-panel.tsx
```

Use the existing feature structure if there is already a better place.

### 3. Show test context

The page should show:

- test title
- source document
- difficulty
- question count
- deadline
- estimated time
- current question number
- assignment status

Example:

```
Question 3 of 8
```

### 4. Show one question at a time

Render one question per step.

Each question should show:

- question text
- answer options
- topic
- question type
- optional source/topic hint if useful

Support at least:

- single choice
- true / false

If mock data already includes multiple choice, it can be displayed, but do not overcomplicate the logic.

### 5. Add answer selection

Employee should be able to:

- select an answer
- change selected answer before moving forward
- see which answer is currently selected

Use local state only.

Do not show correct answer during the test.

### 6. Add navigation controls

Add:

- Previous
- Next
- Submit Test

Behavior:

- Previous moves to the previous question
- Next moves to the next question
- Next should be disabled or visually discouraged until an answer is selected
- Submit Test appears on the final question
- Submit Test navigates to: `/employee/tests/[id]/result`

### 7. Add progress overview

Show test progress:

- answered questions count
- unanswered questions count
- current question
- completion percentage

This can be:

- progress bar
- step indicators
- right-side summary panel

Keep it simple and clean.

### 8. Add question navigator

Add a compact question navigator so the employee can see which questions are answered.

Example:

```
1 2 3 4 5
```

States:

- current
- answered
- unanswered

Clicking a question number may navigate to that question if simple to implement.

### 9. Add submit confirmation for incomplete tests

If the employee tries to submit while some questions are unanswered, show a lightweight confirmation or warning state.

No complex modal is required unless already available.

The warning should clearly show:

- answered count
- unanswered count

### 10. Add simple local score preparation

On submit, calculate a simple local score from selected answers if the mock data includes correct answers.

This score does not need to persist.

For now, navigation to the result page can happen without passing complex state.

The real result page will be implemented in the next spec.

### 11. Keep mock data colocated

Use existing mock employee assignments where possible.

If question data is missing, extend mock data in the employee tests feature.

Mock question data should include:

- id
- question text
- type
- options
- correct answer
- topic
- source document reference if available

## Design Requirements

Use current Ontera AI design system:

- Card
- Badge
- Button
- progress indicator if available
- typography CSS classes
- responsive spacing tokens
- existing employee layout/navigation

The screen should feel focused and calm.

It should not look like an admin dashboard.

Suggested layout:

Desktop:

- Main area: current question
- Side panel: progress, deadline, question navigator

Mobile:

- Test context
- Current question
- Progress
- Navigation controls

## Do Not Implement

- no real backend persistence
- no Supabase
- no real auth
- no real AI feedback
- no adaptive follow-up questions
- no result page implementation
- no complex timer logic
- no anti-cheating logic
- no admin review logic
- no database writes

## Files Likely Involved

- `src/app/employee/tests/[id]/take/page.tsx`
- `src/features/employee/tests/components/test-taking-page.tsx`
- `src/features/employee/tests/components/test-question-card.tsx`
- `src/features/employee/tests/components/test-progress-panel.tsx`
- `src/features/employee/tests/mock/` — extend mock data if needed
- `context/progress-tracker.md`

## Verification

- `/employee/tests/[id]/take` is no longer a placeholder
- invalid test id shows a not-found state
- assigned test data renders correctly
- one question is shown at a time
- answer selection works
- selected answer can be changed
- previous and next navigation work
- progress updates correctly
- question navigator shows answered/current/unanswered states
- submit action appears on the final question
- incomplete submit warning works if applicable
- submit navigates to `/employee/tests/[id]/result`
- no backend or real persistence is added
- `npm run lint` passes
- `npm run typecheck` passes
- `npm run format:check` passes
- `context/progress-tracker.md` is updated

---

Next planned step: **Test Result and AI Feedback**.
