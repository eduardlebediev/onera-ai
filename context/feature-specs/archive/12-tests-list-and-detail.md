# Feature Spec: Tests List and Test Detail

## Goal

Create the main Tests management area where an admin can view all tests and open a full test detail page.

This step uses mock data only. No backend, Supabase, or real persistence.

## User Flow

Publish Test Flow → Open Test Detail → View published test → Return to Tests List → Open other tests

## Requirements

### 1. Create Tests List route

Create or update:

```
/tests
```

The page should show all mock tests.

Each test item should show:

- test title
- status: draft / published / archived
- difficulty
- target role
- language
- question count
- passing score
- source document
- created date
- assigned employees count
- attempts count
- action: View details

### 2. Add filtering / simple tabs

Add simple status filters:

- All
- Draft
- Published
- Archived

Filtering should work with local mock data only.

### 3. Add Tests KPI section

At the top of the page show small KPI cards:

- Total tests
- Published tests
- Draft tests
- Average passing score
- Total attempts

Use explicit data objects for KPI cards:

```
{
  label: "Published Tests",
  value: 8,
  icon: CheckCircle,
  tone: "success",
  status: "published"
}
```

Do not use index-based icon mapping or text-based logic.

### 4. Create Test Detail route

Create:

```
/tests/[id]
```

The page should load a test from mock data.

If test id does not exist, show a simple not-found state.

### 5. Show Test Detail header

Display:

- test title
- status badge
- difficulty
- target role
- language
- passing score
- created date
- source document
- primary action placeholder: Assign to Employees

### 6. Show test settings

Add a section with test configuration:

- question count
- passing score
- difficulty
- language
- target role
- selected topics
- selected chunks count

### 7. Show questions section

Display the test questions in compact cards.

Each question should show:

- question text
- options
- correct answer
- explanation
- topic
- tested skill
- pedagogical goal
- source chunk reference

This is admin preview, not employee test-taking UI.

### 8. Show source documents section

Display source document information:

- document title
- document status
- topics used
- chunks used
- link back to document detail

### 9. Show assignments placeholder

Add a section for future assignments.

Show mock/placeholder data:

- assigned employees count
- completed count
- in progress count
- not started count

Add action:

```
Assign to Employees
```

For now it can navigate to a placeholder or next planned route:

```
/tests/[id]/assign
```

### 10. Show results summary placeholder

Add a results summary section with mock data:

- average score
- pass rate
- weak topics
- recent attempts

This should be simple and not become a full analytics dashboard.

### 11. Add test actions

Add actions depending on status:

- For draft tests: Edit draft, Publish placeholder, Archive
- For published tests: Assign to employees, View results, Archive
- For archived tests: Restore placeholder

Use mock/local behavior only where simple.

## Mock Data

Create or extend mock data for:

- tests
- test questions
- test source documents
- test assignments summary
- test attempts summary
- weak topics

Keep mock data colocated with the tests feature if that structure exists.

## Design Requirements

Use current Ontera AI design system:

- Card
- Badge
- Button
- table/list components if available
- typography CSS classes
- responsive spacing tokens
- existing admin layout

The page should feel like a serious admin management area, not a quiz game UI.

## Do Not Implement

- real database reads
- real database writes
- Supabase
- real auth
- real AI logic
- real assignment logic
- employee test-taking
- full analytics page
- complex editing flow

## Files Likely Involved

- `src/app/tests/page.tsx`
- `src/app/tests/[id]/page.tsx`
- `src/features/tests/components/tests-list-page.tsx`
- `src/features/tests/components/test-detail-page.tsx`
- `src/features/tests/components/test-detail-header.tsx`
- `src/features/tests/components/test-questions-section.tsx`
- `src/features/tests/components/test-settings-section.tsx`
- `src/features/tests/components/test-source-documents-section.tsx`
- `src/features/tests/components/test-assignments-section.tsx`
- `src/features/tests/components/test-results-section.tsx`
- `src/features/tests/mock/tests.ts`
- `context/progress-tracker.md`

## Verification

- `/tests` opens correctly
- tests list renders from mock data
- status filters work
- KPI cards use explicit icon/status/tone data
- `/tests/[id]` opens correctly
- not-found state works for invalid id
- test detail header renders
- test settings render
- questions render correctly
- source document section renders
- assignments placeholder renders
- results summary placeholder renders
- test actions render according to status
- no backend or AI logic added
- `npm run lint` passes
- `npm run typecheck` passes
- `npm run format:check` passes
- `context/progress-tracker.md` is updated

---

Next planned step: **Assign Test to Employees**.
