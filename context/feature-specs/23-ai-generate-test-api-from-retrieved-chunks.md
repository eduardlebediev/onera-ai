# Feature Spec 23: AI Generate Test API from Retrieved Document Chunks

## Goal

Add a backend API endpoint that generates a draft employee knowledge test from retrieved document chunks.

This task proves the main AI value of Ontera AI:

```
Document
→ Chunks
→ Embeddings
→ pgvector retrieval
→ AI-generated structured test draft
```

The API must generate questions from retrieved internal document chunks, not from unguided prompting.

Do not connect the frontend in this task.
Do not save generated tests to tests / test_questions in this task.
Do not implement publish persistence in this task.

## Context

Feature Spec 21 completed the Supabase backend foundation.

Feature Spec 22 completed demo chunk embeddings:

- `document_chunks.embedding` is filled using OpenAI `text-embedding-3-small`
- `match_document_chunks` RPC works
- phishing query returns Phishing Response
- P1 incident query returns Severity Levels / Incident Triage

Now the next step is to use retrieved chunks as grounded context for AI test generation.

Current backend includes: `documents`, `document_chunks`, `tests`, `test_questions`, `ai_generation_runs`, `match_document_chunks` RPC.

Current environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SECRET_KEY=
OPENAI_API_KEY=
```

`SUPABASE_SECRET_KEY` is server-only and must never be exposed to the browser.

## Required Packages

Check `package.json` first. Install only if missing:

```
npm install ai @ai-sdk/openai zod
```

If the project already has `zod`, do not reinstall it.

Do not install Prisma.
Do not add LangChain.
Do not add unnecessary AI orchestration libraries.

## Files to Add or Update

### Create

- `src/app/api/admin/generate-test/route.ts`
- `src/features/tests/schemas/generated-test-schema.ts`
- `src/features/tests/lib/generate-test-prompt.ts`
- `context/feature-specs/23-ai-generate-test-api-from-retrieved-chunks.md`

### Optional (only if it keeps code cleaner)

- `src/features/tests/lib/retrieve-document-context.ts`
- `src/features/tests/lib/generated-test-types.ts`

### Update

- `.env.example`
- `context/progress-tracker.md`
- `context/history.md`
- `context/decisions.md`

Do not modify existing frontend pages in this task unless required to fix imports or type errors.

## API Route

Create `POST /api/admin/generate-test` at `src/app/api/admin/generate-test/route.ts`.

The route must be server-only. It must use `src/lib/supabase/admin.ts` and that file must include `import "server-only";`.

### Request Body

The endpoint accepts:

```json
{
  "documentId": "string",
  "questionCount": 5,
  "difficulty": "medium",
  "language": "en",
  "targetRole": "General employee"
}
```

Defaults:

- `questionCount = 5`
- `difficulty = "medium"`
- `language = "en"`
- `targetRole = "General employee"`

Validation rules:

- `documentId` must be a UUID.
- `questionCount` minimum 3, maximum 10.
- `difficulty` must be `easy`, `medium`, or `hard`.
- `language` must be `en` or `de`.
- `targetRole` max length 120.

Use Zod for request validation. Invalid input should return `400 Bad Request` with a useful error message.

### Response Body

On success, return:

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
        "correctAnswer": {
          "optionIds": ["string"]
        },
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

Do not return full chunk content in the API response unless needed for debugging. The frontend only needs source titles/topics and generated questions.

## Generated Test Schema

Create `src/features/tests/schemas/generated-test-schema.ts`.

Define Zod schemas for:

- `GenerateTestRequestSchema`
- `GeneratedTestDraftSchema`
- `GeneratedTestQuestionSchema`
- `GeneratedTestResponseSchema`

Rules for generated questions:

- `questionText` required, min length 12.
- `questionType` can be: `single_choice`, `multiple_choice`, `true_false`.
- `options`:
  - single choice: exactly 4 options
  - multiple choice: 4 options
  - true/false: exactly 2 options, preferably `True` and `False`
- `correctAnswer.optionIds` must reference existing option IDs.
- `explanation` required, min length 20.
- `topic` required.
- `sourceChunkId` required and must match one of the retrieved chunks.
- Difficulty must match request difficulty unless the model has a strong reason to vary it.
- Generated output must not include unsupported question types.

Add post-validation/refinement where practical.

## Retrieval Step

The route must retrieve grounded context before calling the LLM.

Process:

1. Fetch the document by `documentId`.
2. Verify the document exists (404 if not).
3. Fetch chunks for the document where `embedding is not null`.
4. If no embedded chunks exist, return `422 Unprocessable Entity`.
5. Create one retrieval query embedding using OpenAI `text-embedding-3-small`.

Suggested retrieval query:

```
Generate employee knowledge test questions for {targetRole} from this document. Difficulty: {difficulty}. Language: {language}.
```

6. Call `match_document_chunks` RPC with:

```json
{
  "query_embedding": "embedding",
  "match_count": "Math.min(Math.max(questionCount * 2, 6), 12)",
  "document_id_filter": "documentId",
  "organization_id_filter": "document.organization_id",
  "match_threshold": 0.2
}
```

7. If RPC returns too few chunks, fallback to the top embedded chunks from the same document ordered by `chunk_index`.

Minimum context requirement: at least 3 chunks must be available for generation. If fewer, return `422`.

## LLM Generation

Use Vercel AI SDK `generateObject` with a Zod schema.

Recommended model: `gpt-4.1-mini`. If the project uses a different currently available OpenAI model, keep it configurable as a constant.

Create constants:

```ts
const GENERATION_MODEL = "gpt-4.1-mini"
const EMBEDDING_MODEL = "text-embedding-3-small"
```

The LLM call must use retrieved chunks as the only knowledge source. The prompt must explicitly instruct:

- Use only the provided document chunks.
- Do not invent company policies.
- Each question must be answerable from at least one provided chunk.
- Each question must include `sourceChunkId`.
- Avoid duplicate questions.
- Return exactly the requested number of questions.
- Prefer practical employee scenarios over trivia.

## Prompt Helper

Create `src/features/tests/lib/generate-test-prompt.ts`.

Export a function:

```ts
buildGenerateTestPrompt({
  documentTitle,
  questionCount,
  difficulty,
  language,
  targetRole,
  chunks,
})
```

The prompt should include:

- document title
- target role
- difficulty
- language
- requested question count
- retrieved chunks with: chunk id, title, topic, content

Format chunks clearly:

```
[Chunk ID: ...]
Title: ...
Topic: ...
Content:
...
```

## AI Generation Run Logging

Use `ai_generation_runs`.

### When request starts

Insert a row:

```json
{
  "organization_id": "...",
  "document_id": "...",
  "status": "pending",
  "model": "gpt-4.1-mini",
  "embedding_model": "text-embedding-3-small",
  "input_config": {
    "questionCount": 5,
    "difficulty": "medium",
    "language": "en",
    "targetRole": "..."
  },
  "retrieved_chunk_ids": [],
  "created_by": null
}
```

### When retrieval succeeds

- Update `retrieved_chunk_ids`

### When generation succeeds

- Update: `status: "completed"`, `output_summary`, `completed_at`

Suggested `output_summary`:

```json
{
  "question_count": 5,
  "topics": ["Authentication", "Incident Reporting"],
  "source_chunk_count": 6
}
```

### When generation fails

- Update: `status: "failed"`, `error_message`, `completed_at`

The API response should include `generationRunId`.

## Error Handling

Return clear status codes:

- `400` — invalid request body
- `404` — document not found
- `422` — document has no embedded chunks / insufficient context / invalid generated output
- `500` — unexpected server or provider error

Do not expose raw provider stack traces to the client. Log useful debugging information server-side.

## Security Rules

- Route must run only on the server.
- Use `SUPABASE_SECRET_KEY` only through `src/lib/supabase/admin.ts`.
- Do not import `admin.ts` into any Client Component.
- Do not expose `OPENAI_API_KEY`.
- Do not return secret env values.
- Do not create public RLS policies in this task.
- Do not use user metadata for authorization.
- Auth enforcement can remain minimal for this demo route, but add a `TODO` comment that real admin authorization must be enforced before production.

## Out of Scope

Do not implement: frontend integration, saving generated draft into `tests`/`test_questions`, publish flow persistence, test assignment persistence, employee attempt/result persistence, auth UI, invite flow, PDF upload, PDF parsing, teams, advanced analytics.

This task is API-only.

## Manual Test

After implementation, test with curl:

```bash
curl -X POST http://localhost:3000/api/admin/generate-test \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "c0000000-0000-4000-8000-000000000001",
    "questionCount": 5,
    "difficulty": "medium",
    "language": "en",
    "targetRole": "General employee"
  }'
