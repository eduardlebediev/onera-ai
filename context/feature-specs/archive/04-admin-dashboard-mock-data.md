# Feature Spec: Admin Dashboard with Mock Data

## Goal

Create the first Admin Dashboard screen for Ontera AI using mock data only.

The dashboard should give an admin a quick overview of documents, tests, employee progress, weak topics, and recent activity.

## Requirements

- Create Admin Dashboard page
- Use existing app shell, shadcn/ui components, and design tokens
- Add mock data in `src/data/mock/`
- Use the term **Tests**, not Quizzes

## Dashboard Sections

### Header

- Page title: `Dashboard`
- Short description
- Primary action: `Upload Document`
- Secondary action: `Create Test`

### KPI Cards

Show 4–5 cards:

- Documents
- Active Tests
- Assigned Tests
- Average Score
- Weak Topics

### Recent Documents

Table or card list with:

- document title
- status: `ready`, `processing`, `failed`
- detected topics
- last updated
- action button

### Test Performance

Show recent/active tests with:

- test title
- assigned employees
- completed count
- average score
- status

### Weak Topics

Show topics where employees struggle most:

- topic name
- average correctness
- related document/test

### Recent Activity

Show latest activity items:

- document processed
- test published
- employee completed test
- weak topic detected

## Do Not Implement

- Supabase
- real auth
- AI calls
- real document upload
- real test generation
- database logic
- charts library

## Files Likely Involved

- `src/app/admin/dashboard/page.tsx` or current dashboard route
- `src/data/mock/admin-dashboard.ts`
- reusable dashboard components if needed
- `context/progress-tracker.md`

## Verification

- Dashboard renders correctly
- Mock data is separated from UI
- UI follows current Ontera AI design direction
- No backend logic was added
- `npm run lint` passes
- `npm run typecheck` passes
- `context/progress-tracker.md` is updated
