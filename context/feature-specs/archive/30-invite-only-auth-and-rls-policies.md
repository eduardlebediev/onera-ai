# Feature Spec 30: Invite-only Auth and RLS Policies

## Goal

Add the first real invite-only authentication and organization-scoped access layer.

The goal is to replace hardcoded demo user assumptions with authenticated users and prepare the app for real B2B usage:

```
Admin logs in
→ role is resolved from organization_members
→ admin manages documents/tests/assignments/results
→ employee logs in
→ employee sees only assigned tests/results
→ RLS protects organization-scoped data
```

This spec should introduce the first real auth/RLS layer, not a full enterprise auth system.

## Context

Already completed:

- Spec 21 — Supabase backend foundation
- Spec 22 — Embedding script
- Spec 23 — AI Generate Test API
- Spec 24 — Generate Test page connected to real AI API
- Spec 25 — Save reviewed generated test to Supabase
- Spec 26 — Backend Data Integration for Admin Documents and Tests
- Spec 27 — Real Test Assignments
- Spec 28 — Employee Test Taking and Attempt Persistence
- Spec 29 — Admin Progress and Results from Supabase

Current backend tables: `profiles`, `organization_members`, `organizations`, `documents`, `document_chunks`, `tests`, `test_questions`, `test_assignments`, `test_attempts`, `test_answers`, `ai_generation_runs`.

Current state:

- Many flows use server-only admin client.
- Some employee flows use hardcoded demo employee id.
- RLS is enabled but policies are not fully implemented.
- No public registration should exist.

## Product Rule

Ontera AI is invite-only. No public sign-up, no self-registration, no anonymous employee access.

Users must exist in Supabase Auth and be connected to an organization through `organization_members`.

Roles: `admin`, `employee`. Role lives in `organization_members.role`, not in `profiles`.

## Scope

Implement:

- login page
- logout
- current user helper
- current organization/member helper
- route protection
- role-based redirects
- basic RLS policies
- replace hardcoded demo employee id

Routes affected: `/login`, `/admin/*`, `/employee/*`.

## Important Rules

- No public registration.
- Do not add sign-up page.
- Do not use `user_metadata` as source of role truth.
- Use `organization_members.role`.
- Users without active membership should not access app routes.
- Admin and employee routes must be protected.
- Employees must not access admin routes.
- Keep server-only admin client only for internal privileged tasks.
- Use user-scoped Supabase SSR client for authenticated app access where possible.
- Do not expose `SUPABASE_SECRET_KEY`.
- Do not add enterprise SSO.
- Do not add billing.
- Do not add teams.

## Files to Inspect First

Inspect:

- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/admin.ts`
- `src/lib/supabase/types.ts`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/(admin)/admin/layout.tsx`
- `src/app/(employee)/employee/layout.tsx`
- `src/shared/lib/role-context.tsx`
- `src/shared/components/top-navbar.tsx`
- `src/app/(admin)/`
- `src/app/(employee)/`
- `supabase/migrations/00001_initial_schema.sql`
- `supabase/seed.sql`

Reuse existing Supabase SSR helper.

## Auth UX

Create login route: `/login`.

Minimal login form: email, password, submit, error state, loading state. Do not implement registration.

Optional magic link login is acceptable if simpler, but email/password login is enough for MVP.

After login:

- if user role = admin → `/admin/dashboard`
- if user role = employee → `/employee/dashboard`
- if no active membership → show access denied / logout

Add logout action in navbar or user menu.

## Current User Helper

Create `src/features/auth/lib/current-user.ts` or `src/lib/auth/current-user.ts`.

Responsibilities: get current Supabase auth user, load profile, load active `organization_members` row, return `user`, `profile`, `organizationId`, `role`, `memberStatus`.

Suggested return shape:

```ts
{
  userId: string
  email: string
  profile: {
    id: string
    email: string
    fullName: string | null
  }
  membership: {
    organizationId: string
    role: "admin" | "employee"
    status: "invited" | "active" | "disabled"
  }
}
```

If no user: return `null` or redirect to `/login`. If no active membership: return access denied state.

## Route Protection

Add route protection for `/admin/*` and `/employee/*`.

Preferred simple approach: use server layouts to check current user/membership and redirect.

- Admin layout: requires role = `admin`.
- Employee layout: requires role = `employee`.
- If unauthenticated: redirect `/login`.
- If wrong role: redirect to correct dashboard or show access denied.

Do not build complex middleware unless already needed.

## Replace Hardcoded Demo Employee

Find and replace hardcoded demo employee id (`b0000000-0000-4000-8000-000000000002`). Employee flows should use `currentUser.userId` and `currentUser.membership.organizationId`.

Affected areas likely: employee dashboard, employee tests page, take test route, start attempt API, submit attempt API, result page.

Keep demo fallback only in mock code paths, not in Supabase-backed production paths.

## Admin Authorization in APIs

Update backend API routes that currently have TODOs:

- `POST /api/admin/generate-test`
- `POST /api/admin/tests/publish-generated`
- `POST /api/admin/tests/[id]/assign`

Each admin API should:

1. Load current authenticated user.
2. Verify active admin membership.
3. Verify target document/test belongs to admin organization.
4. Proceed.

Do not trust client-provided `organization_id`.

