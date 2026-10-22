do $$ begin
 if (select count(*) from public.coupon_redemptions where coupon_id='40000000-0000-4000-8000-000000000004')<>1 then
  raise exception 'Concurrent redemption must consume exactly one slot';
 end if;
end $$;
