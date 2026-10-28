# Descubra SJDR

PWA turística com frontend público conectado ao Supabase: Home, mapa Leaflet, catálogo, detalhes de lugares, roteiros, favoritos, agenda e dicas. Sem Cloud configurado ou dados publicados reais, mostra estados de indisponibilidade/vazio; não substitui dados por demonstração. Configuração e limites em [docs/ETAPA2.md](docs/ETAPA2.md).

## Desenvolvimento

Node.js **22.12+** (validado com 24) e npm. O frontend inicia sem credenciais, com catálogo indisponível e favoritos locais funcionais:

```sh
npm ci
npm run dev -- --host 0.0.0.0
npm run lint
npm test
npm run build
```

Para integrar um projeto Supabase, use somente URL e chave **anon/publishable** no `.env.local`, conforme `.env.example`. Tudo em `VITE_*` é público. Nunca coloque `service_role`, chaves privadas ou tokens de fornecedores no Vite. A validação do scaffold rejeita formatos privados conhecidos, mas não substitui revisão de secrets.

## Banco — Etapas 1 e 2

```sh
npm run test:db
```

Requer Docker e acesso à imagem oficial `postgres:17` na primeira execução. O runner cria um banco descartável sem porta publicada, aplica as migrations locais, executa o seed duas vezes e verifica políticas e invariantes; remove o container ao terminar. O bootstrap de Auth/Storage é um **test double**, não deve ser aplicado no Supabase. Não comprova a integração HTTP de Auth/Storage.

Migrations reais, regras e validação com Supabase local: [docs/BANCO.md](docs/BANCO.md). Configuração de serviços: [docs/CONFIGURACAO.md](docs/CONFIGURACAO.md). Escopo e decisões: [docs/DECISOES.md](docs/DECISOES.md).

## Testes no navegador

```sh
npx playwright install --with-deps chromium
npm run test:e2e
```

O runner usa Chromium instalado em `/usr/bin/chromium`, quando presente, ou o navegador do Playwright. Para outro caminho, use `PLAYWRIGHT_CHROMIUM_PATH`. Inicia um Vite exclusivo na porta 5174 com URL/chave **sintéticas de teste**, intercepta o HTTP do Supabase e verifica fluxos reais no navegador; não conecta a produção. Os testes Vitest cobrem `src/**/*.test.*` e o comparador de histórico em `scripts/**/*.test.mjs`.

## Supabase Cloud e autenticação

Projeto configurado: `itegpsgjtuclbsatcdxr`. A URL pública está em `.env.example`; disponibilize a chave **anon/publishable autorizada** via variável de ambiente ou `.env.local` ignorado. `npm run cloud:configure` grava a configuração pública sem imprimir a chave. As variáveis públicas estão disponíveis neste ambiente e 23 verificações HTTP de leitura passaram usando o proxy autorizado. Auth por e-mail/contas reais e Storage HTTP ainda não foram homologados.

Login e recuperação estão em `/entrar`, `/recuperar-senha`, `/auth/confirmar`, `/auth/nova-senha` e `/conta`. Sem criação automática de usuários/admins. Há validação de usuário e permissões no servidor, separada do catálogo público. Guia e pendências: [docs/CLOUD_HOMOLOGACAO.md](docs/CLOUD_HOMOLOGACAO.md).

**O Cloud já tem as três migrations originais. Não executar novamente, resetar ou aplicar seed remoto.** A migration adicional de hardening é proposta para revisão; aplicação remota depende da reconciliação do histórico. `npm run test:cloud`, `npm run cloud:advisors` e `npm run cloud:audit -- <relatório.json> <baseline.json>` são verificações opt-in, sem aplicação de SQL. Falta de credenciais é bloqueio (exit 2), não teste aprovado.

A auditoria externa verificada está em [docs/RELATORIO_SUPABASE_CODEX.md](docs/RELATORIO_SUPABASE_CODEX.md). O mapeamento das três versões remotas não autoriza reaplicação nem prova equivalência integral do SQL. Auth/Storage HTTP permanecem pendentes de homologação autorizada.

Primeira prévia Vercel da PR #3: [docs/VERCEL_PREVIEW.md](docs/VERCEL_PREVIEW.md), incluindo variáveis Preview, comandos/limites e URLs exatas para magic link, recuperação e PKCE. Nenhum deployment Vercel foi criado nesta sessão.

## Gestão do conteúdo turístico

Painel responsivo em `/admin`, restrito ao papel admin verificado no backend. CRUD de categorias, lugares, fotografias, roteiros/paradas, eventos e dicas. Guia, segurança, limites de Storage e aprovações: [docs/GESTAO_CONTEUDO.md](docs/GESTAO_CONTEUDO.md).

O [catálogo editorial](docs/CATALOGO_EDITORIAL.md) tem 28 candidatos em rascunho, um endereço confirmado externamente, 14 provisórios e 13 ausentes e seis roteiros preliminares. `npm run catalog:check` valida; `npm run catalog:sql` gera proposta SQL sem executar no banco. Nenhum conteúdo foi importado no Cloud. O painel depende da nova migration de proveniência; a gravação atômica das paradas depende também da migration RPC, preparada apenas localmente e sujeita a reconciliação/revisão antes de aplicação remota.

### Revisão editorial com referências oficiais externas

O catálogo de revisão agora contém 28 candidatos e seis roteiros em rascunho. O Museu Regional tem endereço confirmado na referência fornecida pelo usuário; seus horários continuam pendentes. Fontes externas não são tratadas como portais acessados neste ambiente. Formulários administrativos persistem URLs/pendências e exigem a migration adicional de proveniência, preparada somente para revisão local. [Catálogo e fontes](docs/CATALOGO_EDITORIAL.md), [dependências e aprovações](docs/GESTAO_CONTEUDO.md). Nenhuma importação ou publicação no banco ocorre automaticamente.

### Infraestrutura e homologação segura

[Revisão de 27/10/2026](docs/INFRA_HOMOLOGACAO.md): correção de versão de roteiros, auditoria de funções/RLS/Storage, preflight/postflight somente leitura e artefatos de implantação para aprovação. Nenhuma migration adicional foi aplicada no Cloud. Gerar artefatos com `node scripts/prepare-reviewed-deployment.mjs` não executa SQL nem conecta ao banco. Auth/Storage autenticados reais, MFA/AAL2 e política de mídia pública permanecem condições de liberação.

### Ensaio local do backup no Windows

[Instruções Windows](docs/BACKUP_WINDOWS.md) e [checklist operacional](docs/CHECKLIST_IMPLANTACAO_ADMIN.md). Com PowerShell 7 e Docker Desktop Linux, executar `pwsh -NoProfile -File .\scripts\backup\Test-SjdrBackup.ps1`. O script restaura somente o recorte da aplicação em PostgreSQL 17.11 descartável, sem destino remoto e sem pedir senha. O arquivo real permanece no computador do usuário; testes sintéticos não significam validação desse arquivo ou recuperação integral do Supabase. Não enviar dumps/relatórios reais ao GitHub.
