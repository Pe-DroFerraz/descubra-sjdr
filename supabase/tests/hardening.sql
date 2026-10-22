-- Isolated fixture database only. All assertions roll back.
begin;
do $$
declare target regprocedure;
begin
  if has_schema_privilege('anon','public','CREATE')
    or has_schema_privilege('authenticated','public','CREATE')
    or has_schema_privilege('anon','private','CREATE')
    or has_schema_privilege('authenticated','private','CREATE') then
    raise exception 'API role can create trusted objects';
  end if;
  for target in
    select p.oid::regprocedure from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where (n.nspname='public' and p.proname in
      ('has_role','public_place_benefits','public_route_sponsors','place_daily_metrics','redeem_coupon'))
      or n.nspname='private'
  loop
    if exists(select 1 from pg_proc p where p.oid=target and p.prosecdef
      and not (coalesce(p.proconfig,'{}') @> array['search_path=""'])) then
      raise exception 'Unpinned definer search_path: %',target;
    end if;
    if exists(select 1 from pg_proc p,
      lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) acl
      where p.oid=target and acl.grantee=0 and acl.privilege_type='EXECUTE') then
      raise exception 'Implicit PUBLIC execute: %',target;
    end if;
  end loop;
  if has_function_privilege('anon','public.redeem_coupon(uuid,uuid,uuid)','EXECUTE')
    or has_function_privilege('authenticated','public.redeem_coupon(uuid,uuid,uuid)','EXECUTE') then
    raise exception 'Client redemption ACL';
  end if;
  if has_function_privilege('anon','public.touch_updated_at()','EXECUTE') then
    raise exception 'Public trigger helper grant';
  end if;
  if has_function_privilege('anon','public.place_daily_metrics(uuid,date,date)','EXECUTE')
    or not has_function_privilege('authenticated','public.place_daily_metrics(uuid,date,date)','EXECUTE') then
    raise exception 'Metrics grant regression';
  end if;
  if not has_function_privilege('anon','public.has_role(public.app_role)','EXECUTE')
    or not has_function_privilege('anon','public.public_place_benefits()','EXECUTE')
    or not has_function_privilege('anon','public.public_route_sponsors(uuid)','EXECUTE') then
    raise exception 'Legitimate tourist grant removed';
  end if;
end $$;

set local role anon;
select public.has_role('admin');
select count(*) from public.public_place_benefits();
select count(*) from public.public_route_sponsors('00000000-0000-4000-0005-000000000001');
rollback;
