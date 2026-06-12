-- Document upload ingestion: metadata columns and private storage bucket.

alter table public.documents
  add column if not exists storage_path text,
  add column if not exists file_type text,
  add column if not exists file_size_mb numeric,
  add column if not exists extraction_method text,
  add column if not exists processing_error text,
  add column if not exists processed_at timestamptz;

-- Private bucket for uploaded source files (access via server admin client + signed URLs).
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do update
set public = excluded.public;
