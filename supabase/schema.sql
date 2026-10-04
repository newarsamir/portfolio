-- Run this once in the Supabase SQL editor.

create extension if not exists "pgcrypto";

-- Project inquiries from /contact
create table if not exists public.contacts (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  name          text not null,
  email         text not null,
  brand         text,
  project_type  text not null,
  budget        text not null,
  message       text not null,
  is_read       boolean not null default false
);

create index if not exists contacts_created_at_idx
  on public.contacts (created_at desc);

-- Key/value site settings edited from /admin
--   hero_video_url      "https://..."            (string)
--   available_for_work  true | false             (boolean)
--   counters            {"emails": 120, ...}     (object, keyed by counter id)
create table if not exists public.settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

-- Case studies, created and edited from /admin
create table if not exists public.case_studies (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  slug        text not null unique,
  title       text not null,
  client      text not null default '',
  industry    text not null default '',
  year        text not null default '',
  services    text[] not null default '{}',
  summary     text not null default '',
  cover       text not null default '',
  challenge   text not null default '',
  approach    text not null default '',
  outcome     text not null default '',
  metrics     jsonb not null default '[]'::jsonb,   -- [{"value": "38%", "label": "..."}]
  gallery     text[] not null default '{}',
  published   boolean not null default false,
  sort_order  integer not null default 0
);

create index if not exists case_studies_sort_idx
  on public.case_studies (sort_order, created_at);

-- Emails in the "Selected emails" section, managed from /admin
create table if not exists public.showcase_items (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  src           text not null,                 -- site path or public image URL
  storage_path  text,                          -- set when uploaded through /admin
  width         integer not null check (width > 0),
  height        integer not null check (height > 0),
  brand         text not null default '',
  type          text not null default '',
  note          text not null default '',
  published     boolean not null default true,
  sort_order    integer not null default 0
);

create index if not exists showcase_items_sort_idx
  on public.showcase_items (sort_order, created_at);

-- Failed admin logins, used for rate limiting across serverless instances
create table if not exists public.login_attempts (
  id          bigint generated always as identity primary key,
  ip          text not null,
  created_at  timestamptz not null default now()
);

create index if not exists login_attempts_ip_created_idx
  on public.login_attempts (ip, created_at desc);

-- Lock everything down. The site only talks to Supabase from server code
-- with the secret key, which bypasses RLS. No policies means the public
-- (anon) key can read and write nothing.
alter table public.contacts       enable row level security;
alter table public.settings       enable row level security;
alter table public.login_attempts enable row level security;
alter table public.case_studies   enable row level security;
alter table public.showcase_items enable row level security;

insert into public.settings (key, value) values
  ('available_for_work', 'true'::jsonb)
on conflict (key) do nothing;

-- Public bucket for email images uploaded from /admin. Uploads go through
-- the server with the secret key, so no storage policies are needed.
do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public)
    values ('showcase', 'showcase', true)
    on conflict (id) do nothing;
  end if;
end $$;

-- Tell Supabase's API about the new tables right away.
notify pgrst, 'reload schema';
