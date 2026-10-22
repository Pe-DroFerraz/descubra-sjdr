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

Requer Docker e acesso à imagem oficial `postgres:17` na primeira execução. O runner cria um banco descartável sem porta publicada, aplica as três migrations, executa o seed duas vezes e verifica políticas e invariantes; remove o container ao terminar. O bootstrap de Auth/Storage é um **test double**, não deve ser aplicado no Supabase. Não comprova a integração HTTP de Auth/Storage.

Migrations reais, regras e validação com Supabase local: [docs/BANCO.md](docs/BANCO.md). Configuração de serviços: [docs/CONFIGURACAO.md](docs/CONFIGURACAO.md). Escopo e decisões: [docs/DECISOES.md](docs/DECISOES.md).

## Testes no navegador

```sh
npx playwright install --with-deps chromium
npm run test:e2e
```

O runner usa Chromium instalado em `/usr/bin/chromium`, quando presente, ou o navegador do Playwright. Para outro caminho, use `PLAYWRIGHT_CHROMIUM_PATH`. Inicia um Vite exclusivo na porta 5174 com URL/chave **sintéticas de teste**, intercepta o HTTP do Supabase e verifica fluxos reais no navegador; não conecta a produção. Os testes Vitest ficam restritos a `src/**/*.test.*`.

## Supabase Cloud e autenticação

Projeto configurado: `itegpsgjtuclbsatcdxr`. A URL pública está em `.env.example`; disponibilize a chave **anon/publishable autorizada** via variável de ambiente ou `.env.local` ignorado. `npm run cloud:configure` grava a configuração pública sem imprimir a chave. Esta sessão não recebeu chave utilizável; a conexão remota ainda não foi homologada.

Login e recuperação estão em `/entrar`, `/recuperar-senha`, `/auth/confirmar`, `/auth/nova-senha` e `/conta`. Sem criação automática de usuários/admins. Há validação de usuário e permissões no servidor, separada do catálogo público. Guia e pendências: [docs/CLOUD_HOMOLOGACAO.md](docs/CLOUD_HOMOLOGACAO.md).

**O Cloud já tem as três migrations originais. Não executar novamente, resetar ou aplicar seed remoto.** A migration adicional de hardening é proposta para revisão; aplicação remota depende da reconciliação do histórico. `npm run test:cloud`, `npm run cloud:advisors` e `npm run cloud:audit -- <relatório.json> <baseline.json>` são verificações opt-in, sem aplicação de SQL. Falta de credenciais é bloqueio (exit 2), não teste aprovado.

A auditoria externa verificada está em [docs/RELATORIO_SUPABASE_CODEX.md](docs/RELATORIO_SUPABASE_CODEX.md). O mapeamento das três versões remotas não autoriza reaplicação nem prova equivalência integral do SQL. Auth/Storage HTTP permanecem pendentes de homologação autorizada.
