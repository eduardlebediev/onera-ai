# Feature Spec 25: Save Reviewed Generated Test to Supabase

## Goal

Persist the reviewed AI-generated test draft from the review page into Supabase.

This task completes the first real backend-backed test creation flow:

```
Document
→ Chunks
→ Embeddings
→ pgvector retrieval
→ AI-generated draft
→ Admin review
→ Save to Supabase
→ Real test detail page
```

This task should save reviewed generated tests into:

- `tests`
- `test_questions`

Do not implement employee attempt/result persistence in this task.
Do not implement assignment persistence in this task unless the existing assign page requires only a tiny compatibility fix.

## Context

Feature Spec 21 completed Supabase backend foundation.

Feature Spec 22 completed embeddings for demo document chunks.

Feature Spec 23 added: `POST /api/admin/generate-test`.

Feature Spec 24 connected:

- `/admin/documents/[id]/generate-test`
- → `POST /api/admin/generate-test`
- → `sessionStorage["ontera.generatedTestDraft"]`
- → `/admin/tests/review`

Now the review page displays AI-generated draft questions, but the generated test is still temporary.

Current database tables include: `tests`, `test_questions`, `documents`, `document_chunks`, `ai_generation_runs`.

Current env variables:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SECRET_KEY=
OPENAI_API_KEY=
```

`SUPABASE_SECRET_KEY` is server-only and must never be exposed to client code.

## Required Behavior

The user flow should be:

1. Admin generates AI draft
2. Admin lands on `/admin/tests/review`
3. Admin reviews questions
4. Admin approves/rejects/edits using existing review UI behavior
5. Admin clicks Publish / Save / Continue
6. Frontend calls server API
7. API saves test row into `tests`
8. API saves question rows into `test_questions`
9. API updates `ai_generation_runs.test_id` if `generationRunId` exists
10. API returns saved test id
11. Frontend redirects to `/admin/tests/[savedTestId]`

The saved test should be visible from a real test detail page or a minimal real-test detail fallback.

## Important Rules

- Use `tests`, not `quizzes`.
- Do not create `quiz_*` tables.
- Do not expose `SUPABASE_SECRET_KEY` to the browser.
- Do not import `src/lib/supabase/admin.ts` into Client Components.
- Use server API route for persistence.
- Keep mock fallback working.
- Do not rewrite the whole review flow.
- Do not remove sessionStorage handoff yet.
- Do not implement full auth UI.
- Do not implement public registration.
- Do not implement employee attempt/result persistence.
- Do not implement real PDF upload or parsing.
- Do not add Prisma.
- Do not add broad public RLS policies.

## Files to Inspect First

Inspect existing files before editing:

- `src/app/(admin)/admin/tests/review/page.tsx`
- `src/features/tests/components/test-review-page.tsx`
- `src/features/tests/components/review-question-detail.tsx`
- `src/features/tests/lib/review-session.ts`
- `src/features/tests/lib/generated-test-session.ts`
- `src/features/tests/lib/generated-test-mapper.ts`
- `src/features/tests/types/generated-test.ts`
- `src/app/(admin)/admin/tests/[id]/page.tsx`
- `src/features/tests/mock/`
- `src/lib/supabase/admin.ts`
- `context/progress-tracker.md`
- `context/history.md`
- `context/decisions.md`

Find the current publish/approve action in the review flow and connect that action to the new persistence API.

## Files to Add or Update

### Create

- `src/app/api/admin/tests/publish-generated/route.ts`
- `src/features/tests/lib/publish-generated-test-api-client.ts`
- `src/features/tests/schemas/publish-generated-test-schema.ts`
- `context/feature-specs/25-save-reviewed-generated-test-to-supabase.md`

### Optional, only if needed

- `src/features/tests/lib/saved-test-mapper.ts`
- `src/features/tests/lib/supabase-test-detail.ts`

### Update

- `src/features/tests/components/test-review-page.tsx`
- `src/app/(admin)/admin/tests/review/page.tsx`
- `src/app/(admin)/admin/tests/[id]/page.tsx`
- `context/progress-tracker.md`
- `context/history.md`
- `context/decisions.md`

## API Route

Create `POST /api/admin/tests/publish-generated` at `src/app/api/admin/tests/publish-generated/route.ts`.

The route must:

- run server-side only
- use `src/lib/supabase/admin.ts`
- validate request body with Zod
- insert into `tests`
- insert into `test_questions`
- update `ai_generation_runs.test_id` when possible
- return saved test id

### Request Body

The API should accept:

```json
{
  "generationRunId": "uuid (optional)",
  "documentId": "uuid",
  "title": "string",
  "description": "string (optional)",
  "difficulty": "easy | medium | hard",
  "language": "en | de",
  "targetRole": "string (optional)",
  "passingScore": 70,
  "questions": [
    {
      "questionText": "string",
      "questionType": "single_choice | multiple_choice | true_false",
      "options": [{ "id": "string", "text": "string" }],
      "correctAnswer": { "optionIds": ["string"] },
      "explanation": "string",
      "topic": "string (optional)",
      "difficulty": "easy | medium | hard (optional)",
      "sourceChunkId": "uuid (optional)",
      "sourceChunkTitle": "string (optional)",
      "orderIndex": 0,
      "reviewStatus": "approved | rejected | needs_edit (optional)"
    }
  ]
}
```

### Validation Rules

Use Zod.

- `documentId` must be UUID.
- `generationRunId`, if provided, must be UUID.
- `title` required, min length 3.
- `difficulty` must be `easy`, `medium`, or `hard`.
- `language` must be `en` or `de`.
- `passingScore` min 0, max 100.
- Questions must contain at least 1 approved question.
- Rejected questions should not be saved.
- `questionText` required.
- Options must match question type:
  - `single_choice`: exactly 4 options
  - `multiple_choice`: 4 options
  - `true_false`: exactly 2 options
- `correctAnswer.optionIds` must reference existing option ids.
- `single_choice` and `true_false` must have exactly one correct option id.
- `multiple_choice` must have at least one correct option id.
- `orderIndex` should be normalized before insert.

Invalid input should return `400 Bad Request` with a safe, useful error response.

### Server Persistence Logic

**Step 1: Fetch document**

Fetch selected document by `documentId`. Required fields: `id`, `organization_id`, `title`. If not found: `404 Document not found`.

**Step 2: Filter approved questions**

Only persist questions that are not rejected. Treat missing `reviewStatus` as approved unless existing review logic already uses a different convention.

```ts
const approvedQuestions = questions.filter((question) => question.reviewStatus !== "rejected")
```

If `approvedQuestions.length === 0`, return `400`.

**Step 3: Insert test**

Insert into `tests`:

```json
{
  "organization_id": "document.organization_id",
  "source_document_id": "document.id",
  "title": "string",
  "description": "string",
  "status": "published",
  "difficulty": "string",
  "language": "string",
  "target_role": "string | null",
  "question_count": "approvedQuestions.length",
  "passing_score": 70,
  "created_by": null,
  "published_at": "ISO string"
}
```

Return inserted row `id`.

**Step 4: Insert test questions**

Insert into `test_questions`:

```json
{
  "organization_id": "document.organization_id",
  "test_id": "savedTest.id",
  "source_chunk_id": "sourceChunkId | null",
  "question_text": "string",
  "question_type": "string",
  "options": "JSON array",
  "correct_answer": "JSON object",
  "explanation": "string",
  "topic": "string",
  "difficulty": "string",
  "order_index": 0
}
```

Normalize `order_index` sequentially after filtering rejected questions: `0, 1, 2, 3...`.

**Step 5: Update generation run**

If `generationRunId` exists, update `ai_generation_runs`:

```json
{
  "test_id": "savedTest.id",
  "output_summary": {
    "...existingOutputSummary": "...",
    "saved_test_id": "savedTest.id",
    "saved_question_count": "approvedQuestions.length",
    "published_at": "now"
  }
}
```

Do not fail the whole request if this update fails after the test and questions were inserted. Log warning server-side.

### Transaction Requirement

Prefer atomic save. For speed in this demo phase, a server route with sequential inserts is acceptable if it has clear error handling.

Recommended approach for this task: use server route with sequential inserts. Add `TODO: replace with DB transaction/RPC before production.`

### Response Body

On success:

```json
{
  "testId": "uuid",
  "questionCount": 5,
  "redirectTo": "/admin/tests/uuid"
}
```

## API Client Helper

Create `src/features/tests/lib/publish-generated-test-api-client.ts`.

Export:

```ts
publishGeneratedTest(input)
```

Behavior:

- calls `POST /api/admin/tests/publish-generated`
- sends JSON
- handles non-200 responses
- returns parsed response
- throws user-friendly errors

Do not include API keys.

## Review Page Integration

Update review page / review component so the existing publish action can persist AI-generated drafts.

Behavior:

- If current review data came from AI generated session draft:
  - Publish button calls `publishGeneratedTest(...)`
  - Shows loading state
  - On success: clears `ontera.generatedTestDraft` if appropriate, navigates to `/admin/tests/{testId}`
- If current review data is mock fallback:
  - Keep existing mock publish behavior

Do not break the existing mock fallback route.

## UI Loading and Error States

When saving:

- disable publish button
- show text: `Saving generated test...`

On error:

- `Could not save the generated test. Please review the questions and try again.`

Do not expose raw server stack traces.

## Saved Test Detail Page

After saving, redirect to `/admin/tests/{testId}`.

The existing test detail page probably expects mock ids. Update it minimally so it can handle UUID test ids saved in Supabase.

Required behavior:

- If id matches existing mock test: render existing mock detail
- Else: try to fetch saved test from Supabase through server-side helper/API, render minimal saved test detail

Minimal saved test detail should show:

- title
- description
- status
- difficulty
- language
- passing score
- question count
- source document title if available
- list of saved questions with options/explanation/source topic

This does not need to be beautiful. It must be demo-stable.

### Data Fetching for Saved Test Detail

Use server-side Supabase access. Options:

1. Server component using admin client.
2. API route plus client fetch.

Preferred for speed: Server component / server-side helper using admin client.

Do not expose secret keys. If using admin client in server page/helper, ensure `import "server-only"` is only in server modules.

## Session Storage Cleanup

After successful save, remove `sessionStorage["ontera.generatedTestDraft"]`. Only clear it after successful response. Do not clear it on failed save.

## ai_generation_runs Verification

After saving, Supabase should show:

```sql
select id, status, test_id, output_summary
from public.ai_generation_runs
order by created_at desc
limit 5;
```

Expected: latest completed run has `test_id`, `output_summary.saved_test_id` exists.

## Error Handling

Return safe status codes:

- `400` — invalid request body / no approved questions
- `404` — document not found
- `422` — invalid source chunk / invalid review state
- `500` — unexpected persistence error

Do not return secret values. Do not expose raw SQL errors directly to the client.

## Security Requirements

- `SUPABASE_SECRET_KEY` only server-side.
- No direct Supabase writes from browser client for this task.
- Do not create broad RLS policies.
- Do not trust client-provided `organization_id`. Derive `organization_id` from the selected document.
- Do not trust client-provided `test_id`.
- Do not trust client-provided `created_by`.
- Do not use `user_metadata` for authorization.
- Add `TODO` that real production version must verify authenticated admin membership.

## Out of Scope

Do not implement: employee attempt persistence, employee result persistence, assignments persistence, real auth UI, invite flow, PDF upload, PDF parsing, teams, advanced analytics, full RLS policy rollout.

## Manual Test

1. Start dev server: `npm run dev`
2. Generate AI draft: `/admin/documents/c0000000-0000-4000-8000-000000000001/generate-test`
3. Continue to review page.
4. Approve at least 3 questions.
5. Click Publish / Save.

Expected:

- button shows saving/loading
- API calls `/api/admin/tests/publish-generated`
- Supabase inserts one row into `tests`
- Supabase inserts approved rows into `test_questions`
- `ai_generation_runs.test_id` is updated
- browser redirects to `/admin/tests/{uuid}`
- saved test detail page renders saved test data

Also test with support document: `/admin/documents/c0000000-0000-4000-8000-000000000002/generate-test`. Expected saved questions should be support-related.

## Supabase Verification Queries

```sql
select id, title, status, source_document_id, question_count, published_at
from public.tests
order by created_at desc
limit 5;
-- Expected: latest generated test has status = published, question_count equals approved question count

