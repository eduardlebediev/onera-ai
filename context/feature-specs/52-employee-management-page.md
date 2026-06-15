# Feature: Employee Management Page

## Goal

Add an employee management page where admins can view team members, track progress, invite new employees, assign tests in bulk, and send reminders — all from one dashboard.

## User story

As an admin, I want to see all employees in one place with their test status, scores, and progress, so that I can manage the team, invite new members, assign training, and nudge overdue employees without switching pages.

## Scope

### In scope

1. `/admin/employees` page with employee list table
2. Search by name, email, department
3. Filter by department and status (Completed, Pending, Overdue)
4. Quick metrics cards: total employees, average score, pending count, overdue count
5. "Invite employee" button → modal with name, email, department fields
6. "Bulk assign" → modal to assign a test to entire department
7. "Nudge" button per employee → send Slack/email reminder
8. "Nudge all overdue" button in filter bar
9. Employee row links to `/admin/employees/[id]` detail page (placeholder or real)
10. Custom toast notifications after actions (invite, assign, nudge)

### Out of scope

- Full employee detail page (separate spec)
- Self-service employee profile editing
- Employee-side dashboard (separate flow)

## UX/UI requirements

- Table: name + avatar, email, department, progress bar, status badge, score, last active, actions
- Search bar with placeholder text
- Filter dropdowns for department and status (select elements)
- 4 KPI cards: Total, Avg Score, Pending, Overdue
- "Invite employee" button → modal with form
- "Bulk assign" button → modal with test selector + department selector
- Nudge: per-row button for overdue/pending employees, "All overdue" button in filter bar
- Toast: custom bottom-right notification with action type label and message

## Modal: Invite employee

- Full name (required)
- Email (required)
- Department (select)
- "Cancel" + "Invite & send onboarding" buttons

## Modal: Bulk assign

- Select assessment module (dropdown)
- Select target department (dropdown or "All departments")
- Warning note about status reset
- "Cancel" + "Execute assignment" buttons

## Data/API requirements

- Employee list from `profiles` joined with `organization_members` and aggregated `test_attempts` / `test_assignments`
- New helper: `src/features/employees/lib/supabase-employees.ts`
- Invite: `POST /api/admin/employees/invite` — create auth user + profile + organization_members row
- Bulk assign: `POST /api/admin/tests/assign` — create `test_assignments` for matching employees
- Nudge: `POST /api/admin/employees/nudge` — log nudge event (actual Slack/email integration out of scope)

## Edge cases

- No employees → empty state with "Invite your first employee" action
- No matching filters → "No employees match your filters"
- Invite with existing email → error "User already exists"
- Bulk assign to empty department → error "No employees found in department"
- Nudge on already completed employee → toast "Employee already completed"

## Acceptance criteria

- WHEN admin opens `/admin/employees`, THEN table shows all employees with status, score, progress
- WHEN admin filters by department, THEN only matching employees shown
- WHEN admin clicks "Invite employee" and fills form, THEN new employee appears in list with toast
- WHEN admin clicks "Bulk assign", THEN selected department employees get test assignment
- WHEN admin clicks "Nudge" on overdue employee, THEN toast confirms reminder sent
- WHEN no employees exist, THEN empty state with invite CTA shown
- THEN `npm run lint`, `typecheck`, `format:check`, `build` pass

## Constraints

- Reuse existing `Table`, `Button`, `Badge`, `Card`, `Input` from `src/shared/ui/`
- Reuse existing `Drawer` component for modals (or use simple modal divs)
- Use existing `toast` from sonner (after Spec 51 adds it)
- Employee list reads from Supabase `profiles` + `organization_members`
- Invite creates auth user via Supabase Admin API
- Keep German text as in the prototype OR make it English based on project language setting
- Do not add actual Slack/email integration — nudge is a log + toast only
