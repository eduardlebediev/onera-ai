# Feature: Proper Demo Seed and Login

## Goal

Make the first-run demo experience work out of the box: seed includes tests, assignments, and completed attempts so all pages show real data immediately. Demo login buttons work with one click.

## User story

As a demo reviewer, when I reset the database and start the app, I want to see real data on every page (dashboard, tests, employees, progress) and log in with one click, so I don't have to manually create data or type credentials.

## Scope

### In scope

1. Extend `supabase/seed.sql` with:
   - `document_topics` for both demo documents
   - One published test with 3–5 questions (derived from Security Guidelines chunks)
   - `test_documents` linking the test to Security Guidelines
   - `test_assignments` for the demo employee
   - One completed `test_attempts` with `test_answers`
   - One `ai_generation_runs` row linking to the test
2. Demo login buttons already exist — ensure `.env.example` has `NEXT_PUBLIC_ENABLE_DEMO_LOGIN=true`
3. Verify demo accounts exist in Supabase Auth

### Out of scope

- Seed for multiple tests
- Seed for advanced analytics (single test is enough)
- Seed for employee progress page (stats come from the single attempt)

## Data/API requirements

- All seed data uses existing fixed UUIDs from current `seed.sql`
- Test questions reference real `document_chunks` IDs from Security Guidelines
- Attempt has 4 answers: 3 correct, 1 incorrect (so weak topics appear)
- Score: 75% (passing)

## Acceptance criteria

- WHEN admin runs seed and opens dashboard, THEN KPIs show 1 test, 1 assignment, 75% avg score
- WHEN admin opens tests page, THEN published Security Guidelines test appears with 4 questions
- WHEN admin opens documents, THEN Security Guidelines shows extracted topics
- WHEN employee logs in, THEN My Tests shows completed assignment
- WHEN employee opens result, THEN score 75% and 1 weak topic are shown
- WHEN employee opens progress, THEN summary shows 1 completed, 75% avg
- WHEN login page loads, THEN demo buttons appear and work
- THEN `npm run lint`, `typecheck`, `format:check`, `build` pass

## Constraints

- Use existing fixed UUIDs from current `seed.sql`
- Test questions must reference existing `document_chunks` IDs (use `SELECT id FROM...` in seed)
- One incorrect answer must be on a topic present in document_topics
- Auth user seed wrapped in exception handler (existing pattern)
- Demo login gated by `NEXT_PUBLIC_ENABLE_DEMO_LOGIN=true`
