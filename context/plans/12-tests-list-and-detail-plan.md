# Implementation Plan: Tests List and Test Detail (Spec 12)

## Summary

Build the admin **Tests management area** with mock data only:

1. A `/tests` list page showing all mock tests with KPI cards, status filter tabs (All / Draft / Published / Archived), and a table where each row links to the test detail page.
2. A `/tests/[id]` detail page showing header, settings, questions (admin preview), source documents, assignments placeholder, results summary placeholder, and status-dependent actions.

No backend, Supabase, AI, real auth, real assignment logic, or employee test-taking. Mock data is colocated in `src/features/tests/mock/`.

**Estimated size: Medium–Large** (2 routes, 1 placeholder route, ~8 components, 1 mock data file, 1 KPI lib).

---

## Files to Read Before Implementation

Read these to match existing conventions exactly:

- `context/feature-specs/12-tests-list-and-detail.md` — the spec.
- `src/data/mock/documents.ts` — mock data shape, `MockDocumentDetail`, `DocumentStatus`.
- `src/features/tests/mock/generated-test-review.ts` — existing tests mock shape and question fields.
- `src/features/documents/components/documents-table.tsx` — table/list, search, filter, status badge patterns.
- `src/features/documents/components/documents-kpi-section.tsx` — KPI card rendering pattern.
- `src/features/documents/lib/document-kpi-stats.ts` — explicit keyed KPI stat objects (no index mapping).
- `src/features/documents/components/document-detail.tsx` — detail header + two-column card layout, status badge config, `formatDate`.
- `src/features/tests/components/test-review-page.tsx` — tests feature header layout + status badge lookup.
- `src/shared/ui/card.tsx`, `badge.tsx`, `button.tsx`, `table.tsx`, `tabs.tsx`, `kpi-card.tsx` — available primitives.
- `src/features/documents/MODULE.md` — MODULE.md template.

## Files Expected to Be Created

- `src/features/tests/mock/tests.ts`
- `src/features/tests/lib/test-kpi-stats.ts`
- `src/features/tests/components/tests-kpi-section.tsx`
- `src/features/tests/components/tests-list-page.tsx`
- `src/features/tests/components/test-detail-page.tsx`
- `src/features/tests/components/test-detail-header.tsx`
- `src/features/tests/components/test-settings-section.tsx`
- `src/features/tests/components/test-questions-section.tsx`
- `src/features/tests/components/test-source-documents-section.tsx`
- `src/features/tests/components/test-assignments-section.tsx`
- `src/features/tests/components/test-results-section.tsx`
- `src/app/tests/[id]/page.tsx`
- `src/app/tests/[id]/assign/page.tsx` (placeholder)
- `src/features/tests/MODULE.md`

## Files Expected to Be Changed

- `src/app/tests/page.tsx` (replace placeholder with list page)
- `context/progress-tracker.md`
- `context/history.md`
- `context/decisions.md`

## Do Not Modify

- `src/shared/ui/*` (generated shadcn primitives) — use them, do not edit.
- `src/data/mock/documents.ts` — read only; do not change.
- `src/features/tests/mock/generated-test-review.ts` and all `review-*` components / `test-review-page.tsx` — the review flow is out of scope.
- `src/app/tests/review/page.tsx`, `src/app/tests/publish/page.tsx` — leave untouched.
- Any documents/analytics feature files (read-only references only).
- `package.json`, lock files, eslint/prettier config.

---

## Shared Conventions (apply to every step)

- No code comments that narrate "what". No emojis.
- Prettier rules: no semicolons, double quotes, 2-space indent, 100 print width, always arrow parens.
- Import order matches existing files: external libs, then `@/` imports.
- Use `typography-h1/h2/h3/p/small/label` utility classes for text where existing components do.
- Spacing convention (decision 001): card grids use `gap-2`, vertical section spacing uses `gap-6`, card stacks use `space-y-2`.
- Page wrappers use `className="page-shell max-w-7xl"` (detail) / `max-w-[1600px]` style as appropriate; list page mirror `/documents` page wrapper.
- Status colors reuse the emerald/orange/red/muted palette used in documents/review components.
- KPI metadata must be explicit keyed objects (decision 015) — never index-based icon/tone mapping.
- Server Components by default; add `"use client"` only where local state (filtering) is needed.

