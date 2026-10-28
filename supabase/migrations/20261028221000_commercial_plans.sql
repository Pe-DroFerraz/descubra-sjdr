-- Commercial plans from docs/ESPECIFICACAO.md; inquiry-only, no automatic billing.
begin;
insert into public.plans(slug,name,price_cents,currency,features,published)
values
('basico','Básico',0,'BRL','{"public_profile":true,"photos":false,"whatsapp":false,"coupons":false,"basic_reports":false,"badge":false,"priority":false}'::jsonb,true),
('parceiro','Parceiro',6900,'BRL','{"public_profile":true,"photos":true,"whatsapp":true,"coupons":true,"basic_reports":true,"badge":true,"priority":false}'::jsonb,true),
('destaque','Destaque',19900,'BRL','{"public_profile":true,"photos":true,"whatsapp":true,"coupons":true,"basic_reports":true,"full_reports":true,"badge":true,"priority":true,"route_spots":true}'::jsonb,true)
on conflict (slug) do nothing;
commit;