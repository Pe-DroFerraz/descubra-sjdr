-- NOT AUTHORIZED FOR REMOTE EXECUTION. Reconcile definitions, review effects and obtain approval first.
-- Run with ON_ERROR_STOP; never use alongside migration up/db push.
-- REVIEW ONLY: 20261022150000_security_hardening.sql; SHA256 92399df11e221c0846cfecc72581bdb04d5dfbf2a5226fc080922009676585ba
-- No original migration DDL. History and this stage commit together, or neither does.
begin;
set local lock_timeout='5s';
set local statement_timeout='120s';
set local search_path=pg_catalog;
select pg_advisory_xact_lock(73492027150000);
do $review_stage$
declare applied record; source_sql constant text:=$review_source$-- Additional hardening only. DO NOT reapply core/storage/tourist_catalog remotely.
-- Apply only after comparing the actual remote history/definitions with the read-only audit.
begin;
-- API roles use existing objects; they do not need to create/replace objects in a trusted schema.
revoke create on schema public from public, anon, authenticated;
revoke create on schema private from public, anon, authenticated;
-- Preserve the privileges required to evaluate RLS helpers.
grant usage on schema private to anon, authenticated, service_role;

alter function public.has_role(public.app_role) set search_path = '';
alter function public.public_place_benefits() set search_path = '';
alter function public.public_route_sponsors(uuid) set search_path = '';
alter function private.owns_advertiser(uuid) set search_path = '';
alter function private.owns_place(uuid) set search_path = '';
alter function private.can_edit_place(uuid) set search_path = '';
alter function private.published_place(uuid) set search_path = '';
alter function private.path_place_id(text) set search_path = '';
alter function public.place_daily_metrics(uuid,date,date) set search_path = '';
alter function public.redeem_coupon(uuid,uuid,uuid) set search_path = '';

-- Do not alter postgres global default privileges: platform functions may share this owner.
-- A per-schema REVOKE cannot override global default PUBLIC EXECUTE. Future application
-- migrations must explicitly REVOKE PUBLIC and GRANT the intended roles for each function.

-- Revoke the implicit PUBLIC grant, not legitimate explicit application grants.
revoke all on function public.touch_updated_at() from public, anon, authenticated, service_role;
revoke all on function public.has_role(public.app_role) from public;
grant execute on function public.has_role(public.app_role) to anon, authenticated, service_role;
revoke all on function public.public_place_benefits() from public;
revoke all on function public.public_route_sponsors(uuid) from public;
grant execute on function public.public_place_benefits(), public.public_route_sponsors(uuid) to anon, authenticated, service_role;
revoke all on function public.place_daily_metrics(uuid,date,date) from public, anon;
grant execute on function public.place_daily_metrics(uuid,date,date) to authenticated, service_role;
revoke all on function public.redeem_coupon(uuid,uuid,uuid) from public, anon, authenticated;
grant execute on function public.redeem_coupon(uuid,uuid,uuid) to service_role;
revoke all on function private.owns_advertiser(uuid), private.owns_place(uuid), private.can_edit_place(uuid), private.published_place(uuid), private.path_place_id(text) from public;

-- These helpers are used by authenticated write/owner policies, not anonymous reads.
-- Keep owns_place/published_place/path_place_id for the anonymous Storage/read policies.
revoke all on function private.owns_advertiser(uuid), private.can_edit_place(uuid) from anon;

-- Event-trigger dispatch does not require client EXECUTE on its handler. Preserve
-- body, owner, search_path and binding; only restrict the unnecessary API ACL.
-- The optional platform object must match the externally audited shape, otherwise abort.
do $$ declare handler oid; begin
  handler:=to_regprocedure('public.rls_auto_enable()');
  if handler is not null then
    if not exists(select 1 from pg_proc p where p.oid=handler
        and pg_get_userbyid(p.proowner)='postgres' and p.prorettype='event_trigger'::regtype
        and p.prosecdef and p.proconfig @> array['search_path=pg_catalog'])
      or not exists(select 1 from pg_event_trigger where evtname='ensure_rls'
        and evtfoid=handler and evtenabled in ('O','A')) then
      raise exception 'platform RLS handler differs: review dependencies before hardening';
    end if;
    revoke all on function public.rls_auto_enable() from public,anon,authenticated,service_role;
  end if;