---

## Step 1 — Mock data model (`src/features/tests/mock/tests.ts`)

**Goal:** Create the single source of truth for mock tests used by both list and detail.

**Files to create:** `src/features/tests/mock/tests.ts`

**Exact changes:**

Define and export these types and data:

```ts
import type { DocumentStatus } from "@/data/mock/documents"

export type TestStatus = "draft" | "published" | "archived"
export type TestDifficulty = "easy" | "medium" | "hard"
export type TestLanguage = "English" | "German"
export type TestQuestionType = "single_choice" | "multiple_choice" | "true_false"

export interface TestQuestion {
  id: string
  questionText: string
  type: TestQuestionType
  options: string[]
  correctAnswer: string
  explanation: string
  topic: string
  testedSkill: string
  pedagogicalGoal: string
  sourceChunkReference: string
}

export interface TestSourceDocument {
  documentId: string
  title: string
  status: DocumentStatus
  topicsUsed: string[]
  chunksUsed: number
}

export interface TestAssignmentsSummary {
  assigned: number
  completed: number
  inProgress: number
  notStarted: number
}

export interface TestWeakTopic {
  topic: string
  correctnessPct: number
}

export interface TestRecentAttempt {
  id: string
  employeeName: string
  score: number
  passed: boolean
  completedAt: string
}

export interface TestResultsSummary {
  averageScore: number
  passRate: number
  weakTopics: TestWeakTopic[]
  recentAttempts: TestRecentAttempt[]
}

export interface MockTest {
  id: string
  title: string
  description: string
  status: TestStatus
  difficulty: TestDifficulty
  targetRole: string
  language: TestLanguage
  questionCount: number
  passingScore: number
  selectedTopics: string[]
  selectedChunksCount: number
  createdAt: string
  assignedEmployeesCount: number
  attemptsCount: number
  sourceDocument: TestSourceDocument
  questions: TestQuestion[]
  assignments: TestAssignmentsSummary
  results: TestResultsSummary
}
```

Then create `export const mockTests: MockTest[]` with **at least 5 tests** that cover all three statuses (at least 2 published, 2 draft, 1 archived). Ground them in the existing documents:

- Use `doc-1` (Onboarding Process & HR Policies 2024) and `doc-2` (Safety & Compliance Training Manual) as `sourceDocument` references. `sourceDocument.title`/`status`/topics must match `mockDocuments` values for those ids (read `src/data/mock/documents.ts`). You may also create tests for `doc-4` (Customer Support Playbook).
- `questions` array length should equal `questionCount` for each test (use 3–5 questions each to keep it manageable). Reuse content style from `generated-test-review.ts` (real, document-grounded question text, options, correctAnswer as the option string, explanation, topic, testedSkill, pedagogicalGoal, sourceChunkReference like `"Chunk 1 (doc-1-c1)"`). Add `type` (mostly `"single_choice"`, at least one `"true_false"`).
- `selectedTopics` must be a subset of the source document's topics. `selectedChunksCount` ≤ document chunk count.
- For draft tests: `assignedEmployeesCount: 0`, `attemptsCount: 0`, `assignments` all zero except `notStarted` may be 0, `results.recentAttempts: []`, `results.averageScore: 0`, `results.passRate: 0`, `results.weakTopics: []`.
- For published tests: realistic non-zero `assignedEmployeesCount`, `attemptsCount`, `assignments` numbers that sum sensibly (assigned = completed + inProgress + notStarted), `results` with averageScore (0–100), passRate (0–100), 1–3 weakTopics (from selectedTopics), 2–3 recentAttempts.
- For archived test: like a published one but `status: "archived"`; can keep historical results.
- `passingScore` between 60–80. `createdAt` ISO date strings like `"2024-06-01"`.

