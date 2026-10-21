# Descubra SJDR — Especificação do Produto

## Visão
PWA turística para São João del-Rei, Minas Gerais, acessada por QR Code e link. Visitantes consultam roteiros e pontos turísticos; estabelecimentos contratam planos mensais para receber mais visibilidade e medir resultados. Identidade inspirada no barroco mineiro: azul-colonial, ocre, terracota, off-white, serifas elegantes, mobile-first. Público PT-BR, inglês e espanhol.

## Stack obrigatória
Frontend React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, React Router, TanStack Query. PWA vite-plugin-pwa. Backend Supabase Auth, PostgreSQL, Storage, RLS, Edge Functions Deno, pg_cron. Leaflet + OpenStreetMap, clusters, GPS, Google Maps e Waze para direções. Asaas para cobranças recorrentes PIX/boleto/cartão por Edge Functions/webhooks. WhatsApp wa.me na fase 1, Cloud API na fase 2. IA Claude (modelo claude-sonnet-4-6, verificar disponibilidade na integração) via Edge Function. react-i18next PT/EN/ES. Open-Meteo para clima. QR PNG/SVG via qrcode. Deploy Vercel + Supabase.

## Papéis
- Turista anônimo: navega, favoritar localmente, montar roteiro, resgatar cupons; magic link opcional para sincronizar.
- Anunciante autenticado: gerencia seus próprios estabelecimentos, cupons, assinaturas, QR e relatórios.
- Admin: gerencia todo conteúdo, usuários, leads, cobranças e auditoria.

## Turista — funcionalidades
1. Home com busca, categorias Igrejas e Museus, Onde Comer, Onde Ficar, Compras e Artesanato, Passeios e Eventos; roteiros em carrossel, perto de você, eventos do mês, roteiro sugerido pelo clima.
2. Mapa Leaflet com clusters, categorias, pinos em destaque, filtro aberto agora, GPS e links de rota.
3. Detalhe de local com galeria, descrição, horário e status atualizado, preço, contato, WhatsApp, Instagram, site, selo condicionado à assinatura, cupons, avaliações moderadas, proximidades, compartilhar e favoritar.
4. Seis roteiros: 1 dia em SJDR, histórico, gastronômico, com crianças, fim de semana romântico, dia de chuva. Paradas ordenadas, duração, mapa e patrocinador.
5. Roteiro pessoal com favoritos organizados por dia e drag-and-drop, persistência offline e link compartilhável.
6. Cupons por QR/código com validação segura pelo anunciante.
7. Eventos com calendário mensal, festas tradicionais, programação dos museus e Maria Fumaça. Nunca apresentar datas não verificadas como certas.
8. Dicas úteis: estacionamento, banheiros, farmácias, caixas, táxis e rodoviária.
9. Assistente IA usando APENAS estabelecimentos e atrações publicadas no banco como contexto, considerando número de dias, perfil e orçamento; máximo 10 mensagens por sessão, rate limit por IP, resposta streaming.
10. Tradução automática PT→EN/ES de textos cadastrados, com edição humana posterior e detecção de idioma do navegador.
11. Offline: cache de roteiros visitados, favoritos e tiles conforme política do provedor (evitar downloads massivos de tiles OSM).
12. Avaliações sem login 1–5 estrelas e comentário curto, moderadas previamente, honeypot + rate limiting.

## QR Codes e rastreamento
QR único por local/parceiro/adesivo, short code /q/<codigo> que contabiliza scan, idioma e tipo de dispositivo e redireciona. Gerar PNG e SVG, versões adesivo e display de mesa com moldura imprimível. Relatórios por QR, local e período. Minimização/anonimização LGPD.

## Painel anunciante
Cadastro/login senha ou magic link. Editar locais e fotos com compressão no cliente, horários, endereço e posição no mapa, redes, cardápio, preços. CRUD de ofertas/cupons, limites, vigência e validação atômica de resgate. Relatórios de views, cliques WhatsApp, direção, QR scans, resgates, gráficos diários, comparação mês anterior e exportação CSV/PDF. Gestão de assinatura, upgrade/downgrade, histórico, cancelamento e forma de pagamento. Features por plano e selo somente quando ativo.

## Admin
Moderar/aprovar/suspender anunciantes, locais e avaliações. CRUD de categorias, locais turísticos, roteiros/paradas, eventos, dicas e patrocinadores. Controle de QR. Painel agregando tráfego diário, idiomas, origem QR/link, mais vistos, categorias, IA, receita recorrente MRR e planos. CRM de leads com estágios Prospecto→Contato feito→Proposta→Ativo→Perdido, anotações, follow-up e atalhos WhatsApp. Controle de cobrança e importação CSV, auditoria.

