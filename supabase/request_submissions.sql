create table if not exists public.request_submissions (
  id bigserial primary key,
  email text not null,
  message text not null,
  email_status text not null default 'pending',
  created_at timestamptz not null default now()
);
