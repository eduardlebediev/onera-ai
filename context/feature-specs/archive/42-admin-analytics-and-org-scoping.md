# Feature: Admin Analytics Page + Org-Scoped Reads

## Goal

Add a dedicated `/admin/analytics` page with team-wide metrics and fix org-scoped reads so analytics data is restricted to the admin's organization.

## User story

As an admin, I want to open an analytics page showing team average score, weak topics, difficult questions, and employee performance — scoped to my organization only — so that I can understand knowledge gaps across my team.

## Scope

### In scope

1. `/admin/analytics` page route with server-side Supabase loader
2. Metrics: team average score, completion rate, weak topics list, difficult questions (highest wrong ratio), employees with failed attempts, best performers
3. Per-test performance table (assigned/completed/avg score)
4. Org-scoped reads in `getAdminDashboardFromSupabase()` — add `.eq("organization_id", organizationId)` to all queries
5. Org-scoped reads in `supabase-test-progress.ts`
6. Analytics nav link + dashboard "View Analytics" quick action

### Out of scope

- CSV export
- Charts or visualizations (reuse existing table components)
- Employee-level drill-down

## UX/UI requirements

- New page at `/admin/analytics` with same shell pattern as dashboard
- Sections: Overview (KPI cards), Weak Topics (table), Difficult Questions (table), Employee Performance (list), Per-Test Performance (table)
- Reuse existing `KpiCard`, `TestPerformanceTable` components
- Empty state: "Complete some tests to see analytics"

## Data/API requirements

- New helper: `src/features/analytics/lib/supabase-analytics.ts`
- Requires `organizationId` from `requireAdminUser()`
- Queries: weak topics — `test_answers.is_correct = false` grouped by `test_questions.topic`; difficult questions — highest wrong ratio; employee performance — grouped by `user_id` with `profiles`
- Dashboard helper `getAdminDashboardFromSupabase()`: add org filter to every query

## Edge cases

- No tests/attempts → empty state, no crash
- Only one test → single row in per-test table
- All correct → weak topics shows "No weak topics yet"
- Cross-org data (security): org filter prevents data leak (fixes current TODO)
- Org filter missing → safe error, not all-orgs data leak

## Acceptance criteria

- WHEN admin opens `/admin/analytics`, THEN page shows team metrics from Supabase
- WHEN admin opens dashboard, THEN KPI numbers are scoped to their org
- WHEN another org has data, THEN admin does not see it
- WHEN org has no data, THEN empty state is shown
- THEN `npm run lint`, `typecheck`, `format:check`, `build` pass

## Constraints

- Reuse existing `KpiCard`, `TestPerformanceTable`
- Add org filter to existing dashboard helper (fix current TODO)
- No new charts library
- Server component + loader pattern
