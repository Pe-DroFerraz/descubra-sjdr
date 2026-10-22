-- ADDITIONAL, REVIEW BEFORE APPLYING REMOTELY. No content imports or existing migration replay.
-- Invoker retains RLS. Transactional replacement avoids partial routes and position collisions.
begin;
create function public.admin_set_route_stops(target_route uuid, expected_updated_at timestamptz, stops jsonb)
returns integer language plpgsql security invoker set search_path='' as $$
declare current_version timestamptz; item jsonb; ordinal bigint;
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
  update public.routes set updated_at=clock_timestamp() where id=target_route;
  return jsonb_array_length(stops);
end $$;
revoke all on function public.admin_set_route_stops(uuid,timestamptz,jsonb) from public,anon;
grant execute on function public.admin_set_route_stops(uuid,timestamptz,jsonb) to authenticated;
commit;
