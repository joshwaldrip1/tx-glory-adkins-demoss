-- Team schedule: games table (public read) + admins allowlist (admin-only writes).
-- Run in the Supabase SQL editor. Then add yourself as admin (last statement).

create extension if not exists "pgcrypto";

create table if not exists public.games (
  id         uuid primary key default gen_random_uuid(),
  game_date  date not null,
  game_time  text,
  event      text,
  opponent   text,
  location   text,
  result     text,
  created_at timestamptz not null default now()
);
create index if not exists games_date_idx on public.games (game_date);
alter table public.games enable row level security;

-- Who may edit the schedule.
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admins enable row level security;

-- A signed-in user may check whether THEY are an admin (used to reveal the editor).
drop policy if exists admins_self_read on public.admins;
create policy admins_self_read on public.admins
  for select to authenticated using (auth.uid() = user_id);

-- Games: anyone can read; only admins can insert/update/delete.
drop policy if exists games_public_read on public.games;
create policy games_public_read on public.games
  for select using (true);

drop policy if exists games_admin_write on public.games;
create policy games_admin_write on public.games
  for all to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- >>> Add yourself as the first admin: replace the email with YOUR login email. <<<
insert into public.admins (user_id)
select id from auth.users where lower(email) = lower('REPLACE_WITH_YOUR_ADMIN_EMAIL')
on conflict do nothing;

-- Seed: College Showcase (Parsons Ranch, Clifton TX), July 11-12 2026. Add results later.
insert into public.games (game_date, game_time, event, opponent, location) values
  ('2026-07-11', '1:30 PM', 'College Showcase', 'Buzz Premier 18U', 'Field 1 · Parsons Ranch, Clifton TX'),
  ('2026-07-11', '3:00 PM', 'College Showcase', 'Buzz Gold 16U',    'Field 1 · Parsons Ranch, Clifton TX'),
  ('2026-07-11', '6:00 PM', 'College Showcase', 'FCA Fastpitch',    'Field 3 · Parkers'),
  ('2026-07-12', '12:00 PM','College Showcase', 'Barrel Factory',   'Field 2 · Remi'),
  ('2026-07-12', '3:00 PM', 'College Showcase', 'Buzz CTX',         'Field 3 · Parkers');
