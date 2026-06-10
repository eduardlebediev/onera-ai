# Feature Spec 21: Supabase Backend Foundation

## Goal

Add the first backend foundation for Ontera AI using Supabase Postgres, Supabase Auth-ready schema, pgvector document chunks, demo seed data, and a vector search RPC.

This is the first backend step for the 7-day RAG demo slice. The goal is not the full production backend — only the smallest reliable foundation for:

Document → Chunks → Embeddings → pgvector retrieval → AI-generated test questions

Do not implement AI generation or auth UI in this task.

## Context

- Clickable mock frontend exists for admin and employee flows.
- Supabase project is created; env vars exist locally.
- Supabase MCP is connected.
- Data API auto-expose is disabled — grant access explicitly when needed.

## Important Rules

- Use tests, not quizzes. No `quiz_*` tables.
- No public registration. Auth is invite-only later; auth UI out of scope.
- Enable RLS on all public tables; no broad unsafe policies.
- Prefer server-side Supabase access for backend/RAG operations.
- Keep existing mock frontend working; do not delete mock data.
- Do not expose `service_role` key to client code.

## Files

| File                                           | Purpose                                        |
| ---------------------------------------------- | ---------------------------------------------- |
| `.env.example`                                 | Document required env vars                     |
| `src/lib/supabase/client.ts`                   | Browser client (`createBrowserClient`)         |
| `src/lib/supabase/server.ts`                   | Server client (`createServerClient` + cookies) |
| `src/lib/supabase/types.ts`                    | Placeholder `Database` type                    |
| `supabase/config.toml`                         | Supabase CLI config                            |
| `supabase/migrations/00001_initial_schema.sql` | Schema, RLS, RPC                               |
| `supabase/seed.sql`                            | Demo org, profiles, documents, chunks          |

## Schema

Extensions: `pgcrypto`, `vector` (in `extensions` schema).

Tables: `organizations`, `profiles`, `organization_members`, `documents`, `document_chunks`, `tests`, `test_questions`, `test_assignments`, `test_attempts`, `test_answers`, `ai_generation_runs`.

- `document_chunks.embedding` uses `extensions.vector(1536)`.
- `profiles.id` references `auth.users(id)` on delete cascade.
- Partial unique indexes on `organization_members` for `(organization_id, user_id)` and `(organization_id, invited_email)`.
- `updated_at` trigger on all tables with `updated_at`.

## RLS

Enable RLS on every public table. No broad public policies in this spec — demo access will be wired through server-side helpers/API routes in later specs.

## RPC

`match_document_chunks(query_embedding, match_count, document_id_filter, organization_id_filter, match_threshold)` — cosine similarity search over `document_chunks`, `SECURITY INVOKER`.

## Seed

1 organization, 1 admin profile, 1 employee profile, organization members, 2 demo documents (Security Guidelines, Customer Support Escalation Guide), 8–12 chunks with `embedding = null`.

## Acceptance Criteria

- Supabase client/server helpers exist.
- `.env.example` documents required env vars.
- Initial migration with pgvector, all core tables, RLS enabled, `match_document_chunks` RPC.
- Demo seed data exists.
- Existing mock frontend still works.
- No AI generation, auth UI, or public registration.

## Out of Scope

AI Generate Test API, embedding generation script, OpenAI integration, auth pages, invite email flow, real file upload, PDF parsing, frontend migration from mock to Supabase, employee attempt persistence UI, advanced analytics.

## Next Step

Feature Spec: Embedding Script for Demo Document Chunks
