# Feature Spec 20: Role-Based Route Structure and Employee Dashboard

## Goal

Refactor app routes into a cleaner role-based structure and add a real Employee Dashboard.

## Target URLs

### Admin

- `/admin/dashboard`
- `/admin/documents`
- `/admin/documents/[id]`
- `/admin/documents/[id]/generate-test`
- `/admin/tests`
- `/admin/tests/review`
- `/admin/tests/publish`
- `/admin/tests/[id]`
- `/admin/tests/[id]/assign`

### Employee

- `/employee/dashboard`
- `/employee/tests`
- `/employee/tests/[id]/take`
- `/employee/tests/[id]/result`

## Route Groups

- `src/app/(admin)/admin/...`
- `src/app/(employee)/employee/...`

## Implementation Notes

- Moved admin routes from `/documents`, `/tests`, `/dashboard` to `/admin/...`
- Kept employee test routes under `/employee/...` and added `/employee/dashboard`
- Updated all internal links to `/admin/...` for admin flows
- Kept global role-context navbar; repointed links and role switcher navigation
- Deleted orphan stub routes: `/analytics`, `/employees`, `/progress`, `/my-tests`
- Root `/` redirects to `/admin/dashboard`
- Employee dashboard uses existing mock employee (`emp-6`) and assignment data

## Employee Dashboard Sections

1. Header (welcome, name, role, department)
2. KPI cards (Assigned, Due Soon, Completed, Average Score, Weak Topics)
3. Next Required Test
4. Recent Feedback
5. Learning Focus (weak topics)
6. Quick Actions

## Out of Scope

- Real auth, middleware, legacy redirects, backend, persistence
