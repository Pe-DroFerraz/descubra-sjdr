# Revisão da infraestrutura — 27/10/2026

**Correções e homologação local concluídas; homologação privilegiada no Supabase Cloud pendente.** Base atualizada: `work/fontes-oficiais-editorial`, commit `76459adec66c1c1ddeafdff9d6a301f4cc95a982`. Entrega em `work/revisao-infra-homologacao`, incremental à PR #5. Não houve aplicação remota, importação, upload, criação de usuários, alteração de Auth, merge ou deploy de produção. Nenhum módulo de negócio novo foi desenvolvido.

## Problemas confirmados e correções

1. **Versão sobrescrita por `now()`:** o corpo do gatilho remoto foi fornecido pelo usuário. A reprodução no schema original local confirma que `UPDATE ... clock_timestamp()` continua recebendo a hora de início da transação. Duas atualizações podem ter a mesma versão; uma transação antiga pode produzir versão anterior a uma edição mais recente.
2. **Paradas diretas não invalidavam o roteiro:** confirmado no código/SQL anterior. O lock existia, mas uma alteração REST em `route_stops` não atualizava a versão do pai.
3. **EXECUTE desnecessário no handler de evento:** a exposição remota foi relatada externamente. PostgreSQL 17 local comprovou que um event trigger continua funcionando após revogar EXECUTE dos papéis de API, inclusive quando o DDL é criado por um papel sem essa permissão. O teste usa um **substituto explicitamente identificado**, não o corpo real do Cloud.
4. **Grants anônimos dispensáveis em dois helpers:** `private.owns_advertiser` e `private.can_edit_place` são necessários para políticas autenticadas, não para as leituras anônimas das políticas locais. Os grants de anon foram removidos; os helpers usados por leitura/Storage continuam disponíveis. Dependências remotas adicionais precisam de conferência antes da aplicação.
5. **Lacunas no verificador anterior:** não comparava triggers/grants de tabela, inspecionava apenas uma lista de funções e não detectava todos os grants privados. O relatório agora inclui todos os SECURITY DEFINER em `public`, funções de `private`, ACLs, vínculos de triggers, dependências do handler e formato do histórico.
6. **Sincronização de testes:** a espera padrão de um segundo era insuficiente para a primeira importação lazy sob carga. O teste agora aguarda até três segundos. O helper E2E navegava antes de terminar login/verificação de papel; agora espera o resultado autenticado/restrito. As asserções de segurança foram preservadas.

## Três migrations adicionais finais

As três originais são **idênticas à base**, inclusive hashes no manifesto. As adicionais estavam pendentes segundo o contexto fornecido e foram revisadas nos mesmos arquivos. Se uma delas já tiver sido aplicada por outro responsável, **não reaplicar nem editar o histórico**: parar e preparar uma nova migration corretiva a partir das definições efetivas.

| Ordem | Arquivo | Revisão e efeitos |
| --- | --- | --- |
| 1 | `20261022150000_security_hardening.sql` | Search paths fixos, sem CREATE para papéis de API, grants mínimos de RPC/helpers. Restringe apenas EXECUTE de `rls_auto_enable()` se existir com o dono/assinatura/search_path/SECURITY DEFINER e vínculo ativo `ensure_rls` esperados; divergência aborta a transação. Não substitui corpo, dono, binding ou evento. Ausência não cria um substituto: exige investigação no preflight. |
| 2 | `20261022170000_admin_route_stops.sql` | Valida o gatilho original e o corpo conhecido antes de substituir **somente o binding de `routes.set_updated_at`** por `private.touch_route_updated_at()`. Versão = `greatest(clock_timestamp(), OLD.updated_at + 1 microsecond)`; cliente não escolhe a versão no UPDATE. Constraint exige timestamp finito. RPC conserva autorização admin, RLS, lock, CAS, substituição atômica e retorno de quantidade. |
| 3 | `20261022180000_editorial_provenance.sql` | Exige a migration de versão/RPC; adiciona colunas e valida publicação. Novo AFTER trigger de paradas invalida os pais, inclusive em REST direto e mudança de roteiro. Durante essa alteração interna de **apenas versão**, evita validar a lista intermediária vazia; autorização e fontes continuam verificadas, e a constraint diferida valida o estado final. |