end $$;
commit;
$review_source$;
begin
  if exists(select 1 from supabase_migrations.schema_migrations where name not in ('core','storage','tourist_catalog','security_hardening','admin_route_stops','editorial_provenance') or name is null) then
    raise exception 'unreviewed migration history: stop, do not repair automatically';
  end if;
  if (select count(*) from supabase_migrations.schema_migrations where name='core')<>1
    or not exists(select 1 from supabase_migrations.schema_migrations where name='core' and version in ('202610220001','20261022141818')) then
    raise exception 'original migration mapping mismatch: core';
  end if;
  if (select count(*) from supabase_migrations.schema_migrations where name='storage')<>1
    or not exists(select 1 from supabase_migrations.schema_migrations where name='storage' and version in ('202610220002','20261022141828')) then
    raise exception 'original migration mapping mismatch: storage';
  end if;
  if (select count(*) from supabase_migrations.schema_migrations where name='tourist_catalog')<>1
    or not exists(select 1 from supabase_migrations.schema_migrations where name='tourist_catalog' and version in ('202610220003','20261022141835')) then
    raise exception 'original migration mapping mismatch: tourist_catalog';
  end if;
  select name,statements into applied from supabase_migrations.schema_migrations where version='20261022150000';
  if found then
    if applied.name is distinct from 'security_hardening' or applied.statements is distinct from array[source_sql] then
      raise exception 'recorded migration differs from reviewed source: 20261022150000';
    end if;
    return; -- Exact replay: no DDL or second history write.
  end if;
  if exists(select 1 from supabase_migrations.schema_migrations where name='security_hardening') then
    raise exception 'additional migration name/version collision';
  end if;

  execute $review_body$-- Additional hardening only. DO NOT reapply core/storage/tourist_catalog remotely.
-- Apply only after comparing the actual remote history/definitions with the read-only audit.

-- API roles use existing objects; they do not need to create/replace objects in a trusted schema.
revoke create on schema public from public, anon, authenticated;
revoke create on schema private from public, anon, authenticated;
-- Preserve the privileges required to evaluate RLS helpers.
grant usage on schema private to anon, authenticated, service_role;

alter function public.has_role(public.app_role) set search_path = '';
alter function public.public_place_benefits() set search_path = '';
alter function public.public_route_sponsors(uuid) set search_path = '';
alter function private.owns_advertiser(uuid) set search_path = '';
alter function private.owns_place(uuid) set search_path = '';
alter function private.can_edit_place(uuid) set search_path = '';
alter function private.published_place(uuid) set search_path = '';
alter function private.path_place_id(text) set search_path = '';
alter function public.place_daily_metrics(uuid,date,date) set search_path = '';
alter function public.redeem_coupon(uuid,uuid,uuid) set search_path = '';

-- Do not alter postgres global default privileges: platform functions may share this owner.
-- A per-schema REVOKE cannot override global default PUBLIC EXECUTE. Future application
-- migrations must explicitly REVOKE PUBLIC and GRANT the intended roles for each function.

-- Revoke the implicit PUBLIC grant, not legitimate explicit application grants.
revoke all on function public.touch_updated_at() from public, anon, authenticated, service_role;
revoke all on function public.has_role(public.app_role) from public;
grant execute on function public.has_role(public.app_role) to anon, authenticated, service_role;
revoke all on function public.public_place_benefits() from public;
revoke all on function public.public_route_sponsors(uuid) from public;
grant execute on function public.public_place_benefits(), public.public_route_sponsors(uuid) to anon, authenticated, service_role;
revoke all on function public.place_daily_metrics(uuid,date,date) from public, anon;
grant execute on function public.place_daily_metrics(uuid,date,date) to authenticated, service_role;
revoke all on function public.redeem_coupon(uuid,uuid,uuid) from public, anon, authenticated;
grant execute on function public.redeem_coupon(uuid,uuid,uuid) to service_role;
revoke all on function private.owns_advertiser(uuid), private.owns_place(uuid), private.can_edit_place(uuid), private.published_place(uuid), private.path_place_id(text) from public;

