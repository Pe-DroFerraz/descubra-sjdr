do $$ begin
 if (select count(*) from public.route_stops where route_id='92000000-0000-4000-8000-000000000004' and duration_minutes=9)<>1
   or (select updated_at from public.routes where id='92000000-0000-4000-8000-000000000004')<='2000-01-01Z' then
   raise exception 'stale concurrent editor overwrote winner';end if;
end $$;
