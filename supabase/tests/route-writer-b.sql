\set VERBOSITY sqlstate
begin;
set local application_name='sjdr_route_writer_b';
set local statement_timeout='8s';
select set_config('request.jwt.claim.sub','92000000-0000-4000-8000-000000000001',true);
set local role authenticated;
select public.admin_set_route_stops('92000000-0000-4000-8000-000000000004','2000-01-01Z','[]');
commit;
