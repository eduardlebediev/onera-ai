# Feature Spec 32: AI Document Topic Extraction

## Goal

Add a separate AI topic extraction step for uploaded documents.

The goal is to make document processing feel more intelligent:

```
Admin uploads document
→ text is extracted
→ chunks and embeddings are created
→ AI extracts key learning topics
→ topics are shown on document detail
→ topics can later improve test generation and recommendations
```

## Scope

Implement only:

- `document_topics` table
- AI topic extraction after upload
- fallback from chunk topics
- document detail topics section
- context documentation updates

Do not implement multi-document generation in this spec.
Do not implement document archive/delete in this spec.
Do not redesign the generate-test page in this spec.

## Database

Create migration: `supabase/migrations/00004_document_topics.sql`

```sql
create table if not exists public.document_topics (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  topic text not null,
  description text,
  confidence numeric,
  source text not null default 'ai',
  created_at timestamptz not null default timezone('utc', now()),

  unique (document_id, topic)
);

create index if not exists document_topics_document_id_idx
  on public.document_topics(document_id);

create index if not exists document_topics_organization_id_idx
  on public.document_topics(organization_id);
```

Add RLS policies for admin organization access.

## Backend

Create:

- `src/features/documents/lib/extract-document-topics.ts`
- `src/features/documents/schemas/document-topics-schema.ts`

Topic extraction input:

- document title
- `extracted_text`
- chunk topics

Use structured AI output with Zod.

Output shape:

```ts
{
  topics: Array<{
    topic: string
    description: string
    confidence?: number
  }>
}
```

Rules:

- extract 5–10 key learning topics
- deduplicate topic names
- do not create generic topics like "Introduction"
- do not fail document ingestion if topic extraction fails
- fallback to `chunk.topic` values if AI extraction fails

## Upload Pipeline Update

Update document ingestion flow:

```
upload file → extract text → clean text → chunk text → embed chunks → extract AI topics → insert document_topics → document status ready
```

If topic extraction fails: document still becomes ready, insert fallback topics from chunks where possible, log safe server-side error.

## UI

Update `/admin/documents/[id]`.

Add section: "AI-extracted topics". Show: topic, description, confidence if available. If no topics: "No topics extracted yet."

## Manual Test

1. Login as admin.
2. Upload a small document.
3. Wait until status is ready.
4. Open document detail.
5. Confirm AI topics are shown.
6. Confirm chunks still exist.
7. Confirm Generate Test still works.

## Validation

```bash
npm run lint
npm run typecheck
npm run format:check
npm run build
```

## Context Updates

Create this file (`context/feature-specs/32-ai-document-topic-extraction.md`).

Update:

- `context/progress-tracker.md`
- `context/history.md`
- `context/decisions.md`
- `context/architecture.md`

Add decision:

```
## 046 — Document topics are extracted as a separate AI step

Uploaded documents receive AI-extracted learning topics after text extraction, chunking, and embeddings. Topics are stored separately from chunks so the UI can present document-level learning concepts and future generation/recommendation flows can use better topic data than raw chunk headings alone.
```

## Acceptance Criteria

- `document_topics` table exists.
- AI topic extraction runs after upload processing.
- Topic extraction failure does not fail the full document upload.
- Fallback topics can be derived from chunks.
- Document detail shows AI-extracted topics.
- Existing document upload still works.
- Existing test generation still works.
- `lint`, `typecheck`, `format:check`, and `build` pass.
