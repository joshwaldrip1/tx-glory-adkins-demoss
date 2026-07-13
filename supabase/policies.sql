alter table public.players enable row level security;

-- Public + owners can read approved rows.
drop policy if exists players_read_approved on public.players;
create policy players_read_approved on public.players
  for select using (status = 'approved');

-- Owners can read their own rows regardless of status (to see pending).
drop policy if exists players_read_own on public.players;
create policy players_read_own on public.players
  for select using (auth.uid() = owner_id);

-- Owners insert only rows they own, forced to pending.
drop policy if exists players_insert_own on public.players;
create policy players_insert_own on public.players
  for insert with check (auth.uid() = owner_id and status = 'pending');

-- Owners update only their own rows; may not self-approve.
drop policy if exists players_update_own on public.players;
create policy players_update_own on public.players
  for update using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id and status = 'pending');

-- Owners delete only their own rows.
drop policy if exists players_delete_own on public.players;
create policy players_delete_own on public.players
  for delete using (auth.uid() = owner_id);
