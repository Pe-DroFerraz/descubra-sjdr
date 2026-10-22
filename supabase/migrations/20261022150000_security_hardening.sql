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
revoke all on function public.touch_updated_at() from public, anon, authenticated;
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

-- Do not replace/disable rls_auto_enable(): its remote implementation and event-trigger
-- bindings are not in the repository. External audit confirmed postgres ownership,
-- event_trigger return and search_path=pg_catalog. Inspect the full dependencies first; SECURITY DEFINER can be necessary
-- for a DDL event trigger. No conversion to INVOKER or blind search_path change here.
commit;
