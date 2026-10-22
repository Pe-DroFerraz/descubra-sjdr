begin;
-- Optional editorial classification, never inferred from a route name or invented by the client.
alter table public.routes add column weather text not null default 'any' check (weather in ('any','rain','dry'));

-- Expose entitlement flags, never customer, payment or subscription identifiers.
create function public.public_place_benefits()
returns table(place_id uuid, valid_until timestamptz, features jsonb)
language sql stable security definer set search_path='' as $$
 select p.id, s.current_period_end, plan.features
 from public.places p
 join public.advertisers a on a.id=p.advertiser_id
 join public.subscriptions s on s.advertiser_id=a.id
 join public.plans plan on plan.id=s.plan_id
 where private.published_place(p.id) and not p.is_demo and not a.is_demo
 and s.status='active' and s.verified_at is not null and s.verified_at<=now()
 and s.current_period_end>now() and plan.published
$$;
revoke all on function public.public_place_benefits() from public;
grant execute on function public.public_place_benefits() to anon, authenticated, service_role;

-- Public sponsor display has no access to billing amounts or advertiser owner identities.
create function public.public_route_sponsors(target_route uuid)
returns table(name text,place_slug text)
language sql stable security definer set search_path='' as $$
 select distinct display.name, display.slug
 from public.route_sponsors sponsor
 join public.routes route on route.id=sponsor.route_id
 join public.advertisers advertiser on advertiser.id=sponsor.advertiser_id
 join lateral (
  select p.name,p.slug from public.places p
  where p.advertiser_id=advertiser.id and not p.is_demo and private.published_place(p.id)
  order by p.id limit 1
 ) display on true
 where route.id=target_route and route.status='published' and not route.is_demo
 and sponsor.confirmed and sponsor.starts_at<=now() and sponsor.ends_at>now()
 and advertiser.status='approved' and not advertiser.is_demo
$$;
revoke all on function public.public_route_sponsors(uuid) from public;
grant execute on function public.public_route_sponsors(uuid) to anon, authenticated, service_role;
commit;
