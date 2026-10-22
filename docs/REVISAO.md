# Entrega atual — referências oficiais externas e publicação editorial

Branch `work/fontes-oficiais-editorial`, criada após atualizar e confirmar `work/gestao-conteudo-turistico` no commit `d325646f70d57b278bbeae2d330da0b95f8e7ba0`. A base do módulo permanece descendente de `work/cloud-auth-homologacao`; não iniciamos da main. As entregas anteriores abaixo são históricas.

O painel mantém CRUD/galeria/paradas com Auth e papel admin no backend. Esta atualização persiste URLs de fontes/campos pendentes nos cinco formulários e na proposta SQL, bloqueia publicação incompleta e mostra a dependência de migration quando faltam as colunas no Cloud. Rótulos explícitos corrigem a localização/associação de seletores e a reedição de textareas preenchidas.

| Verificação desta atualização | Resultado |
| --- | --- |
| `npm run build` | Passou — TypeScript, Vite, PWA; sem warning de tamanho de chunk |
| `npm run lint` | Passou |
| `npm test` | 106 testes passaram, 15 arquivos |
| `npm run test:db` | Passou — PostgreSQL 17 descartável sem rede, seis migrations locais, 29 tabelas com RLS, seed repetível, políticas/Storage SQL, resgate concorrente, CRUD/RPC e publicação editorial |
| Preflight editorial somente leitura | Executado no schema original da fixture; compatível sem as novas colunas. **Não executado no Cloud** |
| Proposta importada apenas na fixture | 28 locais draft e seis roteiros; fontes/pendências persistidas; importação repetida preserva edições/paradas removidas e não vaza drafts para anon |
| `npm run test:e2e` | Passou — 25 cenários em Chromium; CRUD, mídia, paradas, publicação, ausência de migration, idiomas, estados e acesso |
| axe e responsividade | Home desktop/mobile e painel mobile nas regras WCAG automatizadas da suíte; não equivale a auditoria manual completa |
| `npm run catalog:check` | Passou — 28 candidatos: um endereço confirmado externamente, 14 provisórios e 13 ausentes; seis roteiros draft |
| HTTP Supabase Cloud real, leitura via proxy | 23 verificações anônimas passaram; projeções públicas, limites privados observados, has_role(admin)=false e Auth settings. Nenhuma chave impressa |
| HTTP autenticado admin/anunciante | Dois cenários `not_run`: sessões de usuários existentes autorizados não fornecidas |
| Migrations/dados/imagens remotos | Nenhuma aplicação/importação/mutação/upload executada; nenhum usuário criado ou e-mail enviado |

Os cinco links oficiais e o conteúdo informado pelo usuário são evidência de outra sessão. Não houve acesso direto aos portais nesta atualização nem reinterpretação do bloqueio anterior como consulta bem-sucedida. Dez identidades estão referenciadas externamente. Endereço do Museu Regional registrado exatamente como fornecido; horários divergentes seguem pendentes e `place_hours` não é preenchido. Complexo Ferroviário/Maria Fumaça ainda precisam de página/trecho específico no conjunto de fontes fornecido. Componentes ferroviários exigem revisão de agrupamento. Os demais candidatos preservam evidência secundária/histórica, sem afirmar operação atual.

Segurança preparada: `20261022180000_editorial_provenance.sql` adiciona somente duas colunas às cinco tabelas; triggers SECURITY INVOKER com search_path vazio validam HTTPS/limites, pendências, descrição/endereço e paradas publicadas. Não há SECURITY DEFINER nova, nova tabela, mudança de RLS/grants, alteração das três migrations originais ou de `rls_auto_enable()`. Testes SQL confirmam negação de publicação incompleta, credenciais em URLs, arrays inválidos, roteiro vazio, retirada de local referenciado e exclusão direta da última parada; rollback preserva o estado anterior. URLs e nomes de campos são potencialmente públicos, nunca notas privadas.

**Limitações e aprovações:** a nova migration foi aplicada somente na fixture. Esta versão da gestão depende das novas colunas e da RPC adicional para paradas. Reconciliar versões/definições remotas antes de revisar/aprovar cada migration adicional; registros publicados legados sem fontes exigirão revisão para futuras edições. O preflight mostra contagens de impacto, não verifica fatos. Não executar db push, repair/reset/seed ou propostas de importação automaticamente. Aprovar separadamente rascunhos e posterior publicação individual; completar endereço/descrição/visitação, roteiros e estabelecimentos gastronômicos, além de direitos de fotografias. Não existe conteúdo operacional inventado para preencher essas lacunas.

