-- Read only, compatible with the existing three-migration Cloud schema.
-- Review counts before considering editorial_provenance. No data or history changes.
begin transaction read only;
select 'categories' as entity,count(*) as published_rows_needing_provenance_review from public.categories where published
union all select 'places',count(*) from public.places where status='published'
union all select 'routes',count(*) from public.routes where status='published'
union all select 'events',count(*) from public.events where status='published'
union all select 'tips',count(*) from public.tips where status='published';
select count(*) as published_places_missing_basic_content from public.places
where status='published' and (length(btrim(coalesce(address,'')))=0 or length(btrim(description))=0 or is_demo);
select count(*) as published_routes_with_invalid_stops from public.routes r where r.status='published' and (
 not exists(select 1 from public.route_stops s where s.route_id=r.id)
 or exists(select 1 from public.route_stops s join public.places p on p.id=s.place_id where s.route_id=r.id and (p.status<>'published' or p.is_demo))
);
select count(distinct s.place_id) as places_requiring_route_withdrawal_first
from public.route_stops s join public.routes r on r.id=s.route_id where r.status='published';
rollback;
