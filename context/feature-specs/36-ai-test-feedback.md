# Feature: AI Test Feedback

## Goal

Generate personalized AI feedback after an employee submits a test and persist it so the result page always shows the same grounded feedback instead of regenerated template text.

## User story

As an employee, after completing a test, I want to see AI-written feedback that references my specific mistakes and weak topics, so that I know exactly what to review next.

## Scope

### In scope

- Zod schema for AI feedback output
- Server-only generator (`generate-attempt-feedback.ts`)
- Integration in `submitEmployeeTestAttempt()` after scoring
- Persistence to `test_attempts.ai_feedback`
- Read fallback: stored feedback → `buildDynamicAiFeedback()` template
- "AI-generated" label in feedback UI

### Out of scope

- Follow-up questions
- Open-ended grading
- Dashboard or progress page rewrite
- Separate feedback API route

## UX/UI requirements

- Result page shows same feedback on reload (read from DB, not regenerated)
- Add small "AI-generated" caption next to "AI Feedback" heading
- No new props or component changes

## Data/API requirements

- Input: scored answers (question text, topic, isCorrect, employee answer, correct answer) + test metadata
- Output: Zod-validated JSON matching existing `ResultAiFeedback` shape
- Persist as JSON string envelope in `test_attempts.ai_feedback`

## Edge cases

- AI call fails → submit still succeeds, feedback falls back to template
- AI returns invalid output → Zod rejects, fallback to template
- All answers correct → feedback praises strengths, no fabricated weaknesses
- All answers wrong → feedback addresses specific topics, no generic "try again"
- Reload result page → identical feedback (persisted, not regenerated)

## Acceptance criteria

- WHEN employee submits a test, THEN `test_attempts.ai_feedback` is populated with validated JSON
- WHEN result page loads, THEN feedback references specific missed topics (not generic text)
- WHEN AI call fails, THEN submit still succeeds and feedback shows template fallback
- WHEN employee reloads result page, THEN the same feedback appears (read from DB)
- WHEN employee answers all correctly, THEN feedback acknowledges strengths without fabricating weaknesses
- THEN `npm run lint`, `typecheck`, `format:check`, `build` pass

## Constraints

- Reuse existing `buildDynamicAiFeedback()` as fallback
- Do not change submit API response shape
- Do not change result page component props
- AI model from env var, default `gpt-4.1-mini`
- Non-fatal: feedback failure must not break scoring or submission
