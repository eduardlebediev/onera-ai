-- Initial backend foundation for Ontera AI RAG demo slice.
-- Extensions, core tables, updated_at triggers, RLS, and vector search RPC.

create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "vector" with schema extensions;

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- ---------------------------------------------------------------------------
-- profiles (auth-ready)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- ---------------------------------------------------------------------------
-- organization_members
-- ---------------------------------------------------------------------------

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  invited_email text,
  role text not null check (role in ('admin', 'employee')),
  status text not null default 'active' check (status in ('invited', 'active', 'disabled')),
  department text,
  job_title text,
  invited_by uuid references public.profiles (id) on delete set null,
  invited_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index organization_members_org_user_unique
  on public.organization_members (organization_id, user_id)
  where user_id is not null;

create unique index organization_members_org_invited_email_unique
  on public.organization_members (organization_id, invited_email)
  where invited_email is not null;

-- ---------------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------------

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  title text not null,
  description text,
  source_type text not null default 'demo' check (source_type in ('demo', 'upload', 'manual')),
  file_name text,
  file_url text,
  extracted_text text,
  status text not null default 'ready' check (status in ('uploaded', 'processing', 'ready', 'failed')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (id, organization_id)
);

-- ---------------------------------------------------------------------------
-- document_chunks
-- ---------------------------------------------------------------------------

create table public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  document_id uuid not null,
  chunk_index int not null,
  title text,
  topic text,
  content text not null,
  token_count int,
  embedding extensions.vector(1536),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (document_id, chunk_index),
  unique (id, organization_id),
  foreign key (document_id, organization_id)
    references public.documents (id, organization_id)
    on delete cascade
);

create index document_chunks_document_id_idx
  on public.document_chunks (document_id);

create index document_chunks_organization_id_idx
  on public.document_chunks (organization_id);

create index document_chunks_embedding_hnsw_idx
  on public.document_chunks
  using hnsw (embedding extensions.vector_cosine_ops);

-- ---------------------------------------------------------------------------
-- tests
-- ---------------------------------------------------------------------------

create table public.tests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  source_document_id uuid references public.documents (id) on delete set null,
  title text not null,
  description text,
  status text not null default 'draft' check (status in ('draft', 'review', 'published', 'archived')),
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  language text not null default 'en' check (language in ('en', 'de')),
  target_role text,
  question_count int,
  passing_score int not null default 70,
  created_by uuid references public.profiles (id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (id, organization_id)
);

-- ---------------------------------------------------------------------------
-- test_questions
-- ---------------------------------------------------------------------------

create table public.test_questions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  test_id uuid not null,
  source_chunk_id uuid references public.document_chunks (id) on delete set null,
  question_text text not null,
  question_type text not null default 'single_choice' check (
    question_type in ('single_choice', 'multiple_choice', 'true_false', 'open_question')
  ),
  options jsonb not null default '[]'::jsonb,
  correct_answer jsonb not null default '{}'::jsonb,
  explanation text,
  topic text,
  difficulty text check (difficulty in ('easy', 'medium', 'hard')),
  order_index int not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (test_id, order_index),
  unique (id, organization_id),
  foreign key (test_id, organization_id)
    references public.tests (id, organization_id)
    on delete cascade
);

-- ---------------------------------------------------------------------------
-- test_assignments
-- ---------------------------------------------------------------------------

create table public.test_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  test_id uuid not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  assigned_by uuid references public.profiles (id) on delete set null,
  status text not null default 'not_started' check (
    status in ('not_started', 'in_progress', 'completed', 'failed')
  ),
  deadline timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (test_id, user_id),
  unique (id, organization_id),
  foreign key (test_id, organization_id)
    references public.tests (id, organization_id)
    on delete cascade
);

-- ---------------------------------------------------------------------------
-- test_attempts
-- ---------------------------------------------------------------------------

create table public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  test_id uuid not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  assignment_id uuid references public.test_assignments (id) on delete set null,
  status text not null default 'in_progress' check (
    status in ('in_progress', 'completed', 'abandoned')
  ),
  score int,
  passed boolean,
  ai_feedback text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (id, organization_id),
  foreign key (test_id, organization_id)
    references public.tests (id, organization_id)
    on delete cascade
);

-- ---------------------------------------------------------------------------
-- test_answers
-- ---------------------------------------------------------------------------

