# Feature Spec 22: Embedding Script for Demo Document Chunks

## Goal

Add a server-side embedding script that generates vector embeddings for demo document chunks and stores them in Supabase `document_chunks.embedding`.

This task proves the first real RAG step:

```
document_chunks.content
→ OpenAI embedding
→ document_chunks.embedding
→ pgvector similarity search
```

Do not implement AI test question generation in this task.

## Context

The Supabase backend foundation already exists. Current database includes: `documents`, `document_chunks`, `tests`, `test_questions`, `ai_generation_runs`, and `match_document_chunks` RPC.

`document_chunks.embedding` exists as `extensions.vector(1536)`. Demo chunks already exist, but their embedding values are currently `null`.

The next goal is to fill those embeddings using OpenAI `text-embedding-3-small`, then verify that `match_document_chunks` returns relevant chunks.

## Required Environment Variables

The script requires:

```
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SECRET_KEY=
OPENAI_API_KEY=
```

Rules:

- `SUPABASE_SECRET_KEY` (`sb_secret_...`) is server-only. Never expose it through `NEXT_PUBLIC_*`.
- Never import the admin Supabase client into client components.
- `src/lib/supabase/admin.ts` must include `import "server-only";`.

## Required Packages

Check `package.json` first. Install only if missing:

```
npm install openai
```

If the project already uses the Vercel AI SDK and OpenAI provider, keep the existing setup. But for this script, the official `openai` package is acceptable and simple.

## Files to Add or Update

### Create

- `scripts/embed-demo-chunks.ts`

### Update

- `package.json` — add `embed:demo-chunks` script
- `.env.example` — ensure `OPENAI_API_KEY` is documented (already there)
- `context/progress-tracker.md`
- `context/history.md`
- `context/decisions.md`

### Optional helper file if useful

- `src/lib/ai/embeddings.ts` — only add if it keeps the code cleaner

## 1. Add Script Command

Add to `package.json`:

```json
{
  "scripts": {
    "embed:demo-chunks": "tsx scripts/embed-demo-chunks.ts"
  }
}
```

If `tsx` is not installed, check whether the project already uses another TypeScript runner. If missing, install:

```
npm install -D tsx
```

Do not add unnecessary tooling.

## 2. Script Behavior

Create `scripts/embed-demo-chunks.ts`. The script should:

1. Load env variables.
2. Validate required env vars.
3. Create a Supabase admin client using `SUPABASE_SECRET_KEY`.
4. Fetch chunks where `embedding is null`.
5. For each chunk:
   - use `content` as embedding input
   - optionally prefix with `title`/`topic` for better retrieval quality
   - call OpenAI embeddings API
   - update `document_chunks.embedding`
6. Print progress.
7. Print summary.
8. Run a verification query against `match_document_chunks`.

## 3. Embedding Input Format

Use a clear input string per chunk:

```
Title: {title}
Topic: {topic}
Content:
{content}
```

If `title` or `topic` is null, skip that line or use an empty string. Do not embed raw JSON metadata.

## 4. OpenAI Model

Use `text-embedding-3-small`. Store this model name in a constant:

```ts
const EMBEDDING_MODEL = "text-embedding-3-small"
```

This must match the database vector size:

- `text-embedding-3-small` → 1536 dimensions
- `document_chunks.embedding` → `vector(1536)`

## 5. Supabase Admin Client

Use the existing server-only admin helper `src/lib/supabase/admin.ts`. Before using it, verify that it starts with `import "server-only";`. If this import is missing, add it.

The script should not use the browser Supabase client.

## 6. Query Chunks With Null Embeddings

Fetch only chunks that need embeddings: `document_chunks where embedding is null`.

Suggested columns: `id`, `document_id`, `organization_id`, `title`, `topic`, `content`, `embedding`.

Limit can be optional, but for demo data it is fine to process all null chunks.

## 7. Update Embeddings

