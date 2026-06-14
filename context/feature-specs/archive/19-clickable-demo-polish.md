# Feature Spec: Clickable Demo Polish

## Goal

Polish the Ontera AI clickable MVP so it feels coherent, demo-ready, and easy to understand from the first screen to the final employee feedback step.

This task should improve the complete frontend demo experience across navigation, CTAs, mock data consistency, copy, empty states, responsive layout, and documentation.

No backend, Supabase, real AI, database persistence, auth, or new major product features in this task.

## Current State

The project already has the main frontend prototype flow:

Dashboard → Documents → Document Detail → Generate Test Setup → Test Review → Publish Test → Test Detail → Assign Test to Employees → Employee My Tests → Employee Test Taking → Test Result and AI Feedback → Follow-up Question Flow

This task should not add a new core feature. It should make the existing flow smoother, clearer, and presentation-ready.

## Demo Path

The following path must be clickable from start to finish without confusing dead ends:

1. Dashboard
2. Documents
3. Open Document
4. Generate Test
5. Generate Test Preview
6. Review Questions
7. Continue to Publish
8. Publish Test
9. Open Test Detail
10. Assign to Employees
11. View Employee Tests
12. Start Test
13. Submit Test
14. View Results
15. Check Understanding

Every primary CTA should move the user forward in the demo. If an action is not implemented, it should be clearly disabled or labeled as coming later.

## Requirements

### 1. Verify and polish the full demo path

Walk the complete demo path above and fix any dead ends, broken navigation, or confusing intermediate states.

Primary CTAs that must work end to end:

- Document Detail → Generate Test
- Generate Test Setup → Generate Test Preview
- Test Review → Continue to Publish
- Publish Test → Publish Test
- Publish Success → Open Test Detail or Assign to Employees
- Test Detail → Assign to Employees
- Assign Success → View Employee Tests
- Employee My Tests → Start Test or Continue
- Test Taking → Submit Test
- Result Page → Check Understanding

Avoid multiple competing primary buttons on one screen.

### 2. Check route connectivity

Review these routes and make sure they work together:

- `/dashboard` or `/`
- `/documents`
- `/documents/[id]`
- `/documents/[id]/generate-test`
- `/tests/review`
- `/tests/publish`
- `/tests`
- `/tests/[id]`
- `/tests/[id]/assign`
- `/employee/tests`
- `/employee/tests/[id]/take`
- `/employee/tests/[id]/result`

Fix broken links, incorrect IDs, missing query params, or navigation that leads to a weak placeholder.

### 3. Use one consistent demo story

Make the mock data feel like one believable story.

Use one strong source document across the core flow, for example **Security Guidelines**.

Ensure the same story appears consistently in:

- document detail
- generate test setup
- test review
- publish test
- test detail
- assignment flow
- employee test-taking flow
- result page
- follow-up questions

Topics, chunks, questions, weak topics, answer explanations, and feedback should feel connected.

### 4. Improve primary CTA hierarchy

Check all important screens and make sure the main next action is visually obvious.

Admin screens should have a clear forward action. Employee screens should have a single obvious next step (Start, Continue, Submit, Check Understanding).

Secondary actions should use outline or ghost styling so they do not compete with the primary CTA.

### 5. Improve empty and invalid states

Add or improve useful states for:

- invalid document id
- invalid test id
- no documents
- no tests
- no assigned tests
- no selected employees
- no approved questions
- no weak topics
- no incorrect answers
- no follow-up available

Empty states should be short, helpful, and demo-friendly.

Example:

```
No approved questions yet. Approve at least one question before publishing this test.
```

### 6. Add lightweight demo loading states

Where useful, add small local loading/progress states to make the flow feel believable.

Good candidates:

- generating test preview
- publishing test
- assigning test
- submitting test
- checking follow-up answer

Keep this simple:

- local component state only
- short delay only if already acceptable in the codebase
- no API route
- no fake backend abstraction

### 7. Polish user-facing copy

Review all visible labels and helper text.

Use consistent product language:

- Tests
- Employees
- Documents
- Topics
- Chunks
- Generate Test
- Review Questions
- Publish Test
- Assign to Employees
- My Tests
- Check Understanding

Avoid outdated wording:

- Quiz / Quizzes
- Users
- AI magic
- Vector database
- Embedding

