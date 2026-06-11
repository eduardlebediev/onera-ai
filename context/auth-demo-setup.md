# Auth Demo Setup

Ontera AI is invite-only. Users must exist in Supabase Auth and have an active row in `organization_members`.

## Demo users (local seed)

After running `supabase db reset` (or applying migrations + seed), the following demo users are available when auth seeding succeeds:

| Role     | Email                     | Password placeholder | User ID                                |
| -------- | ------------------------- | -------------------- | -------------------------------------- |
| Admin    | `admin@demo.ontera.ai`    | `demo-only-password` | `b0000000-0000-4000-8000-000000000001` |
| Employee | `employee@demo.ontera.ai` | `demo-only-password` | `b0000000-0000-4000-8000-000000000002` |

Both users belong to organization **Ontera Demo Org** (`a0000000-0000-4000-8000-000000000001`).

Do not commit real production passwords. Change credentials in your local `.env` or Supabase dashboard for non-demo environments.

## Required migrations

Auth login depends on RLS policies from `supabase/migrations/00002_auth_rls_policies.sql`. Without it, RLS is enabled but no policies exist, so authenticated users cannot read their own profile or membership and are redirected to `/access-denied`.

Apply locally:

```bash
supabase db reset
```

Or push migrations to your remote project:

```bash
supabase db push
```

## Manual setup (if seed auth block is skipped)

If `supabase/seed.sql` skips auth user inserts (permissions or schema differences):

1. Create two users in Supabase Auth (Dashboard → Authentication → Users):
   - Admin: `admin@demo.ontera.ai`
   - Employee: `employee@demo.ontera.ai`
2. Ensure `public.profiles` rows exist for both user IDs (seed creates them when auth users exist).
3. Ensure `public.organization_members` rows exist with:
   - Admin: `role = admin`, `status = active`
   - Employee: `role = employee`, `status = active`
   - Both linked to your demo organization ID.

## Sign in

1. Run `npm run dev`.
2. Open `/login`.
3. Sign in with admin or employee credentials above.
4. You are redirected to `/admin/dashboard` or `/employee/dashboard` based on `organization_members.role`.

## Verify membership

```sql
select p.email, om.role, om.status, om.organization_id
from public.organization_members om
join public.profiles p on p.id = om.user_id;
```

## Verify RLS policies

```sql
select schemaname, tablename, policyname, permissive, roles, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```