-- These helpers are used by authenticated write/owner policies, not anonymous reads.
-- Keep owns_place/published_place/path_place_id for the anonymous Storage/read policies.
revoke all on function private.owns_advertiser(uuid), private.can_edit_place(uuid) from anon;

-- Event-trigger dispatch does not require client EXECUTE on its handler. Preserve
-- body, owner, search_path and binding; only restrict the unnecessary API ACL.
-- The optional platform object must match the externally audited shape, otherwise abort.
do $$ declare handler oid; begin
  handler:=to_regprocedure('public.rls_auto_enable()');
  if handler is not null then
    if not exists(select 1 from pg_proc p where p.oid=handler
        and pg_get_userbyid(p.proowner)='postgres' and p.prorettype='event_trigger'::regtype
        and p.prosecdef and p.proconfig @> array['search_path=pg_catalog'])
      or not exists(select 1 from pg_event_trigger where evtname='ensure_rls'
        and evtfoid=handler and evtenabled in ('O','A')) then
      raise exception 'platform RLS handler differs: review dependencies before hardening';
    end if;
    revoke all on function public.rls_auto_enable() from public,anon,authenticated,service_role;
  end if;
end $$;
$review_body$;
  insert into supabase_migrations.schema_migrations(version,name,statements)
    values ('20261022150000','security_hardening',array[source_sql]);
end $review_stage$;
commit;

-- REVIEW ONLY: 20261022170000_admin_route_stops.sql; SHA256 00e9491d0a82524e6f83b3b2bf86483114abf7372dce69dd0887d3c3fd09a671
-- No original migration DDL. History and this stage commit together, or neither does.
begin;
set local lock_timeout='5s';
set local statement_timeout='120s';
set local search_path=pg_catalog;
select pg_advisory_xact_lock(73492027150000);
do $review_stage$
declare applied record; source_sql constant text:=$review_source$-- ADDITIONAL, REVIEW BEFORE APPLYING REMOTELY. No content imports or existing migration replay.
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
$review_source$;
begin
  if exists(select 1 from supabase_migrations.schema_migrations where name not in ('core','storage','tourist_catalog','security_hardening','admin_route_stops','editorial_provenance') or name is null) then
    raise exception 'unreviewed migration history: stop, do not repair automatically';
  end if;
  if (select count(*) from supabase_migrations.schema_migrations where name='core')<>1
    or not exists(select 1 from supabase_migrations.schema_migrations where name='core' and version in ('202610220001','20261022141818')) then
    raise exception 'original migration mapping mismatch: core';
  end if;
  if (select count(*) from supabase_migrations.schema_migrations where name='storage')<>1
    or not exists(select 1 from supabase_migrations.schema_migrations where name='storage' and version in ('202610220002','20261022141828')) then
    raise exception 'original migration mapping mismatch: storage';
  end if;
  if (select count(*) from supabase_migrations.schema_migrations where name='tourist_catalog')<>1
    or not exists(select 1 from supabase_migrations.schema_migrations where name='tourist_catalog' and version in ('202610220003','20261022141835')) then
    raise exception 'original migration mapping mismatch: tourist_catalog';
  end if;
  select name,statements into applied from supabase_migrations.schema_migrations where version='20261022170000';
  if found then
    if applied.name is distinct from 'admin_route_stops' or applied.statements is distinct from array[source_sql] then
      raise exception 'recorded migration differs from reviewed source: 20261022170000';
    end if;
    return; -- Exact replay: no DDL or second history write.
  end if;
  if exists(select 1 from supabase_migrations.schema_migrations where name='admin_route_stops') then
    raise exception 'additional migration name/version collision';
  end if;
  if not exists(select 1 from supabase_migrations.schema_migrations where version='20261022150000' and name='security_hardening') then raise exception 'previous reviewed stage missing';end if;
  execute $review_body$-- ADDITIONAL, REVIEW BEFORE APPLYING REMOTELY. No content imports or existing migration replay.
