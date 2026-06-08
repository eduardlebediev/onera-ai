# Decisions

## 023 — Employee test results use colocated mock attempt records

The `/employee/tests/[id]/result` page lives in `src/features/employee/tests/` with colocated mock attempt records in `mock/test-results.ts`. Results merge assignment metadata, `mockTests` questions, and explicit attempt data (answers, weak topics, AI feedback). Score and pass/fail are derived from employee answers against question correct answers — not stored independently on attempt records. No state is passed from the take flow; both passed and failed states are represented via static mock records. KPI presentation uses keyed objects with explicit `tone` and `status` properties.

## 022 — Employee test-taking uses feature-local mock state and assignment gate

The `/employee/tests/[id]/take` flow lives in `src/features/employee/tests/` with colocated helpers and components. Only tests assigned to the demo employee (`emp-6`) are takeable; questions resolve from `mockTests`. Answer selection, navigation, progress, and local score calculation use client-side state only — no persistence or result-page state passing until the result spec lands.

## 021 — Employee My Tests uses dedicated feature module and mock current employee

The `/employee/tests` page lives in `src/features/employee/tests/` with colocated mock assignments for a fixed demo employee (`emp-6`). Assignment deadlines, scores, progress, and required flags are enriched in employee mock data while test metadata resolves from `mockTests`. Employee nav "My Tests" links to `/employee/tests`. Test-taking and result routes are placeholders only. Shared KPI tone styles live in `src/shared/lib/kpi-tone-styles.ts`.

## 020 — Assign test flow uses feature-local mock employees and client state

The `/tests/[id]/assign` flow uses colocated mock data in `src/features/tests/mock/employees.ts` for employee profiles and per-test assignment status. Assignment confirmation updates client-side state only — no Supabase or persistence. Employee selection uses accessible selectable rows (no checkbox primitive installed). Success navigation links to `/employee/tests` as the next planned employee route.

## 019 — Tests list/detail use colocated mock tests model

`mockTests` in `src/features/tests/mock/tests.ts` is the single source of truth for the tests list and test detail pages. Source document title and status are resolved from `mockDocuments` via `resolveMockTest()` — mock tests store only `documentId`, `topicsUsed`, and `chunksUsed`. KPI presentation metadata is keyed by stable ids (not index-mapped). Publish, archive, restore, and assignment actions remain mock/placeholder until backend slices land.

## 018 — Review question edits store correctAnswer as option text, not index

In the mock review edit flow, `correctAnswer` remains the option string value (aligned with `ReviewQuestion.correctAnswer`), not a numeric index. The edit UI uses a per-option selector button; when option text changes, the correct-answer pointer follows if that option was selected. On save, if the pointer no longer matches any option, it falls back to the first resolved option.

## 017 — Document model owns fileType and fileSizeMb; components must not hardcode per-ID metadata

`fileType` (pdf|docx|pptx|txt) and `fileSizeMb` are first-class fields on `MockDocumentDetail`. Components must read these from the model and must not maintain a per-document-ID mapping in component code. This ensures the table, detail page, and any drawer all render consistent, data-driven values with zero component-level hardcoding.

## 016 — Generate test setup stays mock-only with feature-local state

The `/documents/[id]/generate-test` flow uses client-side local state and `generate-test-model.ts` helpers only. No Supabase, AI calls, or persistence are added until the test generation backend slice is implemented. Topic and chunk selection stay synchronized in the UI (topic toggles related chunks; chunk select-all syncs topics).

## 015 — Dashboard KPI metadata should be keyed, not index-mapped

Analytics KPI presentation metadata (icon, value label, trend treatment, color intent) should be mapped by a stable key/label rather than array index. This prevents UI drift when KPI ordering changes from API or backend sorting.

## 014 — Add MODULE manifests for major feature folders

Major existing feature folders should include lightweight `MODULE.md` manifests that define ownership, boundaries, route scope, and future integration constraints. This improves navigation and reduces cross-feature drift for AI-assisted implementation.

## 013 — Use Tests instead of Quizzes

We use "Tests" as the product term because it sounds more appropriate for an enterprise employee knowledge platform. "Quiz" can feel too informal or game-like.

## 012 — Build mock frontend flow before backend

We build the clickable mock flow first to validate the product experience before adding Supabase, pgvector, AI calls, and persistence.

## 011 — Keep AI output behind admin review

AI-generated test questions must stay in draft/review state until an admin approves and publishes them.

## 010 — Tests-first terminology in context docs

All active context docs use "Tests" terminology (test_documents, test_assignments, test_attempts, test generation, test review) to reduce ambiguity for AI agents.

## 009 — Document detail uses shadcn Tabs for navigation

The document detail page uses shadcn `Tabs` component for tabbed navigation between Overview, Extracted Text, Topics, Metadata, and Versions.

## 008 — shadcn/ui components live in src/shared/ui

All shadcn/ui generated components are placed in `src/shared/ui/`. `components.json` aliases (`components` → `@/shared`, `ui` → `@/shared/ui`) ensure future `shadcn add` commands generate into the same directory.

## 007 — shadcn v4 base-nova style

shadcn v4.10.0 uses the `base-nova` style (the renamed "New York" style). Underlying design tokens and component approach are equivalent to previous versions.

## 006 — Tailwind v4 oklch with hsl compatibility

Tailwind v4 uses oklch colors natively. Ontera AI palette tokens use `hsl()` format in CSS custom properties, which is fully compatible with the `@theme inline` mapping.

## 005 — Mock role context without auth wiring

`src/shared/lib/role-context.tsx` uses React Context + `useState` to toggle between Admin and Employee roles client-side. No auth integration yet.

## 004 — Semantic color tokens replace hardcoded hex

Shell colors use `bg-foreground`, `text-background`, `bg-background` tokens. `--primary` is aligned to brand orange (`oklch(0.659 0.189 40)` ≈ `#eb5f24`). No brand-specific tokens (e.g. `navbar-black`) were introduced.

## 003 — Drawer scroll via inner wrapper

Document drawer scroll behaviour is stabilised by constraining drawer height and moving scrolling to an inner `overscroll-contain` wrapper, preventing page background scroll interference.

## 002 — Status badge aligned with actions

Document detail header layout places the status badge aligned with top action controls, not crowding the title line.

## 001 — Grid spacing convention

Card grids use `gap-2` (matching dashboard). Vertical section spacing uses `gap-6`. Document detail card stacks use `space-y-2`.
