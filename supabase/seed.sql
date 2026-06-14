-- Demo seed data for Ontera AI RAG foundation.
-- Fixed UUIDs keep references stable across local resets and remote seed runs.
--
-- Public demo data (org, documents, chunks) always loads.
-- Auth users, profiles, and members are optional: if direct auth.users inserts fail
-- (schema differences, permissions), the seed continues without them.

insert into public.organizations (id, name, slug)
values (
  'a0000000-0000-4000-8000-000000000001',
  'Ontera Demo Org',
  'ontera-demo'
)
on conflict (id) do nothing;

do $seed_auth$
begin
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  values
    (
      '00000000-0000-0000-0000-000000000000',
      'b0000000-0000-4000-8000-000000000001',
      'authenticated',
      'authenticated',
      'admin@demo.ontera.ai',
      extensions.crypt('demo-only-password', extensions.gen_salt('bf')),
      timezone('utc', now()),
      '',
      '',
      '',
      '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Alex Morgan"}'::jsonb,
      timezone('utc', now()),
      timezone('utc', now())
    ),
    (
      '00000000-0000-0000-0000-000000000000',
      'b0000000-0000-4000-8000-000000000002',
      'authenticated',
      'authenticated',
      'employee@demo.ontera.ai',
      extensions.crypt('demo-only-password', extensions.gen_salt('bf')),
      timezone('utc', now()),
      '',
      '',
      '',
      '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Jordan Lee"}'::jsonb,
      timezone('utc', now()),
      timezone('utc', now())
    )
  on conflict (id) do nothing;

  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  values
    (
      'b0000000-0000-4000-8000-000000000011',
      'b0000000-0000-4000-8000-000000000001',
      '{"sub":"b0000000-0000-4000-8000-000000000001","email":"admin@demo.ontera.ai"}'::jsonb,
      'email',
      'b0000000-0000-4000-8000-000000000001',
      timezone('utc', now()),
      timezone('utc', now()),
      timezone('utc', now())
    ),
    (
      'b0000000-0000-4000-8000-000000000012',
      'b0000000-0000-4000-8000-000000000002',
      '{"sub":"b0000000-0000-4000-8000-000000000002","email":"employee@demo.ontera.ai"}'::jsonb,
      'email',
      'b0000000-0000-4000-8000-000000000002',
      timezone('utc', now()),
      timezone('utc', now()),
      timezone('utc', now())
    )
  on conflict (id) do nothing;
exception
  when others then
    raise notice 'Demo auth user seed skipped: %', sqlerrm;
end;
$seed_auth$;

insert into public.profiles (id, email, full_name)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1))
from auth.users u
where u.id in (
  'b0000000-0000-4000-8000-000000000001',
  'b0000000-0000-4000-8000-000000000002'
)
on conflict (id) do nothing;

insert into public.organization_members (
  id,
  organization_id,
  user_id,
  role,
  status,
  department,
  job_title,
  accepted_at
)
select
  seed.id,
  seed.organization_id,
  seed.user_id,
  seed.role,
  seed.status,
  seed.department,
  seed.job_title,
  seed.accepted_at
from (
  values
    (
      'd0000000-0000-4000-8000-000000000001'::uuid,
      'a0000000-0000-4000-8000-000000000001'::uuid,
      'b0000000-0000-4000-8000-000000000001'::uuid,
      'admin',
      'active',
      'Operations',
      'Training Manager',
      timezone('utc', now())
    ),
    (
      'd0000000-0000-4000-8000-000000000002'::uuid,
      'a0000000-0000-4000-8000-000000000001'::uuid,
      'b0000000-0000-4000-8000-000000000002'::uuid,
      'employee',
      'active',
      'Customer Support',
      'Support Specialist',
      timezone('utc', now())
    )
) as seed (id, organization_id, user_id, role, status, department, job_title, accepted_at)
join public.profiles p on p.id = seed.user_id
on conflict (id) do nothing;