-- Invoker retains RLS. Transactional replacement avoids partial routes and position collisions.

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
$review_body$;
  insert into supabase_migrations.schema_migrations(version,name,statements)
    values ('20261022170000','admin_route_stops',array[source_sql]);
end $review_stage$;
commit;

-- REVIEW ONLY: 20261022180000_editorial_provenance.sql; SHA256 43de5452a7cf58aa85f8b823314b9f26b8f0b08924c41ebee7de3bde09794432
-- No original migration DDL. History and this stage commit together, or neither does.
begin;
set local lock_timeout='5s';
set local statement_timeout='120s';
set local search_path=pg_catalog;
select pg_advisory_xact_lock(73492027150000);
do $review_stage$
declare applied record; source_sql constant text:=$review_source$-- ADDITIONAL / LOCAL REVIEW ONLY. Reconcile remote versions before any application.
-- No imports, publication, historical migration replay, RLS changes or SECURITY DEFINER.
begin;
do $$ begin
  if not exists(select 1 from pg_trigger where tgrelid='public.routes'::regclass
    and tgname='set_updated_at' and tgfoid=to_regprocedure('private.touch_route_updated_at()') and tgenabled='O')
    or to_regprocedure('public.admin_set_route_stops(uuid,timestamptz,jsonb)') is null then
    raise exception 'reviewed route version/RPC migration must be applied first';
  end if;
end $$;
do $$ declare relation text; begin
  foreach relation in array array['categories','places','routes','events','tips'] loop
    execute format('alter table public.%I add column source_urls text[] not null default ''{}'', add column pending_fields text[] not null default ''{}''',relation);
    execute format('comment on column public.%I.source_urls is %L',relation,'Public editorial provenance: HTTPS references only; no credentials or personal data.');
    execute format('comment on column public.%I.pending_fields is %L',relation,'Public field names awaiting confirmation; not private editorial notes. Empty does not imply verification.');
  end loop;
end $$;
create function private.validate_editorial_content() returns trigger
language plpgsql security invoker set search_path='' as $$
declare item text; published boolean; content jsonb;
begin
  content:=to_jsonb(new);
  published:=case when tg_table_name='categories' then (content->>'published')::boolean else content->>'status'='published' end;
  if cardinality(new.source_urls)>20 or array_ndims(new.source_urls)>1
     or cardinality(new.pending_fields)>30 or array_ndims(new.pending_fields)>1 then
    raise exception 'editorial array limit' using errcode='23514';
  end if;
  foreach item in array new.source_urls loop
    if item is null or length(item)>2000 or item !~ '^https://[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?(:[0-9]+)?(/[^[:space:]]*)?$' then
      raise exception 'invalid public source URL' using errcode='23514';
    end if;
  end loop;
  foreach item in array new.pending_fields loop
    if item is null or length(btrim(item)) not between 1 and 160 then
      raise exception 'invalid pending field' using errcode='23514';
    end if;
  end loop;
  if published then
    if auth.uid() is not null and not public.has_role('admin') then
      raise exception 'administrator required for publication' using errcode='42501';
    end if;
    if cardinality(new.source_urls)=0 or cardinality(new.pending_fields)>0
       or length(btrim(coalesce(content->>'name',content->>'title','')))=0
       or (tg_table_name<>'categories' and length(btrim(coalesce(content->>'description','')))=0)
       or (tg_table_name='places' and length(btrim(coalesce(content->>'address','')))=0)
       or coalesce((content->>'is_demo')::boolean,false) then
      raise exception 'incomplete editorial content' using errcode='23514';
    end if;
  end if;
  -- Serialize route publication against withdrawal of its places. RLS remains active.
  if tg_table_name='routes' and published and not (
    tg_op='UPDATE' and pg_trigger_depth()>1
    and content-'updated_at'=to_jsonb(old)-'updated_at'
  ) then
    perform p.id from public.places p join public.route_stops s on s.place_id=p.id
      where s.route_id=new.id order by p.id for share of p;
    if not exists(select 1 from public.route_stops where route_id=new.id)
       or exists(select 1 from public.route_stops s left join public.places p on p.id=s.place_id
         where s.route_id=new.id and (p.id is null or p.status<>'published' or p.is_demo)) then
      raise exception 'route needs published stops' using errcode='23514';
    end if;
  end if;
  if tg_table_name='places' and tg_op='UPDATE' then
    if (new.status<>'published' or new.is_demo) and exists(
      select 1 from public.route_stops s join public.routes r on r.id=s.route_id
      where s.place_id=new.id and r.status='published'
    ) then raise exception 'withdraw related routes first' using errcode='23514'; end if;
  end if;
  return new;
