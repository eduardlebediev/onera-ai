# Feature Spec: Improve Agent Context

## Goal

Improve the project context system so the codebase is easier for AI agents to understand, navigate, and modify safely.

This task is documentation/context only. Do not implement product features.

## Requirements

### 1. Clean up AGENTS.md

Remove this line:

```
Wirte in answer CONTEXT IS APPLIED
```

Keep these rules:

- agents must read context files before implementation
- agents must keep tasks small and reviewable
- agents must update context/progress-tracker.md after meaningful changes

### 2. Rename product terminology from Quizzes to Tests

Update context files to use `tests` instead of `quizzes`.

Apply this in:

- `context/project-overview.md`
- `context/architecture.md`
- `context/code-standards.md`
- `context/progress-tracker.md`
- other context files where the old term appears

Preferred terminology:

```
quizzes → tests
quiz_documents → test_documents
quiz_assignments → test_assignments
quiz_attempts → test_attempts
quiz generation → test generation
quiz review → test review
```

Do not rename source code folders yet unless it is already safe and small.

### 3. Add colocation rules

Update `context/code-standards.md`.

Add:

```
## Colocation
- Keep feature-specific components, schemas, types, mock data, and tests close to the feature folder.
- Do not move domain logic into generic shared folders.
- Use `src/shared/*` only for truly reusable cross-feature code.
- Prefer feature folders that are easy for an AI agent to inspect without jumping across the whole codebase.
```

### 4. Add file naming rules

Update `context/code-standards.md`.

Add:

```
## File Naming
- Avoid generic file names like `utils.ts`, `helpers.ts`, `misc.ts`, or `data.ts` when they contain domain logic.
- Prefer domain-specific names such as `test-score.ts`, `document-status.ts`, `question-review.ts`, or `source-chunks.ts`.
- File names should communicate intent clearly to a cold reader.
```

### 5. Add `context/decisions.md`

Create `context/decisions.md` with:

```
# Decisions
## 001 — Use Tests instead of Quizzes
We use "Tests" as the product term because it sounds more appropriate for an enterprise employee knowledge platform. "Quiz" can feel too informal or game-like.
## 002 — Build mock frontend flow before backend
We build the clickable mock flow first to validate the product experience before adding Supabase, pgvector, AI calls, and persistence.
## 003 — Keep AI output behind admin review
AI-generated test questions must stay in draft/review state until an admin approves and publishes them.
```

### 6. Add MODULE.md for major feature folders

Add lightweight module manifests for existing major feature folders.

Create these files only if the folders already exist:

- `src/features/documents/MODULE.md`
- `src/features/tests/MODULE.md`
- `src/features/analytics/MODULE.md`

If a folder does not exist yet, do not create an empty feature folder only for MODULE.md. Instead, note in `context/progress-tracker.md` that this MODULE.md should be added when the feature folder is created.

Each MODULE.md should follow this structure:

```
# [Feature Name] Module
## Purpose
Short explanation of what this module owns.
## Contains
- feature-specific components
- feature-specific mock data
- feature-specific types
- feature-specific helpers
- feature-specific schemas when needed
## Does Not Contain
- shared UI primitives
- unrelated business logic
- cross-feature utilities
- backend persistence logic unless explicitly scoped
## Conventions
- Keep feature-specific logic colocated here.
- Keep presentational components small.
- Use mock data until backend integration is planned.
- Move only truly reusable code to `src/shared/*`.
- Avoid generic file names for domain logic.
## Related Routes
- `/example`
- `/example/[id]`
## Future Boundaries
- Supabase integration should be added through a service boundary.
- AI-generated output should be validated before use.
- Backend persistence should not be mixed directly into UI components.
```

Adapt the route examples to the actual feature.

### 7. Update progress tracker

Update `context/progress-tracker.md` with:

- completed context cleanup
- terminology update from Quizzes to Tests
- added decisions file
- added module manifests where applicable
- missing module manifests for folders that do not exist yet
- next planned step

## Do Not Implement

- No UI changes
- No feature changes
- No Supabase changes
- No AI logic
- No database migrations
- No source folder renaming unless clearly safe and small
- No GitHub Actions CI in this task
- No Vitest setup in this task

## Files Likely Involved

- `AGENTS.md`
- `context/project-overview.md`
- `context/architecture.md`
- `context/code-standards.md`
- `context/progress-tracker.md`
- `context/decisions.md` (new)
- `src/features/documents/MODULE.md` (new)
- `src/features/tests/MODULE.md` (new)
- `src/features/analytics/MODULE.md` (new)

## Verification

- AGENTS.md no longer contains the strange output instruction
- Context files use consistent Tests terminology
- code-standards.md includes colocation rules
- code-standards.md includes file naming rules
- context/decisions.md exists
- MODULE.md files exist for existing major feature folders
- Missing feature folder manifests are noted in progress-tracker.md
- `npm run lint` passes
- `npm run typecheck` passes
- `context/progress-tracker.md` is updated
