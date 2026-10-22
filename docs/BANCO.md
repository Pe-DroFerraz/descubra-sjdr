# Banco, RLS e Storage — Etapa 1

## Aplicação

`supabase/migrations/202610220001_core.sql` cria as 29 tabelas exigidas, PK/FK, constraints, índices, triggers `updated_at`, RLS, helpers e RPCs. `202610220002_storage.sql` configura buckets e políticas. Cada migration é transacional. Para atualizar um projeto existente use o histórico de migrations, nunca reexecute manualmente uma migration já aplicada.

Para Supabase local, instale Docker e a CLI oficial. A CLI oficial 2.108.0 está fixada nas devDependencies. `npm run supabase -- <comando>` seleciona o binário Go oficial empacotado (compatível com o home restrito da nuvem) e o mirror oficial Docker Hub; não modifica verificações TLS/checksums. Na raiz do checkout:

```sh
npm run supabase -- start
# SOMENTE banco local descartável: recria o banco e aplica migrations + seed.
npm run supabase -- db reset --local
# A suíte SQL é transacional e desfaz seus próprios fixtures.
psql 'postgresql://postgres:postgres@127.0.0.1:54322/postgres' -X -v ON_ERROR_STOP=1 -f supabase/tests/security.sql
```

A senha acima é a convenção do ambiente **local** Supabase, não uma credencial de projeto remoto. Não publique portas de banco local na Internet. `start`/`status` podem imprimir chaves locais: não copie sua saída para commits ou chats. Nenhum secret remoto é necessário para os testes isolados `npm run test:db`.

Para homologação remota: revisar migrations primeiro, vincular o projeto correto com a CLI autenticada e aplicar `supabase db push` segundo o processo da equipe. Não executar o seed demonstrativo em produção. Este trabalho não faz deploy remoto, configura pagamentos, nem cria usuários reais.

## Modelo de autorização

- Visitantes leem categorias/planos publicados e conteúdo publicado. Filhos de locais, roteiros e eventos acompanham a publicação do pai. Locais de anunciantes suspensos ou categorias ocultas não ficam públicos.
- Anunciante aprovado vê seus próprios registros e pode inserir/editar locais em `draft`/`pending`, traduções, fotos e horários vinculados a esses locais. Não publica ou verifica conteúdo, não altera donos, roles ou cobrança. Cupons em rascunho/pendentes podem ser editados pelo dono. A aprovação é administrativa. Publicar conteúdo e gerar QR serão integrados nas próximas etapas.
- `advertisers` é provisionado/aprovado pelo admin/backend. O papel `advertiser` não concede propriedade: o vínculo `owner_id` aprovado é obrigatório. Isso evita criação/aprovação de conta comercial pelo próprio cliente.
- Admin tem acesso total; `has_role()` é `SECURITY DEFINER`, `STABLE`, com `search_path` vazio e consulta direta a `user_roles`, evitando recursão. Não usa metadados editáveis do usuário.
- Reviews, eventos, telemetria e sessões de IA não têm INSERT público. Futuras Edge Functions deverão validar JWT/payload, consentimento quando aplicável, rate limit e antiabuso antes de usar `service_role`. Até essa integração, as operações não estão disponíveis ao turista.
- Telemetria bruta fica restrita a backend/admin; anunciante usa `place_daily_metrics(uuid,date,date)` com autorização no servidor, período até 366 dias e agregação por dia UTC. Não guarda IP, user-agent completo ou identificador de visitante.
- `redeem_coupon(uuid,uuid,uuid)` é executável apenas por `service_role`, verifica o ator validado, bloqueia a linha, verifica publicação/validade/limite e permite repetição idempotente por UUID. A Edge Function futura deve obter o ator do JWT verificado, nunca confiar no payload. Não é endpoint público de resgate.
- Benefícios comerciais ainda não são expostos no frontend. No futuro, devem depender de assinatura `active`, `verified_at` preenchido e período vigente; uma assinatura pendente não concede selo. Webhook verificado e idempotente fica para a Etapa 6.

## Storage

- `place-photos`: público, até 5 MiB; JPEG, PNG, WebP e AVIF. Caminhos `<place_uuid>/<arquivo>`. Escrita somente admin ou dono aprovado de local editável. UPDATE valida caminho antigo e novo, bloqueando movimentação para local alheio.
- `event-images`: público, mesmos limites; escrita administrativa.
- `qr-codes`: **privado**, até 2 MiB; PNG/SVG. Geração/escrita administrativa ou backend; leitura autenticada por dono/admin.

Buckets públicos tornam o arquivo acessível a quem conhece sua URL, inclusive antes da publicação do registro. As políticas filtram listagem/metadados, mas não tornam arquivos desses buckets confidenciais. Não enviar fotos privadas, documentos ou secrets; compressão, sanitização e integração de upload serão tratadas nas etapas de interface. SVG só é permitido no bucket privado de QR, sem upload pelo anunciante. Limites MIME/tamanho são aplicados pelo serviço Storage; os testes PostgreSQL verificam configuração e políticas, não o processamento de arquivos HTTP.

## Demonstração e admin de teste

`seed.sql` tem IDs estáveis e `ON CONFLICT DO NOTHING`, preservando edições em reexecuções. Inclui 25 locais, seis roteiros com paradas, oito eventos com datas fictícias, dez dicas, três planos e cinco anunciantes fictícios **sem dono**. Todos os lugares/roteiros/eventos/dicas ficam em rascunho, com `is_demo=true` e sinalização DEMONSTRAÇÃO; nenhum dado operacional não verificado é publicado. Categorias também exigem publicação administrativa. Os planos são públicos e editáveis no banco.

Para testar um admin, crie/convide uma identidade no **Auth do projeto de desenvolvimento** usando o fluxo seguro de senha ou magic link. Confirme o UUID e, somente no SQL Editor administrativo desse projeto, insira:

```sql
-- Substitua o placeholder pelo UUID da identidade criada. Nunca use senha em SQL/seed.
insert into public.user_roles(user_id, role)
values ('<UUID_DO_USUARIO_DE_TESTE>'::uuid, 'admin')
on conflict (user_id, role) do nothing;
```

Crie `profiles` pelo cliente autenticado ou admin; ele contém somente nome/idioma. Para testes de anunciante, o admin vincula `advertisers.owner_id` ao UUID e aprova a conta. Não criar administradores automaticamente por signup ou por metadados do usuário. Apague fixtures quando encerrar homologação.

## Testes e limites

`npm run test:db` aplica o SQL em PostgreSQL 17 real e verifica RLS das 29 tabelas, triggers, cardinalidades/reexecução do seed, leituras públicas, isolamento por dono, bloqueio de escalada de papel, publicação e cobrança indevidas, telemetria agregada, Storage, idempotência/limite de cupom, concorrência real entre duas conexões disputando o último resgate e administração. O bootstrap simula apenas os contratos de `auth.uid()`, `auth.users` e tabelas Storage.

A validação da pilha Supabase completa depende de baixar imagens dos serviços. Não confundir o teste PostgreSQL isolado com um teste de Auth, PostgREST ou Storage HTTP. Ver resultado da execução atual em `docs/REVISAO.md`.