end $$;
revoke all on function private.validate_editorial_content() from public,anon,authenticated,service_role;
do $$ declare relation text; begin
  foreach relation in array array['categories','places','routes','events','tips'] loop
    execute format('create trigger validate_editorial_content before insert or update on public.%I for each row execute function private.validate_editorial_content()',relation);
  end loop;
end $$;
-- Protect direct REST writes to stops as well as admin_set_route_stops().
create function private.lock_editorial_route() returns trigger
language plpgsql security invoker set search_path='' as $$
declare target uuid;
begin
  for target in select distinct id from unnest(array[
    case when tg_op<>'INSERT' then old.route_id end,
    case when tg_op<>'DELETE' then new.route_id end
  ]) id where id is not null order by id loop
    perform id from public.routes where id=target for update;
  end loop;
  if tg_op<>'DELETE' then
    perform id from public.places where id=new.place_id for share;
  end if;
  if tg_op='DELETE' then return old; else return new; end if;
end $$;
create function private.mark_route_changed() returns trigger
language plpgsql security invoker set search_path='' as $$
declare target uuid;
begin
  for target in select distinct id from unnest(array[
    case when tg_op<>'INSERT' then old.route_id end,
    case when tg_op<>'DELETE' then new.route_id end
  ]) id where id is not null order by id loop
    update public.routes set updated_at=updated_at where id=target;
  end loop;
  return null;
end $$;
create function private.check_editorial_stops() returns trigger
language plpgsql security invoker set search_path='' as $$
declare target uuid;
begin
  for target in select distinct id from unnest(array[
    case when tg_op<>'INSERT' then old.route_id end,
    case when tg_op<>'DELETE' then new.route_id end
  ]) id where id is not null loop
    if exists(select 1 from public.routes where id=target and status='published') and (
      not exists(select 1 from public.route_stops where route_id=target)
      or exists(select 1 from public.route_stops s left join public.places p on p.id=s.place_id
        where s.route_id=target and (p.id is null or p.status<>'published' or p.is_demo))
    ) then raise exception 'route needs published stops' using errcode='23514'; end if;
  end loop;
  return null;
end $$;
revoke all on function private.mark_route_changed() from public,anon,authenticated,service_role;
revoke all on function private.lock_editorial_route() from public,anon,authenticated,service_role;
revoke all on function private.check_editorial_stops() from public,anon,authenticated,service_role;
create trigger lock_editorial_route before insert or update or delete on public.route_stops
  for each row execute function private.lock_editorial_route();
create trigger mark_route_changed after insert or update or delete on public.route_stops
  for each row execute function private.mark_route_changed();
create constraint trigger check_editorial_stops after insert or update or delete on public.route_stops
  deferrable initially deferred for each row execute function private.check_editorial_stops();