insert into public.documents (
  id,
  organization_id,
  title,
  description,
  source_type,
  file_name,
  status,
  created_by
)
values
  (
    'c0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    'Security Guidelines',
    'Internal security policies for employees handling company systems and data.',
    'demo',
    'security-guidelines.md',
    'ready',
    (
      select id
      from public.profiles
      where id = 'b0000000-0000-4000-8000-000000000001'
    )
  ),
  (
    'c0000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000001',
    'Customer Support Escalation Guide',
    'Procedures for triaging, escalating, and resolving customer support incidents.',
    'demo',
    'support-escalation-guide.md',
    'ready',
    (
      select id
      from public.profiles
      where id = 'b0000000-0000-4000-8000-000000000001'
    )
  )
on conflict (id) do nothing;

insert into public.document_chunks (
  id,
  organization_id,
  document_id,
  chunk_index,
  title,
  topic,
  content,
  token_count,
  embedding
)
values
  (
    'e0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000001',
    0,
    'Password and MFA Requirements',
    'Authentication',
    'All employees must use unique passwords of at least 14 characters. Multi-factor authentication (MFA) is mandatory for email, VPN, admin tools, and any system containing customer data. Shared accounts are prohibited.',
    48,
    null
  ),
  (
    'e0000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000001',
    1,
    'Phishing Response',
    'Incident Reporting',
    'If you suspect a phishing email, do not click links or download attachments. Forward the message to security@company.internal using the Report Phishing button, then delete it from your inbox. Report suspected phishing within 15 minutes.',
    52,
    null
  ),
  (
    'e0000000-0000-4000-8000-000000000003',
    'a0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000001',
    2,
    'Data Classification',
    'Data Handling',
    'Public data may be shared externally without approval. Internal data is for employees only. Confidential data includes customer records and must never be stored on personal devices. Restricted data requires explicit manager approval before access.',
    55,
    null
  ),
  (
    'e0000000-0000-4000-8000-000000000004',
    'a0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000001',
    3,
    'Remote Work Security',
    'Remote Access',
    'When working remotely, connect through the company VPN before accessing internal systems. Lock your screen when stepping away. Do not use public Wi-Fi without VPN. Company-managed devices must have disk encryption enabled.',
    50,
    null
  ),
  (
    'e0000000-0000-4000-8000-000000000005',
    'a0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000001',
    4,
    'Access Reviews',
    'Access Control',
    'Managers must review team access quarterly. Remove access within 24 hours when an employee changes roles or leaves the company. Temporary elevated access expires automatically after 8 hours and requires a ticket reference.',
    47,
    null
  ),
  (
    'e0000000-0000-4000-8000-000000000006',
    'a0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000002',
    0,
    'Severity Levels',
    'Incident Triage',
    'P0: complete service outage or data breach — page on-call immediately. P1: major feature broken for many customers — escalate within 15 minutes. P2: partial degradation — resolve within 4 hours. P3: minor issue — resolve within 2 business days.',
    58,
    null
  ),
  (
    'e0000000-0000-4000-8000-000000000007',
    'a0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000002',
    1,
    'First Response Checklist',
    'Customer Communication',
    'Acknowledge the customer within 5 minutes. Confirm impact scope, affected account, and reproduction steps. Set expectations for the next update. Never promise a fix timeline without engineer confirmation.',
    45,
    null
  ),
  (
    'e0000000-0000-4000-8000-000000000008',
    'a0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000002',
    2,
    'Escalation Paths',
    'Escalation Paths',
    'Tier 1 support handles billing and account questions. Escalate technical bugs to Tier 2 after documenting logs and steps to reproduce. Escalate to engineering for P0/P1 incidents using the #incidents Slack channel and the incident commander rotation.',
    54,
    null
  ),
  (
    'e0000000-0000-4000-8000-000000000009',
    'a0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000002',
    3,
    'Post-Incident Follow-up',
    'Incident Reporting',
    'After resolving a P0 or P1 incident, send a customer-facing summary within 24 hours. Internal postmortems are required within 3 business days. Document root cause, timeline, and preventive actions in the incident tracker.',
    50,
    null
  ),
  (
    'e0000000-0000-4000-8000-000000000010',
    'a0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000002',
    4,
    'Sensitive Customer Data',
    'Data Handling',
    'Do not paste full credit card numbers, government IDs, or passwords into tickets or chat. Use secure fields for sensitive uploads. Redact personal data in screenshots before sharing internally.',
    44,
    null
  )
on conflict (id) do nothing;

