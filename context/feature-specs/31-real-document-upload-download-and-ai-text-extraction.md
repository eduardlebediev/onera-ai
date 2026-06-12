# Feature Spec 31: Real Document Upload, Download Link and AI Text Extraction

## Goal

Add the first real document upload and ingestion pipeline.

The goal is to let admins upload real source documents and use them for AI test generation:

```
Admin uploads document
→ original file is stored in Supabase Storage
→ document row is created
→ original file is available through secure download link
→ text is extracted
→ text is chunked
→ embeddings are generated
→ document becomes ready
→ admin can generate tests from the uploaded document
```

Do not build an iframe preview.
Do not build a complex document viewer.
Do not add Python-based document processing.
Do not add a separate worker service yet.

## Context

Already completed:

- Spec 21 — Supabase backend foundation
- Spec 22 — Embedding script for demo chunks
- Spec 23 — AI Generate Test API from retrieved chunks
- Spec 24 — Generate Test page connected to real AI API
- Spec 25 — Save reviewed generated test to Supabase
- Spec 26 — Backend Data Integration for Admin Documents and Tests
- Spec 27 — Real Test Assignments
- Spec 28 — Employee Test Taking and Attempt Persistence
- Spec 29 — Admin Progress and Results from Supabase
- Spec 30 — Invite-only Auth and RLS Policies

Current backend already supports: `documents`, `document_chunks`, `document_chunks.embedding`, `match_document_chunks` RPC, AI test generation from document chunks.

Current limitation: documents are still mostly seeded/demo content. There is no real upload → extraction → chunking → embedding pipeline.

## Product Flow

Admin opens Documents → clicks Upload Document → selects supported file → upload starts → document appears with status `processing` → original file is stored privately → text extraction runs → chunks and embeddings are created → document status becomes `ready` → admin can download original file → admin can generate a test from the uploaded document.

## Supported File Types for MVP

Support: `.pdf`, `.docx`, `.pptx`, `.txt`, `.md`.

Do not support: audio, video, ZIP files, external URLs, Google Drive links, Notion links, webpage scraping.

## Main Product Decision

For MVP, the platform should not render the original document inline. Instead:

- Store original file privately in Supabase Storage.
- Show document metadata in the app.
- Provide a secure "Download original" action.
- Show extracted text/chunks inside the app.

This keeps the implementation simpler, safer, and easier to deploy on Vercel.

## Storage

Use Supabase Storage. Bucket: `documents`. Bucket should be private.

Storage path pattern: `{organizationId}/{documentId}/{safeFileName}`.

Document row should store: `storage_path`, `file_name`, `file_type`, `file_size_mb`, `status`, `extracted_text`, `extraction_method`, `processing_error`, `processed_at`.

## Database Migration

Create migration if needed: `supabase/migrations/00003_document_upload_ingestion.sql`.

Add missing columns to `documents` if they do not exist:

```sql
alter table public.documents
  add column if not exists storage_path text,
  add column if not exists file_name text,
  add column if not exists file_type text,
  add column if not exists file_size_mb numeric,
  add column if not exists extraction_method text,
  add column if not exists processing_error text,
  add column if not exists processed_at timestamptz;
```

Document status values: `uploaded`, `processing`, `ready`, `failed`.

## API Route: Upload Document

Create `POST /api/admin/documents/upload`.

Responsibilities:

1. Verify current user is active admin.
2. Validate file extension and MIME type.
3. Validate file size.
4. Create document row with status `processing`.
5. Upload original file to private Supabase Storage bucket.
6. Extract readable text.
7. Save `extracted_text`.
8. Chunk extracted text.
9. Generate embeddings.
10. Insert `document_chunks`.
11. Set document status to `ready`.
12. Return document id and redirect target.

Maximum file size for MVP: 10 MB.

Response:

```json
{
  "documentId": "uuid",
  "status": "ready | failed | processing",
  "redirectTo": "/admin/documents/uuid"
}
```

For MVP, synchronous processing is acceptable for small files. Add TODO: move extraction/chunking/embedding to background job before production.

## API Route: Download Original

Create `POST /api/admin/documents/[id]/download-url` or server action/helper if easier.

Responsibilities:

