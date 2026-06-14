# Feature: Real Follow-up Questions and Block Retake

## Goal

Replace mock follow-up questions with AI-generated ones on the result page, and prevent employees from retaking already completed tests.

## User story

As an employee, when I answer a question incorrectly, I want to see an AI-generated follow-up about that topic to check my understanding. And when I've already completed a test, I should not be able to start a new attempt.

## Scope

### In scope

1. AI-generated follow-up question on incorrect answer click ("Check understanding")
2. Single choice, 4 options, generated at click time
3. Block retake for completed/failed assignments in `startEmployeeTestAttempt()`
4. Block retake in `getSupabaseEmployeeTakeableTest()` so completed tests don't show "Start Test"

### Out of scope

- Follow-up persistence (no `follow_up_questions` table writes)
- Multiple follow-ups per question
- Follow-up on correct answers
- In-test follow-ups

## UX/UI requirements

- Reuse existing `FollowUpQuestionCard` and `FollowUpAnswerFeedback` components
- Map AI output to existing `FollowUpQuestion` type (UI unchanged)
- Loading state while AI generates question
- Error state: "Could not generate question. Try again."
- Completed tests: "Start Test" → "View Results" (already works for mock, fix for Supabase)
- "Retake Test" button on result page → disabled with tooltip "Test already completed"

## Data/API requirements

- New helper: `generateFollowUpQuestion(questionText, topic, explanation)` → Zod-validated output
- Output shape matches existing `FollowUpQuestion` type
- Generate on click, not pre-loaded
- In `startEmployeeTestAttempt()`: check `assignment.status !== "completed" && assignment.status !== "failed"` → return null/error
- In `getSupabaseEmployeeTakeableTest()`: same check → return null

## Edge cases

- AI generation fails → show error + retry button
- All answers correct → no follow-ups shown
- Test completed → "Start Test" hidden, "View Results" shown
- Employee navigates to take URL directly → redirect or show not-found

## Acceptance criteria

- WHEN employee clicks "Check understanding" on incorrect answer, THEN AI generates a single-choice follow-up question
- WHEN employee submits follow-up answer, THEN feedback shows correct/incorrect
- WHEN AI generation fails, THEN error message with retry button
- WHEN employee completed a test, THEN "Start Test" is not shown on employee tests page
- WHEN employee completed a test and navigates to `/take`, THEN attempt is not created (blocked)
- WHEN employee opens result page for completed test, THEN "Retake Test" is disabled or leads to result
- THEN `npm run lint`, `typecheck`, `format:check`, `build` pass

## Constraints

- Reuse existing `FollowUpQuestionCard` UI
- Reuse existing `@ai-sdk/openai` + Zod pattern from Spec 36
- Model from env var, default `gpt-4.1-mini`
- Block retake in TWO places: `startEmployeeTestAttempt()` + `getSupabaseEmployeeTakeableTest()`
- Do not change assignment status after completion
