-- AI-extracted document topics (Feature Spec 32).

create table if not exists public.document_topics (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  document_id uuid not null,
  topic text not null,
  description text,
  confidence numeric,
  source text not null default 'ai',
  created_at timestamptz not null default timezone('utc', now()),

  unique (document_id, topic),
  unique (id, organization_id),
  foreign key (document_id, organization_id)
    references public.documents (id, organization_id)
    on delete cascade
);

create index if not exists document_topics_document_id_idx
  on public.document_topics (document_id);

create index if not exists document_topics_organization_id_idx
  on public.document_topics (organization_id);

alter table public.document_topics enable row level security;

create policy "document_topics_select_for_org_admins"
on public.document_topics
for select
to authenticated
using (public.is_active_org_admin(organization_id));
