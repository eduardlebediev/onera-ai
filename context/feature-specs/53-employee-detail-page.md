# Feature: Employee Detail Page

## Goal

Add an employee detail page that shows all test attempts, scores, weak topics, and progress for one employee. First opens as a drawer from the employee table, with an "Open full page" link to the full detail view.

## User story

As an admin, when I click an employee in the table, I want to see a quick preview in a drawer with their key stats and latest attempts. When I need more detail, I can open the full page with breadcrumbs.

## Scope

### In scope

1. Click employee row → bottom drawer opens (same pattern as documents/tests drawers)
2. Drawer header: employee name + avatar on the left, "Open full page" + "Close" on the right
3. Drawer content: key stats (tests completed, avg score, weak topics), recent attempts list
4. Full page `/admin/employees/[id]` with breadcrumbs: `Employees / Employee Name`
5. Full page content: stat cards, all attempts history, per-test scores, weak topics breakdown, source document links
6. Breadcrumbs on full page only, not in drawer

### Out of scope

- Employee profile editing
- Employee self-service view
- Delete employee action

## UX/UI requirements

- Same bottom drawer pattern as `DocumentDrawer` and `TestDrawer`
- Drawer at 90vh with "Open full page" (Maximize2) + "Close" (X) buttons
- Drawer shows: name, email, department, role, completed tests count, average score, top 3 weak topics, last 3 attempts
- Full page shows: full stat cards, all attempts table, all weak topics, department comparison, source materials reviewed

## Drawer content

- Header: avatar, name, email, department badge, role badge
- Stat row: tests completed, average score, pass rate, weak topics count
- Recent attempts: last 3 (test title, score, passed/failed, date)
- "View full profile" button at bottom

## Full page content

- Breadcrumb: `Employees / Employee Name`
- Hero section: avatar, name, email, department, role, status
- KPI cards: Total tests, Average score, Pass rate, Weak topics
- Attempts history table: test title, score, passed/failed, completed date, duration, source document
- Weak topics breakdown: topic name, times missed, recommended action
- Link back to employees list

## Data/API requirements

- Employee data from `profiles` + `organization_members` + aggregated `test_attempts` + `test_answers`
- New helper: `src/features/employees/lib/supabase-employee-detail.ts`
- Returns: profile, membership, attempts with test titles, weak topics grouped by `test_questions.topic`

## Edge cases

- Employee has no attempts → stat cards show 0, "No attempts yet" empty state
- Employee has no weak topics → "All topics understood"
- Employee not found → notFound()
- Employee from another org → 404 (org-scoped)

## Acceptance criteria

- WHEN admin clicks employee row in table, THEN bottom drawer opens with employee stats and recent attempts
- WHEN admin clicks "Open full page" in drawer, THEN navigates to `/admin/employees/[id]` with breadcrumbs
- WHEN admin navigates directly to `/admin/employees/[id]`, THEN full page with breadcrumbs and all data
- WHEN employee has no attempts, THEN empty state shown
- WHEN drawer is open, THEN no breadcrumbs visible
- THEN `npm run lint`, `typecheck`, `format:check`, `build` pass

## Constraints

- Same drawer pattern as `TestDrawer` and `DocumentDrawer`
- Breadcrumbs only on full page, never in drawer
- Employee drawer added to employees list from Spec 52
- Org-scoped: employee must belong to admin's organization
