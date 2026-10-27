-- ADDITIONAL, REVIEW BEFORE APPLYING REMOTELY. No content imports or existing migration replay.
-- Invoker retains RLS. Transactional replacement avoids partial routes and position collisions.
begin;
-- Fail closed if the remote route trigger differs from the audited original.
do $$ begin
  if not exists(select 1 from pg_trigger t where t.tgrelid='public.routes'::regclass
    and t.tgname='set_updated_at' and not t.tgisinternal
    and t.tgfoid='public.touch_updated_at()'::regprocedure and t.tgtype=19 and t.tgenabled='O')
    or not exists(select 1 from pg_proc where oid='public.touch_updated_at()'::regprocedure
      and rtrim(lower(regexp_replace(prosrc,'[[:space:]]','','g')),';')='beginnew.updated_at=now();returnnew;end')
    or exists(select 1 from pg_trigger where tgrelid='public.routes'::regclass and not tgisinternal
      and tgname<>'set_updated_at' and (tgtype::integer & 2)=2 and (tgtype::integer & 16)=16)
    or exists(select 1 from public.routes where not isfinite(updated_at)) then
    raise exception 'review route trigger / non-finite versions before deployment';
  end if;
end $$;
alter table public.routes add constraint routes_updated_at_finite check (isfinite(updated_at));
-- Only routes change clock semantics. Other tables retain touch_updated_at()/now().
-- Strict monotonicity survives rapid writes, long transactions and a clock adjustment.
create function private.touch_route_updated_at() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  new.updated_at:=greatest(clock_timestamp(),old.updated_at+interval '1 microsecond');
  return new;
end $$;
revoke all on function private.touch_route_updated_at() from public,anon,authenticated,service_role;
drop trigger set_updated_at on public.routes;
create trigger set_updated_at before update on public.routes
  for each row execute function private.touch_route_updated_at();
create function public.admin_set_route_stops(target_route uuid, expected_updated_at timestamptz, stops jsonb)
returns integer language plpgsql security invoker set search_path='' as $$
declare current_version timestamptz; item jsonb;
begin
  if not public.has_role('admin') then raise exception 'forbidden' using errcode='42501'; end if;
  if stops is null or jsonb_typeof(stops)<>'array' then raise exception 'invalid stops' using errcode='22023'; end if;
  if jsonb_array_length(stops)>100 then raise exception 'too many stops' using errcode='22023'; end if;
  select updated_at into current_version from public.routes where id=target_route for update;
  if not found then raise exception 'route not found' using errcode='P0002'; end if;
  if expected_updated_at is distinct from current_version then raise exception 'stale route' using errcode='40001'; end if;
  for item in select value from jsonb_array_elements(stops) loop
    if jsonb_typeof(item)<>'object' or not item ? 'place_id'
      or exists(select 1 from jsonb_object_keys(item) key where key not in ('place_id','duration_minutes'))
      or jsonb_typeof(item->'place_id')<>'string' then
      raise exception 'invalid stop' using errcode='22023';
    end if;
    if item->>'place_id' is null then raise exception 'missing place' using errcode='22023'; end if;
    if item ? 'duration_minutes' and jsonb_typeof(item->'duration_minutes') not in ('null','number') then
      raise exception 'invalid duration' using errcode='22023';
    end if;
  end loop;
  if exists(select 1 from public.routes where id=target_route and status='published') and exists(
    select 1 from jsonb_array_elements(stops) stop
    left join public.places p on p.id=(stop->>'place_id')::uuid
    where p.id is null or p.status<>'published' or p.is_demo
  ) then raise exception 'unpublished stop' using errcode='23514'; end if;
  delete from public.route_stops where route_id=target_route;
  insert into public.route_stops(route_id,place_id,position,duration_minutes)
    select target_route,(value->>'place_id')::uuid,(ordinality-1)::integer,(value->>'duration_minutes')::integer
    from jsonb_array_elements(stops) with ordinality;
  -- The route-specific trigger owns version generation; never trust caller timestamps.
  update public.routes set updated_at=updated_at where id=target_route;
  return jsonb_array_length(stops);
end $$;
revoke all on function public.admin_set_route_stops(uuid,timestamptz,jsonb) from public,anon,service_role;
grant execute on function public.admin_set_route_stops(uuid,timestamptz,jsonb) to authenticated;
commit;
