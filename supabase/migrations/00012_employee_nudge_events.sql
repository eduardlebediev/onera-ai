-- Employee nudge audit log for admin reminder actions.

create table public.employee_nudge_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  employee_user_id uuid not null references public.profiles (id) on delete cascade,
  nudged_by uuid references public.profiles (id) on delete set null,
  channel text not null default 'demo' check (channel in ('demo', 'email', 'slack')),
  reason text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (id, organization_id)
);

create index employee_nudge_events_organization_created_idx
  on public.employee_nudge_events (organization_id, created_at desc);

create index employee_nudge_events_employee_idx
  on public.employee_nudge_events (employee_user_id);

alter table public.employee_nudge_events enable row level security;

create policy "employee_nudge_events_select_for_org_admins"
on public.employee_nudge_events
for select
to authenticated
using (public.is_active_org_admin(organization_id));

create policy "employee_nudge_events_select_own"
on public.employee_nudge_events
for select
to authenticated
using (employee_user_id = (select auth.uid()));

create policy "employee_nudge_events_insert_for_org_admins"
on public.employee_nudge_events
for insert
to authenticated
with check (public.is_active_org_admin(organization_id));
