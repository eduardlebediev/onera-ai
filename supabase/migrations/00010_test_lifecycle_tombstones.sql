-- Feature Spec 45: test lifecycle management tombstones

alter table public.tests
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.profiles(id) on delete set null,
  add column if not exists deletion_reason text;

alter table public.tests
  drop constraint if exists tests_status_check;

alter table public.tests
  add constraint tests_status_check
  check (status in ('draft', 'review', 'published', 'archived', 'deleted'));

create index if not exists tests_deleted_at_idx
  on public.tests (organization_id, deleted_at)
  where deleted_at is not null;

comment on column public.tests.deleted_at is
  'Set when an archived test with historical attempts is tombstoned instead of hard-deleted.';
