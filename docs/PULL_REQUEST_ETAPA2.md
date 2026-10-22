Conecta o frontend turístico ao catálogo público do Supabase e substitui as rotas demonstrativas por Home, busca, mapa Leaflet com clusters, detalhes de locais, roteiros, favoritos/viagem, eventos e dicas. Conteúdo depende de publicação real no banco; sem Cloud configurado ou sem resultados, mostra indisponibilidade/vazio sem dados fictícios de produção.

A branch parte do commit `b0eb99e` da PR #1, ainda sem merge. Como `main` não contém essa base, o comparativo inclui as Etapas 0/1; a implementação nova da Etapa 2 é um commit posterior. Não habilitar merge automático ou deploy Vercel nesta revisão.

## Revisão da PR #1 e correções

- HEAD recuperado por Git; build, lint, 16 testes herdados e PostgreSQL passaram localmente antes das alterações.
- Corrigido crash de inicialização com `localStorage` bloqueado, com teste de regressão.
- Corrigido aviso de bundle >500 KiB com divisão por rotas/vendors.
- Nova migration aditiva com RPCs públicas para benefícios e patrocinadores, sem expor assinaturas, pagamentos ou donos.
- Ajustados contrastes e nome acessível do link de favoritos no mobile.
- Comentários e CI remoto da PR #1 não puderam ser consultados: API GitHub retornou `Post "https://api.github.com/graphql": Forbidden`. Não confundir validação local com aprovação/CI remoto.

## Implementação

- Tailwind + base shadcn/ui, React Router e TanStack Query; PT/EN/ES; carregamento, erro, vazio e retry.
- Consultas públicas anônimas, projeções explícitas, paginação e validação Zod; somente `published` e `is_demo=false`.
- Busca com acentos, categorias, aberto agora verificado, GPS e distância; filtros na URL.
- Leaflet/OSM com atribuição, clusters, pins de benefícios ativos e fallback de falha de tiles, sem downloads massivos.
- Local individual com galeria Storage, informações/horários/preços reais, links seguros, direções, compartilhar, favoritos, proximidades e leitura de cupons/avaliações publicados.
- Roteiros com paradas ordenadas, duração, mapa esquemático, patrocinador confirmado e classificação editorial de clima; Open-Meteo opcional por ação do usuário.
- Favoritos locais, organização por dia, arrastar/soltar e alternativa de teclado, persistência e link compartilhável validado/importação explícita.
- Calendário mensal e detalhe de eventos; busca e categorias de dicas.

## Validação executada

- `npm run build`: passou, sem warning de chunk >500 KiB.
- `npm run lint`: passou.
- `npm test`: 40 passaram, nenhum ignorado.
- `npm run test:db`: passou em PostgreSQL 17, três migrations, seed reexecutado, RLS herdada, concorrência e testes de RPCs/benefícios/patrocinadores.
- `npm run test:e2e`: seis cenários passaram em Chromium real, usando HTTP sintético exclusivamente de teste. Verifica busca/detalhe, persistência, idioma/mobile, clusters/falha de tiles, filtros, calendário, roteiros, dicas, compartilhamento, reordenação, GPS e estados de carregamento/erro/vazio/retry.
- axe na Home desktop/mobile: nenhuma violação nas regras WCAG 2 A/AA e 2.1 AA executadas; capturas visuais inspecionadas. Não é auditoria manual completa nem medição Lighthouse.

## Limitações e configuração

- Supabase Cloud não foi homologado: faltam URL/chave pública no ambiente. Configurar apenas `VITE_SUPABASE_URL` e chave anon/publishable, aplicar a migration adicional e cadastrar/publicar conteúdo real verificado, conforme `docs/ETAPA2.md`.
- Não usar `service_role` no frontend, não publicar seed demonstrativo e não simular assinaturas/pagamentos para criar selos.
- Os testes PostgreSQL usam contratos mínimos simulados de Auth/Storage; navegador usa fixtures HTTP, não produção. A pilha Supabase completa continua pendente do limite de disco registrado na Etapa 1.
- QR seguro, tracking, inserção de avaliações e resgate de cupons ficam na Etapa 3; cache offline completo, SEO avançado e integrações comerciais permanecem nas fases correspondentes.
- Nenhum secret, merge, deploy Vercel ou alteração de banco remoto.

Relatórios e configuração: `docs/REVISAO.md`, `docs/ETAPA2.md`, `docs/DECISOES.md`.
