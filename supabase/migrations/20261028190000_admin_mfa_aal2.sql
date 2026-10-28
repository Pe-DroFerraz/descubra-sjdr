-- Require verified TOTP/AAL2 for every privileged admin path using public.has_role('admin').
-- Also expose a narrowly scoped self-only membership check so the client can prompt MFA
-- before it possesses an aal2 token. It never authorizes data access.
begin;
create or replace function public.has_role(requested public.app_role)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select
    exists(
      select 1
      from public.user_roles
      where user_id = (select auth.uid()) and role = requested
    )
    and (
      requested <> 'admin'::public.app_role
      or coalesce((select auth.jwt())->>'aal', 'aal1') = 'aal2'
    )
$$;
create function public.admin_membership()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists(
      select 1 from public.user_roles
      where user_id = (select auth.uid()) and role = 'admin'::public.app_role
    )
$$;
revoke all on function public.admin_membership() from public, anon, authenticated, service_role;
grant execute on function public.admin_membership() to authenticated, service_role;
commit;