As outras **28 tabelas** continuam usando `public.touch_updated_at()/now()`. Isso é preservado e testado; não significa garantia de versão monotônica para essas tabelas dentro de uma única transação. Mutações usuais do painel ocorrem em transações separadas. Uma futura operação transacional conjunta em outra entidade deve revisar seu mecanismo de versão.

A função de versão é SECURITY INVOKER, search_path vazio e sem EXECUTE de API; o dispatch de trigger funciona sem conceder execução direta. Não há coluna de versão numérica nem mudança do contrato HTTP: a string completa de `updated_at`, inclusive microssegundos, continua sendo o token CAS. Um teste de cliente confirma que ela não é truncada por conversão para `Date`.

Paradas são serializadas pelo lock do roteiro e os lugares relacionados recebem lock compartilhado. Uma disputa real entre dois processos `psql` comprova: A grava, B espera o lock, B recebe `40001` ao detectar a versão antiga, e a lista vencedora permanece intacta. Erros de FK/duplicação e rollback preservam paradas **e versão**. Deadlocks/timeouts devem abortar e exigir recarga consciente; não fazer retry silencioso com conteúdo antigo.

## Matriz SECURITY DEFINER e autorização

| Função | Execução necessária após revisão | Limite de dados / motivo |
| --- | --- | --- |
| `has_role(app_role)` | anon, authenticated, service_role | Booleano do usuário associado a `auth.uid()`, sem enumerar papéis de terceiros; evita recursão de RLS. Não confia em user_metadata. |
| `public_place_benefits()` | anon, authenticated, service_role | Somente local publicado, vigência e flags públicas de plano ativo/verificado; sem cliente/cobrança/identidade do proprietário. |
| `public_route_sponsors(uuid)` | anon, authenticated, service_role | Somente nome/slug publicado e patrocínio confirmado/vigente; sem valor faturado ou proprietário. |
| `place_daily_metrics(uuid,date,date)` | authenticated, service_role | Exige admin/dono real internamente, período válido até 366 dias; somente agregados, sem eventos brutos. Ter service_role no ACL não remove o gate interno de usuário. |
| `redeem_coupon(uuid,uuid,uuid)` | service_role | Chamador confiável deve derivar actor de identidade verificada; checa dono/admin, validade, limite, lock e idempotência. Não chamamos essa RPC de mutação no Cloud. |
| `private.owns_advertiser`, `private.can_edit_place` | authenticated, service_role | Helpers de propriedade/escrita; grant de anon removido. |
| `private.owns_place`, `private.published_place` | anon, authenticated, service_role | Booleanos limitados, necessários nas políticas de leitura/Storage; não expõem registros privados. |
| `private.path_place_id` | anon, authenticated, service_role | Parser SECURITY INVOKER, sem leitura de dados; caminho inválido retorna null. |
| `rls_auto_enable()` | Dispatch do evento / proprietário | PostgreSQL 17 não exige EXECUTE dos papéis de API para disparar evento já cadastrado. ACL restrita; corpo, owner postgres, search_path pg_catalog e `ensure_rls` preservados. |
| RPC de paradas | authenticated, com admin no backend | SECURITY INVOKER, retém RLS. Usuários comuns não ganham acesso pelo simples fato de autenticarem. |
| Funções novas de trigger | Dispatch de triggers | SECURITY INVOKER, EXECUTE de PUBLIC/anon/authenticated/service_role revogado. |

Os nove avisos do Advisor são **evidência externa anterior**, não uma nova execução. Avisos podem continuar para as RPCs públicas e para métricas autenticadas: remover esses grants indiscriminadamente quebra funções legítimas. Cada aviso deve ser classificado pela projeção, autorização, search_path e dependências efetivas. Não converter todos os definers em invokers. O handler de plataforma não foi recriado ou testado remotamente nesta tarefa.

