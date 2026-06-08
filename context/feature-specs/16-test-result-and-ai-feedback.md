# Feature Spec: Test Result and AI Feedback

## Goal

Replace the current `/employee/tests/[id]/result` placeholder with a real employee-facing result page using mock data.

The page should show the employee's score, pass/fail status, answer breakdown, weak topics, and mock AI feedback.

No backend, Supabase, real persistence, or real AI calls in this task.

## Current State

The project already has:

- `/employee/tests` page with assigned tests
- `/employee/tests/[id]/take` test-taking flow
- `/employee/tests/[id]/result` placeholder page
- mock employee test assignments and question data

This task should implement the real result page only.

## User Flow

Employee Test Taking Flow → Submit Test → Test Result Page → Review score and feedback → Review wrong answers → Return to My Tests

## Requirements

### 1. Replace Result placeholder route

Update:

```
src/app/employee/tests/[id]/result/page.tsx
```

The route should load mock result data for the selected assigned test.

If the test id does not exist, show a simple not-found state.

### 2. Create feature-local result UI

Create result components inside the employee tests feature area, for example:

```
src/features/employee/tests/components/test-result-page.tsx
src/features/employee/tests/components/test-result-summary.tsx
src/features/employee/tests/components/test-answer-review.tsx
src/features/employee/tests/components/test-ai-feedback.tsx
src/features/employee/tests/components/test-weak-topics.tsx
```

Use existing feature structure if there is already a better place.

### 3. Show result summary

At the top of the page, show:

- test title
- source document
- score
- passing score
- pass/fail status
- completed date
- total questions
- correct answers
- wrong answers
- time spent

Example:

```
You scored 78%. Passing score: 70%.
```

### 4. Add result KPI cards

Show small KPI cards:

- Score
- Correct answers
- Wrong answers
- Weak topics
- Time spent

Use explicit KPI data objects:

```
{
  label: "Score",
  value: "78%",
  icon: Target,
  tone: "success",
  status: "passed"
}
```

Do not use index-based icon mapping.

Do not calculate visual logic from display text.

### 5. Show mock AI feedback summary

Add a feedback section with:

- short performance summary
- what the employee understood well
- what needs improvement
- recommended next step

Example:

```
You understood the basic password policy well, but struggled with incident reporting scenarios. Review the Incident Reporting section before retaking this test.
```

This is mock feedback only. Do not call AI.

### 6. Show weak topics

Display weak topics based on mock incorrect answers.

Each weak topic should show:

- topic name
- missed questions count
- short explanation
- recommended review action

Example topics:

- Incident Reporting
- Data Protection
- Password Policy

### 7. Show answer review

Show all answered questions.

Each answer item should show:

- question text
- employee answer
- correct answer
- correct / incorrect status
- explanation
- topic
- source chunk reference

This helps the employee understand mistakes.

### 8. Add result state variants

Support at least two mock result states:

- passed
- failed

The UI should clearly communicate both states using explicit status/tone properties.

### 9. Add actions

Add primary and secondary actions:

- Back to My Tests
- Review Source Material
- Retake Test

Behavior:

- Back to My Tests navigates to `/employee/tests`
- Review Source Material navigates to the related document detail page if document id exists
- Retake Test navigates to `/employee/tests/[id]/take`

### 10. Keep mock data colocated

Use existing mock employee assignment and question data where possible.

If result data is missing, extend mock data inside the employee tests feature.

Mock result data should include:

- score
- passing score
- pass/fail status
- completed date
- time spent
- answer review
- weak topics
- mock AI feedback
- source document reference

## Design Requirements

Use current Ontera AI design system:

- Card
- Badge
- Button
- KPI card if available
- typography CSS classes
- responsive spacing tokens
- existing employee layout/navigation

The page should feel helpful and educational, not punitive.

Suggested layout:

Desktop:

- Main area: result summary, AI feedback, answer review
- Side panel: KPI cards, weak topics, actions

Mobile:

- Result summary
- KPI cards
- AI feedback
- Weak topics
- Answer review
- Actions

## Do Not Implement

- no real AI feedback generation
- no Supabase
- no database writes
- no real persistence
- no real retake logic
- no adaptive follow-up questions
- no admin analytics
- no complex charts
- no backend scoring service

## Files Likely Involved

- `src/app/employee/tests/[id]/result/page.tsx`
- `src/features/employee/tests/components/test-result-page.tsx`
- `src/features/employee/tests/components/test-result-summary.tsx`
- `src/features/employee/tests/components/test-answer-review.tsx`
- `src/features/employee/tests/components/test-ai-feedback.tsx`
- `src/features/employee/tests/components/test-weak-topics.tsx`
- `src/features/employee/tests/mock/` — extend mock result data
- `context/progress-tracker.md`

## Verification

- `/employee/tests/[id]/result` is no longer a placeholder
- invalid test id shows a not-found state
- result summary renders correctly
- pass/fail state renders clearly
- KPI cards render from explicit data objects
- AI feedback summary renders
- weak topics render
- answer review renders
- actions navigate correctly
- both passed and failed mock states can be represented
- no backend or AI logic is added
- `npm run lint` passes
- `npm run typecheck` passes
- `npm run format:check` passes
- `context/progress-tracker.md` is updated

---

Next planned step: **Follow-up Question Flow**.