update public.documents as d
set extracted_text = aggregated.full_text
from (
  select
    dc.document_id,
    string_agg(dc.content, E'\n\n' order by dc.chunk_index) as full_text
  from public.document_chunks as dc
  group by dc.document_id
) as aggregated
where d.id = aggregated.document_id
  and d.source_type = 'demo';

insert into public.document_topics (
  id,
  organization_id,
  document_id,
  topic,
  description,
  confidence,
  source
)
values
  (
    'e1000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000001',
    'Authentication',
    'Password length, MFA coverage, and shared-account restrictions.',
    0.94,
    'seed'
  ),
  (
    'e1000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000001',
    'Incident Reporting',
    'Phishing response timing and employee reporting expectations.',
    0.9,
    'seed'
  ),
  (
    'e1000000-0000-4000-8000-000000000003',
    'a0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000001',
    'Data Handling',
    'Classification rules for public, internal, confidential, and restricted data.',
    0.89,
    'seed'
  ),
  (
    'e1000000-0000-4000-8000-000000000004',
    'a0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000001',
    'Remote Access',
    'VPN, screen lock, Wi-Fi, and device security rules for remote work.',
    0.86,
    'seed'
  ),
  (
    'e1000000-0000-4000-8000-000000000005',
    'a0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000001',
    'Access Control',
    'Quarterly access reviews, offboarding removal, and elevated-access limits.',
    0.87,
    'seed'
  ),
  (
    'e1000000-0000-4000-8000-000000000006',
    'a0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000002',
    'Incident Triage',
    'Severity levels and escalation timing for customer-impacting incidents.',
    0.92,
    'seed'
  ),
  (
    'e1000000-0000-4000-8000-000000000007',
    'a0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000002',
    'Customer Communication',
    'First-response expectations, impact discovery, and update discipline.',
    0.88,
    'seed'
  ),
  (
    'e1000000-0000-4000-8000-000000000008',
    'a0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000002',
    'Escalation Paths',
    'Tier ownership and engineering escalation handoff rules.',
    0.91,
    'seed'
  ),
  (
    'e1000000-0000-4000-8000-000000000009',
    'a0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000002',
    'Data Handling',
    'Safe handling of sensitive customer information in tickets and screenshots.',
    0.85,
    'seed'
  )
on conflict (id) do nothing;

insert into public.tests (
  id,
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
  'f0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000001',
  'c0000000-0000-4000-8000-000000000001',
  'Security Guidelines Knowledge Check',
  'A published demo test covering authentication, phishing response, data handling, remote access, and access reviews.',
  'published',
  'medium',
  'en',
  'All employees',
  5,
  70,
  3,
  (
    select id
    from public.profiles
    where id = 'b0000000-0000-4000-8000-000000000001'
  ),
  timezone('utc', now()) - interval '6 days',
  true,
  'valid'
)
on conflict (id) do nothing;

insert into public.test_documents (
  test_id,
  document_id,
  organization_id
)
values (
  'f0000000-0000-4000-8000-000000000001',
  'c0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000001'
)
on conflict (test_id, document_id) do nothing;

