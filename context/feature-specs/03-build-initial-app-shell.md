# Feature Spec: Build Initial App Shell

## Goal

Create the initial application shell with navigation and placeholder pages.

## Requirements

- Create main app layout
- Add dark top navbar
- Add Admin navigation:
  - Dashboard
  - Documents
  - Tests
  - Employees
  - Analytics

- Add Employee navigation:
  - Dashboard
  - My Tests
  - Progress

- Add mock role switch:
  - Admin
  - Employee

- Create placeholder pages for all navigation links
- Use existing shadcn/ui components and design tokens
- Use mock data only

## Do Not Implement

- Supabase
- real auth
- AI logic
- database logic
- document upload
- quiz generation

## Verification

- Navigation works
- Admin and Employee views are separated
- Layout matches current UI direction
- `npm run lint` passes
- `npm run typecheck` passes
- `context/progress-tracker.md` is updated
