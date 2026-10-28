-- Verified introductory heritage catalog. Only official museum/government reference.
-- Opening hours, prices, amenities and availability intentionally NOT claimed.
begin;
with historic_category as (
  select id from public.categories where slug='historia' and published=true
)
insert into public.places
 (slug,name,description,address,category_id,latitude,longitude,website,status,verified_at,source_urls,pending_fields,is_demo)
select listing.slug,listing.name,listing.description,listing.address,cat.id,
 listing.latitude,listing.longitude,listing.website,'published'::public.content_status,
 case when listing.slug='museu-regional-sao-joao-del-rei' then now() else null end,
 listing.sources,array[]::text[],false
from historic_category cat
cross join (
 values
 ('museu-regional-sao-joao-del-rei',
  'Museu Regional de São João del-Rei',
  'Instalado em um casarão histórico do antigo Comendador Mourão, o museu preserva mobiliário, arte sacra e objetos que ajudam a contar a história da região. Consulte o museu antes da visita para confirmar funcionamento e exposições.',
  'Rua Marechal Deodoro, 12 — Centro, São João del-Rei — MG',
  -21.13597541801312::numeric,-44.26123380661011::numeric,
  'https://museuregionaldesaojoaodelrei.museus.gov.br/',
  array['https://www.gov.br/museus/pt-br/museus-ibram/museu-regional-de-sao-joao-del-rei','https://visite.museus.gov.br/instituicoes/museu-regional-de-sao-joao-del-rei/']::text[]),
 ('museu-ferroviario-estacao-efom',
  'Museu Ferroviário e Estação Ferroviária',
  'Espaço de memória ferroviária na antiga estação de São João del-Rei. Para viagens de trem e condições de visitação, consulte os canais oficiais da operação ferroviária e do museu.',
  'Avenida Hermílio Alves, 366 — Centro, São João del-Rei — MG',
  null::numeric,null::numeric,null::text,
  array['https://museuregionaldesaojoaodelrei.museus.gov.br/guia-de-turismo/']::text[]),
 ('igreja-sao-francisco-de-assis-sjdr',
  'Igreja de São Francisco de Assis',
  'Um dos marcos arquitetônicos do centro histórico de São João del-Rei. O acesso ao interior pode sofrer restrições por obras e atividades religiosas: confirme a situação diretamente com os responsáveis.',
  'Praça Frei Orlando, s/n — Centro, São João del-Rei — MG',
  null::numeric,null::numeric,null::text,
  array['https://museuregionaldesaojoaodelrei.museus.gov.br/guia-de-turismo/']::text[]),
 ('catedral-nossa-senhora-do-pilar',
  'Catedral Basílica de Nossa Senhora do Pilar',
  'Referência religiosa e patrimonial do centro de São João del-Rei. A fonte turística utilizada registra períodos de reforma; confirme se há visitação interna antes do deslocamento.',
  'Rua Monsenhor Gustavo, 61 — Centro, São João del-Rei — MG',
  null::numeric,null::numeric,null::text,
  array['https://museuregionaldesaojoaodelrei.museus.gov.br/guia-de-turismo/']::text[]),
 ('centro-cultural-ufsj-solar-baronesa',
  'Centro Cultural da UFSJ — Solar da Baronesa',
  'Espaço cultural no Largo do Carmo, instalado em um imóvel de valor histórico. Consulte a programação cultural e as condições de visita antes de ir.',
  'Praça Doutor Augusto das Chagas Viegas, 17 — Largo do Carmo, São João del-Rei — MG',
  null::numeric,null::numeric,null::text,
  array['https://museuregionaldesaojoaodelrei.museus.gov.br/guia-de-turismo/']::text[])
) as listing(slug,name,description,address,latitude,longitude,website,sources)
on conflict (slug) do nothing;
commit;