insert into public.test_questions (
  id,
  organization_id,
  test_id,
  source_chunk_id,
  source_document_id,
  question_text,
  question_type,
  options,
  correct_answer,
  explanation,
  topic,
  difficulty,
  order_index,
  is_active,
  source_status,
  review_status
)
values
  (
    'f1000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    'f0000000-0000-4000-8000-000000000001',
    'e0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000001',
    'Which password and MFA rule is required for employees?',
    'single_choice',
    '[{"id":"q1-a","text":"Use at least 8 characters and MFA only for finance tools."},{"id":"q1-b","text":"Use unique passwords of at least 14 characters and MFA on protected systems."},{"id":"q1-c","text":"Share team accounts when access is urgent."},{"id":"q1-d","text":"Use MFA only when working remotely."}]'::jsonb,
    '{"optionIds":["q1-b"]}'::jsonb,
    'The guideline requires unique passwords of at least 14 characters and MFA for email, VPN, admin tools, and systems with customer data.',
    'Authentication',
    'medium',
    0,
    true,
    'valid',
    'approved'
  ),
  (
    'f1000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000001',
    'f0000000-0000-4000-8000-000000000001',
    'e0000000-0000-4000-8000-000000000002',
    'c0000000-0000-4000-8000-000000000001',
    'What should an employee do after spotting a suspected phishing email?',
    'single_choice',
    '[{"id":"q2-a","text":"Open the link in a private browser window."},{"id":"q2-b","text":"Forward it to coworkers for review."},{"id":"q2-c","text":"Report it with the Report Phishing button within 15 minutes."},{"id":"q2-d","text":"Reply to the sender and ask for confirmation."}]'::jsonb,
    '{"optionIds":["q2-c"]}'::jsonb,
    'Employees should avoid links and attachments, report the email using the Report Phishing button, and do so within 15 minutes.',
    'Incident Reporting',
    'medium',
    1,
    true,
    'valid',
    'approved'
  ),
  (
    'f1000000-0000-4000-8000-000000000003',
    'a0000000-0000-4000-8000-000000000001',
    'f0000000-0000-4000-8000-000000000001',
    'e0000000-0000-4000-8000-000000000003',
    'c0000000-0000-4000-8000-000000000001',
    'Which data classification includes customer records?',
    'single_choice',
    '[{"id":"q3-a","text":"Public"},{"id":"q3-b","text":"Internal"},{"id":"q3-c","text":"Confidential"},{"id":"q3-d","text":"Temporary"}]'::jsonb,
    '{"optionIds":["q3-c"]}'::jsonb,
    'Customer records are confidential data and must not be stored on personal devices.',
    'Data Handling',
    'medium',
    2,
    true,
    'valid',
    'approved'
  ),
  (
    'f1000000-0000-4000-8000-000000000004',
    'a0000000-0000-4000-8000-000000000001',
    'f0000000-0000-4000-8000-000000000001',
    'e0000000-0000-4000-8000-000000000004',
    'c0000000-0000-4000-8000-000000000001',
    'Which remote-work behavior matches the security guideline?',
    'single_choice',
    '[{"id":"q4-a","text":"Connect through the company VPN before accessing internal systems."},{"id":"q4-b","text":"Use public Wi-Fi without VPN for low-risk tasks."},{"id":"q4-c","text":"Disable disk encryption while traveling."},{"id":"q4-d","text":"Leave the screen unlocked during short breaks."}]'::jsonb,
    '{"optionIds":["q4-a"]}'::jsonb,
    'Remote employees must connect through the company VPN before internal access and keep devices protected.',
    'Remote Access',
    'easy',
    3,
    true,
    'valid',
    'approved'
  ),
  (
    'f1000000-0000-4000-8000-000000000005',
    'a0000000-0000-4000-8000-000000000001',
    'f0000000-0000-4000-8000-000000000001',
    'e0000000-0000-4000-8000-000000000005',
    'c0000000-0000-4000-8000-000000000001',
    'How often must managers review team access?',
    'single_choice',
    '[{"id":"q5-a","text":"Only during annual planning."},{"id":"q5-b","text":"Quarterly."},{"id":"q5-c","text":"Every two years."},{"id":"q5-d","text":"Only after a security incident."}]'::jsonb,
    '{"optionIds":["q5-b"]}'::jsonb,
    'Managers must review team access quarterly and remove access quickly when an employee changes roles or leaves.',
    'Access Control',
    'medium',
    4,
    true,
    'valid',
    'approved'
  )
on conflict (id) do nothing;

insert into public.test_assignments (
  id,
  organization_id,
  test_id,
  user_id,
  assigned_by,
  status,
  deadline,
  created_at,
  updated_at
)
select
  'f2000000-0000-4000-8000-000000000001'::uuid,
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'f0000000-0000-4000-8000-000000000001'::uuid,
  employee.id,
  admin.id,
  'failed',
  timezone('utc', now()) + interval '8 days',
  timezone('utc', now()) - interval '5 days',
  timezone('utc', now()) - interval '2 days'
from public.profiles employee
left join public.profiles admin
  on admin.id = 'b0000000-0000-4000-8000-000000000001'
where employee.id = 'b0000000-0000-4000-8000-000000000002'
on conflict (test_id, user_id) do nothing;

