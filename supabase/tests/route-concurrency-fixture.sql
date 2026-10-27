-- Disposable PG17 only. Persisted for two local psql processes, never remote.
insert into auth.users(id,email) values ('92000000-0000-4000-8000-000000000001','concurrent-admin@example.invalid');
insert into public.user_roles(user_id,role) values ('92000000-0000-4000-8000-000000000001','admin');
insert into public.categories(id,slug,name) values ('92000000-0000-4000-8000-000000000002','race-category','Fixture');
insert into public.places(id,category_id,slug,name) values ('92000000-0000-4000-8000-000000000003','92000000-0000-4000-8000-000000000002','race-place','Fixture');
insert into public.routes(id,slug,name,updated_at) values ('92000000-0000-4000-8000-000000000004','race-route','Fixture','2000-01-01Z');
