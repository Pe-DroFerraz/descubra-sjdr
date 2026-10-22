-- Isolated PG17 fixtures only. No Cloud authentication, sources or writes.
begin;
create function pg_temp.expect_incomplete(statement text) returns void language plpgsql as $$
begin
 begin execute statement; exception when check_violation then return; end;
 raise exception 'incomplete editorial content accepted';
end $$;
insert into auth.users(id,email) values ('81000000-0000-4000-8000-000000000001','editor@example.invalid');
insert into public.user_roles(user_id,role) values ('81000000-0000-4000-8000-000000000001','admin');
select set_config('request.jwt.claim.sub','81000000-0000-4000-8000-000000000001',true);
set local role authenticated;
insert into public.categories(id,slug,name) values ('82000000-0000-4000-8000-000000000001','editorial-fixture','Editorial fixture');
select pg_temp.expect_incomplete($q$update public.categories set published=true where slug='editorial-fixture'$q$);
update public.categories set source_urls=array['https://example.invalid/fixture'],published=true where slug='editorial-fixture';
insert into public.places(id,category_id,slug,name,source_urls,pending_fields) values
 ('82000000-0000-4000-8000-000000000002','82000000-0000-4000-8000-000000000001','editorial-fixture','Fixture',array['https://example.invalid/fixture'],array['address']);
select pg_temp.expect_incomplete($q$update public.places set status='published' where slug='editorial-fixture'$q$);
select pg_temp.expect_incomplete($q$update public.places set pending_fields='{}',status='published' where slug='editorial-fixture'$q$);
select pg_temp.expect_incomplete($q$update public.places set source_urls=array['https://user:secret@example.invalid/fixture'] where slug='editorial-fixture'$q$);
select pg_temp.expect_incomplete($q$update public.places set source_urls=array[null] where slug='editorial-fixture'$q$);
-- Coordinates, prices, schedules, phone and photos remain unknown; never fabricate them.
update public.places set pending_fields='{}',address='Only fixture',description='Only fixture',status='published' where slug='editorial-fixture';
insert into public.routes(id,slug,name,description,source_urls) values
 ('82000000-0000-4000-8000-000000000003','editorial-fixture','Fixture','Only fixture',array['https://example.invalid/fixture']);
select pg_temp.expect_incomplete($q$update public.routes set status='published' where slug='editorial-fixture'$q$);
select public.admin_set_route_stops('82000000-0000-4000-8000-000000000003',(select updated_at from public.routes where slug='editorial-fixture'),'[{"place_id":"82000000-0000-4000-8000-000000000002"}]');
update public.routes set status='published' where slug='editorial-fixture';
select pg_temp.expect_incomplete($q$select public.admin_set_route_stops('82000000-0000-4000-8000-000000000003',(select updated_at from public.routes where slug='editorial-fixture'),'[]')$q$);
select pg_temp.expect_incomplete($q$update public.places set status='suspended' where slug='editorial-fixture'$q$);
-- Direct REST deletion cannot bypass the RPC's published-route checks.
set constraints all immediate;
select pg_temp.expect_incomplete($q$delete from public.route_stops where route_id='82000000-0000-4000-8000-000000000003'$q$);
do $$ begin
 if (select count(*) from public.route_stops where route_id='82000000-0000-4000-8000-000000000003')<>1 then raise exception 'route write did not roll back';end if;
 if exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private' and p.proname in ('validate_editorial_content','lock_editorial_route','check_editorial_stops') and p.prosecdef) then raise exception 'definer introduced';end if;
 if has_function_privilege('anon','private.validate_editorial_content()','execute') or has_function_privilege('authenticated','private.validate_editorial_content()','execute') then raise exception 'trigger exposed';end if;
end $$;
-- Events and tips obey the same provenance / pending-field contract.
select pg_temp.expect_incomplete($q$insert into public.events(name,description,starts_at,ends_at,verified_at,status) values ('Fixture','Only fixture',now(),now()+interval '1 hour',now(),'published')$q$);
select pg_temp.expect_incomplete($q$insert into public.tips(title,description,category,status) values ('Fixture','Only fixture','fixture','published')$q$);
update public.routes set status='draft' where slug='editorial-fixture';
update public.places set status='draft',pending_fields=array['review'] where slug='editorial-fixture';
reset role;
set local role anon;
do $$ begin
 if exists(select 1 from public.places where slug='editorial-fixture') then raise exception 'draft leaked';end if;
end $$;
rollback;
