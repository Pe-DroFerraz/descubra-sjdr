-- Etapa 1: PostgreSQL 15+ / Supabase. No external credentials.
begin;
create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;
create type public.app_role as enum ('admin', 'advertiser');
create type public.content_status as enum ('draft', 'pending', 'published', 'suspended');
create function public.touch_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (length(display_name)<=120),
  locale text not null default 'pt' check (locale in ('pt','en','es')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.profiles for each row execute function public.touch_updated_at();
alter table public.profiles enable row level security;
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique(user_id,role),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.user_roles for each row execute function public.touch_updated_at();
alter table public.user_roles enable row level security;
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.categories for each row execute function public.touch_updated_at();
alter table public.categories enable row level security;
create table public.advertisers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  name text not null,
  status text not null default 'pending' check (status in ('pending','approved','suspended')),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.advertisers for each row execute function public.touch_updated_at();
alter table public.advertisers enable row level security;
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  price_cents integer not null check (price_cents>=0),
  currency text not null default 'BRL' check (currency='BRL'),
  features jsonb not null default '{}' check (jsonb_typeof(features)='object'),
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.plans for each row execute function public.touch_updated_at();
alter table public.plans enable row level security;
create table public.places (
  id uuid primary key default gen_random_uuid(),
  advertiser_id uuid references public.advertisers(id) on delete restrict,
  category_id uuid not null references public.categories(id) on delete restrict,
  slug text not null unique,
  name text not null check (length(name) between 1 and 200),
  description text not null default '',
  address text,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  phone text,
  whatsapp text,
  website text check (website is null or website ~ '^https://'),
  instagram text,
  price_description text,
  status public.content_status not null default 'draft',
  verified_at timestamptz,
  is_demo boolean not null default false,
  check ((latitude is null)=(longitude is null)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.places for each row execute function public.touch_updated_at();
alter table public.places enable row level security;
create table public.place_translations (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  locale text not null check (locale in ('pt','en','es')),
  name text not null,
  description text not null default '',
  human_reviewed boolean not null default false,
  unique(place_id,locale),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.place_translations for each row execute function public.touch_updated_at();
alter table public.place_translations enable row level security;
create table public.place_photos (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  storage_path text not null unique,
  alt_text text not null,
  position integer not null default 0 check (position>=0),
  check (split_part(storage_path,'/',1)=place_id::text),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.place_photos for each row execute function public.touch_updated_at();
alter table public.place_photos enable row level security;
create table public.place_hours (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  opens_at time,
  closes_at time,
  closed boolean not null default false,
  verified_at timestamptz,
  check ((closed and opens_at is null and closes_at is null) or (not closed and opens_at is not null and closes_at is not null and opens_at<closes_at)),
  unique(place_id,weekday,opens_at),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.place_hours for each row execute function public.touch_updated_at();
alter table public.place_hours enable row level security;
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  advertiser_id uuid not null references public.advertisers(id) on delete restrict,
  plan_id uuid not null references public.plans(id) on delete restrict,
  provider_id text unique,
  status text not null default 'pending' check (status in ('pending','active','past_due','cancelled','expired')),
  current_period_end timestamptz,
  verified_at timestamptz,
  check (status<>'active' or (verified_at is not null and current_period_end is not null)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.subscriptions for each row execute function public.touch_updated_at();
alter table public.subscriptions enable row level security;
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete restrict,
  provider_id text not null unique,
  amount_cents integer not null check (amount_cents>=0),
  status text not null check (status in ('pending','paid','overdue','refunded','cancelled')),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.payments for each row execute function public.touch_updated_at();
alter table public.payments enable row level security;
create table public.routes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  duration_minutes integer check (duration_minutes>0),
  status public.content_status not null default 'draft',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.routes for each row execute function public.touch_updated_at();
alter table public.routes enable row level security;
create table public.route_translations (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  locale text not null check (locale in ('pt','en','es')),
  name text not null,
  description text not null default '',
  human_reviewed boolean not null default false,
  unique(route_id,locale),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.route_translations for each row execute function public.touch_updated_at();
alter table public.route_translations enable row level security;
create table public.route_stops (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  place_id uuid not null references public.places(id) on delete restrict,
  position integer not null check (position>=0),
  duration_minutes integer check (duration_minutes>0),
  unique(route_id,position),
  unique(route_id,place_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.route_stops for each row execute function public.touch_updated_at();
alter table public.route_stops enable row level security;
create table public.route_sponsors (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  advertiser_id uuid not null references public.advertisers(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  amount_cents integer not null check (amount_cents>=0),
  confirmed boolean not null default false,
  check (ends_at>starts_at),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.route_sponsors for each row execute function public.touch_updated_at();
alter table public.route_sponsors enable row level security;
create table public.events (
  id uuid primary key default gen_random_uuid(),
  place_id uuid references public.places(id) on delete set null,
  name text not null,
  description text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  verified_at timestamptz,
  image_path text,
  status public.content_status not null default 'draft',
  is_demo boolean not null default false,
  check (ends_at>starts_at),
  check (status<>'published' or verified_at is not null or is_demo),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.events for each row execute function public.touch_updated_at();
alter table public.events enable row level security;
create table public.event_translations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  locale text not null check (locale in ('pt','en','es')),
  name text not null,
  description text not null default '',
  human_reviewed boolean not null default false,
  unique(event_id,locale),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.event_translations for each row execute function public.touch_updated_at();
alter table public.event_translations enable row level security;
create table public.tips (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  status public.content_status not null default 'draft',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.tips for each row execute function public.touch_updated_at();
alter table public.tips enable row level security;
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  title text not null,
  description text not null,
  code text not null unique check (code ~ '^[A-Z0-9-]{4,40}$'),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  max_redemptions integer not null check (max_redemptions>0),
  status public.content_status not null default 'draft',
  check (ends_at>starts_at),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.coupons for each row execute function public.touch_updated_at();
alter table public.coupons enable row level security;
create table public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete restrict,
  redemption_key uuid not null unique,
  validated_by uuid not null references auth.users(id) on delete restrict,
  redeemed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.coupon_redemptions for each row execute function public.touch_updated_at();
alter table public.coupon_redemptions enable row level security;
create table public.qr_codes (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  code text not null unique check (code ~ '^[A-Za-z0-9_-]{4,64}$'),
  label text not null,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.qr_codes for each row execute function public.touch_updated_at();
alter table public.qr_codes enable row level security;
create table public.qr_scans (
  id uuid primary key default gen_random_uuid(),
  qr_code_id uuid not null references public.qr_codes(id) on delete cascade,
  locale text check (locale in ('pt','en','es')),
  device_type text check (device_type in ('mobile','tablet','desktop','unknown')),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.qr_scans for each row execute function public.touch_updated_at();
alter table public.qr_scans enable row level security;
create table public.place_views (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  locale text check (locale in ('pt','en','es')),
  source text not null default 'link' check (source in ('link','qr','search')),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.place_views for each row execute function public.touch_updated_at();
alter table public.place_views enable row level security;
create table public.click_events (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  kind text not null check (kind in ('whatsapp','directions','website','instagram','phone')),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.click_events for each row execute function public.touch_updated_at();
alter table public.click_events enable row level security;
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text not null check (length(comment) between 1 and 1000),
  display_name text not null check (length(display_name) between 1 and 80),
  status public.content_status not null default 'pending',
  moderated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.reviews for each row execute function public.touch_updated_at();
alter table public.reviews enable row level security;
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text,
  stage text not null default 'prospect' check (stage in ('prospect','contacted','proposal','active','lost')),
  follow_up_at timestamptz,
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.leads for each row execute function public.touch_updated_at();
alter table public.leads enable row level security;
create table public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete restrict,
  body text not null check (length(body) between 1 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.lead_notes for each row execute function public.touch_updated_at();
alter table public.lead_notes enable row level security;
create table public.ai_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  session_hash text not null unique,
  message_count integer not null default 0 check (message_count between 0 and 10),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.ai_sessions for each row execute function public.touch_updated_at();
alter table public.ai_sessions enable row level security;
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  table_name text not null,
  record_id uuid,
  metadata jsonb not null default '{}' check (jsonb_typeof(metadata)='object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.audit_logs for each row execute function public.touch_updated_at();
alter table public.audit_logs enable row level security;

-- Stable definer functions avoid recursive user_roles policies. Never trust editable JWT metadata.
create function public.has_role(requested public.app_role) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.user_roles where user_id=(select auth.uid()) and role=requested)
$$;
create function private.owns_advertiser(advertiser uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.advertisers where id=advertiser and owner_id=(select auth.uid()) and status='approved')
$$;
create function private.owns_place(place uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.places p join public.advertisers a on a.id=p.advertiser_id where p.id=place and a.owner_id=(select auth.uid()) and a.status='approved')
$$;
create function private.can_edit_place(place uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select public.has_role('admin') or exists(select 1 from public.places p where p.id=place and private.owns_advertiser(p.advertiser_id) and p.status in ('draft','pending'))
$$;
create function private.published_place(place uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.places p join public.categories c on c.id=p.category_id where p.id=place and p.status='published' and c.published and (p.advertiser_id is null or exists(select 1 from public.advertisers a where a.id=p.advertiser_id and a.status='approved')))
$$;
alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema private revoke execute on functions from public;
revoke all on function public.has_role(public.app_role) from public;
grant execute on function public.has_role(public.app_role) to anon, authenticated, service_role;
revoke all on function private.owns_advertiser(uuid) from public;
grant execute on function private.owns_advertiser(uuid) to anon, authenticated, service_role;
revoke all on function private.owns_place(uuid) from public;
grant execute on function private.owns_place(uuid) to anon, authenticated, service_role;
revoke all on function private.can_edit_place(uuid) from public;
grant execute on function private.can_edit_place(uuid) to anon, authenticated, service_role;
revoke all on function private.published_place(uuid) from public;
grant execute on function private.published_place(uuid) to anon, authenticated, service_role;
revoke all on public.profiles from anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated, service_role;
grant select on public.profiles to anon;
create policy admin_all on public.profiles to authenticated using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
revoke all on public.user_roles from anon, authenticated;
grant select, insert, update, delete on public.user_roles to authenticated, service_role;
grant select on public.user_roles to anon;
create policy admin_all on public.user_roles to authenticated using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
revoke all on public.categories from anon, authenticated;
grant select, insert, update, delete on public.categories to authenticated, service_role;
grant select on public.categories to anon;
create policy admin_all on public.categories to authenticated using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
revoke all on public.advertisers from anon, authenticated;
grant select, insert, update, delete on public.advertisers to authenticated, service_role;
grant select on public.advertisers to anon;
create policy admin_all on public.advertisers to authenticated using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
revoke all on public.plans from anon, authenticated;
grant select, insert, update, delete on public.plans to authenticated, service_role;
grant select on public.plans to anon;
create policy admin_all on public.plans to authenticated using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
revoke all on public.places from anon, authenticated;
grant select, insert, update, delete on public.places to authenticated, service_role;
grant select on public.places to anon;
create policy admin_all on public.places to authenticated using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
revoke all on public.place_translations from anon, authenticated;
grant select, insert, update, delete on public.place_translations to authenticated, service_role;
grant select on public.place_translations to anon;
create policy admin_all on public.place_translations to authenticated using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
revoke all on public.place_photos from anon, authenticated;
grant select, insert, update, delete on public.place_photos to authenticated, service_role;
grant select on public.place_photos to anon;
create policy admin_all on public.place_photos to authenticated using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
revoke all on public.place_hours from anon, authenticated;
grant select, insert, update, delete on public.place_hours to authenticated, service_role;
grant select on public.place_hours to anon;
create policy admin_all on public.place_hours to authenticated using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
revoke all on public.subscriptions from anon, authenticated;
grant select, insert, update, delete on public.subscriptions to authenticated, service_role;
grant select on public.subscriptions to anon;
create policy admin_all on public.subscriptions to authenticated using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
revoke all on public.payments from anon, authenticated;
grant select, insert, update, delete on public.payments to authenticated, service_role;
grant select on public.payments to anon;
create policy admin_all on public.payments to authenticated using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
revoke all on public.routes from anon, authenticated;
grant select, insert, update, delete on public.routes to authenticated, service_role;
grant select on public.routes to anon;
create policy admin_all on public.routes to authenticated using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
revoke all on public.route_translations from anon, authenticated;
grant select, insert, update, delete on public.route_translations to authenticated, service_role;
grant select on public.route_translations to anon;
create policy admin_all on public.route_translations to authenticated using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
revoke all on public.route_stops from anon, authenticated;
grant select, insert, update, delete on public.route_stops to authenticated, service_role;
grant select on public.route_stops to anon;
create policy admin_all on public.route_stops to authenticated using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
revoke all on public.route_sponsors from anon, authenticated;
grant select, insert, update, delete on public.route_sponsors to authenticated, service_role;
grant select on public.route_sponsors to anon;
create policy admin_all on public.route_sponsors to authenticated using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
revoke all on public.events from anon, authenticated;
grant select, insert, update, delete on public.events to authenticated, service_role;
grant select on public.events to anon;
create policy admin_all on public.events to authenticated using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
revoke all on public.event_translations from anon, authenticated;
grant select, insert, update, delete on public.event_translations to authenticated, service_role;
grant select on public.event_translations to anon;
create policy admin_all on public.event_translations to authenticated using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
revoke all on public.tips from anon, authenticated;
grant select, insert, update, delete on public.tips to authenticated, service_role;
grant select on public.tips to anon;
create policy admin_all on public.tips to authenticated using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
revoke all on public.coupons from anon, authenticated;
grant select, insert, update, delete on public.coupons to authenticated, service_role;
grant select on public.coupons to anon;
create policy admin_all on public.coupons to authenticated using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
revoke all on public.coupon_redemptions from anon, authenticated;
grant select, insert, update, delete on public.coupon_redemptions to authenticated, service_role;
grant select on public.coupon_redemptions to anon;
create policy admin_all on public.coupon_redemptions to authenticated using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
revoke all on public.qr_codes from anon, authenticated;
grant select, insert, update, delete on public.qr_codes to authenticated, service_role;
grant select on public.qr_codes to anon;
create policy admin_all on public.qr_codes to authenticated using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
revoke all on public.qr_scans from anon, authenticated;
grant select, insert, update, delete on public.qr_scans to authenticated, service_role;
grant select on public.qr_scans to anon;
create policy admin_all on public.qr_scans to authenticated using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
revoke all on public.place_views from anon, authenticated;
grant select, insert, update, delete on public.place_views to authenticated, service_role;
grant select on public.place_views to anon;
create policy admin_all on public.place_views to authenticated using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
revoke all on public.click_events from anon, authenticated;
grant select, insert, update, delete on public.click_events to authenticated, service_role;
grant select on public.click_events to anon;
create policy admin_all on public.click_events to authenticated using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
revoke all on public.reviews from anon, authenticated;
grant select, insert, update, delete on public.reviews to authenticated, service_role;
grant select on public.reviews to anon;
create policy admin_all on public.reviews to authenticated using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
revoke all on public.leads from anon, authenticated;
grant select, insert, update, delete on public.leads to authenticated, service_role;
grant select on public.leads to anon;
create policy admin_all on public.leads to authenticated using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
revoke all on public.lead_notes from anon, authenticated;
grant select, insert, update, delete on public.lead_notes to authenticated, service_role;
grant select on public.lead_notes to anon;
create policy admin_all on public.lead_notes to authenticated using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
revoke all on public.ai_sessions from anon, authenticated;
grant select, insert, update, delete on public.ai_sessions to authenticated, service_role;
grant select on public.ai_sessions to anon;
create policy admin_all on public.ai_sessions to authenticated using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
revoke all on public.audit_logs from anon, authenticated;
grant select, insert, update, delete on public.audit_logs to authenticated, service_role;
grant select on public.audit_logs to anon;
create policy admin_all on public.audit_logs to authenticated using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
create policy published_read on public.categories for select to anon, authenticated using (published);
create policy published_read on public.plans for select to anon, authenticated using (published);
create policy published_read on public.places for select to anon, authenticated using (private.published_place(id));
create policy published_read on public.place_translations for select to anon, authenticated using (private.published_place(place_id));
create policy published_read on public.place_photos for select to anon, authenticated using (private.published_place(place_id));
create policy published_read on public.place_hours for select to anon, authenticated using (private.published_place(place_id));
create policy published_read on public.routes for select to anon, authenticated using (status='published');
create policy published_read on public.route_translations for select to anon, authenticated using (exists(select 1 from public.routes r where r.id=route_id and r.status='published'));
create policy published_read on public.route_stops for select to anon, authenticated using (private.published_place(place_id) and exists(select 1 from public.routes r where r.id=route_id and r.status='published'));
create policy published_read on public.events for select to anon, authenticated using (status='published' and (place_id is null or private.published_place(place_id)));
create policy published_read on public.event_translations for select to anon, authenticated using (exists(select 1 from public.events e where e.id=event_id and e.status='published'));
create policy published_read on public.tips for select to anon, authenticated using (status='published');
create policy published_read on public.coupons for select to anon, authenticated using (status='published' and starts_at<=now() and ends_at>now() and private.published_place(place_id));
create policy published_read on public.reviews for select to anon, authenticated using (status='published' and private.published_place(place_id));
create policy owner_read on public.profiles for select to authenticated using (id=(select auth.uid()));
create policy owner_read on public.user_roles for select to authenticated using (user_id=(select auth.uid()));
create policy owner_read on public.advertisers for select to authenticated using (owner_id=(select auth.uid()));
create policy owner_read on public.places for select to authenticated using (private.owns_advertiser(advertiser_id));
create policy owner_read on public.subscriptions for select to authenticated using (private.owns_advertiser(advertiser_id));
create policy owner_read on public.payments for select to authenticated using (exists(select 1 from public.subscriptions s where s.id=subscription_id and private.owns_advertiser(s.advertiser_id)));
create policy owner_read on public.route_sponsors for select to authenticated using (private.owns_advertiser(advertiser_id));
create policy owner_read on public.qr_codes for select to authenticated using (private.owns_place(place_id));
create policy owner_read on public.coupons for select to authenticated using (private.owns_place(place_id));
create policy owner_read on public.coupon_redemptions for select to authenticated using (exists(select 1 from public.coupons c where c.id=coupon_id and private.owns_place(c.place_id)));
create policy owner_read on public.place_translations for select to authenticated using (private.owns_place(place_id));
create policy owner_read on public.place_photos for select to authenticated using (private.owns_place(place_id));
create policy owner_read on public.place_hours for select to authenticated using (private.owns_place(place_id));
create policy self_profile_insert on public.profiles for insert to authenticated with check (id=(select auth.uid()));
create policy self_profile_update on public.profiles for update to authenticated using (id=(select auth.uid())) with check (id=(select auth.uid()));
create policy owner_place_insert on public.places for insert to authenticated with check (private.owns_advertiser(advertiser_id) and status in ('draft','pending') and verified_at is null and not is_demo);
create policy owner_place_update on public.places for update to authenticated using (private.can_edit_place(id)) with check (private.owns_advertiser(advertiser_id) and status in ('draft','pending') and verified_at is null and not is_demo);
create policy owner_insert on public.place_translations for insert to authenticated with check (private.can_edit_place(place_id));
create policy owner_update on public.place_translations for update to authenticated using (private.can_edit_place(place_id)) with check (private.can_edit_place(place_id));
create policy owner_delete on public.place_translations for delete to authenticated using (private.can_edit_place(place_id));
create policy owner_insert on public.place_photos for insert to authenticated with check (private.can_edit_place(place_id));
create policy owner_update on public.place_photos for update to authenticated using (private.can_edit_place(place_id)) with check (private.can_edit_place(place_id));
create policy owner_delete on public.place_photos for delete to authenticated using (private.can_edit_place(place_id));
create policy owner_insert on public.place_hours for insert to authenticated with check (private.can_edit_place(place_id));
create policy owner_update on public.place_hours for update to authenticated using (private.can_edit_place(place_id)) with check (private.can_edit_place(place_id));
create policy owner_delete on public.place_hours for delete to authenticated using (private.can_edit_place(place_id));
create policy owner_insert on public.coupons for insert to authenticated with check (private.owns_place(place_id) and status in ('draft','pending'));
create policy owner_update on public.coupons for update to authenticated using (private.owns_place(place_id) and status in ('draft','pending')) with check (private.owns_place(place_id) and status in ('draft','pending'));
create policy owner_delete on public.coupons for delete to authenticated using (private.owns_place(place_id) and status in ('draft','pending'));
create index user_roles_user_id_idx on public.user_roles(user_id);
create index advertisers_owner_id_idx on public.advertisers(owner_id);
create index places_advertiser_id_idx on public.places(advertiser_id);
create index places_category_id_idx on public.places(category_id);
create index place_translations_place_id_idx on public.place_translations(place_id);
create index place_photos_place_id_idx on public.place_photos(place_id);
create index place_hours_place_id_idx on public.place_hours(place_id);
create index subscriptions_advertiser_id_idx on public.subscriptions(advertiser_id);
create index subscriptions_plan_id_idx on public.subscriptions(plan_id);
create index payments_subscription_id_idx on public.payments(subscription_id);
create index route_translations_route_id_idx on public.route_translations(route_id);
create index route_stops_route_id_idx on public.route_stops(route_id);
create index route_stops_place_id_idx on public.route_stops(place_id);
create index route_sponsors_route_id_idx on public.route_sponsors(route_id);
create index route_sponsors_advertiser_id_idx on public.route_sponsors(advertiser_id);
create index events_place_id_idx on public.events(place_id);
create index event_translations_event_id_idx on public.event_translations(event_id);
create index coupons_place_id_idx on public.coupons(place_id);
create index coupon_redemptions_coupon_id_idx on public.coupon_redemptions(coupon_id);
create index coupon_redemptions_validated_by_idx on public.coupon_redemptions(validated_by);
create index qr_codes_place_id_idx on public.qr_codes(place_id);
create index qr_scans_qr_code_id_idx on public.qr_scans(qr_code_id);
create index place_views_place_id_idx on public.place_views(place_id);
create index click_events_place_id_idx on public.click_events(place_id);
create index reviews_place_id_idx on public.reviews(place_id);
create index reviews_moderated_by_idx on public.reviews(moderated_by);
create index leads_assigned_to_idx on public.leads(assigned_to);
create index lead_notes_lead_id_idx on public.lead_notes(lead_id);
create index lead_notes_author_id_idx on public.lead_notes(author_id);
create index ai_sessions_user_id_idx on public.ai_sessions(user_id);
create index audit_logs_actor_id_idx on public.audit_logs(actor_id);
create index places_coordinates_idx on public.places(latitude,longitude) where status='published';
create index places_status_idx on public.places(status);
create index events_starts_at_idx on public.events(starts_at) where status='published';
create index coupons_ends_at_idx on public.coupons(ends_at);
create unique index subscriptions_one_active_idx on public.subscriptions(advertiser_id) where status='active';
create index qr_scans_time_idx on public.qr_scans(qr_code_id,occurred_at);
create index place_views_time_idx on public.place_views(place_id,occurred_at);
create index click_events_time_idx on public.click_events(place_id,occurred_at);
create index leads_follow_up_idx on public.leads(follow_up_at);
create index ai_sessions_expiry_idx on public.ai_sessions(expires_at);
create index audit_logs_time_idx on public.audit_logs(created_at);

-- Only owners/admin can obtain aggregate daily counts; raw telemetry stays backend/admin only.
create function public.place_daily_metrics(target_place uuid, from_date date, to_date date)
returns table(day date, views bigint, clicks bigint, scans bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
 if not (public.has_role('admin') or private.owns_place(target_place)) then
  raise exception 'forbidden' using errcode='42501';
 end if;
 if from_date is null or to_date is null or to_date<from_date or to_date-from_date>366 then
  raise exception 'invalid period' using errcode='22023';
 end if;
 return query
 with telemetry as (
 select (v.occurred_at at time zone 'UTC')::date d, 'view' k from public.place_views v where v.place_id=target_place and v.occurred_at>=from_date::timestamp at time zone 'UTC' and v.occurred_at<(to_date+1)::timestamp at time zone 'UTC'
 union all select (c.occurred_at at time zone 'UTC')::date, 'click' from public.click_events c where c.place_id=target_place and c.occurred_at>=from_date::timestamp at time zone 'UTC' and c.occurred_at<(to_date+1)::timestamp at time zone 'UTC'
 union all select (s.occurred_at at time zone 'UTC')::date, 'scan' from public.qr_scans s join public.qr_codes q on q.id=s.qr_code_id where q.place_id=target_place and s.occurred_at>=from_date::timestamp at time zone 'UTC' and s.occurred_at<(to_date+1)::timestamp at time zone 'UTC'
 ) select d, count(*) filter(where k='view'), count(*) filter(where k='click'), count(*) filter(where k='scan') from telemetry group by d order by d;
end $$;
revoke all on function public.place_daily_metrics(uuid,date,date) from public, anon;
grant execute on function public.place_daily_metrics(uuid,date,date) to authenticated;

-- Lock the coupon before counting: concurrent redemptions cannot exceed its limit.
-- Invoked by a future validated Edge Function with service_role only. Actor comes from verified JWT.
create function public.redeem_coupon(target_coupon uuid, actor uuid, request_key uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare c public.coupons; result uuid;
begin
 select * into c from public.coupons where id=target_coupon for update;
 if not found then raise exception 'coupon unavailable' using errcode='22023'; end if;
 if not exists(select 1 from public.places p join public.advertisers a on a.id=p.advertiser_id where p.id=c.place_id and a.owner_id=actor and a.status='approved') and not exists(select 1 from public.user_roles r where r.user_id=actor and r.role='admin') then
  raise exception 'forbidden' using errcode='42501';
 end if;
 select id into result from public.coupon_redemptions where redemption_key=request_key and coupon_id=target_coupon;
 if found then return result; end if;
 if c.status<>'published' or c.starts_at>now() or c.ends_at<=now() or not private.published_place(c.place_id) or (select count(*) from public.coupon_redemptions where coupon_id=target_coupon)>=c.max_redemptions then
  raise exception 'coupon unavailable' using errcode='22023';
 end if;
 insert into public.coupon_redemptions(coupon_id,validated_by,redemption_key) values(target_coupon,actor,request_key) returning id into result;
 return result;
end $$;
revoke all on function public.redeem_coupon(uuid,uuid,uuid) from public, anon, authenticated;
grant execute on function public.redeem_coupon(uuid,uuid,uuid) to service_role;
commit;
