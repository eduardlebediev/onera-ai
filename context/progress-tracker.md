# Progress Tracker

Update this file after every meaningful implementation change.

## Current Goal

Build a backend-backed RAG demo slice for Ontera AI that proves internal documents can be chunked, embedded, retrieved with pgvector, and used by AI to generate reviewable employee knowledge tests.

The current phase is presentation-focused. The goal is not to build a complete production backend, but to implement the smallest useful vertical slice:

Admin document
→ document chunks
→ embeddings
→ pgvector retrieval
→ AI-generated test draft
→ admin review
→ publish test
→ employee demo flow.

## In Progress

- Supabase pgvector Backend Foundation

## Next Up

- Demo Seed Data: Organization, Users, Documents, Chunks
- Embedding Script for Demo Chunks
- `match_document_chunks` RPC
- AI Generate Test from Document Chunks
- Connect Generate Test Setup to AI
- Save Published Tests and Questions to Supabase
- Presentation Demo Polish

## Open Questions

## Completed

- Feature Spec 20: Role-Based Route Structure and Employee Dashboard
- Feature Spec 19: Clickable Demo Polish
- Feature Spec 17: Follow-up Question Flow
- Feature Spec 16: Test Result and AI Feedback
- Feature Spec 15: Employee Test Taking Flow
- Feature Spec 14: Employee My Tests
- Feature Spec 13: Assign Test to Employees
- Feature Spec 12: Tests List and Test Detail
- Feature Spec 11: Test Review Flow with Mock Generated Questions (includes post-review fix pass)
- Feature Spec 10: Generate Test Setup from Document
- Feature Spec 09: Refactor UI Primitives from Base UI to Radix
- Feature Spec 08: Improve Agent Context
- Feature Spec 06: Documents Mock Pages with Quick Preview
- Feature Spec 05: Responsive Design Tokens and Typography
- Feature Spec 04: Admin Dashboard with Mock Data
- Feature Spec 04 Refactor: Analytics Feature Components
- Feature Spec 04 Visual Alignment: Dashboard Reference
- Feature Spec 04 Enhancement: Active Employees KPI
- Feature Spec 04 Enhancement: Recharts Test Completions Chart
- Feature Spec 04 Refactor: Reusable KPI Card
- Feature Spec 03: Build Initial App Shell
- Feature Spec 02: Add Prettier, ESLint and Husky
- Feature Spec 01: Set up shadcn/ui Design System

See `context/history.md` for full details on each completed item.
