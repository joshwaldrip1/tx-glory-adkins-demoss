alter table public.players enable row level security;

-- Public + owners can read approved rows.
drop policy if exists players_read_approved on public.players;
create policy players_read_approved on public.players
  for select using (status = 'approved');

-- Owners can read their own rows regardless of status (to see pending).
drop policy if exists players_read_own on public.players;
create policy players_read_own on public.players
  for select using (auth.uid() = owner_id);

-- Owners insert only rows they own (auto-approve: status may be 'approved').
drop policy if exists players_insert_own on public.players;
create policy players_insert_own on public.players
  for insert to authenticated with check (auth.uid() = owner_id);

-- Owners update only their own rows (auto-approve enabled).
drop policy if exists players_update_own on public.players;
create policy players_update_own on public.players
  for update to authenticated using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Owners delete only their own rows.
drop policy if exists players_delete_own on public.players;
create policy players_delete_own on public.players
  for delete to authenticated using (auth.uid() = owner_id);
