# Architecture Context

## Stack

| Layer         | Technology                                        | Role                                                             |
| ------------- | ------------------------------------------------- | ---------------------------------------------------------------- |
| Framework     | Next.js App Router + TypeScript                   | Full-stack application framework                                 |
| UI            | React + Tailwind CSS + shadcn/ui                  | Dashboard interface and reusable UI components                   |
| Auth          | Supabase Auth or temporary demo auth              | User identity, admin/employee role access                        |
| Database      | Supabase Postgres                                 | Stores users, documents, quizzes, assignments, attempts, answers |
| Vector Search | Supabase pgvector                                 | Stores document chunk embeddings for semantic search             |
| File Storage  | Supabase Storage                                  | Stores uploaded source documents                                 |
| Validation    | Zod                                               | Runtime validation for forms, API inputs, and AI outputs         |
| AI            | Vercel AI SDK with OpenAI/Anthropic/Groq provider | Topic extraction, quiz generation, feedback generation           |
| Deployment    | Vercel                                            | Public demo deployment                                           |

---

## System Boundaries

- src/app/ — Next.js routes, layouts, pages, route handlers, and server actions.
- src/features/documents/ — document upload, document list, document detail, extracted topics, processing states.
- src/features/quizzes/ — quiz generation, quiz review, quiz editor, quiz detail, quiz publishing.
- src/features/assignments/ — assigning published quizzes to employees.
- src/features/attempts/ — employee test-taking flow, answers, scoring, result screen.
- src/features/analytics/ — admin dashboard metrics, weak topics, quiz performance.
- src/shared/ai/ — AI client, prompt templates, structured output schemas, provider configuration.
- src/shared/db/ — Supabase clients, database types, query helpers.
- src/shared/ui/ — reusable UI components, layout primitives, empty/loading/error states.
- src/shared/lib/ — generic utilities, formatting helpers, error helpers.
- context/ — project context files and feature specs for AI-assisted development.

---

## Storage Model

### Supabase Postgres

Stores structured application data:

- user profiles;
- uploaded document metadata;
- document chunks;
- quizzes;
- quiz-document relations;
- questions;
- quiz assignments;
- quiz attempts;
- answers;
- follow-up questions;
- follow-up answers.

### Supabase Storage

Stores uploaded source files:

- PDFs;
- Markdown files;
- text files;
- future document formats.

### Supabase pgvector

Document chunks live in Postgres in the document_chunks table.

The embedding column stores vector embeddings for semantic search.

For MVP, do not create a separate vector database or a separate universal embeddings table.

---

## Core Entities

### profiles

Application user profile linked to Supabase Auth.

Fields:

- id
- name
- email
- role — admin | employee
- created_at
- updated_at

### documents

Uploaded internal company documents.

Fields:

- id
- title
- file_url
- extracted_text
- status — uploaded | processing | ready | failed
- uploaded_by
- created_at
- updated_at

### document_chunks

Chunks extracted from documents and used for semantic search.

Fields:

- id
- document_id
- content
- topic
- embedding
- chunk_index
- created_at

### quizzes

Quiz metadata.

Fields:

- id
- title
- description
- difficulty — easy | medium | hard
- target_role
- question_count
- passing_score
- language — en | de
- status — draft | published | archived
- created_by
- created_at
- updated_at

### quiz_documents

Many-to-many relation between quizzes and source documents.

Fields:

- id
- quiz_id
- document_id
- created_at

### questions

Questions belonging to a quiz.

Fields:

- id
- quiz_id
- source_chunk_id
- question_text
- type — single_choice | multiple_choice | true_false | open_question
- options
- correct_answer
- explanation
- topic
- order_index
- created_at
- updated_at

### quiz_assignments

Individual quiz assignments for employees.

Fields:

- id
- quiz_id
- user_id
- assigned_by
- status — not_started | in_progress | completed | failed
- deadline
- created_at
- updated_at

### quiz_attempts

Employee quiz attempts.

Fields:

- id
- quiz_id
- user_id
- assignment_id
- score
- passed
- ai_feedback
- started_at
- completed_at
- created_at

### answers

Employee answers to quiz questions.

Fields:

- id
- attempt_id
- question_id
- user_answer
- is_correct
- ai_explanation
- created_at

### follow_up_questions

Adaptive AI-generated follow-up questions after wrong answers.

Fields:

- id
- answer_id
- original_question_id
- question_text
- type
- options
- correct_answer
- explanation
- topic
- created_at

### follow_up_answers

Employee answers to follow-up questions.

Fields:

- id
- follow_up_question_id
- attempt_id
- user_answer
- is_correct
- created_at

---

## Auth and Access Model

- Users authenticate through Supabase Auth or temporary demo auth during early MVP development.
- Application-specific user data lives in profiles.
- profiles.role controls access:
  - admin can manage documents, quizzes, assignments, and analytics;
  - employee can only see assigned quizzes and personal results.
- Employees must not access other employees' attempts, answers, or analytics.
- Admin-only mutations must be checked server-side.
- If Supabase Auth is enabled, use Row Level Security where practical.

---

## AI Boundary

AI output is untrusted and must be validated before use.

AI may generate:

- document topics;
- quiz questions;
- answer explanations;
- personalized feedback;
- adaptive follow-up questions.

AI must not:

- publish quizzes automatically;
- bypass admin review;
- mutate production data without explicit user action;
- generate questions unrelated to selected source documents;
- claim that external work was completed.

The quiz generation flow must be:

text Selected document(s) → document chunks → semantic retrieval with pgvector → AI structured output → Zod validation → draft quiz → admin review/edit → publish

---

## Invariants

1. AI-generated questions must stay in draft state until reviewed and published by an admin.
2. Each document chunk must belong to one document.
3. Document chunk embeddings are stored in document_chunks.embedding using Supabase pgvector.
4. A quiz can use multiple documents through quiz_documents.
5. A question should reference source_chunk_id when generated from document context.
6. Employees can only complete assigned quizzes.
7. Quiz attempts must belong to one user, one quiz, and preferably one assignment.
8. Completed attempts should not break if a quiz is edited later.
9. AI output must be validated with Zod before being saved or shown as final.
10. The MVP should prioritize one complete flow over many incomplete features.
11. Teams are out of scope for MVP; quiz assignments are individual for now.
12. Do not add integrations, payments, enterprise SSO, or advanced permissions before the core MVP works.
