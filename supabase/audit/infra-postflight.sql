-- READ ONLY structural assertions, to run AFTER an explicitly approved deployment.
-- Does not test real Auth sessions, email delivery or Storage HTTP writes.
begin transaction read only;
set local search_path=pg_catalog;
do $$ declare relation text; fn regprocedure; begin
 if (select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and c.relrowsecurity)<>29 then raise exception 'review table/RLS inventory';end if;
 foreach relation in array array['categories','places','routes','events','tips'] loop
  if (select count(*) from information_schema.columns where table_schema='public' and table_name=relation
    and column_name in ('source_urls','pending_fields') and udt_name='_text' and is_nullable='NO')<>2 then raise exception 'missing editorial columns: %',relation;end if;
 end loop;
 if not exists(select 1 from pg_trigger where tgrelid='public.routes'::regclass and tgname='set_updated_at'
   and tgfoid=to_regprocedure('private.touch_route_updated_at()') and tgenabled='O') then raise exception 'route version binding';end if;
 if (select count(*) from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace
   where n.nspname='public' and t.tgname='set_updated_at' and t.tgfoid='public.touch_updated_at()'::regprocedure)<>28 then raise exception 'other timestamp bindings changed';end if;
 if (select count(*) from pg_trigger where tgrelid='public.route_stops'::regclass
   and tgname in ('lock_editorial_route','mark_route_changed','check_editorial_stops') and tgenabled='O')<>3 then raise exception 'stop integrity/version triggers';end if;
 fn:=to_regprocedure('public.admin_set_route_stops(uuid,timestamptz,jsonb)');
 if fn is null or has_function_privilege('service_role',fn,'execute') or has_function_privilege('anon',fn,'execute') or not has_function_privilege('authenticated',fn,'execute')
   or (select prosecdef from pg_proc where oid=fn) then raise exception 'admin RPC privileges';end if;
 if has_function_privilege('anon','public.place_daily_metrics(uuid,date,date)','execute')
   or has_function_privilege('anon','public.redeem_coupon(uuid,uuid,uuid)','execute')
   or has_function_privilege('authenticated','public.redeem_coupon(uuid,uuid,uuid)','execute') then raise exception 'private RPC exposed';end if;
 if to_regprocedure('public.rls_auto_enable()') is not null then
  if has_function_privilege('anon','public.rls_auto_enable()','execute')
    or has_function_privilege('authenticated','public.rls_auto_enable()','execute')
    or not exists(select 1 from pg_event_trigger where evtname='ensure_rls' and evtenabled in ('O','A') and evtfoid='public.rls_auto_enable()'::regprocedure) then raise exception 'platform handler ACL/binding';end if;
 end if;
 if exists(select 1 from public.routes where not isfinite(updated_at)) then raise exception 'invalid route versions';end if;
 if exists(select 1 from public.routes r where status='published' and (
   not exists(select 1 from public.route_stops s where s.route_id=r.id)
   or exists(select 1 from public.route_stops s join public.places p on p.id=s.place_id where s.route_id=r.id and (p.status<>'published' or p.is_demo)))) then raise exception 'invalid published route';end if;
end $$;
rollback;