## Diferenças estruturais — procedência da evidência

| Item | Cloud / evidência | Local revisado / ação |
| --- | --- | --- |
| Histórico original | Versões remotas `20261022141818`, `20261022141828`, `20261022141835`, conforme auditoria fornecida | Mapeadas a `202610220001/2/3`; correspondência de nomes/timestamps não comprova equivalência dos corpos. |
| 29 tabelas/RLS e três buckets | Confirmados externamente pelo usuário | Fixture PG17 e auditoria local verificam os contratos; definições/grants reais ainda exigem exportação privilegiada. |
| `source_urls` e `pending_fields` | Leituras HTTP individuais `SELECT coluna LIMIT 0` indicam ausência nas cinco tabelas | Presentes após a terceira adicional local; não aplicadas no Cloud. |
| `admin_set_route_stops` | Ausente segundo a auditoria fornecida | Criada/testada localmente; não fazemos chamada HTTP de mutação para sondar existência. |
| Gatilho original de timestamp | Corpo `now()` fornecido pelo usuário | Reproduzido localmente; somente `routes` recebe o handler monotônico. Outros triggers remotos desconhecidos devem ser revisados. |
| Funções/ACLs/policies/índices/FKs completos | Não acessíveis pelo binding atual | `cloud-readonly.sql`, `infra-preflight.sql` e comparador preparados; não apresentar uma comparação entre duas fixtures como homologação remota. |
| Auth público em 27/10 | E-mail habilitado, signup habilitado, autoconfirmação desabilitada | Nenhuma configuração alterada; revisar signup antes de abrir acesso. |

A comparação do snapshot local final consigo mesmo tem zero achados e mantém a revisão do handler como pendência. A comparação baseline local × final mostra alterações **esperadas** de colunas/constraint/trigger/ACL. Nenhum desses resultados representa comparação privilegiada com o projeto real.

## Artefatos de implantação para revisão

- `supabase/audit/cloud-readonly.sql`: exporta metadados/hashes, sem usuários, credenciais ou corpos de dados.
- `supabase/audit/infra-preflight.sql` e `editorial-preflight.sql`: somente leitura, compatíveis com o schema anterior; mostram bindings, histórico, colunas, contagens de impacto e políticas.
- `supabase/audit/infra-postflight.sql`: somente leitura, asserções de contratos posteriores; não autentica usuários nem envia arquivos.
- `supabase/deploy/manifest.json`: SHA256 das seis fontes, com execução remota explicitamente não autorizada.
- `supabase/deploy/reviewed-additions.sql`: **proposta para aprovação**, apenas as três adicionais, com transação e histórico atômicos por etapa.
- `node scripts/prepare-reviewed-deployment.mjs`: gera os dois últimos arquivos, sem rede/conexão/execução SQL. Alterar uma fonte exige regeneração e nova revisão. `node scripts/prepare-reviewed-deployment.mjs --check` verifica que os artefatos versionados correspondem exatamente ao gerador/fontes; a suíte PostgreSQL usa essa checagem sem reescrevê-los.

O envelope de implantação usa lock transacional, `lock_timeout=5s` e `statement_timeout=120s`. Confere o histórico original contra os aliases conhecidos, recusa nomes/versões extras, colisões e etapas anteriores ausentes. Insere nome/versão e a fonte completa em `schema_migrations.statements` **na mesma transação** que o DDL. Reexecução pula somente uma etapa com versão, nome e fonte exatamente iguais; divergência aborta, sem repair. O formato real da tabela de histórico precisa ser confirmado antes: espera `version`, `name` e `statements text[]` com semântica compatível.

Este é um caminho alternativo de aplicação manual controlada para o histórico divergente; não combinar o envelope com `migration up`, db push ou execução avulsa dos mesmos arquivos. Ele **não reconcilia automaticamente corpos de função/estrutura**. A aprovação da comparação privilegiada continua obrigatória. Os SQLs originais não são reaplicados, nem seus timestamps reescritos.

