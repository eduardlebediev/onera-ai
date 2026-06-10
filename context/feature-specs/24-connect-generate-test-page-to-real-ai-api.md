# Feature Spec 24: Connect Generate Test Page to Real AI API

## Goal

Connect the existing admin generate-test page to the real AI generation API from Feature Spec 23.

This task turns the current mock generate-test flow into a real backend-backed demo flow:

```
Admin opens document
→ Configure test generation
→ Call real AI Generate Test API
→ Retrieve embedded chunks through pgvector
→ Generate structured draft questions
→ Show generated draft in review UI
```

Do not implement final publish persistence in this task.
Do not save generated questions to `tests` / `test_questions` yet.
Do not implement employee attempt persistence in this task.

## Context

Feature Spec 21 completed Supabase backend foundation.

Feature Spec 22 completed demo embeddings:

- Demo chunks are embedded with OpenAI `text-embedding-3-small`
- `match_document_chunks` works
- Retrieval verification passes

Feature Spec 23 added:

- `POST /api/admin/generate-test`

The API returns a generated draft test JSON.

Now the frontend page should call this API instead of relying only on static mock data.

Existing route: `/admin/documents/[id]/generate-test`

Likely file location: `src/app/(admin)/admin/documents/[id]/generate-test/page.tsx`

Use the actual existing file path if different.

## Important Rules

- Keep existing mock frontend working.
- Do not remove mock fallback data yet.
- Do not rewrite the whole page.
- Do not change route structure.
- Do not implement auth UI.
- Do not implement publish persistence.
- Do not save to Supabase tables in this task.
- Do not call OpenAI directly from the client.
- The browser must call only the internal API route: `POST /api/admin/generate-test`.
- API keys must never be exposed to client code.
- Existing navigation after generation should still work.
- Generated content must be treated as draft/review content, not automatically published.

## Files to Inspect First

Inspect the existing implementation before editing:

- `src/app/(admin)/admin/documents/[id]/generate-test/page.tsx`
- `src/features/tests/`
- `src/features/documents/`
- `src/lib/`
- `context/history.md`
- `context/decisions.md`
- `context/progress-tracker.md`

Find where the current generate-test page stores review data. Look for existing use of: `sessionStorage`, `getMockTestReviewData`, `publish/review route helpers`, `test review model`. Reuse existing UI and data shape where possible.

## Files to Add or Update

### Update existing generate page and supporting feature files

Likely updates:

- `src/app/(admin)/admin/documents/[id]/generate-test/page.tsx`
- `src/features/tests/lib/generated-test-api-client.ts`
- `src/features/tests/lib/generated-test-mapper.ts`
- `src/features/tests/types/generated-test.ts`

### Create only if useful

- `src/features/tests/lib/generated-test-session.ts`

### Update context

- `context/feature-specs/24-connect-generate-test-page-to-real-ai-api.md`
- `context/progress-tracker.md`
- `context/history.md`
- `context/decisions.md`

## User Flow

The user flow should be:

1. Admin opens `/admin/documents/[id]/generate-test`
2. Admin chooses generation settings
3. Admin clicks Generate
4. UI shows loading state
5. Frontend calls `POST /api/admin/generate-test`
6. API returns generated draft
7. Frontend maps generated draft to existing review-page-compatible shape
8. Draft is stored temporarily for review route
9. User is navigated to `/admin/tests/review`
10. Review page shows AI-generated questions

If the existing review route cannot consume dynamic draft data yet, update it minimally so it can read generated draft from session storage while keeping mock fallback.

## Request Mapping

The generate-test page should send:

```json
{
  "documentId": "string",
  "questionCount": 5,
  "difficulty": "easy | medium | hard",
  "language": "en | de",
  "targetRole": "string"
}
```

Map existing UI controls to these fields. If the UI uses labels such as "Number of questions", "Difficulty", "Language", "Target audience / role" — map them directly. If some field does not exist in the current UI, use sensible defaults:

- `questionCount: 5`
- `difficulty: "medium"`
- `language: "en"`
- `targetRole: "General employee"`

## API Client Helper

Create `src/features/tests/lib/generated-test-api-client.ts`.

It should export:

```ts
generateTestFromDocument(input)
```

Behavior:

- calls `fetch("/api/admin/generate-test", { method: "POST" })`
- sends JSON body
- handles non-200 responses
- returns parsed JSON
- throws user-friendly errors

Do not put API keys here.

## Loading State

When generation is running:

- disable Generate button
- show clear loading text
- optionally show progress copy such as: "Retrieving document chunks..." / "Generating draft questions..."

Since the API is one request, fake multi-step progress is optional. Keep it simple. Required: "Generating test draft..."

## Error State

If API fails, show a visible error message. Handle these cases:

- `400` — invalid form values
- `404` — document not found
- `422` — missing embeddings / insufficient context / invalid AI output
- `500` — AI or server error

Do not expose raw stack traces. Suggested UI text:

> Could not generate the test draft. Please check that this document has embedded chunks and try again.

Keep existing mock fallback available only as a fallback/demo recovery option.

## Draft Mapping

The API returns:

