-- Isolated fixtures only. Backend roles, writes and transactions; no Cloud users/data.
begin;
create function pg_temp.cms_assert(ok boolean, message text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'CMS assertion: %',message; end if; end $$;
create function pg_temp.cms_denied(statement text) returns void language plpgsql as $$
begin
 begin execute statement; exception when insufficient_privilege then return; end;
 raise exception 'CMS expected permission denial';
end $$;
insert into auth.users(id,email) values
 ('61000000-0000-4000-8000-000000000001','cms-admin@example.invalid'),
 ('61000000-0000-4000-8000-000000000002','cms-member@example.invalid');
insert into public.user_roles(user_id,role) values ('61000000-0000-4000-8000-000000000001','admin');
select set_config('request.jwt.claim.sub','61000000-0000-4000-8000-000000000001',true);
set local role authenticated;
insert into public.categories(id,slug,name) values ('62000000-0000-4000-8000-000000000001','cms-category','CMS category');
insert into public.places(id,category_id,slug,name) values
 ('62000000-0000-4000-8000-000000000002','62000000-0000-4000-8000-000000000001','cms-first','CMS first'),
 ('62000000-0000-4000-8000-000000000003','62000000-0000-4000-8000-000000000001','cms-second','CMS second');
insert into public.routes(id,slug,name) values ('62000000-0000-4000-8000-000000000004','cms-route','CMS route');
insert into public.events(id,name,starts_at,ends_at) values ('62000000-0000-4000-8000-000000000005','CMS event',now(),now()+interval '1 hour');
insert into public.tips(id,title,description,category) values ('62000000-0000-4000-8000-000000000006','CMS tip','Fixture','test');
insert into public.place_photos(id,place_id,storage_path,alt_text) values ('62000000-0000-4000-8000-000000000007','62000000-0000-4000-8000-000000000002','62000000-0000-4000-8000-000000000002/fixture.webp','Fixture description');
insert into storage.objects(bucket_id,name) values ('place-photos','62000000-0000-4000-8000-000000000002/fixture.webp');
update public.categories set name='CMS updated' where id='62000000-0000-4000-8000-000000000001';
update public.places set description='CMS updated' where id='62000000-0000-4000-8000-000000000002';
update public.routes set description='CMS updated' where id='62000000-0000-4000-8000-000000000004';
update public.events set description='CMS updated' where id='62000000-0000-4000-8000-000000000005';
update public.tips set description='CMS updated' where id='62000000-0000-4000-8000-000000000006';
update public.place_photos set alt_text='CMS updated',position=1 where id='62000000-0000-4000-8000-000000000007';
select pg_temp.cms_assert((select alt_text='CMS updated' from public.place_photos where id='62000000-0000-4000-8000-000000000007'),'admin photo CRUD');
select public.admin_set_route_stops('62000000-0000-4000-8000-000000000004',(select updated_at from public.routes where id='62000000-0000-4000-8000-000000000004'),'[{"place_id":"62000000-0000-4000-8000-000000000002","duration_minutes":null},{"place_id":"62000000-0000-4000-8000-000000000003","duration_minutes":null}]');
-- A duplicate fails after DELETE but the entire RPC rolls back to the old ordered list.
do $$ begin
 begin
  perform public.admin_set_route_stops('62000000-0000-4000-8000-000000000004',(select updated_at from public.routes where id='62000000-0000-4000-8000-000000000004'),'[{"place_id":"62000000-0000-4000-8000-000000000003"},{"place_id":"62000000-0000-4000-8000-000000000003"}]');
  raise exception 'duplicate stops accepted';
 exception when unique_violation then null; end;
 if (select count(*) from public.route_stops where route_id='62000000-0000-4000-8000-000000000004')<>2 then raise exception 'partial route persisted'; end if;
 if not exists(select 1 from public.route_stops where route_id='62000000-0000-4000-8000-000000000004' and position=0 and place_id='62000000-0000-4000-8000-000000000002') then raise exception 'order lost on rollback';end if;
 begin
  perform public.admin_set_route_stops('62000000-0000-4000-8000-000000000004',now()-interval '1 day','[]');
  raise exception 'stale route accepted';
 exception when serialization_failure then null; end;
end $$;
select public.admin_set_route_stops('62000000-0000-4000-8000-000000000004',(select updated_at from public.routes where id='62000000-0000-4000-8000-000000000004'),'[{"place_id":"62000000-0000-4000-8000-000000000003"},{"place_id":"62000000-0000-4000-8000-000000000002"}]');
select pg_temp.cms_assert((select place_id='62000000-0000-4000-8000-000000000003' from public.route_stops where route_id='62000000-0000-4000-8000-000000000004' and position=0),'atomic reorder');
reset role;
select set_config('request.jwt.claim.sub','',true);
set local role anon;
select pg_temp.cms_assert((select count(*)=0 from public.places where id='62000000-0000-4000-8000-000000000002'),'anonymous draft visibility');
select pg_temp.cms_denied($q$select public.admin_set_route_stops('62000000-0000-4000-8000-000000000004',now(),'[]')$q$);
select pg_temp.cms_denied($q$insert into public.categories(slug,name) values ('forged-cms','Forged')$q$);
reset role;
select set_config('request.jwt.claim.sub','61000000-0000-4000-8000-000000000002',true);
set local role authenticated;
select pg_temp.cms_denied($q$select public.admin_set_route_stops('62000000-0000-4000-8000-000000000004',now(),'[]')$q$);
select pg_temp.cms_denied($q$insert into public.categories(slug,name) values ('forged-cms','Forged')$q$);
select pg_temp.cms_denied($q$insert into public.routes(slug,name) values ('forged-cms','Forged')$q$);
select pg_temp.cms_denied($q$insert into public.events(name,starts_at,ends_at) values ('Forged',now(),now()+interval '1 hour')$q$);
select pg_temp.cms_denied($q$insert into public.tips(title,description,category) values ('Forged','Forged','test')$q$);
select pg_temp.cms_denied($q$insert into public.place_photos(place_id,storage_path,alt_text) values ('62000000-0000-4000-8000-000000000002','62000000-0000-4000-8000-000000000002/attack.webp','Forged')$q$);
select pg_temp.cms_denied($q$insert into storage.objects(bucket_id,name) values ('event-images','forged.webp')$q$);
with changed as (update public.places set name='Forged' where id='62000000-0000-4000-8000-000000000002' returning id) select pg_temp.cms_assert((select count(*)=0 from changed),'non-owner cannot modify editorial place');
reset role;
select set_config('request.jwt.claim.sub','61000000-0000-4000-8000-000000000001',true);
set local role authenticated;
delete from public.routes where id='62000000-0000-4000-8000-000000000004';
delete from public.place_photos where id='62000000-0000-4000-8000-000000000007';
delete from storage.objects where bucket_id='place-photos' and name='62000000-0000-4000-8000-000000000002/fixture.webp';
delete from public.events where id='62000000-0000-4000-8000-000000000005';
delete from public.tips where id='62000000-0000-4000-8000-000000000006';
delete from public.places where id in ('62000000-0000-4000-8000-000000000002','62000000-0000-4000-8000-000000000003');
delete from public.categories where id='62000000-0000-4000-8000-000000000001';
select pg_temp.cms_assert((select count(*)=0 from public.route_stops where route_id='62000000-0000-4000-8000-000000000004'),'route deletion cleans stops');
rollback;
