# Ontera AI

## Overview

Ontera AI is an AI-powered employee knowledge assessment platform.

The product helps companies turn internal documentation into dynamic employee knowledge tests, personalized AI feedback, and learning progress dashboards. Admins can upload internal documents, generate quizzes from company knowledge, review AI-generated questions before publishing, assign quizzes to employees, and analyze weak topics across the team.

The product is intentionally not a generic chatbot. It demonstrates a controlled AI workflow with document processing, vector-based retrieval, structured AI outputs, validation, human review, employee testing, and analytics.

## Primary Users

### Admin / Manager / Trainer

The admin is responsible for employee onboarding, internal training, documentation-based learning, or knowledge assessment.

Example admins:

- HR or onboarding manager
- Team lead
- Internal trainer
- Engineering manager
- Support team manager
- Compliance or operations manager

### Employee

The employee completes assigned quizzes and receives feedback based on their results.

Example employees:

- New employee during onboarding
- Developer learning internal engineering standards
- Support agent learning escalation rules
- Sales employee learning product knowledge
- Team member completing compliance training

## Core Problem

Companies store important knowledge across PDFs, onboarding guides, internal wikis, process documents, technical documentation, and policies. Employees may read these materials, but managers often cannot verify whether the knowledge was actually understood.

Manual quiz creation is slow, repetitive, and hard to keep updated when documentation changes.

Ontera AI helps companies convert internal documentation into measurable knowledge checks and learning feedback.

## Goals

1. Admin can upload internal documents and use them as source material for employee knowledge testing.
2. The system extracts document text, splits it into chunks, and stores embeddings with Supabase pgvector.
3. AI can generate structured quiz questions from selected document chunks.
4. AI-generated questions are shown as drafts and must be reviewed by an admin before publishing.
5. Admin can publish and assign quizzes to individual employees.
6. Employee can complete assigned quizzes and receive score, explanations, and AI-generated feedback.
7. Admin can see basic analytics: completion status, average score, weak topics, and difficult questions.
8. The codebase demonstrates production-minded AI development: validation, source grounding, human review, scope control, documentation, and clean architecture.

## Core User Flow

1. Admin opens the dashboard.
2. Admin uploads an internal document.
3. The system extracts text from the document.
4. The system splits the document into chunks.
5. The system stores document chunks and embeddings in Supabase Postgres with pgvector.
6. AI extracts key topics from the document.
7. Admin opens the quiz generator.
8. Admin selects source document, difficulty, question count, target role, language, and question types.
9. Backend retrieves relevant document chunks.
10. AI generates structured quiz questions.
11. AI output is validated with Zod.
12. Generated questions are saved as a draft quiz.
13. Admin reviews, edits, deletes, or approves questions.
14. Admin publishes the quiz.
15. Admin assigns the quiz to an employee.
16. Employee opens assigned tests.
17. Employee completes the quiz.
18. System calculates score and pass/fail status.
19. AI generates personalized feedback based on wrong answers and weak topics.
20. Admin reviews analytics and employee results.

## Features

### Document Management

- Upload internal documents
- Display document processing status
- Extract text from uploaded documents
- Split documents into chunks
- Store document chunks with embeddings
- Show AI-detected topics
- Use documents as source material for quiz generation

### AI Topic Extraction

- Analyze extracted document text
- Detect key topics and concepts
- Show topics on document detail pages
- Use topics for quiz generation and analytics

### AI Quiz Generation

- Generate quizzes from selected internal documents
- Use semantic retrieval over document chunks
- Generate structured questions with answer options
- Include correct answers, explanations, topics, and source references
- Validate AI output before saving it
- Save generated quizzes as drafts

### Human Review

- AI-generated questions are never published automatically
- Admin can review all generated questions
- Admin can edit question text, answer options, correct answers, and explanations
- Admin can delete weak questions
- Admin can manually add questions
- Admin publishes the quiz only after review

### Quiz Assignment

- Admin can assign published quizzes to individual employees
- Assignments have status: not started, in progress, completed, failed
- Team assignments are out of scope for MVP
- The assignment model should remain compatible with future team support

### Employee Test Taking

- Employee can view assigned tests
- Employee can start and complete quizzes
- Employee answers questions one by one
- System saves answers
- System calculates score
- System shows result, explanations, and weak topics

### AI Feedback

- Generate personalized feedback after a quiz attempt
- Feedback is based on score, wrong answers, topics, and explanations
- Feedback should not be generic
- Feedback should recommend what the employee should review next

### Adaptive Follow-up Questions

- If an employee answers incorrectly, the system may generate one follow-up question on the same topic
- Follow-up questions help verify whether the employee understood the concept after feedback
- This is a nice-to-have MVP feature, not required for the first implementation pass

### Admin Analytics

- Show total documents
- Show published quizzes and draft quizzes
- Show assigned and completed tests
- Show average score
- Show weak topics
- Show difficult questions
- Show recent quiz attempts
- Show employee progress summaries

## Scope

### In Scope

- Admin and employee roles
- Demo auth or Supabase Auth
- Document upload
- Text extraction
- Document chunking
- Supabase pgvector for chunk embeddings
- AI topic extraction
- AI-generated quiz creation
- Zod validation for AI output
- Draft quiz review flow
- Editable generated questions
- Quiz publishing
- Individual quiz assignment
- Employee test-taking flow
- Score calculation
- Pass/fail result
- AI feedback generation
- Basic admin dashboard
- Basic employee dashboard
- Basic analytics
- Loading, empty, and error states
- Documentation of AI-assisted development process

### Out of Scope

- Teams as full entities
- Organization/multi-tenant system
- Real enterprise permissions
- Enterprise SSO
- Payments
- Certificates
- Slack integration
- Notion integration
- Confluence integration
- Google Drive integration
- Calendar reminders
- Mobile app
- Complex notification system
- Advanced reporting
- Real customer data

## Success Criteria

1. Admin can upload a document.
2. The system can extract and display document text.
3. The system can split a document into chunks.
4. Document chunks can be connected to the original document.
5. Document chunk embeddings can be stored in Supabase pgvector.
6. AI can extract topics from document content.
7. Admin can generate a quiz from selected document context.
8. AI-generated quiz output is validated before use.
9. Admin can review and edit generated questions before publishing.
10. Admin can publish and assign a quiz to an employee.
11. Employee can complete an assigned quiz.
12. System calculates score and pass/fail correctly.
13. Employee receives result, explanations, and AI feedback.
14. Admin can see basic analytics and weak topics.
15. The project builds successfully.
16. README and context files clearly explain the product, architecture, and development workflow.

## Demo Scenario

Demo document:

> Internal Security Guidelines or Engineering Onboarding Guide

Expected AI output:

- Extracted document topics
- 5–10 quiz questions
- Answer options
- Correct answers
- Explanations
- Source topic or source chunk reference
- Personalized employee feedback after completion

Demo should show:

1. Admin logs in.
2. Admin uploads an internal document.
3. AI extracts topics from the document.
4. Admin generates a quiz from the document.
5. Admin reviews and edits one AI-generated question.
6. Admin publishes the quiz.
7. Admin assigns the quiz to an employee.
8. Employee logs in.
9. Employee completes the quiz.
10. Employee receives score and AI feedback.
11. Admin opens analytics and sees weak topics.
