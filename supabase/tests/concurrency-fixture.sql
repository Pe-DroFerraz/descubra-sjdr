-- Only for the disposable test runner, never production.
insert into auth.users(id,email) values ('40000000-0000-4000-8000-000000000001','concurrency@example.invalid');
insert into public.advertisers(id,owner_id,name,status) values ('40000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000001','Concurrency fixture','approved');
update public.categories set published=true,source_urls=array['https://example.invalid/fixture'] where id='00000000-0000-4000-0001-000000000001';
insert into public.places(id,advertiser_id,category_id,slug,name,status,source_urls,address,description) values ('40000000-0000-4000-8000-000000000003','40000000-0000-4000-8000-000000000002','00000000-0000-4000-0001-000000000001','concurrency-fixture','Concurrency fixture','published',array['https://example.invalid/fixture'],'Fixture only','Fixture only');
insert into public.coupons(id,place_id,title,description,code,starts_at,ends_at,max_redemptions,status) values ('40000000-0000-4000-8000-000000000004','40000000-0000-4000-8000-000000000003','Concurrency fixture','Test','CONCURRENCY-TEST',now()-interval '1 day',now()+interval '1 day',1,'published');
