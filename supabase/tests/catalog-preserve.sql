do $$ begin
 if not exists(select 1 from public.places where id='50c389a0-9609-56af-be0f-47403010b10e' and description='Local editorial preservation fixture') then raise exception 'proposal overwrote editorial changes'; end if;
 if exists(select 1 from public.route_stops where route_id='471bd7a0-6623-5cf1-9401-c976d9024229') then raise exception 'proposal resurrected removed stops'; end if;
end $$;
