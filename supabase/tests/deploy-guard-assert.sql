do $$ begin
 if not has_schema_privilege('anon','public','CREATE') then raise exception 'failed deployment left partial ACL changes';end if;
 if exists(select 1 from supabase_migrations.schema_migrations where name='security_hardening') then raise exception 'failed deployment recorded history';end if;
 if not exists(select 1 from pg_proc where oid='public.rls_auto_enable()'::regprocedure and proconfig @> array['search_path=public']) then raise exception 'handler changed by rejected deploy';end if;
end $$;
