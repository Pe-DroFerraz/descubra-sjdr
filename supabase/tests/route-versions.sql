-- Disposable fixtures only. Microsecond equality, rollback and long transactions.
begin;
insert into auth.users(id,email) values ('91000000-0000-4000-8000-000000000001','version-admin@example.invalid');
insert into public.user_roles(user_id,role) values ('91000000-0000-4000-8000-000000000001','admin');
insert into public.categories(id,slug,name) values ('91000000-0000-4000-8000-000000000002','version-fixture','Fixture');
insert into public.places(id,category_id,slug,name) values
 ('91000000-0000-4000-8000-000000000003','91000000-0000-4000-8000-000000000002','version-first','Fixture'),
 ('91000000-0000-4000-8000-000000000004','91000000-0000-4000-8000-000000000002','version-second','Fixture');
insert into public.routes(id,slug,name,updated_at) values ('91000000-0000-4000-8000-000000000005','version-fixture','Fixture','2000-01-01T00:00:00Z');
insert into public.routes(id,slug,name,updated_at) values ('91000000-0000-4000-8000-000000000006','future-clock-fixture','Fixture',clock_timestamp()+interval '1 day');
select set_config('request.jwt.claim.sub','91000000-0000-4000-8000-000000000001',true);
set local role authenticated;
do $$
declare target constant uuid:='91000000-0000-4000-8000-000000000005';
 payload constant jsonb:='[{"place_id":"91000000-0000-4000-8000-000000000003"}]';
 v0 timestamptz; v1 timestamptz; v2 timestamptz; before_wait timestamptz; snapshot jsonb;
begin
 select updated_at into v0 from public.routes where id=target;
 perform public.admin_set_route_stops(target,v0,payload);
 select updated_at into v1 from public.routes where id=target;
 perform public.admin_set_route_stops(target,v1,payload);
 select updated_at into v2 from public.routes where id=target;
 if v1<=v0 or v2<=v1 then raise exception 'versions collide in one transaction';end if;
 begin perform public.admin_set_route_stops(target,v1,'[]');raise exception 'stale version accepted';
 exception when serialization_failure then null;end;
 select jsonb_agg(to_jsonb(s) order by position) into snapshot from public.route_stops s where route_id=target;
 begin
  perform public.admin_set_route_stops(target,v2,'[{"place_id":"91000000-0000-4000-8000-000000000004"},{"place_id":"91000000-0000-4000-8000-000000000004"}]');
  raise exception 'duplicate accepted';
 exception when unique_violation then null;end;
 if (select jsonb_agg(to_jsonb(s) order by position) from public.route_stops s where route_id=target) is distinct from snapshot
   or (select updated_at from public.routes where id=target)<>v2 then raise exception 'failed replacement lost stops/version';end if;
 begin
  perform public.admin_set_route_stops(target,v2,'[]');
  raise exception using errcode='ZX001',message='simulated transaction failure';
 exception when sqlstate 'ZX001' then null;end;
 if (select jsonb_agg(to_jsonb(s) order by position) from public.route_stops s where route_id=target) is distinct from snapshot
   or (select updated_at from public.routes where id=target)<>v2 then raise exception 'rollback lost stops/version';end if;
 -- Even direct REST edits must invalidate a version that was read for the parent route.
 update public.route_stops set duration_minutes=5 where route_id=target;
 if (select updated_at from public.routes where id=target)<=v2 then raise exception 'direct stop edit did not invalidate route';end if;
 begin perform public.admin_set_route_stops(target,v2,payload);raise exception 'direct-write stale version accepted';
 exception when serialization_failure then null;end;
 before_wait:=clock_timestamp();
 perform pg_sleep(0.08);
 update public.routes set name='Long-running fixture' where id=target returning updated_at into v1;
 if v1<=before_wait or v1<=now() then raise exception 'transaction-start clock still used';end if;
 -- Caller-provided past timestamps cannot control or regress the version.
 update public.routes set updated_at='1900-01-01Z' where id=target returning updated_at into v2;
 if v2<=v1 then raise exception 'caller regressed route version';end if;
end $$;
do $$ declare before_version timestamptz; after_version timestamptz;begin
 select updated_at into before_version from public.routes where slug='future-clock-fixture';
 update public.routes set name='Fixture changed' where slug='future-clock-fixture' returning updated_at into after_version;
 if after_version<>before_version+interval '1 microsecond' then raise exception 'clock rollback/future old version not monotonic';end if;
end $$;
reset role;
do $$ begin
 if (select count(*) from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace
   where n.nspname='public' and t.tgname='set_updated_at' and t.tgfoid='public.touch_updated_at()'::regprocedure)<>28
 then raise exception 'non-route timestamp triggers changed';end if;
 if has_function_privilege('authenticated','private.touch_route_updated_at()','execute') then raise exception 'route trigger exposed';end if;
end $$;
rollback;