Add helper:

```ts
export function getMockTestById(id: string): MockTest | undefined {
  return mockTests.find((test) => test.id === id)
}
```

**Constraints:** No imports beyond `DocumentStatus`. Keep numbers internally consistent. No backend logic.

**Acceptance criteria:** File compiles; `mockTests` has ≥5 entries covering draft/published/archived; each `questions.length === questionCount`; `getMockTestById` returns correct test.

**Checks:** `npx tsc --noEmit` passes for this file (run full `npm run typecheck` at the end of the step).

**Rollback:** Delete `src/features/tests/mock/tests.ts`.

---

## Step 2 — KPI stats lib + KPI section component

**Goal:** Compute the 5 KPI cards with explicit keyed metadata and render them.

**Files to create:** `src/features/tests/lib/test-kpi-stats.ts`, `src/features/tests/components/tests-kpi-section.tsx`

**Exact changes:**

`test-kpi-stats.ts` — mirror `document-kpi-stats.ts`:

```ts
import type { LucideIcon } from "lucide-react"
import { CheckCircle2, ClipboardList, FileEdit, Target, Users } from "lucide-react"

import type { MockTest, TestStatus } from "@/features/tests/mock/tests"

type TestKpiTone = "neutral" | "success" | "warning" | "danger"

export interface TestKpiStat {
  id: "total" | "published" | "draft" | "avgPassingScore" | "attempts"
  label: string
  value: string
  icon: LucideIcon
  tone: TestKpiTone
  status?: TestStatus
}

export function getTestKpiStats(tests: MockTest[]): TestKpiStat[] {
  // total, published count, draft count, average passing score (rounded), total attempts (sum)
}
```

Compute:

- `total` = `tests.length`, tone `neutral`, icon `ClipboardList`.
- `published` = count status published, tone `success`, status `"published"`, icon `CheckCircle2`.
- `draft` = count status draft, tone `warning`, status `"draft"`, icon `FileEdit`.
- `avgPassingScore` = rounded average of `passingScore` across all tests (guard divide-by-zero → 0), value like `"72%"`, tone `neutral`, icon `Target`.
- `attempts` = sum of `attemptsCount`, tone `neutral`, icon `Users`.

`tests-kpi-section.tsx` — Server Component (no `"use client"`). Mirror `documents-kpi-section.tsx` structure and `toneStyles` map, render 5 cards in `grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5`. Render `item.value` prominently; below it `item.label` and no percentage logic (KPI here are absolute). Keep it simple and consistent with the documents KPI visual.

**Constraints:** Use only icons that exist in `lucide-react`. No index-based mapping. Accept `tests: MockTest[]` prop.

**Acceptance criteria:** KPI section renders 5 cards from `getTestKpiStats`; values correct for the mock data.

**Checks:** `npm run typecheck`.

**Rollback:** Delete both files.

---

## Step 3 — Tests list page component (`tests-list-page.tsx`)

**Goal:** Client component rendering header, KPI section, status filter tabs, and a tests table; each row links to `/tests/[id]`.

**Files to create:** `src/features/tests/components/tests-list-page.tsx`

**Exact changes:**