commit;
$review_source$;
begin
  if exists(select 1 from supabase_migrations.schema_migrations where name not in ('core','storage','tourist_catalog','security_hardening','admin_route_stops','editorial_provenance') or name is null) then
    raise exception 'unreviewed migration history: stop, do not repair automatically';
  end if;
  if (select count(*) from supabase_migrations.schema_migrations where name='core')<>1
    or not exists(select 1 from supabase_migrations.schema_migrations where name='core' and version in ('202610220001','20261022141818')) then
    raise exception 'original migration mapping mismatch: core';
  end if;
  if (select count(*) from supabase_migrations.schema_migrations where name='storage')<>1
    or not exists(select 1 from supabase_migrations.schema_migrations where name='storage' and version in ('202610220002','20261022141828')) then
    raise exception 'original migration mapping mismatch: storage';
  end if;
  if (select count(*) from supabase_migrations.schema_migrations where name='tourist_catalog')<>1
    or not exists(select 1 from supabase_migrations.schema_migrations where name='tourist_catalog' and version in ('202610220003','20261022141835')) then
    raise exception 'original migration mapping mismatch: tourist_catalog';
  end if;
  select name,statements into applied from supabase_migrations.schema_migrations where version='20261022180000';
  if found then
    if applied.name is distinct from 'editorial_provenance' or applied.statements is distinct from array[source_sql] then
      raise exception 'recorded migration differs from reviewed source: 20261022180000';
    end if;
    return; -- Exact replay: no DDL or second history write.
  end if;
  if exists(select 1 from supabase_migrations.schema_migrations where name='editorial_provenance') then
    raise exception 'additional migration name/version collision';
  end if;
  if not exists(select 1 from supabase_migrations.schema_migrations where version='20261022170000' and name='admin_route_stops') then raise exception 'previous reviewed stage missing';end if;
  execute $review_body$-- ADDITIONAL / LOCAL REVIEW ONLY. Reconcile remote versions before any application.
-- No imports, publication, historical migration replay, RLS changes or SECURITY DEFINER.

do $$ begin
  if not exists(select 1 from pg_trigger where tgrelid='public.routes'::regclass
    and tgname='set_updated_at' and tgfoid=to_regprocedure('private.touch_route_updated_at()') and tgenabled='O')
    or to_regprocedure('public.admin_set_route_stops(uuid,timestamptz,jsonb)') is null then
    raise exception 'reviewed route version/RPC migration must be applied first';
  end if;
end $$;
do $$ declare relation text; begin
  foreach relation in array array['categories','places','routes','events','tips'] loop
    execute format('alter table public.%I add column source_urls text[] not null default ''{}'', add column pending_fields text[] not null default ''{}''',relation);
    execute format('comment on column public.%I.source_urls is %L',relation,'Public editorial provenance: HTTPS references only; no credentials or personal data.');
    execute format('comment on column public.%I.pending_fields is %L',relation,'Public field names awaiting confirmation; not private editorial notes. Empty does not imply verification.');
  end loop;
end $$;
create function private.validate_editorial_content() returns trigger
language plpgsql security invoker set search_path='' as $$
declare item text; published boolean; content jsonb;
begin
  content:=to_jsonb(new);
  published:=case when tg_table_name='categories' then (content->>'published')::boolean else content->>'status'='published' end;
  if cardinality(new.source_urls)>20 or array_ndims(new.source_urls)>1
     or cardinality(new.pending_fields)>30 or array_ndims(new.pending_fields)>1 then
    raise exception 'editorial array limit' using errcode='23514';
  end if;
  foreach item in array new.source_urls loop
    if item is null or length(item)>2000 or item !~ '^https://[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?(:[0-9]+)?(/[^[:space:]]*)?$' then
      raise exception 'invalid public source URL' using errcode='23514';
    end if;
  end loop;
  foreach item in array new.pending_fields loop
    if item is null or length(btrim(item)) not between 1 and 160 then
      raise exception 'invalid pending field' using errcode='23514';
    end if;
  end loop;
  if published then
    if auth.uid() is not null and not public.has_role('admin') then
      raise exception 'administrator required for publication' using errcode='42501';
    end if;
    if cardinality(new.source_urls)=0 or cardinality(new.pending_fields)>0
       or length(btrim(coalesce(content->>'name',content->>'title','')))=0
       or (tg_table_name<>'categories' and length(btrim(coalesce(content->>'description','')))=0)
       or (tg_table_name='places' and length(btrim(coalesce(content->>'address','')))=0)
       or coalesce((content->>'is_demo')::boolean,false) then
      raise exception 'incomplete editorial content' using errcode='23514';
    end if;
  end if;
  -- Serialize route publication against withdrawal of its places. RLS remains active.
  if tg_table_name='routes' and published and not (
    tg_op='UPDATE' and pg_trigger_depth()>1
    and content-'updated_at'=to_jsonb(old)-'updated_at'
  ) then
    perform p.id from public.places p join public.route_stops s on s.place_id=p.id
      where s.route_id=new.id order by p.id for share of p;
    if not exists(select 1 from public.route_stops where route_id=new.id)
       or exists(select 1 from public.route_stops s left join public.places p on p.id=s.place_id
         where s.route_id=new.id and (p.id is null or p.status<>'published' or p.is_demo)) then
      raise exception 'route needs published stops' using errcode='23514';
    end if;
  end if;
  if tg_table_name='places' and tg_op='UPDATE' then
    if (new.status<>'published' or new.is_demo) and exists(
      select 1 from public.route_stops s join public.routes r on r.id=s.route_id
      where s.place_id=new.id and r.status='published'
    ) then raise exception 'withdraw related routes first' using errcode='23514'; end if;
  end if;
  return new;
