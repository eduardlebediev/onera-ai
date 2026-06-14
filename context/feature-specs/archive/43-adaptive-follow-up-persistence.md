# Feature: Adaptive Follow-up Persistence

## Goal

Persist AI-generated follow-up questions and employee answers in dedicated database tables so follow-up state survives page reload and can be tracked historically.

## User story

As an employee, when I answer a follow-up question, I want my answer to be saved so that if I reload the result page, I still see my follow-up result and don't have to answer again.

## Scope

### In scope

1. Create `follow_up_questions` and `follow_up_answers` tables
2. RLS policies for org-scoped access
3. `POST /api/employee/tests/[id]/follow-up` — generate + persist follow-up
4. `POST /api/employee/tests/[id]/follow-up/[followUpId]/answer` — submit + persist answer
5. Update result page loader to hydrate persisted follow-ups
6. Update `FollowUpQuestionCard` to call real API instead of local mock

### Out of scope

- Multiple follow-ups per question
- Admin review UI for follow-ups
- Dashboard integration

## UX/UI requirements

- Same "Check understanding" button on incorrect answers (existing)
- Follow-up card uses real API for generation and submission
- Loading state while AI generates
- Error state with retry button
- Reload preserves follow-up state

## Data/API requirements

- New tables: `follow_up_questions` (org_id, attempt_id, question_text, options, correct_answer, topic) and `follow_up_answers` (org_id, follow_up_question_id, user_answer, is_correct)
- Generate route: AI call (Zod validated) → persist → return without correct answer
- Answer route: validate → persist → return correctness + explanation
- Result loader: join follow-up data into result response

## Edge cases

- AI generation fails → error with retry, no partial persist
- Generate for already-existing follow-up → return existing (no duplicate)
- Answer already submitted → return stored result (no re-submit)
- Wrong answer → follow-up shows correct answer + explanation
- Correct answer → marked as understood

## Acceptance criteria

- WHEN employee clicks "Check understanding", THEN follow-up is persisted to DB
- WHEN employee submits answer, THEN result is persisted
- WHEN employee reloads result page, THEN follow-up state is restored
- WHEN AI generation fails, THEN retry button appears
- WHEN follow-up already exists, THEN generation is skipped (uses existing)
- THEN `npm run lint`, `typecheck`, `format:check`, `build` pass

## Constraints

- Reuse existing `FollowUpQuestionCard` and `FollowUpAnswerFeedback` components
- Reuse `@ai-sdk/openai` + Zod pattern from Spec 36
- Strip correct answer from generate response (like take flow strips from questions)
- Migration must be idempotent