create table public.test_answers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  attempt_id uuid not null,
  question_id uuid not null,
  user_answer jsonb not null default '{}'::jsonb,
  is_correct boolean,
  ai_explanation text,
  created_at timestamptz not null default timezone('utc', now()),
  foreign key (attempt_id, organization_id)
    references public.test_attempts (id, organization_id)
    on delete cascade,
  foreign key (question_id, organization_id)
    references public.test_questions (id, organization_id)
    on delete cascade
);

-- ---------------------------------------------------------------------------
-- ai_generation_runs
-- ---------------------------------------------------------------------------

create table public.ai_generation_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  document_id uuid references public.documents (id) on delete set null,
  test_id uuid references public.tests (id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  model text,
  embedding_model text,
  input_config jsonb not null default '{}'::jsonb,
  retrieved_chunk_ids uuid[] not null default '{}',
  output_summary jsonb not null default '{}'::jsonb,
  error_message text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz
);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

create trigger set_organizations_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_organization_members_updated_at
before update on public.organization_members
for each row execute function public.set_updated_at();

create trigger set_documents_updated_at
before update on public.documents
for each row execute function public.set_updated_at();

create trigger set_document_chunks_updated_at
before update on public.document_chunks
for each row execute function public.set_updated_at();

create trigger set_tests_updated_at
before update on public.tests
for each row execute function public.set_updated_at();

create trigger set_test_questions_updated_at
before update on public.test_questions
for each row execute function public.set_updated_at();

create trigger set_test_assignments_updated_at
before update on public.test_assignments
for each row execute function public.set_updated_at();

create trigger set_test_attempts_updated_at
before update on public.test_attempts
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Demo access will be wired through server-side helpers/API routes in later specs.
-- ---------------------------------------------------------------------------

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.tests enable row level security;
alter table public.test_questions enable row level security;
alter table public.test_assignments enable row level security;
alter table public.test_attempts enable row level security;
alter table public.test_answers enable row level security;
alter table public.ai_generation_runs enable row level security;

comment on table public.organizations is 'RLS enabled. Demo access via server-side helpers in later specs.';
comment on table public.profiles is 'RLS enabled. Demo access via server-side helpers in later specs.';
comment on table public.organization_members is 'RLS enabled. Demo access via server-side helpers in later specs.';
comment on table public.documents is 'RLS enabled. Demo access via server-side helpers in later specs.';
comment on table public.document_chunks is 'RLS enabled. Demo access via server-side helpers in later specs.';
comment on table public.tests is 'RLS enabled. Demo access via server-side helpers in later specs.';
comment on table public.test_questions is 'RLS enabled. Demo access via server-side helpers in later specs.';
comment on table public.test_assignments is 'RLS enabled. Demo access via server-side helpers in later specs.';
comment on table public.test_attempts is 'RLS enabled. Demo access via server-side helpers in later specs.';
comment on table public.test_answers is 'RLS enabled. Demo access via server-side helpers in later specs.';
comment on table public.ai_generation_runs is 'RLS enabled. Demo access via server-side helpers in later specs.';

-- ---------------------------------------------------------------------------
-- Vector search RPC
-- ---------------------------------------------------------------------------

create or replace function public.match_document_chunks(
  query_embedding extensions.vector(1536),
  match_count int default 6,
  document_id_filter uuid default null,
  organization_id_filter uuid default null,
  match_threshold float default 0.2
)
returns table (
  id uuid,
  document_id uuid,
  title text,
  topic text,
  content text,
  similarity float
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select
    document_chunks.id,
    document_chunks.document_id,
    document_chunks.title,
    document_chunks.topic,
    document_chunks.content,
    1 - (document_chunks.embedding <=> query_embedding) as similarity
  from public.document_chunks
  where document_chunks.embedding is not null
    and (document_id_filter is null or document_chunks.document_id = document_id_filter)
    and (organization_id_filter is null or document_chunks.organization_id = organization_id_filter)
    and 1 - (document_chunks.embedding <=> query_embedding) >= match_threshold
  order by document_chunks.embedding <=> query_embedding asc
  limit greatest(match_count, 0);
$$;

comment on function public.match_document_chunks is
  'Retrieve relevant document chunks using pgvector cosine similarity.';
