-- Run in the authorized SQL Editor/psql as an audit-capable role. READ ONLY, no DDL/DML.
-- Emits metadata/hashes only: no users, email addresses, tokens, keys or table contents.
-- This is a custom audit, not the Supabase Security Advisor service.
begin transaction read only;
set local search_path = pg_catalog;
select jsonb_build_object(
 'report_version',1,
 'server_version',current_setting('server_version'),
 'source','custom_readonly_sql',
 'observed_at',now(),
 'coverage',jsonb_build_object('application_definers',true,'triggers',true,'grants',true),
 'history',(select coalesce(jsonb_agg(jsonb_build_object('version',version,'name',name) order by version),'[]'::jsonb) from supabase_migrations.schema_migrations),
 'tables',(select coalesce(jsonb_agg(jsonb_build_object('name',c.relname,'rls',c.relrowsecurity,'force_rls',c.relforcerowsecurity) order by c.relname),'[]'::jsonb) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'),
 'table_signatures',(select coalesce(jsonb_agg(jsonb_build_object('name',c.relname,
  'columns',(select jsonb_agg(jsonb_build_object('name',a.attname,'type',format_type(a.atttypid,a.atttypmod),'not_null',a.attnotnull,'default',pg_get_expr(d.adbin,d.adrelid)) order by a.attnum) from pg_attribute a left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped),
  'constraints',(select coalesce(jsonb_agg(pg_get_constraintdef(k.oid) order by pg_get_constraintdef(k.oid)),'[]'::jsonb) from pg_constraint k where k.conrelid=c.oid),
  'indexes',(select coalesce(jsonb_agg(pg_get_indexdef(i.indexrelid) order by pg_get_indexdef(i.indexrelid)),'[]'::jsonb) from pg_index i where i.indrelid=c.oid)
 ) order by c.relname),'[]'::jsonb) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'),
 'functions',(select coalesce(jsonb_agg(jsonb_build_object(
  'signature',p.oid::regprocedure::text,
  'owner',pg_get_userbyid(p.proowner),
  'security_definer',p.prosecdef,
  'returns',format_type(p.prorettype,null),
  'volatility',p.provolatile,
  'service_role_execute',has_function_privilege('service_role',p.oid,'EXECUTE'),
  'execute_grantees',(select jsonb_agg(jsonb_build_object('role',case when a.grantee=0 then 'PUBLIC' else pg_get_userbyid(a.grantee) end,'grantable',a.is_grantable) order by case when a.grantee=0 then 'PUBLIC' else pg_get_userbyid(a.grantee) end) from aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a where a.privilege_type='EXECUTE'),
  'search_path',(select setting from unnest(p.proconfig) setting where setting like 'search_path=%' limit 1),
  'definition_md5',md5(pg_get_functiondef(p.oid)),
  'public_execute',exists(select 1 from aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a where a.grantee=0 and a.privilege_type='EXECUTE'),
  'anon_execute',has_function_privilege('anon',p.oid,'EXECUTE'),
  'authenticated_execute',has_function_privilege('authenticated',p.oid,'EXECUTE')
 ) order by n.nspname,p.proname),'[]'::jsonb)
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where (n.nspname='public' and (p.prosecdef or p.proname in ('rls_auto_enable','has_role','public_place_benefits','public_route_sponsors','touch_updated_at','place_daily_metrics','redeem_coupon','admin_set_route_stops')))
 or n.nspname='private'),
 'triggers',(select coalesce(jsonb_agg(jsonb_build_object('schema',n.nspname,'table',c.relname,'name',t.tgname,'function',t.tgfoid::regprocedure::text,'enabled',t.tgenabled,'type',t.tgtype,'deferrable',t.tgdeferrable,'initially_deferred',t.tginitdeferred,'definition_md5',md5(pg_get_triggerdef(t.oid))) order by n.nspname,c.relname,t.tgname),'[]'::jsonb) from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and (n.nspname='public' or (n.nspname='storage' and c.relname='objects'))),
 'table_grants',(select coalesce(jsonb_agg(jsonb_build_object('schema',n.nspname,'table',c.relname,'role',case when a.grantee=0 then 'PUBLIC' else pg_get_userbyid(a.grantee) end,'privilege',a.privilege_type,'grantable',a.is_grantable) order by n.nspname,c.relname,case when a.grantee=0 then 'PUBLIC' else pg_get_userbyid(a.grantee) end,a.privilege_type),'[]'::jsonb) from pg_class c join pg_namespace n on n.oid=c.relnamespace cross join lateral aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) a where c.relkind='r' and (n.nspname='public' or (n.nspname='storage' and c.relname='objects'))),
 'history_columns',(select jsonb_agg(jsonb_build_object('name',a.attname,'type',format_type(a.atttypid,a.atttypmod)) order by a.attnum) from pg_attribute a where a.attrelid='supabase_migrations.schema_migrations'::regclass and a.attnum>0 and not a.attisdropped),
 'platform_handler_dependencies',(select coalesce(jsonb_agg(jsonb_build_object('dependent',pg_describe_object(d.classid,d.objid,d.objsubid),'type',d.deptype)),'[]'::jsonb) from pg_depend d where d.refclassid='pg_proc'::regclass and d.refobjid=to_regprocedure('public.rls_auto_enable()')),
 'event_triggers',(select coalesce(jsonb_agg(jsonb_build_object('name',evtname,'enabled',evtenabled,'owner',pg_get_userbyid(evtowner),'event',evtevent,'tags',evttags,'function',evtfoid::regprocedure::text)),'[]'::jsonb) from pg_event_trigger where evtfoid=to_regprocedure('public.rls_auto_enable()')),
 'policies',(select coalesce(jsonb_agg(jsonb_build_object('schema',schemaname,'table',tablename,'name',policyname,'roles',roles,'command',cmd,'using',qual,'check',with_check) order by schemaname,tablename,policyname),'[]'::jsonb) from pg_policies where schemaname='public' or (schemaname='storage' and tablename='objects')),
 'buckets',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'public',public,'file_size_limit',file_size_limit,'allowed_mime_types',allowed_mime_types) order by id),'[]'::jsonb) from storage.buckets where id in ('place-photos','qr-codes','event-images')),
 'schema_create',jsonb_build_object('anon_public',has_schema_privilege('anon','public','CREATE'),'authenticated_public',has_schema_privilege('authenticated','public','CREATE'),'anon_private',has_schema_privilege('anon','private','CREATE'),'authenticated_private',has_schema_privilege('authenticated','private','CREATE'))
) as report;
rollback;
