# Document Ingestion

## Overview

Real uploaded documents flow through a synchronous admin-only ingestion pipeline:

```
Admin upload → private Supabase Storage → text extraction → chunking → embeddings → ready document
```

The app does not render original files inline. Admins download originals through short-lived signed URLs and review extracted text/chunks in the UI.

## Supported Types

- `.pdf`, `.docx`, `.pptx`, `.txt`, `.md`
- Max size: `MAX_UPLOAD_MB` (default 10 MB)

## Storage

- Bucket: `documents` (private)
- Path: `{organizationId}/{documentId}/{safeFileName}`
- Upload/download uses server-only admin APIs; no public bucket URLs

## Extraction

- `.txt`, `.md` → native UTF-8 read (`native-text`)
- `.pdf`, `.docx`, `.pptx` → OpenAI file input once after upload (`ai-file-extraction`)
- Model: `DOCUMENT_TEXT_EXTRACTION_MODEL` (default `gpt-4.1-mini`)

Extracted text is saved to `documents.extracted_text` and reused by chunking, embeddings, and the existing generate-test RAG flow.

## API Routes

- `POST /api/admin/documents/upload` — validate, store, extract, chunk, embed
- `POST /api/admin/documents/[id]/download-url` — org-scoped signed URL (60s)

## Server Helpers

Located in `src/features/documents/lib/`:

- `upload-document.ts`
- `extract-document-text.ts`
- `clean-extracted-text.ts`
- `chunk-extracted-text.ts`
- `embed-document-chunks.ts`
- `document-download-url.ts`

Shared embedding utilities live in `src/shared/ai/chunk-embeddings.ts` and are also used by `scripts/embed-demo-chunks.ts`.

## Status Values

- `processing` — upload/ingestion in progress
- `ready` — extracted text, chunks, and embeddings available
- `failed` — safe error stored in `processing_error`

## Generate Test Compatibility

Uploaded documents work with the existing generate-test API when:

- `documents.status = ready`
- `document_chunks` exist
- chunk embeddings are present

## Production TODOs

- Move extraction/chunking/embedding to a background job
- Add virus scanning before production uploads