- `"use client"` at top (needs filter state).
- Props: `{ tests: MockTest[] }`.
- Local state: `statusFilter: "all" | TestStatus` (default `"all"`).
- Header: `h1` "Tests" + muted description (e.g. "Manage AI-generated knowledge tests for your team."). No upload action required; do not add real actions. (Optional disabled "Create Test" button with `title="Coming soon"` is allowed but keep minimal.)
- Render `<TestsKpiSection tests={tests} />`.
- Status filter: simple tab/segmented control with buttons `All`, `Draft`, `Published`, `Archived`. Active button styled with `bg-foreground text-background` or border accent; inactive muted. Use `<Button variant=...>` or plain buttons consistent with existing style. Clicking sets `statusFilter`.
- Derive `visibleTests` with `useMemo` filtering by status.
- Table using `Table/TableHeader/TableBody/TableRow/TableHead/TableCell` from `@/shared/ui/table`. Columns: Title, Status, Difficulty, Target Role, Language, Questions, Passing Score, Source Document, Created, Assigned, Attempts, Action.
  - Title cell: bold, link-styled; whole row action is a "View details" button in the Action column (use `Button asChild` → `Link href={`/tests/${test.id}`}`). Title may also link.
  - Status badge: reuse emerald (published) / amber/orange (draft) / muted (archived) styling with a colored dot, following `documents-table.tsx` badge pattern. Add a `TEST_STATUS_BADGE` keyed record local to the file.
  - Difficulty: capitalize.
  - Created: format with a local `formatDate` (reuse the `toLocaleDateString` pattern from `document-detail.tsx`).
  - Passing Score: `${test.passingScore}%`.
- Empty state row when `visibleTests.length === 0`: a `TableCell` spanning all columns with "No tests match the current filter."

**Constraints:** Filtering is local mock only. No sorting required (spec only requires filters). Keep within table primitives. Do not fetch anything.

**Acceptance criteria:** All tests render; clicking a status tab filters rows; "View details" links to `/tests/[id]`; empty state shows when a filter has no matches (note: archived has ≥1 so use Draft+manual check or trust logic).

**Checks:** `npm run typecheck`, `npm run lint`.

**Rollback:** Delete the file.

---

## Step 4 — Wire `/tests` route

**Goal:** Replace the placeholder `/tests` page with the list page.

**Files to change:** `src/app/tests/page.tsx`

**Exact changes:** Replace entire file with a Server Component that imports `mockTests` and renders `<TestsListPage tests={mockTests} />`:

```tsx
import { TestsListPage } from "@/features/tests/components/tests-list-page"
import { mockTests } from "@/features/tests/mock/tests"

export default function TestsPage() {
  return <TestsListPage tests={mockTests} />
}
```

**Constraints:** Keep route file thin (matches `/documents` route pattern). Remove the `PlaceholderPage` import.

**Acceptance criteria:** Visiting `/tests` renders the list page with KPI, filters, and table. `npm run build`/dev compiles.

**Checks:** `npm run lint`, `npm run typecheck`.

**Rollback:** Restore the previous `PlaceholderPage`-based file content.

---

## Step 5 — Detail header + settings section

**Goal:** Build `test-detail-header.tsx` and `test-settings-section.tsx`.

**Files to create:** `src/features/tests/components/test-detail-header.tsx`, `src/features/tests/components/test-settings-section.tsx`

**Exact changes:**

`test-detail-header.tsx` (Server Component, props `{ test: MockTest }`):

