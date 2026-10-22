# Decisões técnicas
- Frontend Vite/React SPA com deploy Vercel e rewrite para React Router.
- Backend Supabase Cloud, com credenciais privadas restritas a Edge Functions.
- Na Etapa 0, renderizar tela demonstrativa sem consultar dados inexistentes; todos os módulos inacabados são explicitamente identificados.
- PWA possui manifest e service worker básico; offline de mapas e roteiros virá na Etapa 7 após regras de cache e uso dos provedores.
- Não incluir identidades reais de estabelecimentos sem verificação de detalhes operacionais.

## Etapas 0 e 1 — implementação em branch de trabalho
- Branch `work/etapas-0-1`, baseada em `main` atualizado. Sem mudanças em produção.
- Etapa 0: lockfile npm para instalação reprodutível; Node 22.12+; tipos Vite, ESLint flat config, testes Vitest e base shadcn/ui (Button real usado no aviso de privacidade). Aliases Vite/TS alinhados. Configuração pública validada com Zod, sem exigir credenciais para o scaffold.
- Etapa 1: 29 tabelas em PostgreSQL, UUIDs, índices de FKs e latitude/longitude (sem exigir PostGIS), RLS por publicação/propriedade/admin; política conservadora de edição em rascunho para não contornar moderação. Aprovação de anunciante exclusivamente administrativa.
- Helpers de segurança em schema `private` fora da API; `has_role()` com `search_path` vazio, sem recursão. Papéis nunca derivados de metadados editáveis. Dados de cobrança não podem ser forjados pelo anunciante.
- Telemetria sem IP bruto e sem leitura de eventos por anunciante; RPC diária agregada. Resgates com bloqueio de linha e idempotência, exclusivamente backend. Rate limiting/antiabuso e consentimento serão exigidos nas Edge Functions, não simulados pelo SQL.
- Seed inteiramente demonstrativo e não publicado, sem identidades/senhas, preservando alterações na reexecução. Preços e features ficam no banco.
- Buckets de fotos/eventos públicos conforme especificação: URL conhecida dá acesso ao arquivo. Somente metadados/listagem seguem publicação. QR privado, SVG restrito a admin/backend.
- Testes isolados usam PostgreSQL 17 em Docker com fixtures mínimos de Auth/Storage. Não substituem teste end-to-end da pilha Supabase.
