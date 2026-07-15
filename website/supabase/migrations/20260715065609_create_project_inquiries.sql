create extension if not exists pg_cron;

create table public.project_inquiries (
  id uuid primary key default gen_random_uuid(),
  idempotency_key uuid not null unique,
  reference_code text not null unique,
  name text not null,
  email text not null,
  organization_project text not null,
  decision_role text not null check (
    decision_role in ('final', 'shared', 'not_final')
  ),
  budget_band text not null check (
    budget_band in ('under_5k', '5k_8k', '8k_15k', '15k_plus')
  ),
  services text[] not null check (cardinality(services) > 0),
  answers jsonb not null,
  status text not null default 'new' check (
    status in ('new', 'reviewing', 'replied', 'closed')
  ),
  email_status text not null default 'pending' check (
    email_status in ('pending', 'sent', 'failed')
  ),
  consent_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '12 months')
);

comment on table public.project_inquiries is
  'Solar Static Studio project inquiries. Rows expire after 12 months.';
comment on column public.project_inquiries.answers is
  'Versioned ProjectInquiryPayloadV1 submitted through the server-only endpoint.';

create index project_inquiries_created_at_idx
  on public.project_inquiries (created_at desc);
create index project_inquiries_expires_at_idx
  on public.project_inquiries (expires_at);

alter table public.project_inquiries enable row level security;

revoke all on table public.project_inquiries from anon, authenticated;
grant select, insert, update, delete
  on table public.project_inquiries
  to service_role;

select cron.schedule(
  'purge-expired-project-inquiries',
  '15 9 * * *',
  $$delete from public.project_inquiries where expires_at < now()$$
);