select test_id, count(*)
from public.test_questions
group by test_id
order by count(*) desc;
-- Expected: saved test has matching question count

select id, test_id, status, output_summary
from public.ai_generation_runs
order by created_at desc
limit 5;
-- Expected: latest run has test_id populated
```

## Validation

Run:

```bash
npm run lint
npm run typecheck
npm run format:check
npm run build
```

Manual browser test:

- Security Guidelines AI generation → Review → Save → Saved detail page
- Customer Support AI generation → Review → Save → Saved detail page
- Mock fallback review flow still works

## Context Updates

Create this file (`context/feature-specs/25-save-reviewed-generated-test-to-supabase.md`).

Update:

- `context/progress-tracker.md`
- `context/history.md`
- `context/decisions.md`

Add decision:

```
## 033 — Reviewed AI drafts persist as published tests

Reviewed AI-generated drafts are persisted only after admin review. The save flow writes one row to `tests` and approved questions to `test_questions`, derives `organization_id` from the source document, updates `ai_generation_runs.test_id`, and redirects to the saved test detail page. Employee attempts/results remain out of scope for the demo slice.
```

Update progress:

Completed:

- Save Reviewed Generated Test to Supabase

Next Up:

- Presentation Demo Polish
- Optional: Persist Test Assignments

## Acceptance Criteria

- `POST /api/admin/tests/publish-generated` exists.
- Request body is validated with Zod.
- API derives `organization_id` from `documents`.
- API inserts one row into `tests`.
- API inserts approved rows into `test_questions`.
- Rejected questions are not saved.
- API updates `ai_generation_runs.test_id` when `generationRunId` exists.
- Review page publish action calls the real API for AI drafts.
- Publish button has loading/error states.
- Successful save redirects to `/admin/tests/{uuid}`.
- Saved test detail page can render UUID-backed Supabase test data.
- Mock fallback review/publish flow still works.
- No API keys are exposed to client code.
- No employee attempt/result persistence is implemented.
- `lint`, `typecheck`, `format:check`, and `build` pass.

## Next Step

Presentation Demo Polish
