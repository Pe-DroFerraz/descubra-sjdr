-- Additional hardening only. DO NOT reapply core/storage/tourist_catalog remotely.
-- Apply only after comparing the actual remote history/definitions with the read-only audit.
begin;
-- API roles use existing objects; they do not need to create/replace objects in a trusted schema.
revoke create on schema public from public, anon, authenticated;
revoke create on schema private from public, anon, authenticated;
-- Preserve the privileges required to evaluate RLS helpers.
grant usage on schema private to anon, authenticated, service_role;

alter function public.has_role(public.app_role) set search_path = '';
alter function public.public_place_benefits() set search_path = '';
alter function public.public_route_sponsors(uuid) set search_path = '';
alter function private.owns_advertiser(uuid) set search_path = '';
alter function private.owns_place(uuid) set search_path = '';
alter function private.can_edit_place(uuid) set search_path = '';
alter function private.published_place(uuid) set search_path = '';
alter function private.path_place_id(text) set search_path = '';
alter function public.place_daily_metrics(uuid,date,date) set search_path = '';
alter function public.redeem_coupon(uuid,uuid,uuid) set search_path = '';

-- Do not alter postgres global default privileges: platform functions may share this owner.
-- A per-schema REVOKE cannot override global default PUBLIC EXECUTE. Future application
-- migrations must explicitly REVOKE PUBLIC and GRANT the intended roles for each function.

-- Revoke the implicit PUBLIC grant, not legitimate explicit application grants.
revoke all on function public.touch_updated_at() from public, anon, authenticated, service_role;
revoke all on function public.has_role(public.app_role) from public;
grant execute on function public.has_role(public.app_role) to anon, authenticated, service_role;
revoke all on function public.public_place_benefits() from public;
revoke all on function public.public_route_sponsors(uuid) from public;
grant execute on function public.public_place_benefits(), public.public_route_sponsors(uuid) to anon, authenticated, service_role;
revoke all on function public.place_daily_metrics(uuid,date,date) from public, anon;
grant execute on function public.place_daily_metrics(uuid,date,date) to authenticated, service_role;
revoke all on function public.redeem_coupon(uuid,uuid,uuid) from public, anon, authenticated;
grant execute on function public.redeem_coupon(uuid,uuid,uuid) to service_role;
revoke all on function private.owns_advertiser(uuid), private.owns_place(uuid), private.can_edit_place(uuid), private.published_place(uuid), private.path_place_id(text) from public;

-- These helpers are used by authenticated write/owner policies, not anonymous reads.
-- Keep owns_place/published_place/path_place_id for the anonymous Storage/read policies.
revoke all on function private.owns_advertiser(uuid), private.can_edit_place(uuid) from anon;

-- Event-trigger dispatch does not require client EXECUTE on its handler. Preserve
-- body, owner, search_path and binding; only restrict the unnecessary API ACL.
-- The optional platform object must match the externally audited shape, otherwise abort.
do $$ declare handler oid; begin
  handler:=to_regprocedure('public.rls_auto_enable()');
  if handler is not null then
    if not exists(select 1 from pg_proc p where p.oid=handler
        and pg_get_userbyid(p.proowner)='postgres' and p.prorettype='event_trigger'::regtype
        and p.prosecdef and p.proconfig @> array['search_path=pg_catalog'])
      or not exists(select 1 from pg_event_trigger where evtname='ensure_rls'
        and evtfoid=handler and evtenabled in ('O','A')) then
      raise exception 'platform RLS handler differs: review dependencies before hardening';
    end if;
    revoke all on function public.rls_auto_enable() from public,anon,authenticated,service_role;
  end if;
end $$;
commit;