Testes em clone descartável comprovam: precondição de plataforma inválida causa rollback do DDL/ACL e não registra a migration; divergência de fonte já registrada é recusada sem sobrescrever o histórico; duas execuções idênticas produzem somente um conjunto de objetos/registros. As três etapas têm commits separados: uma falha posterior conserva os checkpoints anteriores, sem fingir que tudo foi revertido.

## Checklist obrigatório antes do Cloud

1. Fixar commit/manifesto revisados e obter autorização explícita para **aplicação**. Esta PR não autoriza aplicar. Preservar as PRs anteriores sem merge automático e manter a gestão em manutenção/protegida até terminar a homologação.
2. Confirmar projeto `itegpsgjtuclbsatcdxr`, PostgreSQL 17 e acesso administrativo de auditoria. Exportar histórico completo, snapshots e ACLs anteriores com proteção de acesso, sem colar segredos no GitHub.
3. Executar somente os preflights e `cloud-readonly.sql`. Comparar o snapshot remoto com `.audit/local-baseline.json`; conferir owners confiáveis de todas as SECURITY DEFINER e revisar **toda** diferença de corpos/ACLs/policies/triggers/FKs/buckets e os aliases. Conferir que `private` não está exposto indevidamente na API. Snapshot parcial/antigo ou ausência inesperada de `ensure_rls` impede a liberação.
4. Inspecionar o corpo e dependências reais de `rls_auto_enable()` em canal autorizado, sem publicação de dados sensíveis. Confirmar owner, retorno, search_path, tag/evento, modo ativo e estabilidade do hash anterior. Validar políticas anônimas antes de retirar os dois grants de helpers.
5. Confirmar que nenhuma adicional já foi executada por outro responsável. Se aplicada com outra fonte, preparar uma **nova** migration corretiva; não editar registro, não marcar como aplicada artificialmente e não reaplicar as três originais.
6. Confirmar backup/snapshot restaurável e plano de recuperação, inclusive Storage separadamente; registrar responsável, janela e capacidade de restore. Nenhum backup real foi criado/testado aqui.
7. Revisar contagens de registros publicados, timestamps não finitos/futuros, listas de paradas e fontes. Dados legados publicados incompletos podem bloquear edições futuras; definir backfill separado e aprovado, sem inventar conteúdo. Reavaliar timeouts/locks conforme volume real.
8. Só após aprovação, executar o envelope aprovado com `ON_ERROR_STOP`, por ferramenta autorizada e conexão segura, **sem imprimir DSN, senha, tokens ou variáveis**. Interromper no primeiro erro; não contornar guards. Registrar hash e resultado de cada checkpoint. Não importar catálogo nem seed.
9. Executar postflight, novo snapshot e comparação contra o estado final esperado. O corpo/hash de `rls_auto_enable()` deve permanecer igual ao snapshot remoto anterior; o hash do substituto local não é referência para seu corpo real. Verificar grants, RLS e triggers, além da ausência de mudanças nas outras 28 tabelas.
10. Reexecutar Advisor oficial e classificar avisos restantes; realizar HTTP de leitura e homologação autorizada com contas reais existentes. Mutações/arquivos de homologação só mediante autorização separada, plano reversível e materiais licenciados. Não há criação automática de admin.
11. Aprovar Auth, SMTP, MFA/AAL2, Storage e regressões antes de liberar a gestão. Importação de rascunhos, publicação editorial e produção são decisões separadas, fora desta execução.

## Auth, Storage e bloqueios para disponibilizar a administração

