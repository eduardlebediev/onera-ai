# Current Plan

## Current Priority

Build a backend-backed RAG demo slice.

This project has moved beyond the mock-only clickable prototype phase. The frontend prototype remains useful, but the next implementation work should focus on proving the core AI value:

Internal documents become employee knowledge tests through document chunking, vector search, and AI-generated reviewable questions.

## Presentation Must-Have

The presentation must clearly demonstrate:

```txt
Document
→ Chunks
→ Embeddings
→ pgvector retrieval
→ AI-generated questions
→ Admin review
→ Publish test
→ Employee takes test
→ Result/feedback
```

## Technical Direction

Use:

- Next.js App Router
- Supabase Postgres
- Supabase Auth, eventually invite-only
- pgvector for document chunk embeddings
- AI SDK / LLM structured output for generated test questions
- Zod validation for AI outputs

## Auth Strategy

There should be no public self-registration for normal users.

The intended product flow is:

First admin is created manually or seeded
→ Admin invites employees
→ Employee receives invite or magic link
→ Employee joins the organization
→ Role is resolved from organization membership

For the demo, auth can stay minimal. Do not spend presentation time on complex auth UI unless the RAG flow is already working.

## Backend Schema Direction

Use a production-shaped schema, but implement only the necessary demo slice first.

Core tables:

- profiles
- organizations
- organization_members
- documents
- document_chunks
- tests
- test_questions
- test_assignments
- test_attempts
- test_answers
- ai_generation_runs

Optional later tables:

- document_topics
- test_documents
- follow_up_questions
- follow_up_answers

### Important Naming Decision

Use tests, not quizzes.

The product is an enterprise employee knowledge testing platform. "Test" sounds more appropriate than "Quiz".

Use:

- tests
- test_questions
- test_assignments
- test_attempts
- test_answers

Do not introduce new quiz\_\* tables.

## Implementation Order

1. **Supabase pgvector Backend Foundation**

   Set up Supabase environment, server/client helpers, migrations folder, initial schema, and pgvector support.

2. **Demo Seed Data**

   Seed one demo organization, one admin, one employee, one or two documents, and realistic document chunks.

3. **Embedding Script**

   Generate embeddings for demo chunks and store them in `document_chunks.embedding`.

4. **Vector Search RPC**

   Create `match_document_chunks` RPC to retrieve relevant chunks for a document/query using pgvector similarity search.

5. **AI Generate Test API**

   Create an API endpoint or server action that:
   - receives documentId + generation settings
   - retrieves relevant chunks
   - calls the LLM
   - validates structured questions
   - returns a draft test
   - logs the generation run

6. **Connect Generate Test Setup**

   Connect `/admin/documents/[id]/generate-test` to the real AI generation flow.

7. **Save Published Test**

   Save reviewed/published generated tests and questions to Supabase.

8. **Demo Polish**

   Make the presentation flow clear, stable, and explainable.

## Out of Scope for This Phase

Do not spend time on:

- public registration
- complex auth UI
- full invite management UI
- teams
- billing
- real PDF upload
- PDF parsing
- advanced analytics

These can be described as next-phase work.

## AI Safety / Product Rule

AI output must not directly publish content.

Generated questions should always go through:

AI draft
→ schema validation
→ admin review
→ publish
