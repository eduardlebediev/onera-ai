-- Feature Spec 46: retake policy and transactional write RPCs

alter table public.tests
  add column if not exists max_attempts int;

update public.tests
set max_attempts = 3
where max_attempts is null;

alter table public.tests
  alter column max_attempts set default 3,
  alter column max_attempts set not null;

alter table public.tests
  drop constraint if exists tests_max_attempts_check;

alter table public.tests
  add constraint tests_max_attempts_check
  check (max_attempts between 1 and 10);

create unique index if not exists test_attempts_one_in_progress_per_user_test_idx
  on public.test_attempts (organization_id, test_id, user_id)
  where status = 'in_progress';

create or replace function public.publish_generated_test(
  p_organization_id uuid,
  p_source_document_id uuid,
  p_title text,
  p_description text,
  p_difficulty text,
  p_language text,
  p_target_role text,
  p_question_count int,
  p_passing_score int,
  p_created_by uuid,
  p_published_at timestamptz,
  p_document_ids uuid[],
  p_questions jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_test_id uuid;
  v_inserted_question_count int;
begin
  if array_length(p_document_ids, 1) is null then
    raise exception 'At least one source document is required';
  end if;

  if jsonb_typeof(p_questions) is distinct from 'array' then
    raise exception 'Questions payload must be a JSON array';
  end if;

  insert into public.tests (
    organization_id,
    source_document_id,
    title,
    description,
    status,
    difficulty,
    language,
    target_role,
    question_count,
    passing_score,
    max_attempts,
    created_by,
    published_at,
    is_active,
    source_validity
  )
  values (
    p_organization_id,
    p_source_document_id,
    p_title,
    p_description,
    'published',
    p_difficulty,
    p_language,
    p_target_role,
    p_question_count,
    p_passing_score,
    3,
    p_created_by,
    p_published_at,
    true,
    'valid'
  )
  returning id into v_test_id;

  insert into public.test_documents (test_id, document_id, organization_id)
  select v_test_id, document_id, p_organization_id
  from unnest(p_document_ids) as document_id
  on conflict do nothing;

  insert into public.test_questions (
    organization_id,
    test_id,
    source_chunk_id,
    source_document_id,
    is_active,
    source_status,
    review_status,
    question_text,
    question_type,
    options,
    correct_answer,
    explanation,
    topic,
    difficulty,
    order_index
  )
  select
    p_organization_id,
    v_test_id,
    q.source_chunk_id,
    q.source_document_id,
    true,
    q.source_status,
    q.review_status,
    q.question_text,
    q.question_type,
    coalesce(q.options, '[]'::jsonb),
    coalesce(q.correct_answer, '{}'::jsonb),
    q.explanation,
    q.topic,
    q.difficulty,
    q.order_index
  from jsonb_to_recordset(p_questions) as q(
    source_chunk_id uuid,
    source_document_id uuid,
    source_status text,
    review_status text,
    question_text text,
    question_type text,
    options jsonb,
    correct_answer jsonb,
    explanation text,
    topic text,
    difficulty text,
    order_index int
  );

  get diagnostics v_inserted_question_count = row_count;

  if v_inserted_question_count <> p_question_count then
    raise exception 'Question count mismatch';
  end if;

  return v_test_id;
end;
$$;

create or replace function public.complete_test_attempt(
  p_attempt_id uuid,
  p_test_id uuid,
  p_user_id uuid,
  p_organization_id uuid,
  p_score int,
  p_passed boolean,
  p_completed_at timestamptz,
  p_answers jsonb
)
returns table (
  attempt_id uuid,
  score int,
  passed boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt public.test_attempts%rowtype;
  v_inserted_answer_count int;
  v_expected_answer_count int;
begin
  if jsonb_typeof(p_answers) is distinct from 'array' then
    raise exception 'Answers payload must be a JSON array';
  end if;

  select *
  into v_attempt
  from public.test_attempts
  where id = p_attempt_id
    and test_id = p_test_id
    and user_id = p_user_id
    and organization_id = p_organization_id
  for update;

  if not found then
    raise exception 'Attempt not found';
  end if;

  if v_attempt.status = 'completed'
    and v_attempt.score is not null
    and v_attempt.passed is not null then
    return query select v_attempt.id, v_attempt.score, v_attempt.passed;
    return;
  end if;

  if v_attempt.status <> 'in_progress' then
    raise exception 'Attempt is already completed';
  end if;

  select count(*)
  into v_expected_answer_count
  from jsonb_array_elements(p_answers);

  if exists (
    select 1
    from public.test_answers ta
    where ta.attempt_id = p_attempt_id
      and ta.organization_id = p_organization_id
  ) then
    raise exception 'Attempt already has answers';
  end if;

  insert into public.test_answers (
    organization_id,
    attempt_id,
    question_id,
    user_answer,
    is_correct
  )
  select
    p_organization_id,
    p_attempt_id,
    a.question_id,
    coalesce(a.user_answer, '{}'::jsonb),
    a.is_correct
  from jsonb_to_recordset(p_answers) as a(
    question_id uuid,
    user_answer jsonb,
    is_correct boolean
  );

  get diagnostics v_inserted_answer_count = row_count;

  if v_inserted_answer_count <> v_expected_answer_count then
    raise exception 'Answer count mismatch';
  end if;

  update public.test_attempts
  set
    status = 'completed',
    score = p_score,
    passed = p_passed,
    completed_at = p_completed_at
  where id = p_attempt_id
    and status = 'in_progress';

  if v_attempt.assignment_id is not null then
    update public.test_assignments
    set status = case when p_passed then 'completed' else 'failed' end
    where id = v_attempt.assignment_id
      and organization_id = p_organization_id;
  end if;

  return query select p_attempt_id, p_score, p_passed;
end;
$$;

revoke all on function public.publish_generated_test(
  uuid, uuid, text, text, text, text, text, int, int, uuid, timestamptz, uuid[], jsonb
) from public;
revoke all on function public.complete_test_attempt(
  uuid, uuid, uuid, uuid, int, boolean, timestamptz, jsonb
) from public;
revoke all on function public.publish_generated_test(
  uuid, uuid, text, text, text, text, text, int, int, uuid, timestamptz, uuid[], jsonb
) from authenticated;
revoke all on function public.complete_test_attempt(
  uuid, uuid, uuid, uuid, int, boolean, timestamptz, jsonb
) from authenticated;

grant execute on function public.publish_generated_test(
  uuid, uuid, text, text, text, text, text, int, int, uuid, timestamptz, uuid[], jsonb
) to service_role;
grant execute on function public.complete_test_attempt(
  uuid, uuid, uuid, uuid, int, boolean, timestamptz, jsonb
) to service_role;

comment on column public.tests.max_attempts is
  'Maximum completed attempts allowed for a test assignment retake policy.';
