-- All objects/roles are disposable and roll back. Surrogate is NOT a remote homologation.
begin;
do $$ begin
 if has_function_privilege('anon','public.rls_auto_enable()','execute')
   or has_function_privilege('authenticated','public.rls_auto_enable()','execute')
   or has_function_privilege('service_role','public.rls_auto_enable()','execute') then
   raise exception 'API execute on platform handler';
 end if;
 if not exists(select 1 from pg_event_trigger where evtname='ensure_rls' and evtenabled='O'
   and evtfoid='public.rls_auto_enable()'::regprocedure) then raise exception 'event disabled/rebound';end if;
end $$;
create role ddl_fixture nologin;
grant usage,create on schema public to ddl_fixture;
set local role ddl_fixture;
-- DDL by a role without handler EXECUTE still invokes the postgres-owned event trigger.
create table public.infra_event_fixture(id integer);
reset role;
do $$ begin
 if not (select relrowsecurity from pg_class where oid='public.infra_event_fixture'::regclass)
   then raise exception 'revoking execute prevented automatic RLS';end if;
end $$;
rollback;
