# Ontera AI

**Ontera AI** is an AI-powered employee knowledge assessment platform that turns internal company documentation into dynamic quizzes, personalized feedback, and learning progress dashboards.

The project helps teams verify whether employees understand internal processes, policies, product knowledge, or technical documentation — without manually creating training tests from scratch.

## Overview

Companies often store important knowledge across PDFs, internal wikis, onboarding guides, and process documents. Ontera AI transforms that documentation into structured knowledge checks.

Admins can upload documents, generate AI-based quizzes, review questions before publishing, assign tests to employees, and track learning progress through analytics dashboards.

Employees can complete assigned tests, receive instant results, and get AI-generated feedback based on their weak topics.

## Core Features

- Document upload and text extraction
- AI-generated quiz creation from internal documentation
- Human review before publishing AI-generated questions
- Employee test-taking flow
- Score calculation and result overview
- Personalized AI feedback after each attempt
- Admin analytics for weak topics and team progress
- Source-based question generation using document chunks
- Planned support for vector search with Supabase pgvector

## MVP Flow

Admin uploads document
→ AI extracts topics
→ Admin generates quiz
→ Admin reviews and publishes questions
→ Admin assigns quiz to employee
→ Employee completes quiz
→ AI generates feedback
→ Admin reviews analytics

## Tech Stack

* Framework: Next.js
* Language: TypeScript
* Styling: Tailwind CSS
* UI: shadcn/ui
* Backend: Supabase
* Database: PostgreSQL
* Auth: Supabase Auth
* Storage: Supabase Storage
* Vector Search: Supabase pgvector
* AI: OpenAI / compatible LLM provider