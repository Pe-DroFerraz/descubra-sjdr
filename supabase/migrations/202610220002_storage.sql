begin;
-- Public media only: never upload personal documents or credentials here.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('place-photos','place-photos',true,5242880,array['image/jpeg','image/png','image/webp','image/avif']),
 ('qr-codes','qr-codes',false,2097152,array['image/png','image/svg+xml']),
 ('event-images','event-images',true,5242880,array['image/jpeg','image/png','image/webp','image/avif'])
on conflict(id) do update set public=excluded.public, file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;

-- Invalid paths fail closed rather than raising UUID parsing errors.
create function private.path_place_id(path text) returns uuid language plpgsql immutable set search_path='' as $$
begin
 if split_part(path,'/',1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' and position('/' in path)>0 then
  return split_part(path,'/',1)::uuid;
 end if;
 return null;
end $$;
revoke all on function private.path_place_id(text) from public;
grant execute on function private.path_place_id(text) to anon, authenticated, service_role;
create policy sjdr_media_read on storage.objects for select to anon, authenticated using (
 (bucket_id='place-photos' and private.published_place(private.path_place_id(name))) or
 (bucket_id='event-images' and exists(select 1 from public.events e where e.image_path=name and e.status='published')) or
 (bucket_id in ('place-photos','event-images','qr-codes') and public.has_role('admin')) or
 (bucket_id in ('place-photos','qr-codes') and private.owns_place(private.path_place_id(name)))
);
create policy sjdr_media_insert on storage.objects for insert to authenticated with check (
 (bucket_id in ('place-photos','event-images','qr-codes') and public.has_role('admin')) or
 (bucket_id='place-photos' and private.can_edit_place(private.path_place_id(name)))
);
create policy sjdr_media_update on storage.objects for update to authenticated using (
 (bucket_id in ('place-photos','event-images','qr-codes') and public.has_role('admin')) or
 (bucket_id='place-photos' and private.can_edit_place(private.path_place_id(name)))
) with check (
 (bucket_id in ('place-photos','event-images','qr-codes') and public.has_role('admin')) or
 (bucket_id='place-photos' and private.can_edit_place(private.path_place_id(name)))
);
create policy sjdr_media_delete on storage.objects for delete to authenticated using (
 (bucket_id in ('place-photos','event-images','qr-codes') and public.has_role('admin')) or
 (bucket_id='place-photos' and private.can_edit_place(private.path_place_id(name)))
);
commit;