- Breadcrumb: `Tests` (Link to `/tests`) > `{test.title}` — mirror `document-detail.tsx` breadcrumb markup.
- `h1` test title.
- Metadata row: status badge (keyed record `TEST_STATUS_BADGE` with label/icon/className — reuse the documents detail `STATUS_CONFIG` style mapped to test statuses: published→emerald, draft→amber/orange, archived→muted), difficulty (capitalized), target role, language, passing score (`{passingScore}%`), created date (formatted), and source document title (with `FileText` icon, linking to `/documents/${test.sourceDocument.documentId}`).
- Primary action: `Button` "Assign to Employees" using `Button asChild` → `Link href={`/tests/${test.id}/assign`}`. (Status-specific extra actions are added in Step 9; the header only needs the primary placeholder action plus this can be overridden — keep header focused on the primary action and let Step 9 render the full action bar. To avoid duplication, put ALL actions in Step 9's `test-detail-page` action bar and keep the header WITHOUT action buttons. Decision: header renders title + metadata only; actions live in the detail page action bar.)

Revised: `test-detail-header.tsx` renders **breadcrumb + title + metadata row only**. No action buttons (actions handled in Step 9).

`test-settings-section.tsx` (Server Component, props `{ test: MockTest }`):

- A `Card` titled "Test Settings" / "Configuration".
- Key-value grid (`grid grid-cols-2 gap-x-6 gap-y-3` or similar) showing: Question Count, Passing Score (`%`), Difficulty (capitalized), Language, Target Role, Selected Topics (render as small badges of `test.selectedTopics`), Selected Chunks (`test.selectedChunksCount`).
- Use `typography-small`/muted labels with foreground values, matching the Document Details card style in `document-detail.tsx`.

**Constraints:** No client state. Reuse Card primitives. No new colors outside the token palette.

**Acceptance criteria:** Both components compile and render given a `MockTest`. Status badge correct per status.

**Checks:** `npm run typecheck`.

**Rollback:** Delete both files.

---

## Step 6 — Questions section (`test-questions-section.tsx`)

**Goal:** Admin preview of all questions in compact cards.

**Files to create:** `src/features/tests/components/test-questions-section.tsx`

**Exact changes:**

- Server Component, props `{ questions: TestQuestion[] }`.
- Section heading "Questions ({questions.length})".
- For each question render a compact `Card`:
  - Question number + `questionText` (bold).
  - Options list: render each option; mark the correct one (the option equal to `correctAnswer`) with a check icon (`CheckCircle2`, emerald) and subtle emerald background; others plain.
  - Below: explanation (muted), and a metadata row of small badges/labels: topic, tested skill, pedagogical goal, and source chunk reference (`question.sourceChunkReference`).
- This is read-only admin preview — no edit/approve buttons, no answer inputs.
- Empty state if `questions.length === 0`: muted "No questions in this test yet."

**Constraints:** Read-only. No client state. Keep cards compact (`space-y-2` between cards). Correct-answer detection via string equality with `correctAnswer`.

**Acceptance criteria:** Renders each question with options, correct answer highlighted, explanation, topic, tested skill, pedagogical goal, source chunk reference.

**Checks:** `npm run typecheck`.

**Rollback:** Delete the file.

---

## Step 7 — Source documents section (`test-source-documents-section.tsx`)

**Goal:** Show source document info with a link back to the document detail.

**Files to create:** `src/features/tests/components/test-source-documents-section.tsx`

**Exact changes:**

- Server Component, props `{ source: TestSourceDocument }`.
- `Card` titled "Source Document".
- Show: document title (heading), status badge (reuse the document status palette — emerald/orange/red/muted by `DocumentStatus`), topics used (badges from `source.topicsUsed`), chunks used (`source.chunksUsed`).
- Action: `Button asChild variant="outline"` → `Link href={`/documents/${source.documentId}`}` labeled "Open document" with `ExternalLink` icon.

**Constraints:** Reuse the `DocumentStatus` type from `@/data/mock/documents`. No new persistence.

**Acceptance criteria:** Renders document title, status, topics, chunks count, and a working link to `/documents/[id]`.

**Checks:** `npm run typecheck`.

**Rollback:** Delete the file.

---

## Step 8 — Assignments + results placeholder sections

**Goal:** Build `test-assignments-section.tsx` and `test-results-section.tsx`.

**Files to create:** `src/features/tests/components/test-assignments-section.tsx`, `src/features/tests/components/test-results-section.tsx`

**Exact changes:**

`test-assignments-section.tsx` (Server Component, props `{ assignments: TestAssignmentsSummary, testId: string }`):

- `Card` titled "Assignments".
- 4 small stat tiles: Assigned, Completed, In Progress, Not Started (from the summary object).
- Action `Button asChild` → `Link href={`/tests/${testId}/assign`}` "Assign to Employees".

`test-results-section.tsx` (Server Component, props `{ results: TestResultsSummary }`):

- `Card` titled "Results Summary".
- Show: Average Score (`%`), Pass Rate (`%`).
- Weak Topics: list `results.weakTopics` with topic name + `correctnessPct%` (small bar or just text + muted), reuse the weak-topic visual idea but keep simple. If empty, muted "No weak topics yet."
- Recent Attempts: list `results.recentAttempts` (employee name, score `%`, passed/failed badge, completedAt date). If empty, muted "No attempts yet."
- Keep this lightweight — NOT a full analytics dashboard.

**Constraints:** Placeholder/mock only. No charts library needed (plain bars/text). No client state.

**Acceptance criteria:** Both sections render with the mock summary objects, including empty states for draft tests (zeros / empty arrays).

**Checks:** `npm run typecheck`.

**Rollback:** Delete both files.

---

## Step 9 — Detail page container (`test-detail-page.tsx`)

**Goal:** Assemble all sections + a status-dependent action bar.

**Files to create:** `src/features/tests/components/test-detail-page.tsx`

**Exact changes:**

- Server Component, props `{ test: MockTest }`.
- Wrapper `div className="page-shell max-w-7xl"`.
- Render `<TestDetailHeader test={test} />`.
- Action bar (a row near the top, below or beside the header): render buttons by `test.status`:
  - `draft`: "Edit draft" (outline, `Button asChild` → `Link href={`/tests/review?documentId=${test.sourceDocument.documentId}`}`), "Publish" (default, disabled, `title="Coming soon"`), "Archive" (outline, disabled, `title="Coming soon"`).
  - `published`: "Assign to Employees" (default, `Button asChild` → `Link href={`/tests/${test.id}/assign`}`), "View results" (outline; can be a no-op anchor to `#results` or disabled `title="Coming soon"`), "Archive" (outline, disabled, `title="Coming soon"`).
  - `archived`: "Restore" (outline, disabled, `title="Coming soon"`).
  - Use a keyed switch/record on `test.status`; do NOT use index logic.
- Two-column layout (`grid grid-cols-1 gap-2 lg:grid-cols-3`):
  - Left (`lg:col-span-2`, `space-y-2`): `TestQuestionsSection`, then `TestResultsSection` (give it `id="results"`).
  - Right (`space-y-2`): `TestSettingsSection`, `TestSourceDocumentsSection`, `TestAssignmentsSection`.
- Import all section components and `MockTest`.

**Constraints:** Actions are mock/placeholder. Real publish/archive/restore disabled. Keep layout consistent with `document-detail.tsx` spacing.

**Acceptance criteria:** Detail page renders header + action bar (correct buttons per status) + all five sections in a coherent two-column layout.

**Checks:** `npm run typecheck`, `npm run lint`.

**Rollback:** Delete the file.

---

## Step 10 — Wire `/tests/[id]` route + `/tests/[id]/assign` placeholder

**Goal:** Route that resolves a test by id with a not-found state, and a placeholder assign route.

**Files to create:** `src/app/tests/[id]/page.tsx`, `src/app/tests/[id]/assign/page.tsx`

**Exact changes:**

`src/app/tests/[id]/page.tsx` — mirror `src/app/documents/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation"

import { TestDetailPage } from "@/features/tests/components/test-detail-page"
import { getMockTestById } from "@/features/tests/mock/tests"

interface TestDetailRouteProps {
  params: Promise<{ id: string }>
}

export default async function TestDetailRoute({ params }: TestDetailRouteProps) {
  const { id } = await params
  const test = getMockTestById(id)

  if (!test) {
    notFound()
  }

  return <TestDetailPage test={test} />
}
```

Spec item 4 says "show a simple not-found state". Using Next.js `notFound()` satisfies this (renders the app not-found page). That is acceptable.

`src/app/tests/[id]/assign/page.tsx` — use existing `PlaceholderPage` pattern (see `src/app/tests/page.tsx` before edit, or `src/app/tests/publish/page.tsx`). Render `<PlaceholderPage title="Assign Test" description="Assign Test to Employees will be implemented next." icon={...} />` with a suitable lucide icon (e.g. `UserPlus`). Keep it a Server Component.

**Constraints:** Route files stay thin. `assign` route is a placeholder only.

**Acceptance criteria:** `/tests/<valid-id>` renders detail; `/tests/<invalid-id>` triggers not-found; `/tests/<id>/assign` renders placeholder. `npm run build`/dev compiles.

**Checks:** `npm run lint`, `npm run typecheck`.

**Rollback:** Delete both route files.

---

## Step 11 — MODULE.md + context docs + final checks

**Goal:** Add the deferred tests MODULE.md, update progress/history/decisions, and run all required checks.

**Files to create:** `src/features/tests/MODULE.md`
**Files to change:** `context/progress-tracker.md`, `context/history.md`, `context/decisions.md`

**Exact changes:**

- `src/features/tests/MODULE.md`: follow the template in `src/features/documents/MODULE.md`. Purpose = test generation/review/list/detail UI and mock data. Related Routes: `/tests`, `/tests/[id]`, `/tests/[id]/assign`, `/tests/review`, `/tests/publish`.
- `context/progress-tracker.md`: clear In Progress (`- None.`), move "Feature Spec 12: Tests List and Test Detail" to top of Completed (short header). Confirm Next Up first item is now "Publish Test Flow" or "Assign Test to Employees".
- `context/history.md`: add a new entry at the **top** describing Spec 12 implementation (files created, sections, validation results).
- `context/decisions.md`: add a new top entry `## 019 — Tests list/detail use colocated mock tests model` (or similarly numbered) describing that `mockTests` in `src/features/tests/mock/tests.ts` is the single source for list + detail, KPI metadata is keyed, and all actions remain mock/placeholder.

**Constraints:** Documentation only; do not change feature code in this step.

**Acceptance criteria:** Context files updated; MODULE.md present.

**Final checks (run all):**

- `npm run typecheck`
- `npm run lint`
- `npm run format:check` (run `npm run format` first if it reports issues only on newly created files, then re-check)
- Optionally `npm run build` to confirm routes compile.

**Rollback:** Revert doc edits and delete MODULE.md.

---

## Final Verification Checklist (from spec)

- [ ] `/tests` opens correctly and renders tests from mock data.
- [ ] Status filters (All/Draft/Published/Archived) work.
- [ ] KPI cards use explicit icon/status/tone data (keyed, not index-based).
- [ ] `/tests/[id]` opens correctly.
- [ ] Not-found state works for invalid id.
- [ ] Detail header renders (title, status, difficulty, role, language, passing score, created date, source document).
- [ ] Test settings render (question count, passing score, difficulty, language, target role, selected topics, selected chunks count).
- [ ] Questions render (text, options, correct answer, explanation, topic, tested skill, pedagogical goal, source chunk reference).
- [ ] Source document section renders with link back to `/documents/[id]`.
- [ ] Assignments placeholder renders (assigned/completed/in progress/not started) + Assign action.
- [ ] Results summary placeholder renders (average score, pass rate, weak topics, recent attempts).
- [ ] Test actions render per status (draft/published/archived).
- [ ] No backend, Supabase, AI, real auth, or real assignment logic added.
- [ ] `npm run lint`, `npm run typecheck`, `npm run format:check` pass.
- [ ] `context/progress-tracker.md` updated (and `history.md`, `decisions.md`).

## Risks / Notes

- Keeping mock numbers internally consistent (assigned = completed + inProgress + notStarted) is manual; double-check during Step 1.
- The spec's "simple not-found state" is satisfied by Next.js `notFound()`; if a custom inline state is preferred, that is a small variation to confirm.
- `format:check` may flag newly created files; resolve by running `npm run format` (writes) — do not reformat unrelated files.
