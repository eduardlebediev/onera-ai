-- Review editor: persist per-question review state on draft questions.

alter table public.test_questions
  add column if not exists review_status text not null default 'pending';

alter table public.test_questions
  drop constraint if exists test_questions_review_status_check;

alter table public.test_questions
  add constraint test_questions_review_status_check
  check (review_status in ('pending', 'approved', 'edited', 'rejected'));

comment on column public.test_questions.review_status is
  'Admin review state for draft/review tests before publish.';
