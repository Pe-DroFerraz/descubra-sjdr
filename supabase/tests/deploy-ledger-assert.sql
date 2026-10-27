do $$ begin
 if not has_schema_privilege('anon','public','CREATE') then raise exception 'drift check changed ACL';end if;
 if not exists(select 1 from supabase_migrations.schema_migrations where version='20261022150000' and statements=array['different source']) then raise exception 'drift silently repaired';end if;
end $$;