Technical terms like chunks can remain where they help explain the product, but do not overuse them in employee-facing screens.

### 8. Make admin and employee modes clear

Make it obvious whether the user is in admin or employee flow.

Admin screens should feel like management/review screens. Employee screens should feel focused, simple, and educational.

Check:

- navigation labels
- page headers
- helper descriptions
- button labels
- dashboard links

### 9. Polish visual consistency

Review the main pages for:

- spacing
- card density
- badge consistency
- button hierarchy
- KPI card consistency
- table/list density
- page header structure
- mobile stacking
- dark mode compatibility if supported

Use existing design tokens and typography CSS classes. Do not redesign the whole application.

### 10. Improve responsive behavior

Check the core demo screens on desktop, tablet width, and mobile width.

Focus especially on:

- document detail
- generate test setup side panel
- test review layout
- publish page side panel
- assign employees table/list
- employee test-taking layout
- result page
- follow-up cards

Fix obvious layout breaks only.

### 11. Add small demo helper hints

Add short helper copy where it improves understanding.

Examples:

- This test was generated from selected document topics and source chunks.
- AI-generated questions stay in review until an admin approves them.
- Follow-up questions help employees check understanding after a wrong answer.

Keep hints short and product-focused.

### 12. Remove or reduce weak placeholders

Search for placeholder copy like:

- will be implemented next
- coming soon
- placeholder

For any placeholder inside the main demo path:

- replace it with a real lightweight mock state, or
- remove the CTA leading to it, or
- clearly mark it as out of scope

The final demo path should not rely on placeholder screens.

### 13. Add a demo script

Create:

```
context/demo-script.md
```

The script should explain the full demo route order and what each screen proves.

Suggested structure:

```markdown
# Ontera AI Demo Script

## Demo Goal

Show how internal documents become employee knowledge tests and feedback.

## Route Flow

1. Dashboard
2. Documents
3. Document Detail
4. Generate Test Setup
5. Test Review
6. Publish Test
7. Test Detail
8. Assign Test
9. Employee My Tests
10. Test Taking
11. Test Result
12. Follow-up Question

## Talking Points

...
```

Keep the script practical and short.

### 14. Update context documentation

Update:

- `context/progress-tracker.md`
- `context/history.md`

The progress tracker should show:

- Clickable Demo Polish completed
- no unfinished core MVP demo item unless intentionally left
- next up: README/demo preparation or backend planning

Add a short history note describing what was polished.

### 15. Optional: update README preview

If the README still looks generic or outdated, make a small update.

It should clearly say:

- what Ontera AI is
- what the current prototype demonstrates
- that the current version is mock frontend only
- how to run locally
- main demo flow

Do not write a huge README rewrite unless it is currently very weak.

## Do Not Implement

- no Supabase
- no real auth
- no real AI generation
- no real document upload
- no pgvector
- no embeddings
- no database writes
- no production permissions
- no new major feature
- no new animation library
- no large visual redesign
- no complex global state
- no backend routes

## Files Likely Involved

Across the demo path, expect touch points in:

- `src/app/` — route pages and navigation entry points
- `src/features/documents/` — document list, detail, generate test setup
- `src/features/tests/` — review, publish, list, detail, assign
- `src/features/employee/tests/` — my tests, take, result, follow-up
- `src/data/mock/` and feature-local mock files — consistent demo story
- `src/shared/ui/` — shared empty/loading states if reused
- `context/demo-script.md` — new demo script
- `context/progress-tracker.md`
- `context/history.md`
- `README.md` — optional small update

## Verification

- full demo path can be clicked from Dashboard to Follow-up Question Flow
- no main demo CTA leads to a confusing placeholder
- publish flow connects to test detail and assignment flow
- employee test-taking connects to result page
- result page connects to follow-up question interaction
- mock data feels consistent across core screens
- primary CTAs are visually clear
- invalid and empty states are handled
- user-facing copy consistently uses Tests
- admin and employee areas are clearly distinguishable
- main pages work on desktop and mobile widths
- no backend, AI, auth, or persistence is added
- `npm run lint` passes
- `npm run typecheck` passes
- `npm run format:check` passes
- `npm run build` passes if already reasonable for the project
- `context/progress-tracker.md` is updated
- `context/history.md` is updated
- `context/demo-script.md` is added

---

Next planned step: Final README and demo handoff preparation.
