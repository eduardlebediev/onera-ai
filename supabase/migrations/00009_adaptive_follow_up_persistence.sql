-- Adaptive follow-up persistence: store AI-generated follow-ups and employee answers.

create table if not exists public.follow_up_questions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  attempt_id uuid not null,
  original_question_id uuid not null,
  question_text text not null,
  options jsonb not null default '[]'::jsonb,
  correct_answer jsonb not null default '{}'::jsonb,
  topic text not null,
  explanation_before_question text not null,
  explanation_after_answer text not null,
  learning_goal text not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  source_chunk_reference text not null default 'Source document',
  created_at timestamptz not null default timezone('utc', now()),
  unique (id, organization_id),
  unique (attempt_id, original_question_id),
  foreign key (attempt_id, organization_id)
    references public.test_attempts (id, organization_id)
    on delete cascade,
  foreign key (original_question_id, organization_id)
    references public.test_questions (id, organization_id)
    on delete cascade
);

create table if not exists public.follow_up_answers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  follow_up_question_id uuid not null,
  user_answer jsonb not null default '{}'::jsonb,
  is_correct boolean not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (follow_up_question_id),
  unique (id, organization_id),
  foreign key (follow_up_question_id, organization_id)
    references public.follow_up_questions (id, organization_id)
    on delete cascade
);

alter table public.follow_up_questions enable row level security;
alter table public.follow_up_answers enable row level security;

comment on table public.follow_up_questions is
  'AI-generated adaptive follow-up questions after incorrect test answers.';
comment on table public.follow_up_answers is
  'Employee answers to adaptive follow-up questions.';

-- follow_up_questions

drop policy if exists "follow_up_questions_select_for_org_admins" on public.follow_up_questions;
create policy "follow_up_questions_select_for_org_admins"
on public.follow_up_questions
for select
to authenticated
using (public.is_active_org_admin(organization_id));

drop policy if exists "follow_up_questions_select_own" on public.follow_up_questions;
create policy "follow_up_questions_select_own"
on public.follow_up_questions
for select
to authenticated
using (
  exists (
    select 1
    from public.test_attempts ta
    where ta.id = follow_up_questions.attempt_id
      and ta.user_id = (select auth.uid())
  )
);

drop policy if exists "follow_up_questions_insert_own" on public.follow_up_questions;
create policy "follow_up_questions_insert_own"
on public.follow_up_questions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.test_attempts ta
    where ta.id = follow_up_questions.attempt_id
      and ta.user_id = (select auth.uid())
  )
);

-- follow_up_answers

drop policy if exists "follow_up_answers_select_for_org_admins" on public.follow_up_answers;
create policy "follow_up_answers_select_for_org_admins"
on public.follow_up_answers
for select
to authenticated
using (public.is_active_org_admin(organization_id));

drop policy if exists "follow_up_answers_select_own" on public.follow_up_answers;
create policy "follow_up_answers_select_own"
on public.follow_up_answers
for select
to authenticated
using (
  exists (
    select 1
    from public.follow_up_questions fq
    join public.test_attempts ta on ta.id = fq.attempt_id
    where fq.id = follow_up_answers.follow_up_question_id
      and ta.user_id = (select auth.uid())
  )
);

drop policy if exists "follow_up_answers_insert_own" on public.follow_up_answers;
create policy "follow_up_answers_insert_own"
on public.follow_up_answers
for insert
to authenticated
with check (
  exists (
    select 1
    from public.follow_up_questions fq
    join public.test_attempts ta on ta.id = fq.attempt_id
    where fq.id = follow_up_answers.follow_up_question_id
      and ta.user_id = (select auth.uid())
  )
);
