-- Invite-only auth RLS policies for organization-scoped access.

-- ---------------------------------------------------------------------------
-- Helper functions (security definer to avoid RLS recursion on membership checks)
-- ---------------------------------------------------------------------------

create or replace function public.is_active_org_admin(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = org_id
      and om.user_id = auth.uid()
      and om.role = 'admin'
      and om.status = 'active'
  );
$$;

create or replace function public.is_active_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = org_id
      and om.user_id = auth.uid()
      and om.status = 'active'
  );
$$;

create or replace function public.is_assigned_published_test(test_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.test_assignments ta
    join public.tests t on t.id = ta.test_id
    where ta.test_id = test_id
      and ta.user_id = auth.uid()
      and t.status = 'published'
  );
$$;

create or replace function public.is_assigned_test(test_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.test_assignments ta
    where ta.test_id = test_id
      and ta.user_id = auth.uid()
  );
$$;

revoke all on function public.is_active_org_admin(uuid) from public;
revoke all on function public.is_active_org_member(uuid) from public;
revoke all on function public.is_assigned_published_test(uuid) from public;
revoke all on function public.is_assigned_test(uuid) from public;

grant execute on function public.is_active_org_admin(uuid) to authenticated;
grant execute on function public.is_active_org_member(uuid) to authenticated;
grant execute on function public.is_assigned_published_test(uuid) to authenticated;
grant execute on function public.is_assigned_test(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------

create policy "organizations_select_for_members"
on public.organizations
for select
to authenticated
using (public.is_active_org_member(id));

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "profiles_select_org_for_admins"
on public.profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.organization_members target
    where target.user_id = profiles.id
      and target.status = 'active'
      and public.is_active_org_admin(target.organization_id)
  )
);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- ---------------------------------------------------------------------------
-- organization_members
-- ---------------------------------------------------------------------------

create policy "organization_members_select_own"
on public.organization_members
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "organization_members_select_org_for_admins"
on public.organization_members
for select
to authenticated
using (public.is_active_org_admin(organization_id));

-- ---------------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------------

create policy "documents_select_for_org_admins"
on public.documents
for select
to authenticated
using (public.is_active_org_admin(organization_id));

-- ---------------------------------------------------------------------------
-- document_chunks
-- ---------------------------------------------------------------------------

create policy "document_chunks_select_for_org_admins"
on public.document_chunks
for select
to authenticated
using (public.is_active_org_admin(organization_id));

-- ---------------------------------------------------------------------------
-- tests
-- ---------------------------------------------------------------------------

create policy "tests_select_for_org_admins"
on public.tests
for select
to authenticated
using (public.is_active_org_admin(organization_id));

create policy "tests_select_assigned_for_employees"
on public.tests
for select
to authenticated
using (
  status = 'published'
  and public.is_assigned_published_test(id)
);

-- ---------------------------------------------------------------------------
-- test_questions
-- ---------------------------------------------------------------------------

create policy "test_questions_select_for_org_admins"
on public.test_questions
for select
to authenticated
using (public.is_active_org_admin(organization_id));

-- Employees must not read test_questions directly (correct_answer lives in this table).
-- Take/result flows use server helpers with the admin client and strip answers before submit.

-- ---------------------------------------------------------------------------
-- test_assignments
-- ---------------------------------------------------------------------------

create policy "test_assignments_select_for_org_admins"
on public.test_assignments
for select
to authenticated
using (public.is_active_org_admin(organization_id));

create policy "test_assignments_select_own"
on public.test_assignments
for select
to authenticated
using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- test_attempts
-- ---------------------------------------------------------------------------

create policy "test_attempts_select_for_org_admins"
on public.test_attempts
for select
to authenticated
using (public.is_active_org_admin(organization_id));

create policy "test_attempts_select_own"
on public.test_attempts
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "test_attempts_insert_own"
on public.test_attempts
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and public.is_active_org_member(organization_id)
  and public.is_assigned_test(test_id)
);

create policy "test_attempts_update_own"
on public.test_attempts
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- test_answers
-- ---------------------------------------------------------------------------

create policy "test_answers_select_for_org_admins"
on public.test_answers
for select
to authenticated
using (public.is_active_org_admin(organization_id));

create policy "test_answers_select_own"
on public.test_answers
for select
to authenticated
using (
  exists (
    select 1
    from public.test_attempts ta
    where ta.id = test_answers.attempt_id
      and ta.user_id = (select auth.uid())
  )
);

create policy "test_answers_insert_own"
on public.test_answers
for insert
to authenticated
with check (
  exists (
    select 1
    from public.test_attempts ta
    where ta.id = test_answers.attempt_id
      and ta.user_id = (select auth.uid())
  )
);

create policy "test_answers_update_own"
on public.test_answers
for update
to authenticated
using (
  exists (
    select 1
    from public.test_attempts ta
    where ta.id = test_answers.attempt_id
      and ta.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.test_attempts ta
    where ta.id = test_answers.attempt_id
      and ta.user_id = (select auth.uid())
  )
);

-- ---------------------------------------------------------------------------
-- ai_generation_runs
-- ---------------------------------------------------------------------------

create policy "ai_generation_runs_select_for_org_admins"
on public.ai_generation_runs
for select
to authenticated
using (public.is_active_org_admin(organization_id));

create policy "ai_generation_runs_insert_for_org_admins"
on public.ai_generation_runs
for insert
to authenticated
with check (public.is_active_org_admin(organization_id));

create policy "ai_generation_runs_update_for_org_admins"
on public.ai_generation_runs
for update
to authenticated
using (public.is_active_org_admin(organization_id))
with check (public.is_active_org_admin(organization_id));
