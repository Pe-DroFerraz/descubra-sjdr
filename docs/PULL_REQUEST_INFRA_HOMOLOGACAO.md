A RPC de paradas atribuía `clock_timestamp()`, mas o gatilho original substituía a versão por `now()`. Duas gravações na mesma transação podiam reutilizar `updated_at`, comprometendo o CAS. Esta PR corrige a geração de versão somente em `routes` e faz alterações diretas de paradas invalidarem o roteiro.

Base: `work/fontes-oficiais-editorial` (`76459ad`), PR #5 ainda dependente da #4. Nova branch `work/revisao-infra-homologacao`; entrega em rascunho, sem novo módulo de negócio, merge ou produção.

- Três migrations adicionais **ainda pendentes** revisadas nos próprios arquivos. Originais e seus hashes preservados. Se alguma adicional tiver sido aplicada por outro responsável, parar e preparar uma nova corretiva; não editar o histórico.
- Versão monotônica por roteiro com `greatest(clock_timestamp(), OLD.updated_at + 1 microsecond)`, handler próprio, constraint finita e precisão preservada no cliente. Outros 28 handlers mantidos.
- Locks/CAS, invalidação por REST direto em paradas e validação diferida do estado final. Erros e rollback preservam paradas e versão; edição concorrente antiga recebe 40001.
- Grants mínimos de helpers/RPC. Restrição proposta de EXECUTE de `rls_auto_enable()` sob validação de dono/assinatura/search_path/evento; corpo, owner e vínculo não substituídos. Teste com handler **substituto local**, sem alegar homologação do handler real. Defaults globais da plataforma preservados.
- Auditoria somente leitura ampliada: todos os definers de public, funções private, triggers, ACLs, dependências, histórico e formato das colunas. Preflight e postflight preparados.
- Envelope de implantação **para aprovação**: fontes/manifesto SHA256, aliases conhecidos das originais, lock, DDL/histórico atômicos por etapa, replay exato e recusa de drift. Nenhum replay das originais ou repair. Artefatos verificados contra gerador por --check.

Validação executada: build, lint, **113 testes unitários**, PostgreSQL 17 descartável e **26 E2E** passaram. PostgreSQL cobre o bug original, versões sucessivas/transação longa, dois escritores reais, stale token, rollback, grants/handler de evento, publicação e implantação repetida/recusada. E2E cobre Auth/papel, CRUD, mídia, publicação e edição concorrente do roteiro. Ajustadas esperas dos testes para lazy import e conclusão do login, mantendo as asserções.

Cloud real: **24 leituras passaram**, mais dez sondagens individuais que confirmam ausência das duas colunas editoriais nas cinco tabelas. Dois cenários autenticados ficaram not_run. E-mail habilitado, signup ainda habilitado e autoconfirmação desabilitada. Management API/Advisor e exportação privilegiada indisponíveis por falta de credencial autorizada; os nove alertas são evidência externa anterior.

**Não liberar administração sensível ainda:** falta homologar Auth/Storage HTTP reais, SMTP, callbacks e política de signup. AAL2 não é exigido pelo backend atual e o cliente não inclui desafio MFA. Objetos em buckets públicos, inclusive mídia de drafts, não são confidenciais por URL conhecida. Essas limitações estão documentadas, sem promessa de correção remota.

Relatórios: `docs/INFRA_HOMOLOGACAO.md` (diferenças, classificação das funções, checklist, checkpoints e recuperação) e `docs/REVISAO.md` (resultados/limites). Aplicação no Cloud depende de reconciliação de definições/owners/ACLs, revisão dos efeitos, backup restaurável e **aprovação separada**. Não combinar o envelope com db push/up/repair. Importar/publicar catálogo e produção permanecem fora do escopo.

Nenhuma migration aplicada no Supabase Cloud, dado turístico importado, upload real, alteração de Auth, usuário criado, merge ou deploy de produção. Push da branch pode acionar Preview pela integração Vercel existente.