## Planos (tabela editável plans)
- Básico: R$0, nome, endereço e telefone no mapa.
- Parceiro: R$69/mês, perfil completo, fotos, WhatsApp, cupons, relatório básico e selo ativo.
- Destaque: R$199/mês, tudo do Parceiro mais prioridade, pin, roteiros, banner e analytics completo.
- Patrocínio de roteiro: sob consulta, cobrado manualmente e registrado pelo admin.
Preços e feature flags definidos no banco, não hardcoded no frontend.

## Dados — migrations obrigatórias
Criar todas as tabelas com PK/FK, constraints, índices, updated_at triggers e políticas RLS:
profiles, user_roles, categories, places, place_translations, place_photos, place_hours, advertisers, plans, subscriptions, payments, routes, route_translations, route_stops, route_sponsors, events, event_translations, tips, coupons, coupon_redemptions, qr_codes, qr_scans, place_views, click_events (whatsapp, directions, website, instagram, phone), reviews, leads, lead_notes, ai_sessions, audit_logs.
PostGIS (ou lat/lng com índices) para consultas de proximidade; has_role() SECURITY DEFINER evitando recursão em user_roles. RLS em todas as tabelas: visitante lê só publicados; anunciante só os próprios; admin acesso total. Events e reviews inseridos anonimamente SOMENTE por Edge Function validada com rate limit e antiabuso (não por INSERT público livre). Criar RPC/views agregadas que não vazem eventos brutos. Buckets: place-photos (leitura pública, escrita autorizada por dono), qr-codes, event-images.

## Edge Functions necessárias — implementação completa
1. asaas-create-subscription: cria cliente e assinatura, retorna link ou dados de pagamento, autentica dono.
2. asaas-webhook: valida token, protege idempotência, sincroniza subscriptions/payments, libera/suspende benefícios apenas após eventos verificados.
3. ai-assistant: Claude com contexto consultado a partir de places publicadas, limite por sessão/IP, resposta streaming.
4. translate-content: PT→EN/ES, grava nas traduções, requer permissão de proprietário/admin.
5. track-event: valida id/categoria/origem, rate limit e registra view/click/QR.
6. qr-redirect: resolve short code, contabiliza com segurança e redireciona.
7. send-whatsapp: Cloud API para mensagens de template e avisos ao anunciante.
8. daily-cron: expira cupons e assinaturas, produz resumo semanal e entrega por e-mail (provedor de email a configurar).

## Integração real — documentação
Criar guias de conta, chaves e secrets (frontend só VITE_* públicos, demais Supabase secrets), URLs definitivas de webhook após definir project_ref, testes sandbox, mensagens de erro, deploy. Incluir Asaas, Cloud API, Anthropic, Supabase, Open-Meteo, domínio e Vercel. Nunca exigir credenciais reais em commit.

## Segurança, conformidade e qualidade
Validação Zod frontend/Edge Functions. LGPD com política de privacidade, consentimento antes de analytics não essenciais e minimização de dados; cookies. Acessibilidade teclado/contraste/labels, imagens otimizadas lazy, SEO meta e Open Graph por lugar, sitemap, JSON-LD schema.org, testes Vitest + Edge Functions e objetivo Lighthouse >=90 a confirmar em medição real. Estados de loading/erro/vazio. Sem falsa indicação de dados operacionais confiáveis.

## Seed
seed.sql marcado DEMONSTRAÇÃO, pelo menos 25 locais (Igreja São Francisco de Assis, Catedral Basílica Nossa Senhora do Pilar, Museu Regional, Estação Ferroviária, Maria Fumaça, Ponte da Cadeia e outras categorias), seis roteiros, oito eventos, dez dicas, três planos, cinco anunciantes fictícios e orientações seguras para criação de admin de teste (nunca senha real hardcoded). Nomes/dados comerciais e datas fictícios claramente sinalizados.

## Ordem de trabalho
Etapa 0 scaffold, configs e chaves; etapa 1 migrations RLS storage seed; etapa 2 front turista completo; etapa 3 QR tracking avaliações cupons; etapa 4 painel anunciante; etapa 5 painel admin CRM; etapa 6 Edge Functions e integrações; etapa 7 offline SEO LGPD testes e deploy.

**Regra de entrega:** código completo arquivo por arquivo com caminhos; nunca apresentar scaffolds como funcionalidades acabadas. Executar testes após cada etapa. Preservar contexto e decisões em docs/DECISOES.md.
