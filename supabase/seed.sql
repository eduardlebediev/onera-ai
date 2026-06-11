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
