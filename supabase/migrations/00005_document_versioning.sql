-- Document versioning and visible version history (Feature Spec 33).

alter table public.documents
  add column if not exists parent_document_id uuid references public.documents (id) on delete set null,
  add column if not exists version_number integer not null default 1,
  add column if not exists is_latest boolean not null default true,
  add column if not exists replaced_by_document_id uuid references public.documents (id) on delete set null,
  add column if not exists change_message text,
  add column if not exists ai_change_summary text;

create index if not exists documents_parent_document_id_idx
  on public.documents (parent_document_id);

create index if not exists documents_replaced_by_document_id_idx
  on public.documents (replaced_by_document_id);

create index if not exists documents_organization_latest_status_idx
  on public.documents (organization_id, is_latest, status);

create unique index if not exists documents_one_latest_per_version_family_idx
  on public.documents (organization_id, coalesce(parent_document_id, id))
  where is_latest;

create table if not exists public.document_version_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  document_id uuid not null,
  previous_document_id uuid references public.documents (id) on delete set null,
  event_type text not null check (event_type in ('initial_upload', 'new_version')),
  created_by uuid references public.profiles (id) on delete set null,
  change_message text,
  ai_change_summary text,
  created_at timestamptz not null default timezone('utc', now()),

  unique (id, organization_id),
  foreign key (document_id, organization_id)
    references public.documents (id, organization_id)
    on delete cascade
);

create index if not exists document_version_events_document_id_idx
  on public.document_version_events (document_id);

create index if not exists document_version_events_previous_document_id_idx
  on public.document_version_events (previous_document_id);

create index if not exists document_version_events_organization_id_idx
  on public.document_version_events (organization_id);

alter table public.document_version_events enable row level security;

create policy "document_version_events_select_for_org_admins"
on public.document_version_events
for select
to authenticated
using (public.is_active_org_admin(organization_id));

create policy "document_version_events_insert_for_org_admins"
on public.document_version_events
for insert
to authenticated
with check (public.is_active_org_admin(organization_id));
