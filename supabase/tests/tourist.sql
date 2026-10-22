begin;
do $$ begin
 if not has_function_privilege('anon','public.public_place_benefits()','EXECUTE') then raise exception 'Public benefits missing';end if;
 if not has_function_privilege('anon','public.public_route_sponsors(uuid)','EXECUTE') then raise exception 'Public sponsors missing';end if;
end $$;
insert into auth.users(id,email) values ('50000000-0000-4000-8000-000000000001','tourist-test@example.invalid');
insert into public.advertisers(id,owner_id,name,status) values ('50000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000001','Test advertiser','approved');
update public.categories set published=true where id='00000000-0000-4000-0001-000000000001';
insert into public.places(id,advertiser_id,category_id,slug,name,status) values ('50000000-0000-4000-8000-000000000003','50000000-0000-4000-8000-000000000002','00000000-0000-4000-0001-000000000001','tourist-test','Tourist test','published');
insert into public.routes(id,slug,name,status,weather) values ('50000000-0000-4000-8000-000000000004','tourist-test','Tourist test','published','rain');
insert into public.subscriptions(id,advertiser_id,plan_id,status,verified_at,current_period_end) values ('50000000-0000-4000-8000-000000000005','50000000-0000-4000-8000-000000000002','00000000-0000-4000-0002-000000000003','pending',null,now()+interval '1 month');
insert into public.route_sponsors(id,route_id,advertiser_id,starts_at,ends_at,amount_cents,confirmed) values ('50000000-0000-4000-8000-000000000006','50000000-0000-4000-8000-000000000004','50000000-0000-4000-8000-000000000002',now()-interval '1 day',now()+interval '1 day',10000,false);
set local role anon;
do $$ begin
 if exists(select 1 from public.public_place_benefits()) then raise exception 'Pending subscription leaked benefits';end if;
 if exists(select 1 from public.public_route_sponsors('50000000-0000-4000-8000-000000000004')) then raise exception 'Unconfirmed sponsor leaked';end if;
end $$;
reset role;
update public.subscriptions set status='active',verified_at=now() where id='50000000-0000-4000-8000-000000000005';
update public.route_sponsors set confirmed=true where id='50000000-0000-4000-8000-000000000006';
set local role anon;
do $$ begin
 if not exists(select 1 from public.public_place_benefits() where place_id='50000000-0000-4000-8000-000000000003' and features->>'badge'='true') then raise exception 'Verified active benefits missing';end if;
 if not exists(select 1 from public.public_route_sponsors('50000000-0000-4000-8000-000000000004') where place_slug='tourist-test') then raise exception 'Confirmed public sponsor missing';end if;
 if exists(select 1 from public.subscriptions) then raise exception 'Raw subscriptions leaked';end if;
end $$;
reset role;
update public.subscriptions set current_period_end=now()-interval '1 second' where id='50000000-0000-4000-8000-000000000005';
update public.advertisers set status='suspended' where id='50000000-0000-4000-8000-000000000002';
set local role anon;
do $$ begin
 if exists(select 1 from public.public_place_benefits()) then raise exception 'Expired/suspended benefits leaked';end if;
 if exists(select 1 from public.public_route_sponsors('50000000-0000-4000-8000-000000000004')) then raise exception 'Suspended sponsor leaked';end if;
end $$;
reset role;
rollback;