- Guard e operações revalidam usuário por `getUser()` e papel por `has_role('admin')`; RLS faz a decisão final. Os testes cobrem metadados forjados, não admin, papel revogado, CRUD e conflitos. **Sem sessão autorizada real, isso não homologa login/CRUD do Cloud.**
- Signup permanece habilitado no endpoint público. Se a fase é restrita a contas existentes, o responsável deve revisar/desabilitar novos cadastros no Auth. `shouldCreateUser:false` no aplicativo não fecha a API. Não alteramos essa configuração.
- Magic link/recuperação usam PKCE e `ConfirmationURL`, solicitados/abertos na mesma origem/navegador. Autorizar somente a origem HTTPS confiável com `/auth/confirmar` e variantes `?next=%2Fconta`, `?next=%2Ffavoritos`, `?next=%2Fadmin`. `/auth/nova-senha` é destino interno após recuperação validada. Preservar Site URL e callbacks legítimos; não usar wildcard geral da Vercel.
- SMTP/remetente, entrega real, templates, limites, CAPTCHA, URLs e configuração MFA não são visíveis no endpoint público. A aplicação/RLS atual **não exige AAL2** e não oferece desafio MFA. Antes de disponibilizar administração sensível, homologar enrolamento/recuperação e exigência de AAL2 no servidor **com fluxo compatível no cliente**; habilitar MFA no projeto, isoladamente, não garante essa exigência. Esta é uma pendência de segurança, não uma configuração confirmada.
- Upload local valida arquivo/MIME/tamanho e remove EXIF. O vínculo/dono é autorizado pela RLS; direitos de uso exigem declaração e fonte/licença com revisão humana, não uma comprovação automática de copyright. RLS de Storage é testada por SQL, e o navegador usa HTTP interceptado. Storage HTTP real (upload/substituição/exclusão, revogação e limites) continua pendente, sem upload nesta tarefa.
- **Buckets públicos expõem arquivos por URL conhecida, inclusive de rascunhos.** RLS protege registros e metadados consultados, não torna o objeto público confidencial. Não afirmar sigilo de mídia draft. Aprovar essa política ou preparar fluxo privado de mídia antes de exigir confidencialidade; não alteramos buckets nesta revisão.

## Recuperação e rollback

- Antes de executar qualquer coisa: backup restaurável, ACLs/bindings/definições anteriores e responsável definido; janela sem gravações administrativas. Frontend público pode continuar lendo o estado anterior. Se a nova interface depende de colunas ausentes, manter a administração protegida.
- Falha **dentro** de uma etapa: a transação reverte DDL/ACL e histórico juntos. Conferir o snapshot e o log sanitizado antes de repetir exatamente a mesma fonte. Não inserir history manualmente para "pular" erro.
- Falha **depois** de um checkpoint: manter a administração fechada, preservar o histórico confirmado e diagnosticar a etapa seguinte. Preferir correção aditiva revisada. Não apagar colunas, paradas, mídia ou registros para tentar voltar ao passado.
- Se for necessário retornar a interface anterior, selecionar somente uma Preview conhecida sob aprovação; isso não desfaz schema/dados. Não promover produção ou alterar a base das PRs automaticamente.
- Não usar `DROP ... CASCADE`, reset, repair, seed ou replay das originais como rollback. Não desabilitar `ensure_rls`. Repor ACL de plataforma, se indispensável em incidente, exige comparar/restaurar **somente** os grants anteriores capturados, sem recriar corpo/owner/evento; reavaliar a exposição resultante.
- Voltar um timestamp para `now()` reintroduz a falha de CAS. Se uma reversão excepcional do binding for aprovada, congelar escritores e forçar recarga de todas as versões; preferir manter a função monotônica e corrigir adiante. Conservar `source_urls/pending_fields` e dados editoriais, mesmo se alguma interface antiga os ignorar.
- Restauração integral é último recurso aprovado: ensaiar em ambiente separado, verificar perdas desde o backup e consistência banco/Storage. Nunca restaurar por cima do projeto real sem decisão explícita.

## Validações e resultados

Os resultados desta entrega estão em [REVISAO.md](REVISAO.md). Fixtures de Auth/Storage e handler de evento são substitutos locais; leituras Cloud são identificadas separadamente. Advisor, metadados privilegiados e testes autenticados/Storage reais permanecem pendentes por falta de acesso autorizado, não por um HTTP 403 inventado.
