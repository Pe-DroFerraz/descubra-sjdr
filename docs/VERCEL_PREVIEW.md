# Primeira prévia Vercel — versão da PR #3

## Versão e estado verificado

- Repositório: `Pe-DroFerraz/descubra-sjdr`.
- Branch de origem: `work/cloud-auth-homologacao`.
- Código da aplicação aprovado: `b8e45a93ca706cbb2eca96f39ee02dfb22145c39`, [PR #3](https://github.com/Pe-DroFerraz/descubra-sjdr/pull/3), ainda em rascunho.
- Ambos os jobs `Validate` desse commit passaram no GitHub Actions. Não repetimos build, lint, Vitest, PostgreSQL ou Chromium já aprovados. Este complemento altera somente documentação e o ignore da configuração local Vercel; o frontend e as migrations continuam os da PR #3.
- Em 22/10/2026, as duas variáveis públicas estavam disponíveis no processo, com configuração aceita e chave aceita pelo gateway remoto. Nenhum valor da chave foi impresso ou versionado. O `.env.local` ignorado ainda tem chave vazia; as variáveis injetadas têm precedência.
- Supabase Cloud: **23 verificações HTTP de leitura passaram, nenhuma falhou**, mais uma consulta de negação da RPC privada de métricas. As duas verificações de usuários anunciante/admin ficaram `not_run`, por falta de sessões autorizadas existentes.
- Não há conector/CLI autenticada Vercel, token, IDs de projeto/equipe nem vínculo `.vercel/project.json` neste ambiente. **Nenhum projeto, variável Vercel, deployment ou URL de Preview foi criado/configurado aqui.** O roteiro abaixo está preparado para a conexão autorizada ao projeto Vercel.

Já podemos preparar uma prévia técnica do frontend turista: Home, catálogo, mapa, detalhes, roteiros, favoritos locais, eventos e dicas, com estados de carregamento/erro/vazio e PT/EN/ES. A interface de Auth está pronta para homologação com contas existentes; não representa liberação dos futuros painéis administrativos/comerciais. Não preencher o catálogo com seed fictício.

## Configuração do projeto Vercel

No projeto Vercel autorizado correspondente ao repositório, conferir:

| Campo | Configuração |
| --- | --- |
| Código | Branch `work/cloud-auth-homologacao`, aplicação do commit `b8e45a9`; complementos de documentação não mudam o aplicativo |
| Framework Preset | Vite |
| Root Directory | Raiz do repositório (`.`); o caminho `/workspace/descubra-sjdr` é apenas deste ambiente |
| Node.js | 24.x, como no CI aprovado |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Configuração de rotas/headers | `vercel.json` versionado; fallback SPA, CSP e referrer policy |
| Ambiente do deployment | **Preview** |

Não selecionar esta branch como Production Branch. Não promover deployment, executar `--prod` ou clicar em um fluxo inicial de importação que publique Production automaticamente. Se o projeto ainda não existir, provisionar/vincular primeiro sem deployment de produção; depois criar explicitamente um deployment Preview. CLI autenticada `vercel deploy` sem `--prod` usa Preview; não executar nesta sessão sem vínculo/autorização Vercel disponível. Não executar migrations ou seed como parte de install/build/deploy.

Nas Environment Variables do projeto, cadastrar somente estas variáveis públicas, selecionando **Preview**, preferencialmente com escopo da branch `work/cloud-auth-homologacao`:

| Nome | Origem do valor |
| --- | --- |
| `VITE_SUPABASE_URL` | URL pública do projeto `itegpsgjtuclbsatcdxr`, disponível no ambiente autorizado |
| `VITE_SUPABASE_ANON_KEY` | Chave anon/publishable autorizada do mesmo projeto, já disponível no ambiente desta tarefa |

Não copiar `SUPABASE_ACCESS_TOKEN`, sessões de teste, `service_role`, secret key ou senha para Vercel/Vite. Não imprimir/colar a chave em descrição de PR, comandos com valor literal ou logs. Definir as variáveis **antes** do build; o Vite incorpora `VITE_*` no bundle, e alterações posteriores exigem novo build Preview. Configurar variáveis no ambiente Codex não as transfere automaticamente para a Vercel. `.env.local` e `.vercel/` não são versionados.

Depois de vincular/configurar, gerar o deployment explicitamente Preview dessa branch. Registrar a URL HTTPS retornada e o commit no registro de homologação. Até existir essa URL real, `<origem-preview>` abaixo é um marcador, não um domínio publicado. Uma URL de branch estável pode facilitar a homologação; utilizar sempre a mesma origem ao solicitar e abrir links de Auth.

## Supabase Auth — URLs autorizadas

No painel autorizado do projeto Supabase, abrir **Authentication → URL Configuration**. Esta documentação não altera essas configurações remotamente, e `supabase/config.toml` configura apenas a pilha local.

1. **Site URL:** preservar a URL legítima existente em projeto compartilhado. Se o projeto for exclusivamente de homologação, o responsável pode definir a origem HTTPS da prévia após revisão. Site URL não substitui o cadastro explícito dos callbacks. Não mudar produção automaticamente.
2. **Redirect URLs:** cadastrar somente a origem real e confiável da prévia, com o caminho e as duas variantes de query geradas pelo aplicativo. Preservar entradas legítimas existentes; não autorizar `https://**.vercel.app/**` ou hosts desconhecidos.

Substituir `<origem-preview>` pela origem real, por exemplo uma origem HTTPS retornada pela Vercel, **sem barra final**:

```text
<origem-preview>/auth/confirmar
<origem-preview>/auth/confirmar?next=%2Fconta
<origem-preview>/auth/confirmar?next=%2Ffavoritos
```

Cadastrar explicitamente as duas variantes evita depender de como a allowlist trata a query. O código atual sempre gera `next` por `URLSearchParams`; não cadastrar apenas a raiz do site ou apenas `/auth/nova-senha`.

| Fluxo | Redirect solicitado ao Supabase | Depois da troca PKCE |
| --- | --- | --- |
| Magic link padrão | `/auth/confirmar?next=%2Fconta` | `/conta` |
| Magic link a partir de favoritos | `/auth/confirmar?next=%2Ffavoritos` | `/favoritos` |
| Recuperação de senha | `/auth/confirmar?next=%2Fconta` | `/auth/nova-senha`, somente com contexto de recuperação do SDK |
| Login por senha | Sem callback de e-mail | Sessão verificada e destino interno permitido |

O callback recebe `code`, remove código/erros/fragmento da URL e chama `exchangeCodeForSession`. `/auth/nova-senha` é uma rota interna após verificação, não um callback público alternativo. Não acrescentar `type=recovery`, tokens implícitos ou `token_hash` manualmente: esses formatos não são o fluxo implementado.

Para desenvolvimento local, se autorizado no Auth Cloud, registrar as mesmas três entradas para **cada origem efetivamente usada** (`http://localhost:5173` ou `http://127.0.0.1:5173`); elas são origens diferentes. Não registrar portas/hosts de fixtures E2E no Cloud. Conferir também a configuração local se testar a pilha local; ela não configura o remoto.

## E-mail, PKCE e contas existentes

- Em **Authentication → Email Templates**, magic link e recuperação precisam usar o link de confirmação emitido pelo Supabase, `{{ .ConfirmationURL }}`, preservando a verificação e o redirect solicitado. Não trocar por um link estático baseado apenas em `SiteURL`. Templates antigos baseados em `TokenHash` exigiriam outro fluxo de frontend e não devem ser misturados com este PKCE.
- Solicitar e abrir o link no **mesmo navegador, perfil e origem** da prévia. O verificador PKCE é armazenado por origem; alternar entre domínio de branch e domínio de deployment, navegador diferente ou dispositivo diferente pode impedir a troca. Storage bloqueado pode impedir PKCE entre recarregamentos.
- Usar somente contas reais de teste já existentes e autorizadas. Não criar admin/senha fixos, contas em massa ou enviar e-mails para terceiros durante este preparo.
- A leitura pública real de Auth confirmou `external.email=true`, `disable_signup=false` e `mailer_autoconfirm=false`. Portanto, **signup público está habilitado no Cloud**, embora o frontend não ofereça cadastro e envie `shouldCreateUser:false`. Para uma fase restrita a contas existentes, revisar/desabilitar novos cadastros no Auth remoto com o responsável; ocultar a interface não bloqueia a API de signup. Nenhuma configuração foi alterada aqui. Habilitar signup não concede papel admin automaticamente; não substituir a revisão de RLS por essa medida.
- `mailer_autoconfirm=false` não comprova entrega de e-mail. Verificar SMTP/remetente, limites, templates, política de senha, rate limit e CAPTCHA. O endpoint público não confirmou a configuração CAPTCHA. Homologar MFA e exigência de AAL2 no servidor antes de liberar painéis administrativos. A interface não inclui integração CAPTCHA nesta versão; se obrigatório no Cloud, os formulários precisam dessa integração antes de funcionar.

## Banco e segurança: pendências preservadas

A prévia não executa migrations. `core`, `storage` e `tourist_catalog` já existem remotamente nas versões registradas em `supabase/audit/remote-history.json`. Não reaplicar/resetar/semear/usar `db push` genérico ou reparar histórico automaticamente.

A migration adicional `20261022150000_security_hardening.sql` permanece proposta, testada apenas localmente na entrega anterior. Antes de qualquer aplicação: comparar corpos/ACLs/policies/estrutura reais usando o relatório READ ONLY, reconciliar as versões e revisar efeitos/grants. As leituras HTTP não substituem essa comparação.

Preservar `rls_auto_enable()` e seus event triggers. Os avisos SECURITY DEFINER exigem inspeção; `has_role` e as RPCs públicas têm execução legítima. A RPC `place_daily_metrics` negou anon nesta sessão (`HTTP 401`, SQLSTATE `42501`). Leituras vazias de tabelas privadas não comprovam isolamento completo com dados populados ou acesso de proprietários reais. Falta acesso de auditoria/Management API para reexecutar Advisor e inspecionar definições/dependências; não confundir com as verificações públicas que passaram.

## Como repetir somente a leitura Cloud quando necessário

Em runtime com rede direta e variáveis autorizadas, usar `npm run test:cloud`. Neste ambiente, DNS direto falhou, mas o proxy autorizado alcançou o projeto. Node 24 suporta proxy nativo:

```sh
node --use-env-proxy --env-file-if-exists=.env.local scripts/cloud-smoke.mjs
```

Esse foi o comando aprovado nesta sessão, com 23 verificações passando. Não requer gravar a chave no arquivo local, pois usa as variáveis já injetadas. Não imprimir `env`, cabeçalhos ou corpos de respostas privadas. Resultado sanitizado em `.audit/cloud-smoke.json` ignorado. Os tokens opcionais de contas de teste são somente para o runner seguro, nunca para Vite/Vercel.

## Homologação após existir a URL Preview

- Conferir que o deployment é Preview, aponta para a branch/versão correta e recebeu as duas variáveis antes do build. Não há publicação de produção ou merge implícito.
- Abrir diretamente `/lugares`, `/mapa`, `/favoritos`, `/entrar` e `/auth/confirmar` para verificar o fallback SPA; conferir assets, manifest e service worker reais, sem receber HTML no lugar de JS/manifest.
- Conferir headers CSP/referrer/nosniff/frame policy e ausência de violações inesperadas que bloqueiem Supabase, Leaflet/OSM ou Open-Meteo. Não relaxar a CSP para resolver mensagens de ferramentas de terceiros sem revisão.
- Verificar catálogo/estados vazios, mapa/atribuição, PT/EN/ES e favoritos locais. O catálogo pode permanecer vazio; não criar conteúdo fictício nem assinaturas.
- Após configurar Auth/SMTP/redirects, homologar login/logout, magic link e recuperação com conta existente autorizada; verificar código removido da URL e recusa de redirect externo. Esses fluxos e Storage HTTP ainda não foram homologados remotamente.
- Registrar URL/commit/resultados/pendências para revisão. Manter PRs #1, #2 e #3 sem merge automático, hardening não aplicado e pagamentos/produção sem publicação.
