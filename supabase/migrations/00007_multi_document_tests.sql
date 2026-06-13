-- Feature Spec 35: Multi-document test generation

create table if not exists public.test_documents (
  test_id uuid not null references public.tests(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete restrict,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),

  primary key (test_id, document_id)
);

create index if not exists test_documents_document_id_idx
  on public.test_documents(document_id);

create index if not exists test_documents_organization_id_idx
  on public.test_documents(organization_id);

insert into public.test_documents (test_id, document_id, organization_id)
select id, source_document_id, organization_id
from public.tests
where source_document_id is not null
on conflict do nothing;

alter table public.test_documents enable row level security;

create policy "test_documents_select_for_org_admins"
on public.test_documents
for select
to authenticated
using (public.is_active_org_admin(organization_id));

create policy "test_documents_select_assigned_for_employees"
on public.test_documents
for select
to authenticated
using (public.is_assigned_test(test_id));