end $$;
revoke all on function private.validate_editorial_content() from public,anon,authenticated,service_role;
do $$ declare relation text; begin
  foreach relation in array array['categories','places','routes','events','tips'] loop
    execute format('create trigger validate_editorial_content before insert or update on public.%I for each row execute function private.validate_editorial_content()',relation);
  end loop;
end $$;
-- Protect direct REST writes to stops as well as admin_set_route_stops().
create function private.lock_editorial_route() returns trigger
language plpgsql security invoker set search_path='' as $$
declare target uuid;
begin
  for target in select distinct id from unnest(array[
    case when tg_op<>'INSERT' then old.route_id end,
    case when tg_op<>'DELETE' then new.route_id end
  ]) id where id is not null order by id loop
    perform id from public.routes where id=target for update;
  end loop;
  if tg_op<>'DELETE' then
    perform id from public.places where id=new.place_id for share;
  end if;
  if tg_op='DELETE' then return old; else return new; end if;
end $$;
create function private.mark_route_changed() returns trigger
language plpgsql security invoker set search_path='' as $$
declare target uuid;
begin
  for target in select distinct id from unnest(array[
    case when tg_op<>'INSERT' then old.route_id end,
    case when tg_op<>'DELETE' then new.route_id end
  ]) id where id is not null order by id loop
    update public.routes set updated_at=updated_at where id=target;
  end loop;
  return null;
end $$;
create function private.check_editorial_stops() returns trigger
language plpgsql security invoker set search_path='' as $$
declare target uuid;
begin
  for target in select distinct id from unnest(array[
    case when tg_op<>'INSERT' then old.route_id end,
    case when tg_op<>'DELETE' then new.route_id end
  ]) id where id is not null loop
    if exists(select 1 from public.routes where id=target and status='published') and (
      not exists(select 1 from public.route_stops where route_id=target)
      or exists(select 1 from public.route_stops s left join public.places p on p.id=s.place_id
        where s.route_id=target and (p.id is null or p.status<>'published' or p.is_demo))
    ) then raise exception 'route needs published stops' using errcode='23514'; end if;
  end loop;
  return null;
end $$;
revoke all on function private.mark_route_changed() from public,anon,authenticated,service_role;
revoke all on function private.lock_editorial_route() from public,anon,authenticated,service_role;
revoke all on function private.check_editorial_stops() from public,anon,authenticated,service_role;
create trigger lock_editorial_route before insert or update or delete on public.route_stops
  for each row execute function private.lock_editorial_route();
create trigger mark_route_changed after insert or update or delete on public.route_stops
  for each row execute function private.mark_route_changed();
create constraint trigger check_editorial_stops after insert or update or delete on public.route_stops
  deferrable initially deferred for each row execute function private.check_editorial_stops();
$review_body$;
  insert into supabase_migrations.schema_migrations(version,name,statements)
    values ('20261022180000','editorial_provenance',array[source_sql]);
end $review_stage$;
commit;
