-- READ ONLY. Use with cloud-readonly.sql under authorized audit access; no DDL/DML/repair.
begin transaction read only;
set local search_path=pg_catalog;
select version,name from supabase_migrations.schema_migrations order by version;
select t.tgname,t.tgenabled,t.tgtype,t.tgfoid::regprocedure as function,md5(pg_get_triggerdef(t.oid)) as trigger_hash
from pg_trigger t where t.tgrelid='public.routes'::regclass and not t.tgisinternal order by t.tgname;
select oid::regprocedure as function,pg_get_userbyid(proowner) as owner,prosecdef,proconfig,
 md5(pg_get_functiondef(oid)) as definition_hash
from pg_proc where oid in (to_regprocedure('public.touch_updated_at()'),to_regprocedure('public.rls_auto_enable()'));
select evtname,evtevent,evtenabled,evttags,pg_get_userbyid(evtowner) as owner,evtfoid::regprocedure as function
from pg_event_trigger where evtname='ensure_rls' or evtfoid=to_regprocedure('public.rls_auto_enable()');
select count(*) filter(where not isfinite(updated_at)) as invalid_route_versions,
 count(*) filter(where updated_at>clock_timestamp()+interval '1 minute') as future_route_versions
from public.routes;
select table_name,column_name,data_type from information_schema.columns
where (table_schema='public' and table_name in ('categories','places','routes','events','tips')
 and column_name in ('source_urls','pending_fields'))
 or (table_schema='supabase_migrations' and table_name='schema_migrations') order by table_name,column_name;
select schemaname,tablename,policyname,roles,cmd,qual,with_check from pg_policies
where schemaname='public' or (schemaname='storage' and tablename='objects') order by schemaname,tablename,policyname;
select id,public,file_size_limit,allowed_mime_types from storage.buckets
where id in ('place-photos','event-images','qr-codes') order by id;
rollback;
