-- Runs as database owner on a disposable DB (also compatible with local Supabase).
-- All fixtures and assertions are rolled back. No real users or credentials.
begin;
create function pg_temp.assert_true(ok boolean, message text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'ASSERTION FAILED: %',message; end if; end $$;
create function pg_temp.denied(statement text) returns void language plpgsql as $$
begin
 begin execute statement;
 exception when insufficient_privilege then return;
 end;
 raise exception 'Expected permission denial for %',statement;
end $$;
select pg_temp.assert_true((select count(*)=29 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and c.relrowsecurity),'RLS on all 29 tables');
select pg_temp.assert_true((select count(*)=29 from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and t.tgname='set_updated_at'),'updated_at triggers');
select pg_temp.assert_true((select count(*)=25 from public.places where is_demo and status='draft'),'25 demo places, draft; repeatable seed');
select pg_temp.assert_true((select count(*)=6 from public.routes where is_demo and status='draft'),'six draft routes');
select pg_temp.assert_true((select count(*)=8 from public.events where is_demo and status='draft' and verified_at is null),'eight unverified demo events');
select pg_temp.assert_true((select count(*)=10 from public.tips where is_demo),'ten demo tips');
select pg_temp.assert_true((select count(*)=5 from public.advertisers where is_demo and owner_id is null),'five fictitious advertisers without auth identities');
select pg_temp.assert_true((select array_agg(price_cents order by price_cents)=array[0,6900,19900] from public.plans),'editable plan prices');
select pg_temp.assert_true((select count(*)=3 from storage.buckets where id in ('place-photos','qr-codes','event-images')),'storage buckets');
select pg_temp.assert_true((select not public from storage.buckets where id='qr-codes'),'private QR bucket');
insert into auth.users(id,email) values
 ('10000000-0000-4000-8000-000000000001','owner1@example.invalid'),
 ('10000000-0000-4000-8000-000000000002','owner2@example.invalid'),
 ('10000000-0000-4000-8000-000000000003','admin@example.invalid');
insert into public.user_roles(user_id,role) values ('10000000-0000-4000-8000-000000000003','admin');
update public.advertisers set owner_id='10000000-0000-4000-8000-000000000001',status='approved' where id='00000000-0000-4000-0003-000000000001';
update public.advertisers set owner_id='10000000-0000-4000-8000-000000000002',status='approved' where id='00000000-0000-4000-0003-000000000002';
update public.categories set published=true,source_urls=array['https://example.invalid/fixture'];
update public.places set advertiser_id='00000000-0000-4000-0003-000000000001',is_demo=false,status='published',source_urls=array['https://example.invalid/fixture'],address='Fixture only',description='Fixture only' where id='00000000-0000-4000-0004-000000000001';
update public.places set advertiser_id='00000000-0000-4000-0003-000000000002',is_demo=false,status='draft' where id='00000000-0000-4000-0004-000000000002';
update public.places set advertiser_id='00000000-0000-4000-0003-000000000001',is_demo=false,status='draft' where id='00000000-0000-4000-0004-000000000003';
insert into public.place_views(place_id) values ('00000000-0000-4000-0004-000000000001');
insert into public.click_events(place_id,kind) values ('00000000-0000-4000-0004-000000000001','whatsapp');
insert into public.subscriptions(advertiser_id,plan_id,status) values ('00000000-0000-4000-0003-000000000001','00000000-0000-4000-0002-000000000002','pending');
insert into public.coupons(id,place_id,title,description,code,starts_at,ends_at,max_redemptions,status) values
 ('20000000-0000-4000-8000-000000000001','00000000-0000-4000-0004-000000000001','Test','Test','TEST-ONLY',now()-interval '1 day',now()+interval '1 day',1,'published');
insert into storage.objects(bucket_id,name) values
 ('place-photos','00000000-0000-4000-0004-000000000001/public.webp'),
 ('place-photos','00000000-0000-4000-0004-000000000002/private.webp');
set local role anon;
select pg_temp.assert_true((select count(*)=1 from public.places),'anon sees published only');
select pg_temp.assert_true((select count(*)=0 from public.advertisers),'anon cannot see advertiser identities');
select pg_temp.assert_true((select count(*)=0 from public.place_views),'anon cannot see raw telemetry');
select pg_temp.assert_true((select count(*)=0 from public.user_roles),'anon cannot enumerate roles');
select pg_temp.assert_true((select count(*)=1 from storage.objects),'storage metadata filters unpublished');
select pg_temp.denied($q$insert into public.reviews(place_id,rating,comment,display_name) values('00000000-0000-4000-0004-000000000001',5,'Test','Anonymous')$q$);
select pg_temp.denied($q$insert into public.events(name,starts_at,ends_at) values('Spam',now(),now()+interval '1 day')$q$);
select pg_temp.denied($q$insert into public.place_views(place_id) values('00000000-0000-4000-0004-000000000001')$q$);
select pg_temp.denied($q$select public.place_daily_metrics('00000000-0000-4000-0004-000000000001',current_date,current_date)$q$);
select pg_temp.denied($q$select public.redeem_coupon('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',gen_random_uuid())$q$);
select pg_temp.denied($q$insert into storage.objects(bucket_id,name) values('place-photos','00000000-0000-4000-0004-000000000001/attack.webp')$q$);
reset role;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
set local role authenticated;
select pg_temp.assert_true(not public.has_role('admin'),'no admin without role');
select pg_temp.assert_true((select count(*)=1 from public.advertisers),'owner sees only own advertiser');
select pg_temp.denied($q$insert into public.user_roles(user_id,role) values('10000000-0000-4000-8000-000000000001','admin')$q$);
select pg_temp.denied($q$insert into public.subscriptions(advertiser_id,plan_id,status,verified_at,current_period_end) values('00000000-0000-4000-0003-000000000001','00000000-0000-4000-0002-000000000003','active',now(),now()+interval '1 month')$q$);
select pg_temp.denied($q$insert into public.places(advertiser_id,category_id,slug,name,status) values('00000000-0000-4000-0003-000000000001','00000000-0000-4000-0001-000000000001','bad-published','Forged','published')$q$);
select pg_temp.denied($q$insert into public.places(advertiser_id,category_id,slug,name) values('00000000-0000-4000-0003-000000000002','00000000-0000-4000-0001-000000000001','bad-owner','Forged')$q$);
insert into public.places(advertiser_id,category_id,slug,name) values('00000000-0000-4000-0003-000000000001','00000000-0000-4000-0001-000000000001','owner-draft','Own draft');
update public.places set name='Updated draft' where slug='owner-draft';
select pg_temp.assert_true((select name='Updated draft' from public.places where slug='owner-draft'),'owner edits own draft');
select pg_temp.denied($q$update public.places set status='published' where slug='owner-draft'$q$);
with changed as (update public.places set name='Attack' where id='00000000-0000-4000-0004-000000000002' returning id) select pg_temp.assert_true((select count(*)=0 from changed),'cannot modify another owner');
with changed as (update public.advertisers set status='approved',owner_id='10000000-0000-4000-8000-000000000001' where id='00000000-0000-4000-0003-000000000002' returning id) select pg_temp.assert_true((select count(*)=0 from changed),'cannot take advertiser');
select pg_temp.assert_true((select count(*)=0 from public.place_views),'owner cannot read raw telemetry');
select pg_temp.assert_true((select views=1 and clicks=1 and scans=0 from public.place_daily_metrics('00000000-0000-4000-0004-000000000001',current_date,current_date)),'authorized aggregate metrics');
select pg_temp.denied($q$select public.place_daily_metrics('00000000-0000-4000-0004-000000000002',current_date,current_date)$q$);
select pg_temp.denied($q$select public.redeem_coupon('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',gen_random_uuid())$q$);
insert into storage.objects(bucket_id,name) values('place-photos','00000000-0000-4000-0004-000000000003/own.webp');
select pg_temp.denied($q$insert into storage.objects(bucket_id,name) values('place-photos','00000000-0000-4000-0004-000000000002/other.webp')$q$);
select pg_temp.denied($q$insert into storage.objects(bucket_id,name) values('place-photos','bad-path/other.webp')$q$);
select pg_temp.denied($q$update storage.objects set name='00000000-0000-4000-0004-000000000002/stolen.webp' where name='00000000-0000-4000-0004-000000000003/own.webp'$q$);
select pg_temp.denied($q$insert into storage.objects(bucket_id,name) values('qr-codes','00000000-0000-4000-0004-000000000003/forged.svg')$q$);
reset role;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
set local role authenticated;
select pg_temp.assert_true(public.has_role('admin'),'admin role resolves without recursion');
select pg_temp.assert_true((select count(*)=26 from public.places),'admin sees all places');
update public.places set status='published',source_urls=array['https://example.invalid/fixture'],address='Fixture only',description='Fixture only' where slug='owner-draft';
insert into storage.objects(bucket_id,name) values('event-images','admin.webp');
select pg_temp.assert_true((select count(*)=1 from public.place_views),'admin raw access');
reset role;
set local role service_role;
select public.redeem_coupon('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001');
select public.redeem_coupon('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001');
select pg_temp.assert_true((select count(*)=1 from public.coupon_redemptions),'redemption idempotence');
do $$ begin
 begin perform public.redeem_coupon('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000002');
 exception when invalid_parameter_value then return;
 end;
 raise exception 'redemption limit not enforced';
end $$;
select pg_temp.denied($q$select public.redeem_coupon('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002',gen_random_uuid())$q$);
reset role;
select pg_temp.assert_true((select count(*)=0 from public.places where name='Attack'),'other owner data intact');
rollback;
