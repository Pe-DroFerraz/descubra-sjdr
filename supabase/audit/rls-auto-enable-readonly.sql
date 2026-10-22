-- Only inspect this specific DDL helper; never dump arbitrary function sources/credentials.
begin transaction read only;
set local search_path=pg_catalog;
select p.oid::regprocedure as signature,pg_get_userbyid(p.proowner) as owner,p.prosecdef,
 (select setting from unnest(p.proconfig) setting where setting like 'search_path=%' limit 1) as search_path,
 pg_get_function_result(p.oid) as result_type,
 pg_get_functiondef(p.oid) as definition
from pg_proc p where p.oid=to_regprocedure('public.rls_auto_enable()');
select evtname,evtevent,evtenabled,evttags from pg_event_trigger where evtfoid=to_regprocedure('public.rls_auto_enable()');
rollback;
