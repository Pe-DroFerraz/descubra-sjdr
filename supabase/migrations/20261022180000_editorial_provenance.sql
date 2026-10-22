-- ADDITIONAL / LOCAL REVIEW ONLY. Reconcile remote versions before any application.
-- No imports, publication, historical migration replay, RLS changes or SECURITY DEFINER.
begin;
do $$ declare relation text; begin
  foreach relation in array array['categories','places','routes','events','tips'] loop
    execute format('alter table public.%I add column source_urls text[] not null default ''{}'', add column pending_fields text[] not null default ''{}''',relation);
    execute format('comment on column public.%I.source_urls is %L',relation,'Public editorial provenance: HTTPS references only; no credentials or personal data.');
    execute format('comment on column public.%I.pending_fields is %L',relation,'Public field names awaiting confirmation; not private editorial notes. Empty does not imply verification.');
  end loop;
end $$;
create function private.validate_editorial_content() returns trigger
language plpgsql security invoker set search_path='' as $$
declare item text; published boolean; content jsonb;
begin
  content:=to_jsonb(new);
  published:=case when tg_table_name='categories' then (content->>'published')::boolean else content->>'status'='published' end;
  if cardinality(new.source_urls)>20 or array_ndims(new.source_urls)>1
     or cardinality(new.pending_fields)>30 or array_ndims(new.pending_fields)>1 then
    raise exception 'editorial array limit' using errcode='23514';
  end if;
  foreach item in array new.source_urls loop
    if item is null or length(item)>2000 or item !~ '^https://[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?(:[0-9]+)?(/[^[:space:]]*)?$' then
      raise exception 'invalid public source URL' using errcode='23514';
    end if;
  end loop;
  foreach item in array new.pending_fields loop
    if item is null or length(btrim(item)) not between 1 and 160 then
      raise exception 'invalid pending field' using errcode='23514';
    end if;
  end loop;
  if published then
    if auth.uid() is not null and not public.has_role('admin') then
      raise exception 'administrator required for publication' using errcode='42501';
    end if;
    if cardinality(new.source_urls)=0 or cardinality(new.pending_fields)>0
       or length(btrim(coalesce(content->>'name',content->>'title','')))=0
       or (tg_table_name<>'categories' and length(btrim(coalesce(content->>'description','')))=0)
       or (tg_table_name='places' and length(btrim(coalesce(content->>'address','')))=0)
       or coalesce((content->>'is_demo')::boolean,false) then
      raise exception 'incomplete editorial content' using errcode='23514';
    end if;
  end if;
  -- Serialize route publication against withdrawal of its places. RLS remains active.
  if tg_table_name='routes' and published then
    perform p.id from public.places p join public.route_stops s on s.place_id=p.id
      where s.route_id=new.id order by p.id for share of p;
    if not exists(select 1 from public.route_stops where route_id=new.id)
       or exists(select 1 from public.route_stops s left join public.places p on p.id=s.place_id
         where s.route_id=new.id and (p.id is null or p.status<>'published' or p.is_demo)) then
      raise exception 'route needs published stops' using errcode='23514';
    end if;
  end if;
  if tg_table_name='places' and tg_op='UPDATE' then
    if (new.status<>'published' or new.is_demo) and exists(
      select 1 from public.route_stops s join public.routes r on r.id=s.route_id
      where s.place_id=new.id and r.status='published'
    ) then raise exception 'withdraw related routes first' using errcode='23514'; end if;
  end if;
  return new;
end $$;
revoke all on function private.validate_editorial_content() from public,anon,authenticated;
do $$ declare relation text; begin
  foreach relation in array array['categories','places','routes','events','tips'] loop
    execute format('create trigger validate_editorial_content before insert or update on public.%I for each row execute function private.validate_editorial_content()',relation);
  end loop;
end $$;
-- Protect direct REST writes to stops as well as admin_set_route_stops().
create function private.lock_editorial_route() returns trigger
language plpgsql security invoker set search_path='' as $$
declare target uuid;
begin
  for target in select distinct id from unnest(array[
    case when tg_op<>'INSERT' then old.route_id end,
    case when tg_op<>'DELETE' then new.route_id end
  ]) id where id is not null order by id loop
    perform id from public.routes where id=target for update;
  end loop;
  if tg_op<>'DELETE' then
    perform id from public.places where id=new.place_id for share;
  end if;
  if tg_op='DELETE' then return old; else return new; end if;
end $$;
create function private.check_editorial_stops() returns trigger
language plpgsql security invoker set search_path='' as $$
declare target uuid;
begin
  for target in select distinct id from unnest(array[
    case when tg_op<>'INSERT' then old.route_id end,
    case when tg_op<>'DELETE' then new.route_id end
  ]) id where id is not null loop
    if exists(select 1 from public.routes where id=target and status='published') and (
      not exists(select 1 from public.route_stops where route_id=target)
      or exists(select 1 from public.route_stops s left join public.places p on p.id=s.place_id
        where s.route_id=target and (p.id is null or p.status<>'published' or p.is_demo))
    ) then raise exception 'route needs published stops' using errcode='23514'; end if;
  end loop;
  return null;
end $$;
revoke all on function private.lock_editorial_route() from public,anon,authenticated;
revoke all on function private.check_editorial_stops() from public,anon,authenticated;
create trigger lock_editorial_route before insert or update or delete on public.route_stops
  for each row execute function private.lock_editorial_route();
create constraint trigger check_editorial_stops after insert or update or delete on public.route_stops
  deferrable initially deferred for each row execute function private.check_editorial_stops();
commit;