1. Verify current user is active admin.
2. Verify document belongs to admin organization.
3. Verify document has `storage_path`.
4. Create a short-lived signed download URL.
5. Return signed URL.

Signed URL expiry: 60 seconds or 5 minutes.

Frontend behavior: click "Download original" → request signed URL → open/download original file in new tab.

Do not make the storage bucket public.

## Text Extraction Strategy

Use a deploy-friendly extraction pipeline.

**For `.txt` and `.md`:** extract directly in Node via `buffer.toString("utf-8")`. Then clean text.

**For `.pdf`, `.docx`, `.pptx`:** use AI file input server-side to extract clean readable text.

Extraction prompt:

```
Extract the full readable text from this document.
Do not summarize.
Do not add information.
Preserve headings, lists, and tables where possible.
Return clean structured plain text.
```

Important: this extraction runs once after upload. Do not send the original file to AI every time a test is generated.

After extraction, the normal RAG pipeline should use: `extracted_text` → chunks → embeddings → pgvector retrieval → AI-generated test.

## Ingestion Pipeline Helpers

Create:

- `src/features/documents/lib/upload-document.ts`
- `src/features/documents/lib/extract-document-text.ts`
- `src/features/documents/lib/clean-extracted-text.ts`
- `src/features/documents/lib/chunk-extracted-text.ts`
- `src/features/documents/lib/embed-document-chunks.ts`
- `src/features/documents/lib/document-download-url.ts`

Server-only helpers should use `import "server-only"`. Do not import server-only helpers into Client Components.

## Extraction Method Values

- `.txt` → `native-text`
- `.md` → `native-text`
- `.pdf` → `ai-file-extraction`
- `.docx` → `ai-file-extraction`
- `.pptx` → `ai-file-extraction`

## Text Cleaning

Clean extracted text before chunking: normalize line endings, trim excessive whitespace, collapse repeated empty lines, remove obvious extraction artifacts, preserve headings/lists/tables where possible.

Do not summarize. Do not rewrite document meaning.

## Chunking

Chunk extracted text into useful sections. Suggested rules:

- Split by headings where possible
- Keep paragraphs together
- Target roughly 2,000–3,500 characters per chunk
- Avoid very tiny chunks
- Preserve section title as chunk title/topic where possible
- Store `chunk_index`

Insert into `document_chunks`: `organization_id`, `document_id`, `title`, `topic`, `content`, `chunk_index`, `metadata`, `embedding`.

Metadata example:

```json
{
  "source": "upload",
  "extraction_method": "ai-file-extraction",
  "file_type": "pdf",
  "character_count": 2840,
  "embedding_model": "text-embedding-3-small"
}
```

## Embeddings

Use existing embedding model: `text-embedding-3-small`.

Refactor reusable embedding logic from `scripts/embed-demo-chunks.ts`. Do not duplicate embedding logic.

Embedding input should combine: chunk title, topic, content.

Save embedding to `document_chunks.embedding`.

## Documents Page Integration

Route: `/admin/documents`.

Add upload action. UI requirements: Upload document button, file picker, supported file types text, max file size text, upload/loading state, error state, success redirect or refresh.

Show uploaded documents in the existing documents list. Status display: `processing`, `ready`, `failed`.

Generate Test action should be enabled only when: `document.status = ready`, document has chunks, chunks have embeddings.

## Document Detail Integration

Route: `/admin/documents/[id]`.

For uploaded documents show: title, file name, file type, file size, status, extraction method, processed date, processing error if failed, Download original action, extracted text preview, chunks/topics, Generate Test action when ready.

No iframe. No embedded document viewer. The document detail page should use the signed download URL flow for original file download.

## Generate Test Compatibility

Existing generate-test flow should work for uploaded documents once: `document.status = ready`, `document_chunks` exist, `document_chunks.embedding` is not null.

Do not special-case uploaded documents in the AI generation endpoint unless necessary.

## Error Handling

If upload/extraction/chunking/embedding fails: `document.status = failed`, `documents.processing_error` = safe message, no crash.

Failure cases: unsupported file type, file too large, storage upload failed, empty extracted text, AI extraction failed, chunking produced no chunks, embedding failed, database insert failed.

Do not store stack traces, API keys, or raw provider errors in the database.

## Security Requirements