Auth/Storage HTTP com admin/anunciante reais, callbacks/MFA, definições/grants efetivos e Security Advisor ainda dependem de acesso/homologação privilegiados autorizados. As 23 leituras anônimas não comprovam essas permissões. Testes de navegador interceptam HTTP de fixtures; PostgreSQL usa contratos mínimos de Auth/Storage, sem substituir o Cloud.

A primeira execução E2E localizou problemas de associação dos campos após preenchimento. Os rótulos foram corrigidos e a suíte final consta acima. Uma tentativa auxiliar de formatação usou cache npm fora do workspace e falhou com ENOENT; repetir com cache em `/tmp` resolveu sem alterar dependências do projeto. Permanecem os avisos não impeditivos herdados de migração futura do React Router nos testes e NO_COLOR/FORCE_COLOR no Playwright.

Documentação: [CATALOGO_EDITORIAL.md](CATALOGO_EDITORIAL.md), [GESTAO_CONTEUDO.md](GESTAO_CONTEUDO.md), `content/referencias-oficiais-externas.json`. Sem merge automático, publicação de dados turísticos ou deploy de produção.

---

# Entrega atual — gestão editorial e catálogo inicial

Branch `work/gestao-conteudo-turistico`, baseada na versão atualizada `3d14509` de `work/cloud-auth-homologacao`. Funcionalidades, configuração e aprovações em [GESTAO_CONTEUDO.md](GESTAO_CONTEUDO.md). Pesquisa e pendências em [CATALOGO_EDITORIAL.md](CATALOGO_EDITORIAL.md).

| Verificação desta entrega | Resultado |
| --- | --- |
| `npm run build` | Passou — TypeScript, Vite, PWA; chunks abaixo do limite de warning |
| `npm run lint` | Passou |
| `npm test` | 100 testes passaram, 15 arquivos |
| `npm run test:db` | Passou — cinco migrations locais, seed demonstrativo repetível, políticas anteriores, CRUD administrativo, negação a anon/outros usuários, Storage SQL, resgate concorrente, RPC de paradas atômica/rollback/conflito |
| Proposta de catálogo no banco descartável | Importada repetidamente após limpar apenas fixtures locais; nenhum overwrite editorial ou restauração de paradas removidas; candidatos em draft invisíveis a anon |
| `npm run test:e2e` | 23 cenários passaram em Chromium com HTTP de fixtures locais |
| axe — Home desktop/mobile e gestão mobile | Zero violações nas regras WCAG 2/2.1 A/AA executadas; contraste do novo endereço corrigido; não é auditoria manual completa |
| Responsividade | Sem overflow horizontal nos cenários mobile; capturas da Home e painel inspecionadas |
| `npm run catalog:check` | 24 candidatos, 15 endereços provisórios e nove ausentes, seis roteiros; validação sem conexão ao banco |
| Migrations/dados/imagens remotos | Nenhuma alteração/aplicação/importação/upload executado |

Cobertura nova: verificação real de usuário/papel pelo cliente antes de operações e RLS no PostgreSQL, rejeição de metadados com falso admin, papel revogado durante edição, comparação de updated_at, datas locais sem perda de precisão de campos inalterados, schemas/referências editoriais, direitos/MIME/tamanho de imagens e compensação de upload. E2E cobre CRUD das cinco entidades, galeria, imagem de evento (troca/limpeza), paradas, confirmação editorial e distinção vazio/filtro/erro. O teste SQL verifica rollback mesmo se uma falha ocorrer após DELETE das paradas.

Limites: fontes primárias bloquearam acesso por proxy403/DNS; espelhos acadêmicos/MuseusBr/Wikipédia são secundários e históricos. Vinte endereços completos e atuais ainda não estão homologados. Todos os 24 candidatos e seis roteiros ficam em rascunho, sem verified_at, coordenadas, preços ou operação inventada; o gastronômico exige seleção de estabelecimentos. Não há imagens licenciadas fornecidas para o catálogo.

