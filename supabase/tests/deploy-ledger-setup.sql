-- Continue only in the disposable infra_guard clone.
alter function public.rls_auto_enable() set search_path=pg_catalog;
insert into supabase_migrations.schema_migrations(version,name,statements)
values ('20261022150000','security_hardening',array['different source']);