- Admin-only upload.
- Private Supabase Storage bucket.
- Signed download URLs only.
- No public file URLs.
- Validate MIME type and extension.
- Limit file size.
- Do not accept arbitrary external URLs.
- Do not expose `SUPABASE_SECRET_KEY`.
- Do not expose `OPENAI_API_KEY`.
- Do not expose correct answers or internal prompts.
- Add `TODO` for virus scanning before production.

## Environment Variables

Update `.env.example` if needed:

```
MAX_UPLOAD_MB=10
DOCUMENT_TEXT_EXTRACTION_MODEL=gpt-4.1-mini
```

Use existing: `OPENAI_API_KEY`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Out of Scope

Do not implement: iframe preview, inline PDF viewer, DOCX viewer, PPTX viewer, bulk upload, folders, versioning UI, external URL ingestion, Google Drive ingestion, Notion ingestion, OCR for scanned PDFs, audio/video transcription, AI summarization, virus scanning, enterprise document integrations, team permissions, billing, Prisma, large redesign.

## Manual Test

Run `npm run dev`.

Preconditions: admin user can access `/admin/documents`, Supabase Storage bucket exists, OpenAI API key is configured.

Test upload with `.txt`:

1. Open `/admin/documents`
2. Upload a small `.txt` file
3. Confirm document row is created
4. Confirm original file is stored in Supabase Storage
5. Confirm `extracted_text` is saved
6. Confirm chunks are created
7. Confirm embeddings are generated
8. Confirm document status becomes `ready`
9. Open document detail
10. Click Download original
11. Confirm original file downloads
12. Click Generate Test
13. Confirm AI test generation works

Test upload with `.pdf`, `.docx`, or `.pptx`: file → text extracted → chunks created → embeddings generated → document becomes `ready` → test generation works.

Test failures: unsupported file type, too large file, empty document, broken file. Expected: safe error message, document status `failed`, no crash.

## Supabase Verification Queries

```sql
select id, title, status, file_name, file_type, file_size_mb, storage_path, extraction_method, processed_at, processing_error
from public.documents
order by created_at desc
limit 10;

select document_id, count(*) as chunk_count
from public.document_chunks
group by document_id
order by chunk_count desc;

select id, document_id, chunk_index, title, topic, embedding is not null as has_embedding
from public.document_chunks
order by created_at desc
limit 20;
```

## Validation

```bash
npm run lint
npm run typecheck
npm run format:check
npm run build
```

Also verify: no API keys are exposed client-side, uploaded files are not public, signed download URL expires, existing seeded demo documents still work, existing AI generation flow still works, existing published test flow still works.

## Context Updates

Create this file (`context/feature-specs/31-real-document-upload-download-and-ai-text-extraction.md`).
Create `context/document-ingestion.md`.
Update `context/progress-tracker.md`, `context/history.md`, `context/decisions.md`, `context/architecture.md`, `.env.example`.

Add decision:

```
## 042 — Uploaded documents use private storage, signed downloads, and AI text extraction

Real uploaded documents are stored as original files in a private Supabase Storage bucket. The app does not render original documents inline; instead, admins can download originals through short-lived signed URLs. Text is extracted once after upload, saved to `documents.extracted_text`, chunked, embedded with `text-embedding-3-small`, and then reused through the existing pgvector retrieval and AI test generation flow.
```

Update progress:

Completed:

- Real Document Upload, Download Link and AI Text Extraction

Next Up:

- Production Readiness Cleanup
- Optional: OCR / Advanced Document Extraction

## Acceptance Criteria

- Admin can upload supported documents.
- Original file is stored in private Supabase Storage.
- Document row is created in Supabase.
- Admin can download original file through a signed URL.
- No iframe or inline document viewer is implemented.
- Uploaded document status moves to `ready` or `failed`.
- Extracted text is saved to `documents.extracted_text`.
- Uploaded document is chunked into `document_chunks`.
- Chunks receive embeddings with `text-embedding-3-small`.
- Ready uploaded document can be used by existing AI Generate Test flow.
- Unsupported/invalid files fail safely.
- Upload is admin-only.
- No arbitrary URL ingestion added.
- No API keys exposed to client code.
- Existing seeded demo documents still work.
- `lint`, `typecheck`, `format:check`, and `build` pass.

## Next Step

Feature Spec 32: Production Readiness Cleanup