## Employee Authorization in APIs

Update employee APIs:

- `POST /api/employee/tests/[id]/start`
- `POST /api/employee/tests/[id]/submit`

Each employee API should:

1. Load current authenticated user.
2. Verify active employee membership.
3. Verify assignment belongs to user and organization.
4. Proceed.

Do not trust client-provided user id.

## RLS Policies

RLS is already enabled. Add practical MVP policies.

Create migration: `supabase/migrations/00002_auth_rls_policies.sql`.

Policies should cover authenticated users.

**Profiles:**

- Users can read their own profile.
- Admins can read profiles in their organization through `organization_members`.
- Users can update limited own profile fields if needed.

**Organization Members:**

- Users can read their own membership.
- Admins can read members in their organization.

**Documents:**

- Admins can read documents in their organization.
- Employees do not need direct document access for MVP unless required by assigned test flow.
- Admin document writes can stay through server-side route/admin client for now if needed.

**Document Chunks:**

- Admins can read chunks for documents in their organization.
- Employees do not need direct chunk access.

**Tests:**

- Admins can read tests in their organization.
- Employees can read published tests assigned to them.

**Test Questions:**

- Admins can read questions for tests in their organization.
- Employees can read questions for tests assigned to them.

Important: employee-facing queries must not expose `correct_answer` before submit. If `test_questions.correct_answer` is stored in same table, do not use direct client query for employee take page. Use server helper/API that strips correct answers before returning to client.

**Test Assignments:**

- Admins can read assignments in their organization.
- Employees can read their own assignments.

**Test Attempts:**

- Admins can read attempts in their organization.
- Employees can read/create/update their own attempts through server API.

**Test Answers:**

- Admins can read answers in their organization.
- Employees can read their own answers after submit/result.
- Employee writes should preferably go through server API.

Important RLS note: because some MVP flows still use server-side admin client, RLS policies may not be exercised everywhere immediately. That is acceptable. But user-scoped reads should start moving toward SSR client + RLS where practical. Do not break the working AI/RAG flow.

## Seed / Demo Users

Update seed or document required demo users. Need at least: one admin auth user, one employee auth user, profiles for both, `organization_members` rows for both.

If seeding Supabase Auth users through SQL is fragile, document manual setup in `context/auth-demo-setup.md`. Include admin email/password, employee email/password, organization membership requirement. Do not commit real passwords or secrets. Use placeholder values only.

## Role Context Cleanup

The current mock role switcher may conflict with real auth. Options:

1. Remove role switcher from production navbar after auth is added.
2. Keep it only as dev/demo helper if clearly marked.

Preferred: use authenticated role from `organization_members` as the source of truth.

## Out of Scope

Do not implement: public registration, invite email sending, enterprise SSO, billing, teams, advanced organization management, full member management UI, password reset flow, production-grade audit log, PDF upload, Prisma, large redesign.

## Manual Test

Run `npm run dev`.

Test unauthenticated access: `/admin/dashboard` → redirects to `/login`, `/employee/dashboard` → redirects to `/login`.

Test admin login: login as admin → `/admin/dashboard`, can access `/admin/documents`, `/admin/tests`, can generate/publish/assign tests, cannot access employee dashboard unless explicitly allowed.

Test employee login: login as employee → `/employee/dashboard`, can see assigned tests, can take assigned test, can see own result, cannot access `/admin/dashboard`.

Test no membership: authenticated user without active `organization_members` row → access denied or logout.

## Supabase Verification

```sql
select p.email, om.role, om.status, om.organization_id
from public.organization_members om
join public.profiles p on p.id = om.user_id;

select schemaname, tablename, policyname, permissive, roles, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

## Validation

```bash
npm run lint
npm run typecheck
npm run format:check
npm run build
```

## Context Updates

Create this file (`context/feature-specs/30-invite-only-auth-and-rls-policies.md`).
Create `context/auth-demo-setup.md`.
Update `context/progress-tracker.md`, `context/history.md`, `context/decisions.md`, `context/architecture.md`.

Add decision:

```
## 041 — Ontera AI uses invite-only access with organization membership roles

Ontera AI does not support public registration. Authenticated users must have an active `organization_members` row. The application role is resolved from `organization_members.role`, not from `profiles` or `user_metadata`. Admin routes require admin membership, employee routes require employee membership, and Supabase RLS policies protect organization-scoped data.
```

Update progress:

Completed:

- Invite-only Auth and RLS Policies

Next Up:

- Real Document Upload and Markdown Extraction
- Production Readiness Cleanup

## Acceptance Criteria

- `/login` exists.
- Public registration is not available.
- Authenticated users are resolved through Supabase Auth.
- App role is resolved from `organization_members.role`.
- Admin routes require active admin membership.
- Employee routes require active employee membership.
- Hardcoded demo employee id is removed from Supabase-backed employee flows.
- Admin APIs validate current admin membership.
- Employee APIs validate current employee membership.
- RLS policies exist for core tables.
- Employee-facing take flow does not expose correct answers before submit.
- Mock role context no longer overrides authenticated role.
- No `SUPABASE_SECRET_KEY` is exposed client-side.
- `lint`, `typecheck`, `format:check`, and `build` pass.

## Next Step

Feature Spec 31: Real Document Upload and Markdown Extraction
