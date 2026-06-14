# Feature: Review Editor Enhancements

## Goal

Allow admin to add/delete/regenerate questions in the review editor and support open-ended question type.

## User story

As an admin reviewing an AI-generated test draft, I want to add a manual question, delete a bad one, regenerate a single AI question, and support open-ended questions so that I have full control over the final test.

## Scope

### In scope

1. "Add question" button in review editor → manual question form (type, options, correct answer, explanation, topic)
2. "Delete" button per question → removes from draft
3. "Regenerate" button per AI question → re-runs AI generation for that single question
4. `open_question` type support: generation, textarea input, AI grading
5. `review_status` column on `test_questions` to persist review state

### Out of scope

- Bulk regenerate
- Reorder questions in review
- Edit-after-publish (covered by lifecycle spec)

## UX/UI requirements

- "Add question" at bottom of review question list → expands inline form
- Delete shows confirmation tooltip
- Regenerate shows loading spinner, replaces question in-place
- Open questions render textarea in take flow, text in result
- Reuse existing edit form components from `review-question-detail.tsx`

## Data/API requirements

- `PATCH /api/admin/tests/[id]/questions` — upsert/delete `test_questions`
- `POST /api/admin/tests/[id]/questions/[questionId]/regenerate` — single question generation via AI
- Open question grading via AI inside submit flow (non-fatal fallback to incorrect)
- Migration: `review_status` on `test_questions`
- Add `open_question` to `QuestionTypeSchema`

## Edge cases

- Add question with no correct option → blocked client+server
- Delete last approved question → publish blocked
- Regenerate on manual question → not allowed (only AI questions)
- AI grading fails → mark as incorrect with "needs manual review" note

## Acceptance criteria

- WHEN admin clicks "Add question" and fills form, THEN new question appears in review list
- WHEN admin clicks "Delete", THEN question is removed from draft
- WHEN admin clicks "Regenerate" on AI question, THEN new AI version replaces it
- WHEN admin generates test with open questions, THEN open questions appear in review
- WHEN employee answers open question, THEN AI grades it and stores result
- THEN `npm run lint`, `typecheck`, `format:check`, `build` pass

## Constraints

- Reuse existing review UI components
- Regenerate only for AI questions (not manual)
- Open question AI grading: non-fatal, fallback to incorrect
- `review_status` migration must be idempotent
