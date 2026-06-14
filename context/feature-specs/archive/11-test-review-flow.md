# Feature Spec: Test Review Flow with Mock Generated Questions

## Goal

Create a review screen where an admin checks AI-generated test questions before publishing.

This step uses mock data only. No real AI generation, backend, or persistence.

## User Flow

Generate Test Setup → Generate Test Preview → Test Review → Approve / edit / reject questions → Continue to Publish Test

## Requirements

### 1. Create Test Review route

Create a route for reviewing generated questions, for example:

```
/tests/review
```

The route may accept query params from the setup screen:

```
/tests/review?documentId=[id]
```

Use mock generated questions connected to the selected document.

### 2. Show review page header

At the top of the page show:

- test title
- source document
- difficulty
- target role
- question count
- language
- review progress

Example progress:

```
4 of 8 questions approved
```

### 3. Show generated question cards

Each question card should display:

- question text
- answer options
- correct answer
- explanation
- topic
- source chunk reference
- tested skill
- pedagogical goal
- review status

Review statuses:

- needs_review
- approved
- rejected
- edited

### 4. Add review actions

Each question should support:

- Approve
- Reject
- Edit

For edit mode, allow local editing of:

- question text
- options
- correct answer
- explanation

No persistence is required. Use local state only.

### 5. Add quality metadata

Each question should show AI quality metadata:

- tested skill
- pedagogical goal
- source chunk
- difficulty
- why this question is useful

This should demonstrate that the system does not only generate questions, but also explains what each question is testing.

### 6. Add review summary panel

Add a summary panel showing:

- total questions
- approved questions
- rejected questions
- edited questions
- remaining questions
- source document
- selected topics

The summary should update from local state.

### 7. Add continue action

Add a primary action:

```
Continue to Publish
```

If no questions are approved, show a warning and disable or visually discourage continuing.

The action should navigate to the next route or placeholder:

```
/tests/publish
```

If the publish route does not exist yet, create a simple placeholder page:

```
Publish Test Flow will be implemented next.
```

### 8. Use mock data only

Create or extend mock data for:

- generated test questions
- answer options
- correct answers
- explanations
- topics
- source chunk references
- pedagogical goals
- tested skills
- review statuses

Keep mock data colocated with the tests feature if that structure exists.

## Design Requirements

Use existing Ontera AI design system:

- Card
- Badge
- Button
- Input / textarea if available
- typography CSS classes
- responsive spacing tokens

The page should feel like an admin quality-control interface, not a quiz-taking screen.

## Do Not Implement

- real AI calls
- Supabase
- database writes
- real persistence
- publish logic
- employee test-taking flow
- scoring logic
- pgvector / embeddings

## Files Likely Involved

- `src/app/tests/review/page.tsx`
- `src/features/tests/components/test-review-page.tsx`
- `src/features/tests/components/review-question-card.tsx`
- `src/features/tests/components/review-summary-panel.tsx`
- `src/data/mock/test-questions.ts`
- `context/progress-tracker.md`

## Verification

- `/tests/review` opens correctly
- mock generated questions render
- each question shows metadata and source chunk reference
- admin can approve a question
- admin can reject a question
- admin can edit a question locally
- review summary updates correctly
- continue action navigates to publish placeholder
- no backend or AI logic added
- `npm run lint` passes
- `npm run typecheck` passes
- `npm run format:check` passes
- `context/progress-tracker.md` is updated

---

Next planned step: **Publish Test Flow**.
