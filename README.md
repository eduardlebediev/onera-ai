# Ontera AI

**Ontera AI** is an AI-powered employee knowledge assessment platform that turns internal company documentation into reviewable tests, personalized feedback, and learning progress dashboards.

The project helps teams verify whether employees understand internal processes, policies, and technical documentation — without manually creating training tests from scratch.

## Current Status

Backend-backed MVP. Core AI/RAG vertical slice is complete:

```
Document → Chunks → Embeddings → pgvector retrieval
→ AI-generated draft → Admin review → Published test
→ Assignments → Employee attempt → Score/result
```

## Tech Stack

- Framework: Next.js 16 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS v4
- UI: shadcn/ui + Radix primitives
- Database: Supabase PostgreSQL + pgvector
- Auth: Supabase Auth (invite-only, no public registration)
- AI: Vercel AI SDK + OpenAI (gpt-4.1-mini, text-embedding-3-small)
- Validation: Zod
- Charts: Recharts

## Implemented Features

**AI/RAG Generation:**

- Document chunking and storage in Supabase
- OpenAI embeddings for semantic search
- pgvector similarity search (`match_document_chunks` RPC)
- AI-generated structured test drafts from retrieved chunks
- Admin review and edit before publishing

**Admin Flow:**

- Dashboard with real KPI metrics (tests, assignments, scores)
- Document list and detail (Supabase-backed)
- Test generation, review, publish
- Test assignment to employees
- Test detail with assignment progress and scores
- Weak topics derived from incorrect answers

**Employee Flow:**

- Dashboard with assigned tests
- Test-taking (Supabase-backed with persisted attempts)
- Server-side scoring (single/multiple choice, true/false)
- Result page with score, answers, weak topics

**Backend Foundation:**

- Org-scoped schema with composite foreign keys
- RLS enabled (policies for MVP flows)
- Server-only admin client for privileged operations
- Auth-ready profiles and organization_members

## Setup

### 1. Environment Variables

```bash
cp .env.example .env.local
```

Required:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SECRET_KEY=
OPENAI_API_KEY=
```

### 2. Database

Migrations are in `supabase/migrations/`. Apply via Supabase MCP or SQL editor:

```sql
-- Run all files in supabase/migrations/ in order
```

Seed data:

```sql
-- Run supabase/seed.sql
```

### 3. Generate Embeddings

```bash
npm run embed:demo-chunks
```

### 4. Start Dev Server

```bash
npm run dev
```

## Demo Credentials

| Role     | Email                     | Password             |
| -------- | ------------------------- | -------------------- |
| Admin    | `admin@demo.ontera.ai`    | `demo-only-password` |
| Employee | `employee@demo.ontera.ai` | `demo-only-password` |

These users are created by `supabase/seed.sql`.
