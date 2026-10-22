# Etapa 2 — frontend do turista e revisão da PR #1

Branch de trabalho: `work/etapa-2-turista`, baseada no HEAD da PR #1 (`b0eb99e3adb27a3e5d2b3c9ffae07e034775b801`). Nenhum merge, deploy Vercel ou operação em banco remoto.

## Revisão da PR #1

O código foi recuperado por `git fetch origin refs/pull/1/head` e comparado com `main`. Build, lint, os 16 testes herdados e a suíte PostgreSQL passaram antes da implementação da Etapa 2. A API do GitHub retornou `Post "https://api.github.com/graphql": Forbidden`; por isso, comentários, aprovações e CI remoto não puderam ser consultados. Os resultados aqui são de execução local, não uma aprovação remota da PR.

Correções feitas sobre o código revisado nesta branch:

- O scaffold acessava `localStorage` diretamente no primeiro render, podendo derrubar a página em navegadores com armazenamento bloqueado. Agora a navegação permanece funcional, os favoritos continuam em memória e falhas ao salvar têm mensagem clara. Há regressão automatizada desse caso.
- O aviso de bundle maior que 500 KiB foi corrigido com divisão por página e grupos de dependências (mapa, Supabase e demais vendors). O mapa é carregado sob demanda.
- O esquema anterior não oferecia dados públicos seguros para selos/pins de assinatura nem patrocinadores dos roteiros. A migration aditiva `202610220003_tourist_catalog.sql` fornece RPCs restritas aos campos de exibição, sem expor assinaturas, pagamentos ou donos. Expiração e suspensão são verificadas no servidor; o cliente também respeita `valid_until`, revalida benefícios a cada 30 segundos e oculta selos em erro de consulta.
- Texto ocre sobre azul e alguns textos secundários tinham contraste insuficiente. A paleta foi ajustada; o link de favoritos recebeu nome acessível também quando seu texto visual está oculto no mobile.

## Implementação

- Home responsiva com identidade colonial: azul, terracota, ocre, tipografia serifada, busca, categorias do banco, locais, carrossel de roteiros, proximidade por GPS, agenda do mês e consulta opcional ao clima real da cidade via Open-Meteo. A ilustração local `public/heritage.svg` é arte editorial, não foto ou dado de um estabelecimento.
- Catálogo com busca por nome/descrição/endereço insensível a acentos, categoria, aberto agora e distância. Filtros na URL, ordenação por benefícios confirmados e nome, paginação estável das consultas ao PostgREST (200 registros por página).
- Leaflet + OpenStreetMap, clusters, pins de destaque condicionados a benefício ativo, GPS solicitado pelo usuário, popup seguro, atribuição e aviso se os tiles falharem. A lista permanece utilizável sem mapa/coordenadas. Sem cache de tiles ou downloads em massa.
- Detalhes de locais: galeria de fotos do Storage, descrição traduzida quando cadastrada, endereço, horários e atualização, preço informado, contato/WhatsApp/Instagram/site, Google Maps/Waze, compartilhar, favoritar, locais próximos, cupons publicados e avaliações aprovadas. Não há preço ou horário inventado. Status aberto/fechado usa `America/Sao_Paulo` e só é afirmado com horários verificados nos últimos 30 dias; sem isso, é desconhecido. Atualiza a cada 30 segundos.
- Roteiros publicados com detalhes, duração, paradas ordenadas, mapa esquemático (não navegação viária), patrocinadores públicos confirmados e salvamento das paradas na viagem. O campo editorial `routes.weather` permite recomendações `rain`/`dry`; na ausência de classificação, não inventamos recomendação.
- Minha viagem: favoritos locais, dias 1–30, reordenação por arrastar e soltar e botões de teclado, remoção, persistência e links compartilháveis com importação explícita. Somente UUIDs/dias no link; validação de limite, formato e duplicatas. IDs/organização persistem offline, mas o catálogo ainda precisa de conexão (cache offline completo é Etapa 7).
- Eventos: calendário mensal navegável, filtro por dia, cartões e detalhe, com datas no fuso de São Paulo. Dicas: busca, categoria e direções quando há coordenadas.
- Interface PT/EN/ES com detecção e escolha persistida. Traduções de lugares/roteiros/eventos são lidas das respectivas tabelas; sem tradução editorial, há fallback ao português, informado ao visitante. Dicas/categorias não possuem tabela de tradução na Etapa 1; categorias padrão e tipos de dicas têm labels traduzidos na interface. Tradução automática fica na Etapa 6.
- React Router, TanStack Query, Tailwind, componentes com a base shadcn/ui existente. Layouts com estados reais de carregamento/erro/vazio, retry, navegação móvel, skip link, foco visível e preferência por movimento reduzido.

