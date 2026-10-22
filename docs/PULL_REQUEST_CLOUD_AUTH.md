## Problema e resultado

O frontend turístico precisava de autenticação segura e de um caminho auditável para homologar o Supabase Cloud existente. Esta entrega adiciona login por senha/magic link PKCE, recuperação e troca de senha, sessão verificada no servidor, logout e papéis obtidos do banco. O catálogo continua usando um cliente anônimo separado após login; não há criação automática de contas/admins ou conteúdo de produção fictício.

Base desta PR: `work/etapa-2-turista`. Revisão incremental em rascunho, sem merge ou deploy de produção.

## Segurança e banco

- Registrada a auditoria externa real em `docs/RELATORIO_SUPABASE_CODEX.md`: PostgreSQL 17, 29 tabelas com RLS, buckets, negações para anon e nove alertas de executabilidade de funções SECURITY DEFINER.
- Preservadas as três migrations originais. Mapeados os timestamps remotos `20261022141818`, `20261022141828` e `20261022141835`, sem replay/repair/reset/seed remoto. Equivalência completa de definições ainda depende de leitura autorizada.
- Preparada e testada **somente localmente** a migration `20261022150000_security_hardening.sql`: search_path, ACLs explícitas e schemas confiáveis, preservando RPCs/RLS legítimas. `rls_auto_enable()` permanece intacta: postgres/event_trigger/search_path pg_catalog confirmados externamente, corpo/ACL/dependências pendentes. Não aplicar remotamente antes da reconciliação e revisão dos efeitos.
- Validação de chave pública/URL, callbacks restritos, respostas de e-mail sem enumeração, identidade validada por `getUser`, storage de sessão sem restauração de token antigo após logout entre abas e headers CSP/referrer preparados para prévia.
- Scripts opt-in de integração HTTP somente leitura, Advisor oficial e comparação de metadados; nenhum token/arquivo privado incluído no Git.

## Validação

| Comando/verificação | Resultado |
| --- | --- |
| `npm run build` | Passou |
| `npm run lint` | Passou |
| `npm test` | 75 testes passaram |
| `npm run test:db` | Passou em PostgreSQL 17 isolado: quatro migrations locais, seed repetível, RLS, Storage SQL, ACL, permissões legítimas e resgate concorrente |
| `npm run test:e2e` | Dez cenários passaram em Chromium: Auth/PKCE/recuperação/idiomas, catálogo, mapa, filtros, favoritos, roteiros, eventos, estados e acessibilidade automática |
| Comparação hardening local × baseline local | Zero achados; helper de plataforma ausente da fixture continua em revisão |
| PRs #1 e #2 | Abertas, CI validate com sucesso, sem comentários/revisões registrados; nenhum merge |
| Cloud com proxy nativo Node 24 | 23 verificações HTTP somente leitura passaram, zero falhas; negação da RPC de métricas para anon confirmada separadamente (401/42501) |
| `npm run cloud:advisors` | Bloqueado, exit 2: binding Management API ausente; auditoria externa preservada sem alegar reexecução |

## Limitações e revisão necessária

As duas variáveis públicas agora estão ativas e o gateway real aceitou a chave autorizada. O Node exigiu proxy nativo neste ambiente: `node --use-env-proxy --env-file-if-exists=.env.local scripts/cloud-smoke.mjs`. A tentativa anterior sem proxy retornou exit 2 por DNS; HTTPS pelo proxy funciona. Anunciante/admin reais ficaram `not_run`, sem sessões autorizadas. Auth por e-mail/contas reais, Storage HTTP, SMTP/redirects/CAPTCHA/MFA e corpos/ACLs/dependências remotos ainda precisam de homologação. A leitura pública de Auth confirmou e-mail habilitado, signup habilitado e autoconfirmação desabilitada; revisar signup para a fase restrita a contas existentes. Nenhuma configuração remota foi alterada.

Os avisos SECURITY DEFINER não foram eliminados cegamente: execução de `has_role` e RPCs públicas é legítima. A ausência de CREATE para anon/authenticated já foi confirmada externamente. A migration adicional não foi aplicada remotamente e não substitui revisão dos avisos.

O código b8e45a9 teve os dois jobs Validate aprovados; o complemento posterior preserva aplicação/migrations e altera apenas documentação/ignore, sem repetir manualmente os testes aprovados. Para a primeira prévia Vercel, seguir `docs/VERCEL_PREVIEW.md`: variáveis com escopo Preview, branch/versão da PR #3, callbacks exatos incluindo as variantes next e revisão de e-mail/segurança/headers. Não há vínculo/acesso Vercel ou URL Preview criada nesta sessão. Nenhum deploy, pagamento real ou alteração de Auth Cloud ocorreu nesta entrega. Não publicar o seed para preencher o catálogo vazio.
