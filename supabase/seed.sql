-- DEMONSTRAÇÃO: dados não verificados. NÃO executar em produção.
-- Datas, descrições e negócios são fictícios; todos os conteúdos ficam em draft.
-- Reexecução segura: IDs estáveis, ON CONFLICT DO NOTHING preserva edições locais.
begin;
insert into public.categories (id,slug,name) values
('00000000-0000-4000-0001-000000000001','historia','Igrejas e Museus'),
('00000000-0000-4000-0001-000000000002','comer','Onde Comer'),
('00000000-0000-4000-0001-000000000003','hospedar','Onde Ficar'),
('00000000-0000-4000-0001-000000000004','artesanato','Compras e Artesanato'),
('00000000-0000-4000-0001-000000000005','passeios','Passeios e Eventos')
on conflict do nothing;
insert into public.plans (id,slug,name,price_cents,features,published) values
('00000000-0000-4000-0002-000000000001','basico','Básico',0,'{"map_listing":true}','true'),
('00000000-0000-4000-0002-000000000002','parceiro','Parceiro',6900,'{"full_profile":true,"photos":true,"whatsapp":true,"coupons":true,"basic_reports":true,"badge":true}','true'),
('00000000-0000-4000-0002-000000000003','destaque','Destaque',19900,'{"full_profile":true,"photos":true,"whatsapp":true,"coupons":true,"basic_reports":true,"badge":true,"priority":true,"featured_pin":true,"routes":true,"banner":true,"full_analytics":true}','true')
on conflict do nothing;
insert into public.advertisers (id,name,is_demo) values
('00000000-0000-4000-0003-000000000001','DEMONSTRAÇÃO — Anunciante fictício 1','true'),
('00000000-0000-4000-0003-000000000002','DEMONSTRAÇÃO — Anunciante fictício 2','true'),
('00000000-0000-4000-0003-000000000003','DEMONSTRAÇÃO — Anunciante fictício 3','true'),
('00000000-0000-4000-0003-000000000004','DEMONSTRAÇÃO — Anunciante fictício 4','true'),
('00000000-0000-4000-0003-000000000005','DEMONSTRAÇÃO — Anunciante fictício 5','true')
on conflict do nothing;
insert into public.places (id,advertiser_id,category_id,slug,name,description,is_demo) values
('00000000-0000-4000-0004-000000000001',null,'00000000-0000-4000-0001-000000000001','demo-local-1','DEMONSTRAÇÃO — Igreja São Francisco de Assis','Cadastro demonstrativo não verificado. Não informa funcionamento, disponibilidade ou preços reais.','true'),
('00000000-0000-4000-0004-000000000002',null,'00000000-0000-4000-0001-000000000001','demo-local-2','DEMONSTRAÇÃO — Catedral Basílica Nossa Senhora do Pilar','Cadastro demonstrativo não verificado. Não informa funcionamento, disponibilidade ou preços reais.','true'),
('00000000-0000-4000-0004-000000000003',null,'00000000-0000-4000-0001-000000000001','demo-local-3','DEMONSTRAÇÃO — Museu Regional','Cadastro demonstrativo não verificado. Não informa funcionamento, disponibilidade ou preços reais.','true'),
('00000000-0000-4000-0004-000000000004',null,'00000000-0000-4000-0001-000000000001','demo-local-4','DEMONSTRAÇÃO — Estação Ferroviária','Cadastro demonstrativo não verificado. Não informa funcionamento, disponibilidade ou preços reais.','true'),
('00000000-0000-4000-0004-000000000005',null,'00000000-0000-4000-0001-000000000001','demo-local-5','DEMONSTRAÇÃO — Maria Fumaça','Cadastro demonstrativo não verificado. Não informa funcionamento, disponibilidade ou preços reais.','true'),
('00000000-0000-4000-0004-000000000006',null,'00000000-0000-4000-0001-000000000001','demo-local-6','DEMONSTRAÇÃO — Ponte da Cadeia','Cadastro demonstrativo não verificado. Não informa funcionamento, disponibilidade ou preços reais.','true'),
('00000000-0000-4000-0004-000000000007',null,'00000000-0000-4000-0001-000000000001','demo-local-7','DEMONSTRAÇÃO — Igreja Nossa Senhora do Carmo','Cadastro demonstrativo não verificado. Não informa funcionamento, disponibilidade ou preços reais.','true'),
('00000000-0000-4000-0004-000000000008',null,'00000000-0000-4000-0001-000000000001','demo-local-8','DEMONSTRAÇÃO — Igreja Nossa Senhora do Rosário','Cadastro demonstrativo não verificado. Não informa funcionamento, disponibilidade ou preços reais.','true'),
('00000000-0000-4000-0004-000000000009',null,'00000000-0000-4000-0001-000000000001','demo-local-9','DEMONSTRAÇÃO — Igreja das Mercês','Cadastro demonstrativo não verificado. Não informa funcionamento, disponibilidade ou preços reais.','true'),
('00000000-0000-4000-0004-000000000010',null,'00000000-0000-4000-0001-000000000001','demo-local-10','DEMONSTRAÇÃO — Memorial fictício','Cadastro demonstrativo não verificado. Não informa funcionamento, disponibilidade ou preços reais.','true'),
('00000000-0000-4000-0004-000000000011','00000000-0000-4000-0003-000000000002','00000000-0000-4000-0001-000000000002','demo-local-11','DEMONSTRAÇÃO — Restaurante fictício Colonial','Cadastro demonstrativo não verificado. Não informa funcionamento, disponibilidade ou preços reais.','true'),
('00000000-0000-4000-0004-000000000012','00000000-0000-4000-0003-000000000003','00000000-0000-4000-0001-000000000002','demo-local-12','DEMONSTRAÇÃO — Café fictício da Ponte','Cadastro demonstrativo não verificado. Não informa funcionamento, disponibilidade ou preços reais.','true'),
('00000000-0000-4000-0004-000000000013','00000000-0000-4000-0003-000000000004','00000000-0000-4000-0001-000000000002','demo-local-13','DEMONSTRAÇÃO — Bistrô fictício Ocre','Cadastro demonstrativo não verificado. Não informa funcionamento, disponibilidade ou preços reais.','true'),
('00000000-0000-4000-0004-000000000014','00000000-0000-4000-0003-000000000005','00000000-0000-4000-0001-000000000002','demo-local-14','DEMONSTRAÇÃO — Padaria fictícia da Serra','Cadastro demonstrativo não verificado. Não informa funcionamento, disponibilidade ou preços reais.','true'),
('00000000-0000-4000-0004-000000000015','00000000-0000-4000-0003-000000000001','00000000-0000-4000-0001-000000000002','demo-local-15','DEMONSTRAÇÃO — Sorveteria fictícia Central','Cadastro demonstrativo não verificado. Não informa funcionamento, disponibilidade ou preços reais.','true'),
('00000000-0000-4000-0004-000000000016','00000000-0000-4000-0003-000000000002','00000000-0000-4000-0001-000000000003','demo-local-16','DEMONSTRAÇÃO — Pousada fictícia Barroca','Cadastro demonstrativo não verificado. Não informa funcionamento, disponibilidade ou preços reais.','true'),
('00000000-0000-4000-0004-000000000017','00000000-0000-4000-0003-000000000003','00000000-0000-4000-0001-000000000003','demo-local-17','DEMONSTRAÇÃO — Hotel fictício dos Sinos','Cadastro demonstrativo não verificado. Não informa funcionamento, disponibilidade ou preços reais.','true'),
('00000000-0000-4000-0004-000000000018','00000000-0000-4000-0003-000000000004','00000000-0000-4000-0001-000000000003','demo-local-18','DEMONSTRAÇÃO — Hospedaria fictícia do Largo','Cadastro demonstrativo não verificado. Não informa funcionamento, disponibilidade ou preços reais.','true'),
('00000000-0000-4000-0004-000000000019','00000000-0000-4000-0003-000000000005','00000000-0000-4000-0001-000000000004','demo-local-19','DEMONSTRAÇÃO — Ateliê fictício Terracota','Cadastro demonstrativo não verificado. Não informa funcionamento, disponibilidade ou preços reais.','true'),
('00000000-0000-4000-0004-000000000020','00000000-0000-4000-0003-000000000001','00000000-0000-4000-0001-000000000004','demo-local-20','DEMONSTRAÇÃO — Loja fictícia de Estanho','Cadastro demonstrativo não verificado. Não informa funcionamento, disponibilidade ou preços reais.','true'),
('00000000-0000-4000-0004-000000000021','00000000-0000-4000-0003-000000000002','00000000-0000-4000-0001-000000000004','demo-local-21','DEMONSTRAÇÃO — Artesanato fictício das Gerais','Cadastro demonstrativo não verificado. Não informa funcionamento, disponibilidade ou preços reais.','true'),
('00000000-0000-4000-0004-000000000022','00000000-0000-4000-0003-000000000003','00000000-0000-4000-0001-000000000005','demo-local-22','DEMONSTRAÇÃO — Passeio fictício das Pontes','Cadastro demonstrativo não verificado. Não informa funcionamento, disponibilidade ou preços reais.','true'),
('00000000-0000-4000-0004-000000000023','00000000-0000-4000-0003-000000000004','00000000-0000-4000-0001-000000000005','demo-local-23','DEMONSTRAÇÃO — Trilha fictícia da Serra','Cadastro demonstrativo não verificado. Não informa funcionamento, disponibilidade ou preços reais.','true'),
('00000000-0000-4000-0004-000000000024','00000000-0000-4000-0003-000000000005','00000000-0000-4000-0001-000000000005','demo-local-24','DEMONSTRAÇÃO — Praça fictícia dos Encontros','Cadastro demonstrativo não verificado. Não informa funcionamento, disponibilidade ou preços reais.','true'),
('00000000-0000-4000-0004-000000000025','00000000-0000-4000-0003-000000000001','00000000-0000-4000-0001-000000000005','demo-local-25','DEMONSTRAÇÃO — Centro cultural fictício','Cadastro demonstrativo não verificado. Não informa funcionamento, disponibilidade ou preços reais.','true')
on conflict do nothing;
insert into public.routes (id,slug,name,description,duration_minutes,is_demo) values
('00000000-0000-4000-0005-000000000001','demo-roteiro-1','DEMONSTRAÇÃO — 1 dia em SJDR','Paradas e duração fictícias, sujeitas a validação.',180,'true'),
('00000000-0000-4000-0005-000000000002','demo-roteiro-2','DEMONSTRAÇÃO — Histórico','Paradas e duração fictícias, sujeitas a validação.',180,'true'),
('00000000-0000-4000-0005-000000000003','demo-roteiro-3','DEMONSTRAÇÃO — Gastronômico','Paradas e duração fictícias, sujeitas a validação.',180,'true'),
('00000000-0000-4000-0005-000000000004','demo-roteiro-4','DEMONSTRAÇÃO — Com crianças','Paradas e duração fictícias, sujeitas a validação.',180,'true'),
('00000000-0000-4000-0005-000000000005','demo-roteiro-5','DEMONSTRAÇÃO — Fim de semana romântico','Paradas e duração fictícias, sujeitas a validação.',180,'true'),
('00000000-0000-4000-0005-000000000006','demo-roteiro-6','DEMONSTRAÇÃO — Dia de chuva','Paradas e duração fictícias, sujeitas a validação.',180,'true')
on conflict do nothing;
insert into public.route_stops (id,route_id,place_id,position,duration_minutes) values
('00000000-0000-4000-0006-000000000001','00000000-0000-4000-0005-000000000001','00000000-0000-4000-0004-000000000001',1,60),
('00000000-0000-4000-0006-000000000002','00000000-0000-4000-0005-000000000001','00000000-0000-4000-0004-000000000002',2,60),
('00000000-0000-4000-0006-000000000003','00000000-0000-4000-0005-000000000001','00000000-0000-4000-0004-000000000003',3,60),
('00000000-0000-4000-0006-000000000004','00000000-0000-4000-0005-000000000002','00000000-0000-4000-0004-000000000005',1,60),
('00000000-0000-4000-0006-000000000005','00000000-0000-4000-0005-000000000002','00000000-0000-4000-0004-000000000006',2,60),
('00000000-0000-4000-0006-000000000006','00000000-0000-4000-0005-000000000002','00000000-0000-4000-0004-000000000007',3,60),
('00000000-0000-4000-0006-000000000007','00000000-0000-4000-0005-000000000003','00000000-0000-4000-0004-000000000009',1,60),
('00000000-0000-4000-0006-000000000008','00000000-0000-4000-0005-000000000003','00000000-0000-4000-0004-000000000010',2,60),
('00000000-0000-4000-0006-000000000009','00000000-0000-4000-0005-000000000003','00000000-0000-4000-0004-000000000011',3,60),
('00000000-0000-4000-0006-000000000010','00000000-0000-4000-0005-000000000004','00000000-0000-4000-0004-000000000013',1,60),
('00000000-0000-4000-0006-000000000011','00000000-0000-4000-0005-000000000004','00000000-0000-4000-0004-000000000014',2,60),
('00000000-0000-4000-0006-000000000012','00000000-0000-4000-0005-000000000004','00000000-0000-4000-0004-000000000015',3,60),
('00000000-0000-4000-0006-000000000013','00000000-0000-4000-0005-000000000005','00000000-0000-4000-0004-000000000017',1,60),
('00000000-0000-4000-0006-000000000014','00000000-0000-4000-0005-000000000005','00000000-0000-4000-0004-000000000018',2,60),
('00000000-0000-4000-0006-000000000015','00000000-0000-4000-0005-000000000005','00000000-0000-4000-0004-000000000019',3,60),
('00000000-0000-4000-0006-000000000016','00000000-0000-4000-0005-000000000006','00000000-0000-4000-0004-000000000021',1,60),
('00000000-0000-4000-0006-000000000017','00000000-0000-4000-0005-000000000006','00000000-0000-4000-0004-000000000022',2,60),
('00000000-0000-4000-0006-000000000018','00000000-0000-4000-0005-000000000006','00000000-0000-4000-0004-000000000023',3,60)
on conflict do nothing;
insert into public.events (id,place_id,name,description,starts_at,ends_at,is_demo) values
('00000000-0000-4000-0007-000000000001','00000000-0000-4000-0004-000000000001','DEMONSTRAÇÃO — Evento fictício 1','Data fictícia. Não representa programação confirmada.','2030-01-11T14:00:00Z','2030-01-11T16:00:00Z','true'),
('00000000-0000-4000-0007-000000000002','00000000-0000-4000-0004-000000000002','DEMONSTRAÇÃO — Evento fictício 2','Data fictícia. Não representa programação confirmada.','2030-01-12T14:00:00Z','2030-01-12T16:00:00Z','true'),
('00000000-0000-4000-0007-000000000003','00000000-0000-4000-0004-000000000003','DEMONSTRAÇÃO — Evento fictício 3','Data fictícia. Não representa programação confirmada.','2030-01-13T14:00:00Z','2030-01-13T16:00:00Z','true'),
('00000000-0000-4000-0007-000000000004','00000000-0000-4000-0004-000000000004','DEMONSTRAÇÃO — Evento fictício 4','Data fictícia. Não representa programação confirmada.','2030-01-14T14:00:00Z','2030-01-14T16:00:00Z','true'),
('00000000-0000-4000-0007-000000000005','00000000-0000-4000-0004-000000000005','DEMONSTRAÇÃO — Evento fictício 5','Data fictícia. Não representa programação confirmada.','2030-01-15T14:00:00Z','2030-01-15T16:00:00Z','true'),
('00000000-0000-4000-0007-000000000006','00000000-0000-4000-0004-000000000006','DEMONSTRAÇÃO — Evento fictício 6','Data fictícia. Não representa programação confirmada.','2030-01-16T14:00:00Z','2030-01-16T16:00:00Z','true'),
('00000000-0000-4000-0007-000000000007','00000000-0000-4000-0004-000000000007','DEMONSTRAÇÃO — Evento fictício 7','Data fictícia. Não representa programação confirmada.','2030-01-17T14:00:00Z','2030-01-17T16:00:00Z','true'),
('00000000-0000-4000-0007-000000000008','00000000-0000-4000-0004-000000000008','DEMONSTRAÇÃO — Evento fictício 8','Data fictícia. Não representa programação confirmada.','2030-01-18T14:00:00Z','2030-01-18T16:00:00Z','true')
on conflict do nothing;
insert into public.tips (id,title,description,category,is_demo) values
('00000000-0000-4000-0008-000000000001','DEMONSTRAÇÃO — Estacionamento','Exemplo sem localização ou disponibilidade confirmada. Verifique fontes oficiais antes de viajar.','parking','true'),
('00000000-0000-4000-0008-000000000002','DEMONSTRAÇÃO — Banheiros','Exemplo sem localização ou disponibilidade confirmada. Verifique fontes oficiais antes de viajar.','restroom','true'),
('00000000-0000-4000-0008-000000000003','DEMONSTRAÇÃO — Farmácias','Exemplo sem localização ou disponibilidade confirmada. Verifique fontes oficiais antes de viajar.','pharmacy','true'),
('00000000-0000-4000-0008-000000000004','DEMONSTRAÇÃO — Caixas eletrônicos','Exemplo sem localização ou disponibilidade confirmada. Verifique fontes oficiais antes de viajar.','atm','true'),
('00000000-0000-4000-0008-000000000005','DEMONSTRAÇÃO — Táxis','Exemplo sem localização ou disponibilidade confirmada. Verifique fontes oficiais antes de viajar.','taxi','true'),
('00000000-0000-4000-0008-000000000006','DEMONSTRAÇÃO — Rodoviária','Exemplo sem localização ou disponibilidade confirmada. Verifique fontes oficiais antes de viajar.','transport','true'),
('00000000-0000-4000-0008-000000000007','DEMONSTRAÇÃO — Acessibilidade','Exemplo sem localização ou disponibilidade confirmada. Verifique fontes oficiais antes de viajar.','accessibility','true'),
('00000000-0000-4000-0008-000000000008','DEMONSTRAÇÃO — Água e hidratação','Exemplo sem localização ou disponibilidade confirmada. Verifique fontes oficiais antes de viajar.','health','true'),
('00000000-0000-4000-0008-000000000009','DEMONSTRAÇÃO — Cuidado com o patrimônio','Exemplo sem localização ou disponibilidade confirmada. Verifique fontes oficiais antes de viajar.','heritage','true'),
('00000000-0000-4000-0008-000000000010','DEMONSTRAÇÃO — Informação turística','Exemplo sem localização ou disponibilidade confirmada. Verifique fontes oficiais antes de viajar.','information','true')
on conflict do nothing;
commit;