## Consultas e segurança

`src/data/api.ts` usa um cliente Supabase **anônimo separado**, sem persistência/recuperação de sessão, para que uma sessão futura de anunciante/admin não faça o catálogo público mostrar rascunhos. As consultas de conteúdo exigem `status=published` e `is_demo=false`; categorias exigem publicação. A RLS continua sendo a autoridade de acesso. Não existe fallback para seed, array de destinos, datas, avaliações ou preços fictícios em produção.

Os payloads retornados são validados com Zod; projeções explícitas evitam carregar dados administrativos. Os erros da interface não incluem URLs privadas, credenciais ou mensagens brutas do banco. URLs de saída são HTTPS, telefones são normalizados e popup do Leaflet usa `textContent`, sem interpolação HTML de dados. Nenhum rastreamento/analytics foi habilitado. Favoritos/idioma ficam no navegador. GPS não é gravado no banco; o provedor de mapas recebe requisições de tiles da região exibida. Open-Meteo é consultado somente por ação do usuário para coordenadas fixas da cidade.

## Configuração do Supabase Cloud

1. Em um projeto de **homologação**, aplicar o histórico de migrations, incluindo `202610220003_tourist_catalog.sql`. Essa migration adiciona `routes.weather` e as RPCs `public_place_benefits()` e `public_route_sponsors(uuid)`.
2. Configurar `VITE_SUPABASE_URL=https://<PROJECT_REF>.supabase.co` e `VITE_SUPABASE_ANON_KEY=<anon-ou-publishable>` nas variáveis do ambiente de desenvolvimento ou em `.env.local` (ignorado pelo Git). Reiniciar o Vite após mudanças. Ambas são configurações públicas do frontend; **nunca** usar `service_role`, senha de banco, Asaas ou Anthropic no Vite.
3. Se a rede for restrita, permitir o domínio exato `<PROJECT_REF>.supabase.co` (REST/RPC/Storage), `api.open-meteo.com` e `tile.openstreetmap.org`. Não é necessário habilitar todos os destinos.
4. Cadastrar e revisar dados reais no backend: categorias publicadas, conteúdo `published` e `is_demo=false`, coordenadas/horários verificados e arquivos de mídia autorizados. Não publicar o seed de demonstração nem simplesmente remover seu marcador para simular dados reais. Locais comerciais dependem de anunciante aprovado; eventos publicados reais exigem `verified_at`.
5. Inserir traduções editoriais nas tabelas correspondentes. Assinaturas/benefícios e patrocínios somente após confirmação administrativa/backend legítima. Não simular pagamento para obter selo.
6. Validar no navegador: rede sem erros em `/rest/v1`, imagens em `/storage/v1/object/public`, lista vazia quando não houver dados publicados e nenhum acesso a tabelas administrativas. Conferir filtros, idiomas, GPS autorizado/negado e Storage público conforme `BANCO.md`.

Nenhuma variável Supabase estava disponível no processo ou em arquivo local privado nesta execução. Não foi solicitada nem inventada credencial de produção. Sem Cloud configurado, a interface mostra conteúdo indisponível com opção de tentar novamente; favoritos locais continuam utilizáveis.

## Testes e limites

Os resultados finais estão em `docs/REVISAO.md`. Testes unitários validam horários/fuso, links seguros, coordenadas, busca, traduções, links de viagem e ausência de Cloud/storage. Playwright executa Chromium real com respostas HTTP **sintéticas de teste**, incluindo asserts dos filtros enviados ao Supabase, busca/detalhes, favoritos persistentes, mudança de idioma/mobile, clusters, falha de tiles, calendário, importação, compartilhamento, ordenação e GPS, além de WCAG automatizado da Home desktop/mobile. Fixtures vivem exclusivamente em `tests/e2e` e não são importadas pela aplicação.

A suíte PostgreSQL real aplica as três migrations e inclui benefícios pendentes/ativos/expirados, patrocinador não confirmado/suspenso e negação de leitura de assinatura bruta. Auth/Storage dessa suíte usam contratos mínimos simulados, como documentado na Etapa 1. Supabase Cloud, pilha completa Auth/Storage HTTP, provisionamento comercial e integrações externas não foram homologados nesta execução. A restrição de disco da Etapa 1 continua registrada; não baixamos novamente a imagem que excedeu o ambiente.

QR seguro, rastreamento, submissão/moderação de avaliações e resgate de cupons ficam na Etapa 3; esta entrega só lê avaliações/cupons já publicados. IA, tradução automática, cobrança e cron continuam nas etapas seguintes. Não há medição Lighthouse nem promessa de cache offline completo de conteúdo/mapas.