```

Expected:

- HTTP 200
- JSON response with `generationRunId`
- `draft.questions.length === 5`
- every question has `sourceChunkId`
- every `sourceChunkId` exists in `retrievedChunks`
- questions are about the selected document

Also test support document:

```bash
curl -X POST http://localhost:3000/api/admin/generate-test \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "c0000000-0000-4000-8000-000000000002",
    "questionCount": 5,
    "difficulty": "medium",
    "language": "en",
    "targetRole": "Customer Support Specialist"
  }'
```

Expected questions should mention: P0/P1 escalation, first response, escalation paths, post-incident follow-up, sensitive customer data.

## Validation

Run:

```bash
npm run lint
npm run typecheck
npm run format:check
npm run build
```

Also run manual API tests for both demo documents.

Verify in Supabase:

```sql
select id, status, model, embedding_model, output_summary, error_message
from public.ai_generation_runs
order by created_at desc
limit 5;
```

Expected:

- successful runs have `status = completed`
- failed runs have useful `error_message`

## Context Updates

Create this file (`context/feature-specs/23-ai-generate-test-api-from-retrieved-chunks.md`).

Update:

- `context/progress-tracker.md`
- `context/history.md`
- `context/decisions.md`

Add decision:

```
## 031 — AI test generation uses retrieved document chunks as grounded context

AI-generated test drafts are created only after retrieving embedded document chunks through the `match_document_chunks` RPC. The generation endpoint uses structured output validation and requires each generated question to reference a source chunk. Generated questions are returned as a draft and are not automatically published.
```

Update progress:

Completed:

- AI Generate Test API from Retrieved Document Chunks

Next Up:

- Connect Generate Test Page to Real AI API
- Save Reviewed Generated Test to Supabase

## Acceptance Criteria

- `POST /api/admin/generate-test` exists.
- Request body is validated with Zod.
- API retrieves embedded document chunks before calling the LLM.
- API uses `match_document_chunks`.
- API uses structured output generation.
- API validates generated output with Zod.
- API returns a draft test JSON.
- Each generated question includes a valid `sourceChunkId`.
- `ai_generation_runs` logs pending/completed/failed states.
- No generated test is saved to `tests` or `test_questions` yet.
- No frontend page is modified for integration yet.
- `lint`, `typecheck`, `format:check`, and `build` pass.
- Existing mock frontend still works.

## Next Step

Feature Spec 24: Connect Generate Test Page to Real AI API
