# Feature Spec: Employee My Tests

## Goal

Create the employee-facing page where an employee can see assigned tests and start or continue them.

This step uses mock data only. No backend, Supabase, or real persistence.

## User Flow

Admin assigns test → Employee opens My Tests → Employee sees assigned tests → Employee starts or continues a test → Navigate to Test Taking Flow

## Requirements

### 1. Create Employee My Tests route

Create or update:

```
/employee/tests
```

or use the existing employee route structure if already defined.

The page should show tests assigned to the current mock employee.

### 2. Show page header

Display:

- page title: My Tests
- short description
- employee name / role from mock data
- overall progress summary

### 3. Add assigned tests list

Each test card should show:

- test title
- status: not started / in progress / completed / overdue
- source document
- difficulty
- question count
- deadline
- estimated time
- score if completed
- pass/fail status if completed

### 4. Add employee KPI section

Show small summary cards:

- Assigned tests
- Completed tests
- In progress
- Average score
- Overdue tests

Use explicit KPI data objects with icon/tone/status. Do not use index-based icon mapping.

### 5. Add filters

Add simple filters:

- All
- Not Started
- In Progress
- Completed
- Overdue

Filters should work with mock data only.

### 6. Add test actions

Depending on assignment status:

- Start Test for not started tests
- Continue for in-progress tests
- View Results for completed tests
- Review for failed/completed tests if useful

Actions should navigate to placeholder or next planned routes:

```
/employee/tests/[id]/take
/employee/tests/[id]/result
```

If these routes do not exist yet, create simple placeholder pages.

### 7. Add priority / risk indicators

For employee clarity, show simple visual indicators:

- overdue
- due soon
- low previous score
- required test

Keep this lightweight and mock-only.

## Mock Data

Create or extend mock data for:

- current employee
- assigned tests
- assignment statuses
- deadlines
- scores
- progress states

Keep mock data colocated with the employee/tests feature if that structure exists.

## Design Requirements

Use the current Ontera AI design system:

- Card
- Badge
- Button
- typography CSS classes
- responsive spacing tokens
- existing employee layout/navigation

The page should feel like a clean employee task dashboard, not an admin management table.

## Do Not Implement

- real auth
- Supabase
- database reads/writes
- real assignment persistence
- real test-taking logic
- scoring logic
- AI feedback logic

## Files Likely Involved

- `src/app/employee/tests/page.tsx`
- `src/app/employee/tests/[id]/take/page.tsx`
- `src/app/employee/tests/[id]/result/page.tsx`
- `src/features/employee/tests/` — components, mock data, lib
- `context/progress-tracker.md`

## Verification

- Employee My Tests page opens correctly
- assigned tests render from mock data
- KPI cards render correctly
- filters work
- test actions render based on status
- start/continue actions navigate to test-taking placeholder
- completed test actions navigate to result placeholder
- no backend or real persistence added
- `npm run lint` passes
- `npm run typecheck` passes
- `npm run format:check` passes
- `context/progress-tracker.md` is updated

---

Next planned step: **Employee Test Taking Flow**.
