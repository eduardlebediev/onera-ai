-- Advisor fixes for employee nudge events.

create index employee_nudge_events_nudged_by_idx
  on public.employee_nudge_events (nudged_by);

drop policy if exists "employee_nudge_events_select_for_org_admins"
on public.employee_nudge_events;

drop policy if exists "employee_nudge_events_select_own"
on public.employee_nudge_events;

create policy "employee_nudge_events_select_for_admins_or_self"
on public.employee_nudge_events
for select
to authenticated
using (
  employee_user_id = (select auth.uid())
  or public.is_active_org_admin(organization_id)
);
