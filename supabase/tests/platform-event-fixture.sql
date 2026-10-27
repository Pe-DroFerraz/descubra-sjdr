-- SURROGATE ONLY, not the remote function body. Disposable PG17 fixture; NEVER Cloud.
-- Mirrors only the supplied owner/return/search_path/event binding contract.
create function public.rls_auto_enable() returns event_trigger
language plpgsql security definer set search_path=pg_catalog as $$
declare command record;
begin
  for command in select * from pg_event_trigger_ddl_commands()
    where object_type='table' and schema_name='public' loop
    execute format('alter table %s enable row level security',command.objid::regclass);
  end loop;
end $$;
alter function public.rls_auto_enable() owner to postgres;
grant execute on function public.rls_auto_enable() to public,anon,authenticated,service_role;
create event trigger ensure_rls on ddl_command_end when tag in ('CREATE TABLE')
  execute function public.rls_auto_enable();

-- Simulate broad platform defaults: pending migrations must revoke per object,
-- preserving the global defaults for unrelated platform functions.
alter default privileges for role postgres grant execute on functions to anon,authenticated,service_role;
grant execute on function public.touch_updated_at() to service_role;
