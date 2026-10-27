begin;
set local application_name='sjdr_route_writer_a';
set local statement_timeout='15s';
select set_config('request.jwt.claim.sub','92000000-0000-4000-8000-000000000001',true);
set local role authenticated;
select public.admin_set_route_stops('92000000-0000-4000-8000-000000000004','2000-01-01Z','[{"place_id":"92000000-0000-4000-8000-000000000003","duration_minutes":9}]');
reset role;
select pg_advisory_xact_lock(920001);
-- Deterministic barrier: commit only after B really waits on A's row lock.
do $$ declare queued boolean:=false;begin
 for attempt in 1..1000 loop
  perform pg_stat_clear_snapshot();
  select exists(select 1 from pg_stat_activity where application_name='sjdr_route_writer_b' and wait_event_type='Lock') into queued;
  exit when queued;
  perform pg_sleep(0.01);
 end loop;
 if not queued then raise exception 'B never reached the route row lock';end if;
end $$;
commit;
