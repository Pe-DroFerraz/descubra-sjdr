-- Disposable local fixture only; prove a repeated proposal respects subsequent curation.
update public.places set description='Local editorial preservation fixture' where id='50c389a0-9609-56af-be0f-47403010b10e';
delete from public.route_stops where route_id='471bd7a0-6623-5cf1-9401-c976d9024229';