insert into public.test_attempts (
  id,
  organization_id,
  test_id,
  user_id,
  assignment_id,
  status,
  score,
  passed,
  ai_feedback,
  started_at,
  completed_at,
  created_at,
  updated_at
)
select
  'f3000000-0000-4000-8000-000000000001'::uuid,
  assignment.organization_id,
  assignment.test_id,
  assignment.user_id,
  assignment.id,
  'completed',
  60,
  false,
  '{"version":1,"feedback":{"performanceSummary":"You scored 60% and did not meet the passing threshold on the Security Guidelines Knowledge Check.","understoodWell":"You correctly handled authentication, data handling, and remote access questions.","needsImprovement":"Review phishing response timing and quarterly access review expectations.","recommendedNextStep":"Revisit the Security Guidelines sections on Incident Reporting and Access Control, then retake the test."}}',
  timezone('utc', now()) - interval '2 days 25 minutes',
  timezone('utc', now()) - interval '2 days',
  timezone('utc', now()) - interval '2 days 25 minutes',
  timezone('utc', now()) - interval '2 days'
from public.test_assignments assignment
where assignment.id = 'f2000000-0000-4000-8000-000000000001'
on conflict (id) do nothing;

insert into public.test_answers (
  id,
  organization_id,
  attempt_id,
  question_id,
  user_answer,
  is_correct,
  ai_explanation
)
select
  answer.id,
  attempt.organization_id,
  attempt.id,
  answer.question_id,
  answer.user_answer,
  answer.is_correct,
  answer.ai_explanation
from public.test_attempts attempt
join (
  values
    (
      'f4000000-0000-4000-8000-000000000001'::uuid,
      'f1000000-0000-4000-8000-000000000001'::uuid,
      '{"selectedOptionIds":["q1-b"]}'::jsonb,
      true,
      'Correct. The guideline requires 14-character unique passwords and MFA on protected systems.'
    ),
    (
      'f4000000-0000-4000-8000-000000000002'::uuid,
      'f1000000-0000-4000-8000-000000000002'::uuid,
      '{"selectedOptionIds":["q2-b"]}'::jsonb,
      false,
      'Incorrect. Suspicious emails should be reported with the Report Phishing button within 15 minutes.'
    ),
    (
      'f4000000-0000-4000-8000-000000000003'::uuid,
      'f1000000-0000-4000-8000-000000000003'::uuid,
      '{"selectedOptionIds":["q3-c"]}'::jsonb,
      true,
      'Correct. Customer records are confidential data.'
    ),
    (
      'f4000000-0000-4000-8000-000000000004'::uuid,
      'f1000000-0000-4000-8000-000000000004'::uuid,
      '{"selectedOptionIds":["q4-a"]}'::jsonb,
      true,
      'Correct. VPN is required before accessing internal systems remotely.'
    ),
    (
      'f4000000-0000-4000-8000-000000000005'::uuid,
      'f1000000-0000-4000-8000-000000000005'::uuid,
      '{"selectedOptionIds":["q5-a"]}'::jsonb,
      false,
      'Incorrect. Managers must review access quarterly.'
    )
) as answer (id, question_id, user_answer, is_correct, ai_explanation)
  on true
where attempt.id = 'f3000000-0000-4000-8000-000000000001'
on conflict (id) do nothing;

insert into public.ai_generation_runs (
  id,
  organization_id,
  document_id,
  test_id,
  status,
  model,
  embedding_model,
  input_config,
  retrieved_chunk_ids,
  output_summary,
  created_by,
  created_at,
  completed_at
)
values (
  'f5000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000001',
  'c0000000-0000-4000-8000-000000000001',
  'f0000000-0000-4000-8000-000000000001',
  'completed',
  'gpt-4.1-mini',
  'text-embedding-3-small',
  '{"difficulty":"medium","questionCount":5,"targetRole":"All employees","language":"en"}'::jsonb,
  array[
    'e0000000-0000-4000-8000-000000000001',
    'e0000000-0000-4000-8000-000000000002',
    'e0000000-0000-4000-8000-000000000003',
    'e0000000-0000-4000-8000-000000000004',
    'e0000000-0000-4000-8000-000000000005'
  ]::uuid[],
  '{"question_count":5,"status":"published_seed","topics":["Authentication","Incident Reporting","Data Handling","Remote Access","Access Control"]}'::jsonb,
  (
    select id
    from public.profiles
    where id = 'b0000000-0000-4000-8000-000000000001'
  ),
  timezone('utc', now()) - interval '6 days',
  timezone('utc', now()) - interval '6 days'
)
on conflict (id) do nothing;
