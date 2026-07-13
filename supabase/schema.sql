-- Run in Supabase SQL editor (project → SQL).
create extension if not exists "pgcrypto";

create table if not exists public.players (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  first_name    text not null,
  last_name     text not null,
  jersey_number int,
  grad_year     int,
  positions     text[] not null default '{}',
  bats_throws   text,
  height        text,
  weight        text,
  gpa           numeric,
  school        text,
  hometown      text,
  stats         jsonb not null default '{}',
  metrics       jsonb not null default '{}',
  achievements  text[] not null default '{}',
  academics     jsonb not null default '{}',
  bio           jsonb not null default '{}',
  photo_path    text,
  video_url     text,
  profile_url   text,
  socials       jsonb not null default '{}',
  guardian_name  text,
  guardian_email text,
  guardian_phone text,
  status        text not null default 'pending' check (status in ('pending','approved')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists players_status_idx on public.players (status);
create index if not exists players_owner_idx on public.players (owner_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists players_set_updated_at on public.players;
create trigger players_set_updated_at
  before update on public.players
  for each row execute function public.set_updated_at();
