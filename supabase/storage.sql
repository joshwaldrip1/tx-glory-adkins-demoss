-- Public read of player photos.
drop policy if exists photos_public_read on storage.objects;
create policy photos_public_read on storage.objects
  for select using (bucket_id = 'player-photos');

-- Authenticated users may upload/update/delete only within a folder
-- named after a player row they own (path: "<player_id>/...").
drop policy if exists photos_owner_write on storage.objects;
create policy photos_owner_write on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'player-photos'
    and exists (
      select 1 from public.players p
      where p.owner_id = auth.uid()
        and (storage.foldername(name))[1] = p.id::text
    )
  );

drop policy if exists photos_owner_modify on storage.objects;
create policy photos_owner_modify on storage.objects
  for update to authenticated
  using (
    bucket_id = 'player-photos'
    and exists (
      select 1 from public.players p
      where p.owner_id = auth.uid()
        and (storage.foldername(name))[1] = p.id::text
    )
  );
