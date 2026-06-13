-- Feature Spec 34: Document archive/delete and test source invalidation

-- Documents: archive/delete audit columns
alter table public.documents
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references public.profiles(id) on delete set null,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.profiles(id) on delete set null,
  add column if not exists deletion_reason text;

-- Extend documents.status to include archived and deleted
alter table public.documents
  drop constraint if exists documents_status_check;

alter table public.documents
  add constraint documents_status_check
  check (status in ('uploaded', 'processing', 'ready', 'failed', 'archived', 'deleted'));

-- Tests: source validity and activity
alter table public.tests
  add column if not exists is_active boolean not null default true,
  add column if not exists source_validity text not null default 'valid',
  add column if not exists source_invalid_reason text,
  add column if not exists source_invalid_at timestamptz;

alter table public.tests
  drop constraint if exists tests_source_validity_check;

alter table public.tests
  add constraint tests_source_validity_check
  check (source_validity in ('valid', 'outdated', 'source_archived', 'source_deleted', 'needs_review'));

-- Test questions: source document tracking and invalidation
alter table public.test_questions
  add column if not exists source_document_id uuid references public.documents(id) on delete set null,
  add column if not exists is_active boolean not null default true,
  add column if not exists source_status text not null default 'valid',
  add column if not exists source_invalid_reason text;

alter table public.test_questions
  drop constraint if exists test_questions_source_status_check;

alter table public.test_questions
  add constraint test_questions_source_status_check
  check (source_status in ('valid', 'document_outdated', 'document_archived', 'document_deleted', 'source_missing', 'manual_kept'));

-- Backfill source_document_id from document_chunks
update public.test_questions tq
set source_document_id = dc.document_id
from public.document_chunks dc
where tq.source_chunk_id = dc.id
  and tq.source_document_id is null;

create index if not exists test_questions_source_document_id_idx
  on public.test_questions (source_document_id);

create index if not exists tests_source_validity_idx
  on public.tests (organization_id, is_active, source_validity);

create index if not exists documents_archived_by_idx
  on public.documents (archived_by);

create index if not exists documents_deleted_by_idx
  on public.documents (deleted_by);
