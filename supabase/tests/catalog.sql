-- Isolated candidate import assertions; no production publication.
begin;
do $$ begin
 if (select count(*) from public.places where not is_demo)<>24 then raise exception 'candidate place count'; end if;
 if exists(select 1 from public.places where not is_demo and (status<>'draft' or verified_at is not null or latitude is not null or price_description is not null)) then raise exception 'unreviewed candidates published or enriched'; end if;
 if (select count(*) from public.routes where not is_demo)<>6 then raise exception 'candidate route count'; end if;
 if exists(select 1 from public.routes where not is_demo and (status<>'draft' or duration_minutes is not null)) then raise exception 'unreviewed route published'; end if;
 if exists(select 1 from public.route_stops stop join public.routes route on route.id=stop.route_id left join public.places place on place.id=stop.place_id where not route.is_demo and (place.id is null or place.is_demo)) then raise exception 'candidate stop relation'; end if;
 if exists(select 1 from public.route_stops stop join public.routes route on route.id=stop.route_id where not route.is_demo group by route.id having min(stop.position)<>0 or max(stop.position)<>count(*)-1) then raise exception 'candidate stop ordering';end if;
end $$;
set local role anon;
do $$ begin
 if exists(select 1 from public.places) or exists(select 1 from public.routes) or exists(select 1 from public.categories) then raise exception 'draft candidate leaked to public API role'; end if;
end $$;
rollback;
