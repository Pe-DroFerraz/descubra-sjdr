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
