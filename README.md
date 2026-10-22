# Descubra SJDR

PWA turística em desenvolvimento. O scaffold é demonstrativo: não representa estabelecimentos operacionais, programação confirmada ou integrações prontas.

## Desenvolvimento

Node.js **22.12+** (validado com 24) e npm. O frontend funciona sem credenciais:

```sh
npm ci
npm run dev -- --host 0.0.0.0
npm run lint
npm test
npm run build
```

Para integrar um projeto Supabase, use somente URL e chave **anon/publishable** no `.env.local`, conforme `.env.example`. Tudo em `VITE_*` é público. Nunca coloque `service_role`, chaves privadas ou tokens de fornecedores no Vite. A validação do scaffold rejeita formatos privados conhecidos, mas não substitui revisão de secrets.

## Banco — Etapa 1

```sh
npm run test:db
```

Requer Docker e acesso à imagem oficial `postgres:17` na primeira execução. O runner cria um banco descartável sem porta publicada, aplica as duas migrations, executa o seed duas vezes e verifica políticas e invariantes; remove o container ao terminar. O bootstrap de Auth/Storage é um **test double**, não deve ser aplicado no Supabase. Não comprova a integração HTTP de Auth/Storage.

Migrations reais, regras e validação com Supabase local: [docs/BANCO.md](docs/BANCO.md). Configuração de serviços: [docs/CONFIGURACAO.md](docs/CONFIGURACAO.md). Escopo e decisões: [docs/DECISOES.md](docs/DECISOES.md).
