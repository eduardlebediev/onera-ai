# AI Workflow Rules

## Approach

Build this project incrementally using a context-driven and spec-driven workflow. The context files define what to build, how to build it, and the current state of progress. AI coding tools must implement against these specs and must not invent large product behavior from scratch.

## Scoping Rules

- Work on one feature unit at a time.
- Prefer small, verifiable increments over large speculative changes.
- Do not combine unrelated system boundaries in one implementation step.
- Do not implement features that are explicitly out of scope.
- If a feature does not support the core demo flow, postpone it.

## Required AI Workflow Before Code Changes

Before changing code, the AI assistant should:

1. Inspect relevant files.
2. Explain the intended change.
3. List files to create or modify.
4. Identify edge cases and risks.
5. Keep the implementation scope small.

For large or ambiguous changes, do not edit files immediately. First propose a plan.

## Implementation Rules

- Implement only the requested slice.
- Keep diffs small and reviewable.
- Do not introduce new dependencies without explaining why.
- Do not remove tests to make code pass.
- Do not ignore TypeScript or lint errors.
- Do not perform broad refactors unless explicitly requested.
- Do not modify unrelated UI or architecture.

## When to Split Work

Split an implementation step if it combines:

- UI changes and database schema changes
- AI prompt design and persistence logic
- Multiple unrelated API routes
- Refactoring and new behavior
- More than one core user flow
- Behavior not clearly defined in the context files

If a change cannot be verified end to end quickly, the scope is too broad — split it.

## Handling Missing Requirements

- Do not invent product behavior not defined in context files.
- If a requirement is ambiguous, add it as an open question in `progress-tracker.md`.
- If implementation requires changing scope, update `project-overview.md` or `architecture.md` first.
- If a technical decision affects future work, document it in `progress-tracker.md` or a dedicated decision note.

## AI Safety Rules

- Treat AI output as untrusted.
- Validate AI responses with Zod before use.
- Do not directly persist AI-generated subtasks.
- Always require user approval before saving AI suggestions.
- Do not generate or execute shell commands from AI output.
- Do not use real personal/customer data.
- Do not include secrets in prompts, code, or commits.

## Protected Files

Do not modify these unless explicitly instructed:

- `components/ui/*` or `src/shared/ui/*` generated shadcn components
- lock files except when dependencies intentionally change
- environment files containing secrets
- third-party library internals

## Keeping Docs in Sync

Update relevant context files whenever implementation changes:

- system architecture or boundaries
- storage model
- code conventions
- feature scope
- AI workflow or safety rules
- current progress and next steps (`progress-tracker.md`)
- implementation history (`context/history.md`) — detailed records for completed items

### Progress Tracking Format

- `context/progress-tracker.md`: only Current Goal, In Progress, Completed, Next Up, Open Questions. Completed section is short headers only.
- `context/decisions.md`: all architecture and design decisions. Newest first (highest number at top).
- `context/history.md`: store all detailed descriptions, file lists, and implementation notes per completed feature spec. Append new entries at the top.

## Before Moving to the Next Unit

1. Current unit works end to end within its defined scope.
2. No invariant in `architecture.md` was violated.
3. `progress-tracker.md` and `context/history.md` reflect the completed work.
4. Build, lint, and relevant tests pass or failures are documented.