A nova migration 20261022170000_admin_route_stops.sql só foi aplicada no PostgreSQL descartável; a gravação de paradas no Cloud depende de revisão e aplicação autorizada. Originais e hardening anterior não alterados nem reaplicados. Auth/Storage HTTP reais com conta administrativa, MFA/callback e políticas/definições efetivas ainda exigem homologação; fixtures não comprovam isso. O usuário informou Preview já existente; nenhum deploy de produção ou mudança remota ocorreu nesta tarefa.

---

# Atualização — leituras Cloud e preparo de Preview

Base confirmada e sincronizada antes das alterações: `work/cloud-auth-homologacao`, commit `b8e45a93ca706cbb2eca96f39ee02dfb22145c39`. Ambos os jobs Validate da [PR #3](https://github.com/Pe-DroFerraz/descubra-sjdr/pull/3) concluíram SUCCESS. Não repetimos build/lint/75 testes unitários/banco/dez E2E já aprovados; esta atualização preserva código/configuração da aplicação e migrations, alterando documentação e ignore de `.vercel/`.

| Verificação atual — 22/10/2026 | Resultado |
| --- | --- |
| Variáveis públicas no processo | URL e chave presentes; valores não impressos; configuração aceita pelo gateway |
| `npm run test:cloud` sem proxy nativo | Exit 2: `BLOCKED: Supabase gateway unreachable. No remote assertions executed.` |
| DNS direto / HTTPS com proxy, sem chave | DNS: `[Errno -3] Temporary failure in name resolution`; proxy: HTTP 401 esperado sem chave |
| Runner com `node --use-env-proxy --env-file-if-exists=.env.local scripts/cloud-smoke.mjs` | **23 verificações passaram, zero falhas** |
| Catálogo e RPCs públicas | Leitura de projeções/publicação, benefícios, patrocinadores e `has_role(admin)=false` passou |
| Fronteiras privadas para anon | Leituras HEAD/count retornaram zero registros nos cenários da suíte; não comprovam isolamento de usuários reais ou equivalência de grants |
| `place_daily_metrics` como anon — leitura adicional | Negado: HTTP 401, SQLSTATE 42501 |
| Configurações públicas de Auth | E-mail habilitado, signup habilitado, autoconfirmação desabilitada; CAPTCHA não informado |
| Anunciante/admin reais | Dois cenários `not_run`, sem sessões autorizadas existentes |
| Supabase Advisor / definições privilegiadas | Pendente: binding Management API/conector ausente; sem repetição do comando bloqueado |
| Vercel | Sem token, projeto vinculado, deployment ou URL Preview nesta sessão |

Configuração detalhada em [VERCEL_PREVIEW.md](VERCEL_PREVIEW.md): escopo Preview das variáveis, origem e callbacks com `next`, templates ConfirmationURL, PKCE no mesmo navegador/origem, SMTP/CAPTCHA/MFA e teste posterior do deployment. Signup habilitado é pendência real de configuração para a fase de contas existentes; `shouldCreateUser:false` protege o fluxo do aplicativo, não desativa signup direto na API.

Nenhuma migration remota aplicada: originais preservadas, adicional pendente de reconciliação/revisão. Sem alteração de Auth remoto, publicação de conteúdo fictício, envio de e-mails, merge ou deploy de produção. Resultados anteriores abaixo são registros históricos.

---

# Histórico — conexão Cloud, Auth e hardening

Branch `work/cloud-auth-homologacao`, baseada em `work/etapa-2-turista`. Ver [CLOUD_HOMOLOGACAO.md](CLOUD_HOMOLOGACAO.md) para contexto, configuração segura, histórico e plano de revisão.

- Implementados login/sessão verificada, senha, magic link PKCE, recuperação/troca, logout e consulta segura de papéis; catálogo permanece anônimo.
- Migration adicional `20261022150000_security_hardening.sql` preparada/testada somente no banco local. As três migrations originais permanecem intactas e **não foram reaplicadas no Cloud**. Não aplicar a adicional remotamente antes da reconciliação/revisão.
- Auditoria SQL READ ONLY e comparador de histórico/estrutura/funções/buckets preparados. Mapeamento dos três timestamps remotos registrado, com testes contra duplicação/colisão; equivalência das definições ainda pendente. `rls_auto_enable()` preservada conforme revisão externa.
- PRs #1 e #2 consultadas nesta sessão: ambas abertas, CI `validate` com sucesso e sem comentários/revisões registrados; nenhum merge realizado.
- URL pública configurada; chave pública/conectividade autorizada ainda faltam nesta sessão. Scripts de integração Cloud e Security Advisor oficial retornaram bloqueio (exit 2), não aprovação.
- [RELATORIO_SUPABASE_CODEX.md](RELATORIO_SUPABASE_CODEX.md) registra os resultados reais fornecidos pelo usuário: 29 tabelas/RLS, buckets, histórico, negações para anon, ausência de CREATE e alertas do Advisor. Fonte externa autorizada, sem reexecução nesta sessão; não equivale a homologação HTTP completa.

| Verificação desta entrega | Resultado |
| --- | --- |
| `npm run build` | Passou: TypeScript, Vite e PWA |
| `npm run lint` | Passou |
| `npm test` | 75 passaram; inclui Auth, storage de sessão, tradução e histórico |
| `npm run test:db` | Passou: PostgreSQL 17 isolado, quatro migrations locais, seed repetível, RLS/grants, concorrência |
| `npm run test:e2e` | Dez cenários passaram em Chromium; HTTP sintético exclusivo de teste |
| Comparação baseline local × hardening local | Zero achados; revisão de `rls_auto_enable` pendente, pois não existe na fixture |
| `npm run test:cloud` | Exit 2: chave pública não injetada neste runtime; nenhuma asserção HTTP remota |
| `npm run cloud:advisors` | Exit 2: binding Management API ausente; resultados externos do Advisor preservados no relatório |
| Migrações/seed remotos | Nenhum comando de aplicação/repair/reset/seed executado |

Cenários de Auth cobrem verificação no servidor, metadados sem autoridade, negação por sessão inválida, logout, resposta genérica de e-mail, PKCE deduplicado, recuperação legítima, rejeição de recuperação forjada e de redirect externo, tradução e catálogo anônimo após login. Storage de sessão testa que logout em outra aba não restaura um token antigo do fallback. Corrigido o atributo de prioridade da imagem para compatibilidade com React 18. Asserções de banco confirmam que grants legítimos e triggers continuam funcionando após hardening local.

Limites: Auth/Storage HTTP reais e papéis de contas reais ainda não homologados, Advisor sem reexecução, histórico sem comparação completa das definições, CSP preparada mas não observada em CDN, SMTP/CAPTCHA/MFA remotos pendentes. Nenhum dado fictício foi publicado. Os registros das etapas anteriores abaixo são históricos.

---

# Entrega atual para revisão — Etapa 2

Branch `work/etapa-2-turista`, partindo do HEAD da PR #1. Relatório completo, revisão de código e configuração Cloud: [ETAPA2.md](ETAPA2.md).

| Verificação local | Resultado |
| --- | --- |
| Revisão inicial do HEAD da PR #1 | Build, lint, 16 testes herdados e suíte PostgreSQL passaram |
| `npm run build` após Etapa 2 | Passou, com divisão por página/vendor e sem warning de chunk >500 KiB |
| `npm run lint` | Passou |
| `npm test` | 40 passaram, nenhum ignorado |
| `npm run test:db` | Passou: três migrations, seed reexecutado, políticas herdadas, concorrência e novas RPCs públicas |
| `npm run test:e2e` | Seis cenários passaram em Chromium real; fixtures HTTP exclusivamente de teste |
| axe WCAG 2 A/AA e 2.1 AA — Home desktop/mobile | Nenhuma violação nas regras executadas; não equivale a auditoria manual completa |
| Responsividade | Home e navegação mobile verificadas sem overflow horizontal; capturas inspecionadas |
| Supabase Cloud | Não homologado: URL/chave pública ainda não configuradas neste ambiente |
| Comentários e CI remoto da PR #1 | Não consultados: API GitHub retornou `Forbidden` |

O frontend consulta dados reais publicados no Supabase, sem fallback fictício de produção. As credenciais públicas e o cadastro editorial real ainda precisam ser configurados conforme `ETAPA2.md`. Os testes HTTP de navegador usam fixtures sintéticas e não comprovam conexão ao Cloud. Testes PostgreSQL usam Auth/Storage mínimos simulados; a limitação de disco para a pilha Supabase completa continua registrada abaixo. Sem merge automático, deploy Vercel ou alteração de banco remoto.

QR, tracking, inserção de avaliações e resgate de cupons são Etapa 3. Tradução automática, IA, cobranças, cron, cache offline completo e SEO avançado permanecem nas fases correspondentes. Não houve medição Lighthouse.

---

# Histórico de revisão — Etapas 0 e 1

Branch local: `work/etapas-0-1`, baseada no commit `ebd500eb38a70301889a9597b5b2d30fc373e09d` de `main`. Sem push/deploy ou alteração de banco remoto.

## Etapa 0 concluída

- Dependências instaladas e lockfile versionado; Node 22.12+, validado com Node 24.19.0 / npm 11.9.0.
- Corrigido erro TypeScript de `import.meta.env`; impedida geração de config JS concorrente com `vite.config.ts`.
- ESLint configurado, 16 testes Vitest, CI para lint/test/build/banco e base shadcn/ui com Button usado no scaffold.
- Configuração pública validada sem expor valores nos erros. Backend opcional no scaffold; nenhuma chave privada necessária ou incluída.
- CLI oficial Supabase fixada em 2.108.0, com helper para binário Go oficial e mirror Docker Hub. `npm run supabase -- --version` validado. Inicialização completa tem a limitação abaixo.

## Etapa 1 implementada

- `supabase/migrations/202610220001_core.sql`: 29 tabelas da especificação, chaves, constraints, índices, triggers, RLS e helpers sem recursão. RPC de analytics diário e resgate backend com lock/idempotência.
- `supabase/migrations/202610220002_storage.sql`: buckets, limites de arquivos e políticas por propriedade/admin; validação do caminho antigo e novo no UPDATE.
- `supabase/seed.sql`: 25 locais, seis roteiros/paradas, oito eventos, dez dicas, três planos e cinco anunciantes fictícios. Conteúdo não verificado permanece em rascunho, sinalizado DEMONSTRAÇÃO. Nenhuma identidade/senha criada.
- `supabase/config.toml`: configuração local; `supabase/tests/` e `scripts/test-db.sh`: testes reproduzíveis em banco descartável.
- `docs/BANCO.md`: modelo de autorização, comandos, criação segura de admin de teste, limitações dos buckets públicos e instruções para homologação.

## Resultados executados

| Verificação | Resultado |
| --- | --- |
| Instalação npm / instalação congelada com `npm ci` | Passou |
| `npm run build` (TypeScript + Vite + PWA) | Passou |
| `npm run lint` | Passou |
| `npm test` | 16 passaram, nenhum ignorado |
| `npm run test:db` | Passou em PostgreSQL 17 real, com contratos mínimos simulados de Auth/Storage |
| Aplicação das duas migrations e seed duas vezes | Passou, cardinalidades preservadas |
| RLS/roles/propriedade/publicação/cobrança/analytics/Storage | Passou nos cenários da suíte SQL |
| Resgate: limite, idempotência, acesso e duas conexões simultâneas | Passou; exatamente um resgate no último uso |
| HTTP do servidor de desenvolvimento | Home e módulos TSX servidos com sucesso |
| HTTP do build via preview | Home, fallback SPA, asset JS, manifest e service worker verificados |
| Pilha Supabase completa (Auth/Storage HTTP/PostgREST) | Não validada: download/extração das imagens bloqueado por recursos do ambiente |

## Limites e próximos passos

A primeira tentativa da pilha local falhou por acesso negado a `public.ecr.aws`; o mirror oficial Docker Hub permitiu os downloads, mas a extração da imagem PostgreSQL Supabase falhou com `no space left on device` no disco de 32 GiB. Os processos de inicialização foram encerrados. Não houve alteração de checksums, desativação de TLS ou instalação de imagem não verificada. O banco PostgreSQL oficial menor usado na suíte isolada executou normalmente. Para validar a pilha completa, usar ambiente com espaço suficiente e repetir `npm run supabase -- start` / reset local e a suíte SQL, depois testes HTTP de Auth/Storage. O teste isolado não substitui essa homologação.

O build emite aviso de chunk JS maior que 500 KiB; divisão por módulos pode ser feita com a implementação do frontend turista. Não há medição Lighthouse ou teste de instalação/offline PWA em navegador nesta entrega. Vitest verifica renderização do scaffold no servidor, não interações completas em navegador.

Home e rotas seguem demonstrativas. Frontend turista, endpoints de moderação/tracking, antiabuso, uploads do painel, cobrança, IA, cron e integrações permanecem nas etapas seguintes, conforme a especificação. O banco não torna essas funcionalidades prontas. Não usar `service_role` em clientes nem publicar o seed em produção.
