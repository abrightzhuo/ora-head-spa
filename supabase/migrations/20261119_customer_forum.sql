-- Customer Q&A forum.
-- Customers sign in to ask a question; staff answer and publish it in the admin.
-- Reads and writes go through the service role API, so no table grants are given
-- to anon / authenticated.

begin;

create table if not exists public.forum_topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  customer_id uuid references public.customers (id) on delete set null,
  author_name text not null default '',
  author_email text not null default '',
  locale text not null default 'en',
  title text not null,
  body text not null,
  status text not null default 'pending'
    check (status in ('pending', 'published', 'hidden')),
  published_at timestamptz,
  answered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists forum_topics_status_idx
  on public.forum_topics (status, created_at desc);

create index if not exists forum_topics_user_idx
  on public.forum_topics (user_id, created_at desc)
  where user_id is not null;

create table if not exists public.forum_answers (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.forum_topics (id) on delete cascade,
  staff_id uuid references public.staff_profiles (id) on delete set null,
  author_name text not null default '',
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists forum_answers_topic_idx
  on public.forum_answers (topic_id, created_at);

alter table public.forum_topics enable row level security;
alter table public.forum_answers enable row level security;

revoke all on table public.forum_topics from anon, authenticated;
revoke all on table public.forum_answers from anon, authenticated;

comment on table public.forum_topics is
  'Customer questions submitted from the public forum page.';
comment on column public.forum_topics.status is
  'pending = waiting for staff review, published = visible on the forum, hidden = removed from view.';

commit;