```json
{
  "generationRunId": "uuid",
  "document": {
    "id": "uuid",
    "title": "string"
  },
  "draft": {
    "title": "string",
    "description": "string",
    "difficulty": "easy | medium | hard",
    "language": "en | de",
    "targetRole": "string",
    "passingScore": 70,
    "questions": [
      {
        "questionText": "string",
        "questionType": "single_choice | multiple_choice | true_false",
        "options": [{ "id": "string", "text": "string" }],
        "correctAnswer": { "optionIds": ["string"] },
        "explanation": "string",
        "topic": "string",
        "difficulty": "easy | medium | hard",
        "sourceChunkId": "string",
        "sourceChunkTitle": "string"
      }
    ]
  },
  "retrievedChunks": [
    {
      "id": "uuid",
      "title": "string | null",
      "topic": "string | null",
      "similarity": 0.0
    }
  ]
}
```

Map this response to the existing review page data shape. The review page should display: generated test title, description, difficulty, language, target role, generated questions, options, correct answers, explanations, and topic/source information if the UI supports it.

If source display does not exist yet, add a small non-invasive source label: `Source: {sourceChunkTitle}`.

Do not redesign the whole review page.

## Temporary Storage

Because publish persistence is not implemented yet, store the generated draft temporarily. Use the existing mechanism if already present. Preferred for this task: `sessionStorage`.

Store under a clear key: `ontera.generatedTestDraft`.

Include:

```json
{
  "generationRunId": "uuid",
  "document": { "id": "uuid", "title": "string" },
  "draft": { ... },
  "retrievedChunks": [...],
  "createdAt": "ISO string"
}
```

The review page should:

1. Try to read `ontera.generatedTestDraft`
2. Validate/parse enough to avoid runtime crashes
3. Use it if present
4. Fall back to mock review data if absent

Do not add global state libraries. Do not add database persistence in this task.

## Review Page Integration

Inspect existing review page at `/admin/tests/review`. Likely file: `src/app/(admin)/admin/tests/review/page.tsx`.

Update minimally so it can consume generated draft from session storage.

Rules:

- Keep static mock fallback.
- Do not break existing route.
- Do not require Supabase read from review page.
- Do not save to database.
- Do not change publish route yet unless needed for session continuity.

## Navigation

After successful generation, navigate to `/admin/tests/review`. If current flow uses query params, preserve or extend them carefully. Optional query params: `?source=ai&documentId={documentId}&runId={generationRunId}`.

Do not rely only on query params for full draft content.

## UX Requirements

The page should make it clear that AI content is a draft. Add or reuse copy like:

> AI-generated draft. Review before publishing.

The review page should not imply the test is already published.

## Security Requirements

- No API keys in client code.
- Client calls internal API only.
- Do not import `src/lib/supabase/admin.ts` into client code.
- Do not expose full retrieved chunk content in browser unless already returned by API and needed.
- Do not expose `SUPABASE_SECRET_KEY`.
- Do not create new public RLS policies.
- Do not implement auth bypasses.

## Out of Scope

Do not implement: saving generated draft to `tests`, saving generated questions to `test_questions`, publish persistence, assignments persistence, employee attempt persistence, auth UI, invite flow, PDF upload, PDF parsing, teams, advanced analytics.

This task only connects the frontend generate page to the existing AI API and passes the generated draft to the review page.

## Manual Test

Start dev server:

```bash
npm run dev
```

Open: `/admin/documents/c0000000-0000-4000-8000-000000000001/generate-test`

Generate a test with: `questionCount: 5`, `difficulty: medium`, `language: en`, `targetRole: General employee`.

Expected:

- Generate button enters loading state
- API request is sent to `/api/admin/generate-test`
- User is redirected to `/admin/tests/review`
- Review page shows AI-generated questions about Security Guidelines
- Source labels reference relevant chunks such as authentication, phishing, data handling, remote access, or access control

Also test: `/admin/documents/c0000000-0000-4000-8000-000000000002/generate-test` — expected questions about P0/P1 escalation, first response, escalation paths, post-incident follow-up, sensitive customer data.

### Failure Test

Temporarily send an invalid document id or disconnect API route. Expected:

- UI shows user-friendly error
- No crash
- User remains on generate page
- Mock fallback remains available only if current app already supports it

## Validation

Run:

```bash
npm run lint
npm run typecheck
npm run format:check
npm run build
```

Manual browser test both demo documents. Check browser console:

- No hydration errors
- No uncaught runtime errors
- No API keys visible

## Context Updates

Create this file (`context/feature-specs/24-connect-generate-test-page-to-real-ai-api.md`).

Update:

- `context/progress-tracker.md`
- `context/history.md`
- `context/decisions.md`

Add decision:

```
## 032 — Generate Test page uses real AI API with temporary draft handoff

The admin generate-test page now calls `POST /api/admin/generate-test` to create a real AI-generated draft from retrieved document chunks. The generated draft is stored temporarily in `sessionStorage` and consumed by the review page. Generated tests are still not persisted to `tests` / `test_questions`; admin review remains required before publishing.
```

Update progress:

Completed:

- Connect Generate Test Page to Real AI API

Next Up:

- Save Reviewed Generated Test to Supabase
- Presentation Demo Polish

## Acceptance Criteria

- Generate Test page calls `POST /api/admin/generate-test`.
- Generate button has loading and disabled states.
- API errors are shown in the UI.
- Successful generation navigates to `/admin/tests/review`.
- Review page can display generated AI draft from temporary storage.
- Mock fallback remains available.
- No generated test is saved to Supabase yet.
- No API keys are exposed to client code.
- No auth UI is implemented.
- No publish persistence is implemented.
- Existing mock frontend still works.
- `lint`, `typecheck`, `format:check`, and `build` pass.

## Next Step

Feature Spec 25: Save Reviewed Generated Test to Supabase