For each chunk, update `document_chunks.embedding` using the returned embedding array from OpenAI.

Also update `document_chunks.metadata` if useful, for example:

```json
{
  "embedding_model": "text-embedding-3-small",
  "embedded_at": "2026-..."
}
```

Do not overwrite existing metadata blindly. Merge with existing metadata if possible.

## 8. Error Handling

The script should fail clearly if:

- `OPENAI_API_KEY` is missing
- `SUPABASE_SECRET_KEY` is missing
- `NEXT_PUBLIC_SUPABASE_URL` is missing
- OpenAI returns no embedding
- Supabase update fails

For individual chunk failures: log the chunk id, continue only if safe, print failed count at the end.

For this demo, simple sequential processing is enough. Do not add complex queues or batching.

## 9. Verification Query

After embeddings are saved, generate an embedding for a test query:

> What should an employee do when they receive a phishing email?

Then call `match_document_chunks` with:

- `query_embedding`
- `match_count: 5`
- `match_threshold: 0.2`

Print returned chunks: `similarity`, `title`, `topic`, `content preview`.

Expected result should include something close to: Phishing Response / Incident Reporting.

Also run a second test query:

> When should support escalate a P1 incident?

Expected result should include something close to: Severity Levels / Incident Triage.

## 10. Optional npm Scripts

```json
{
  "scripts": {
    "embed:demo-chunks": "tsx scripts/embed-demo-chunks.ts",
    "rag:verify": "tsx scripts/embed-demo-chunks.ts --verify-only"
  }
}
```

`--verify-only` is optional. If implementing it adds too much complexity, skip it.

## 11. Do Not Implement Yet

Do not implement:

- AI Generate Test API
- test question generation
- frontend integration
- document upload
- PDF parsing
- employee result persistence
- auth UI

This task is only: chunks → embeddings → pgvector retrieval verification.

## 12. Validation

Run:

```
npm run lint
npm run typecheck
npm run format:check
npm run build
npm run embed:demo-chunks
```

Expected output:

```
Found 10 chunks without embeddings.
Embedded chunk 1/10 ...
...
Updated 10 chunks.
Verification query: phishing email
Top result: Phishing Response
Verification query: P1 incident
Top result: Severity Levels
```

If there are already embeddings, the script should say:

```
No chunks need embeddings.
Running verification only...
```

## 13. Supabase Verification

Using Supabase MCP or SQL editor, verify:

```sql
select count(*) from public.document_chunks where embedding is not null;
-- Expected: 10

select count(*) from public.document_chunks where embedding is null;
-- Expected: 0
```

## 14. Update Context

After implementation, update:

- `context/progress-tracker.md`
- `context/history.md`
- `context/decisions.md`

Add decision:

```
## 029 — Demo chunks use OpenAI text-embedding-3-small

Demo document chunks are embedded with OpenAI `text-embedding-3-small`. The database stores embeddings in `document_chunks.embedding` as `extensions.vector(1536)`. Embeddings are generated by a server-side script using the Supabase admin client (`SUPABASE_SECRET_KEY`) and are verified through the `match_document_chunks` RPC before AI question generation is implemented.
```

Update current progress:

Completed:

- Embedding Script for Demo Document Chunks

Next Up:

- AI Generate Test API from Retrieved Chunks

## Acceptance Criteria

- `scripts/embed-demo-chunks.ts` exists.
- `npm run embed:demo-chunks` works.
- Missing env vars produce clear errors.
- Script uses server-side Supabase admin client.
- `src/lib/supabase/admin.ts` has `import "server-only";`.
- OpenAI `text-embedding-3-small` is used.
- `document_chunks.embedding` is filled for demo chunks.
- `match_document_chunks` returns relevant chunks for phishing and P1 support queries.
- Lint, typecheck, format check, and build pass.
- No AI question generation is implemented yet.
- Existing mock frontend still works.

## Next Step

Feature Spec: AI Generate Test API from Retrieved Document Chunks
