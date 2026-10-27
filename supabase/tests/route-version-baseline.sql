-- Reproduce the reported OLD clock bug, only before additional migrations in disposable PG17.
begin;
insert into public.routes(id,slug,name) values ('93000000-0000-4000-8000-000000000001','clock-baseline','Fixture');
do $$ declare first_version timestamptz; second_version timestamptz; begin
 update public.routes set updated_at=clock_timestamp() where slug='clock-baseline' returning updated_at into first_version;
 perform pg_sleep(0.03);
 update public.routes set updated_at=clock_timestamp() where slug='clock-baseline' returning updated_at into second_version;
 if first_version<>now() or second_version<>first_version then raise exception 'original clock bug not reproduced';end if;
end $$;
rollback;
