-- Editorial navigation taxonomy for the public site; no businesses, locations, hours or prices.
-- Categories are site-owned classifications, not official governmental endorsements.
begin;
insert into public.categories (slug,name,published,source_urls,pending_fields)
values
 ('historia','História e Museus',true,array['https://museuregionaldesaojoaodelrei.museus.gov.br/guia-de-turismo/']::text[],array[]::text[]),
 ('comer','Onde Comer',true,array['https://www.saojoaodelrei.mg.gov.br/']::text[],array[]::text[]),
 ('hospedar','Onde Ficar',true,array['https://www.saojoaodelrei.mg.gov.br/']::text[],array[]::text[]),
 ('artesanato','Compras e Artesanato',true,array['https://museuregionaldesaojoaodelrei.museus.gov.br/guia-de-turismo/']::text[],array[]::text[]),
 ('passeios','Passeios e Experiências',true,array['https://museuregionaldesaojoaodelrei.museus.gov.br/guia-de-turismo/']::text[],array[]::text[])
on conflict (slug) do nothing;
commit;
