begin;
set local role service_role;
do $$ begin
 begin
  perform public.redeem_coupon('40000000-0000-4000-8000-000000000004','40000000-0000-4000-8000-000000000001',gen_random_uuid());
  perform pg_sleep(1); -- Keep the successful transaction open while the second call contends.
 exception when invalid_parameter_value then null; -- The exhausted coupon must reject one caller.
 end;
end $$;
commit;
