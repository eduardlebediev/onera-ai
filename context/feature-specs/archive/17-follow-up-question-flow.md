# Feature Spec: Follow-up Question Flow

## Goal

Add a lightweight follow-up question flow to the employee test result experience.

The goal is to show how Ontera AI can act not only as a testing tool, but also as a simple AI tutor: when an employee answers incorrectly, the system explains the topic and asks one focused follow-up question to check understanding.

This task uses mock data only. No real AI generation, backend, Supabase, or persistence.

## Current State

The project already has:

- `/employee/tests`
- `/employee/tests/[id]/take`
- `/employee/tests/[id]/result`
- mock test questions
- mock result data
- weak topics
- answer review
- mock AI feedback

This task should extend the result/feedback experience with follow-up questions.

## User Flow

Employee completes test → Opens result page → Reviews wrong answers → Sees "Check understanding" action on incorrect answers → Opens follow-up question → Answers follow-up → Sees whether topic is now understood

## Requirements

### 1. Add follow-up entry point from result page

On `/employee/tests/[id]/result`, add a follow-up action for incorrect answers.

Example action:

```
Check understanding
```

Only show this action for incorrect answers or weak topics.

Do not show follow-up actions for correctly answered questions.

### 2. Create follow-up question UI

Create feature-local components, for example:

```
src/features/employee/tests/components/follow-up-question-card.tsx
src/features/employee/tests/components/follow-up-answer-feedback.tsx
```

Use existing feature structure if there is a better place.

The follow-up UI can appear:

- inline inside the answer review
- inside an expandable card
- or inside a simple panel on the result page

Do not create a complex new route unless it fits the current app structure better.

### 3. Show explanation before follow-up question

Before the follow-up question, show a short learning explanation.

The explanation should include:

- what the employee missed
- correct concept
- why it matters
- source topic

Example:

```
You missed the incident reporting escalation rule. The key idea is that security incidents must be reported immediately, even if the full impact is not clear yet.
```

### 4. Show one follow-up question

Each incorrect answer can have one mock follow-up question.

The follow-up question should show:

- question text
- answer options
- related topic
- source chunk reference
- difficulty
- learning goal

Support simple single-choice questions only for this MVP.

### 5. Add follow-up answer selection

Employee should be able to:

- select one answer
- change selected answer before submitting
- submit follow-up answer

Use local state only.

Do not persist the answer.

### 6. Show follow-up feedback

After submission, show result feedback:

If correct:

```
Topic understood
```

If incorrect:

```
Review recommended
```

Feedback should include:

- correct answer
- short explanation
- suggested next action

Example next actions:

```
Review source material
Back to results
Try another follow-up
```

For MVP, do not generate multiple follow-ups dynamically.

### 7. Add weak topic integration

In the weak topics section, show whether a follow-up was completed locally.

Example states:

```
Needs review
Follow-up completed
Topic understood
```

This state can be local UI state only.

### 8. Add mock follow-up data

Extend mock result/question data with follow-up questions.

Each follow-up item should include:

```ts
{
  id: string
  originalQuestionId: string
  topic: string
  sourceChunkReference: string
  explanationBeforeQuestion: string
  questionText: string
  options: Array<{ id: string; label: string }>
  correctOptionId: string
  explanationAfterAnswer: string
  learningGoal: string
  difficulty: "easy" | "medium" | "hard"
}
```

Keep mock data colocated with the employee tests feature.

### 9. Keep the scope lightweight

This is not full adaptive learning yet.

For this MVP:

- one follow-up per incorrect answer
- single-choice only
- local state only
- no real AI
- no persistence
- no complex learning path

## Design Requirements

Use current Ontera AI design system:

- Card
- Badge
- Button
- radio/selectable option pattern
- typography CSS classes
- responsive spacing tokens

The UI should feel supportive and educational.

Avoid punitive wording.

Use labels like:

```
Check understanding
Review recommended
Topic understood
```

## Do Not Implement

- no real AI tutor
- no adaptive difficulty engine
- no Supabase
- no database writes
- no real persistence
- no new backend routes
- no multi-step learning path
- no spaced repetition system
- no admin analytics for follow-ups

## Files Likely Involved

- `src/features/employee/tests/components/test-result-page.tsx` (extend)
- `src/features/employee/tests/components/follow-up-question-card.tsx` (new)
- `src/features/employee/tests/components/follow-up-answer-feedback.tsx` (new)
- `src/features/employee/tests/mock/` (extend)
- `context/progress-tracker.md`

## Verification

- incorrect answers show a follow-up entry action
- correct answers do not show follow-up actions
- follow-up explanation renders
- follow-up question renders from mock data
- employee can select an answer
- employee can submit a follow-up answer
- correct follow-up shows "Topic understood"
- incorrect follow-up shows "Review recommended"
- weak topic state updates locally after follow-up completion
- source chunk reference is visible
- no backend, AI, or persistence logic is added
- `npm run lint` passes
- `npm run typecheck` passes
- `npm run format:check` passes
- `context/progress-tracker.md` is updated
