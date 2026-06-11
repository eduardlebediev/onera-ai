# Current Plan

## Current Priority

Replace mock core flows with Supabase-backed data.

The first AI/RAG vertical slice is complete:

```txt
Document
→ Chunks
→ Embeddings
→ pgvector retrieval
→ AI-generated questions
→ Admin review
→ Publish test
```

The next step is to turn the mock-based admin and employee flows into real backend-backed features.

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

Auth can stay minimal for now. Do not spend time on complex auth UI until the core backend flows are stable.

## Backend Schema Direction

Use a production-shaped schema, but implement only what the current milestone needs.

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

### Naming

Use tests, not quizzes.

## Implementation Order

### Completed (AI/RAG vertical slice)

1. **Supabase pgvector Backend Foundation** — schema, RLS, RPC, seed data
2. **Demo Seed Data** — org, users, documents, chunks
3. **Embedding Script** — OpenAI embeddings for demo chunks
4. **Vector Search RPC** — `match_document_chunks` pgvector search
5. **AI Generate Test API** — structured draft from retrieved chunks
6. **Connect Generate Test Setup** — frontend calls real API, draft handoff to review
7. **Save Published Test** — reviewed draft persists to `tests` and `test_questions`

### Next Up

8. **Backend Data Integration for Admin Documents and Tests** — `/admin/documents` and `/admin/tests` read from Supabase instead of mock data
9. **Real Test Assignments** — assign published tests to employees, employee sees real assignments
10. **Employee Test Taking and Attempt Persistence** — take real saved tests, persist answers and results
11. **Admin Progress and Results from Supabase** — real completion stats, scores, weak topics
12. **Invite-only Auth and RLS Policies** — login, route protection, org-scoped policies

## Out of Scope for Now

Do not spend time on:

- public registration
- complex auth UI
- full invite management UI
- teams
- billing
- real PDF upload
- PDF parsing
- advanced analytics

## AI Safety / Product Rule

AI output must not directly publish content.

Generated questions should always go through:

AI draft
→ schema validation
→ admin review
→ publish
