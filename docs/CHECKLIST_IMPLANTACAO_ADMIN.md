# Checklist operacional — infraestrutura administrativa

Base revisada: PR #6, commit `685ebb5`. Esta entrega prepara o ensaio do backup e a operação; **não autoriza nem executa alterações no Cloud**. Checklist completo de recuperação e classificações: [INFRA_HOMOLOGACAO.md](INFRA_HOMOLOGACAO.md). Execução Windows: [BACKUP_WINDOWS.md](BACKUP_WINDOWS.md).

## 1. Antes de decidir pela aplicação

- [ ] Registrar o arquivo original protegido no Windows. Criação informada: pg_dump 17.11, CUSTOM/gzip, 521.502 bytes, 942 entradas, exit 0. Não confundir criação com restauração verificada.
- [ ] Executar o script local e revisar códigos, inventário, contagens, SHA256, FKs não validadas e limpeza. A aplicação pode restaurar mesmo com limitações dos serviços gerenciados; registrar essas limitações antes de aprovar o plano de recuperação.
- [ ] Confirmar estratégia restaurável para Auth/Storage/roles/configurações gerenciadas e cópia dos arquivos de buckets, com responsável e janela definidos. Se a estratégia de recuperação necessária depender desses itens, o teste parcial não libera a implantação.
- [ ] Revisar a PR, fixar o commit/manifesto de implantação e obter aprovação explícita. Não promover Preview para produção nem fazer merge automático.
- [ ] Manter a administração protegida/sem gravações até concluir toda a homologação.

## 2. Reconciliar sem modificar o histórico existente

Executar somente sob acesso autorizado de auditoria:

- [ ] Confirmar projeto `itegpsgjtuclbsatcdxr`, PostgreSQL **17.11**, ambiente e responsável.
- [ ] Executar `supabase/audit/cloud-readonly.sql`, `infra-preflight.sql` e `editorial-preflight.sql`. Proteger os resultados; não divulgar registros, funções com segredos, DSN ou credenciais.
- [ ] Confirmar exatamente uma ocorrência de cada original: remoto `20261022141818/core`, `20261022141828/storage`, `20261022141835/tourist_catalog`; aliases locais `202610220001/2/3`. Preservar os três registros e arquivos.
- [ ] Comparar definições/owners/ACLs, dependências, triggers, políticas RLS, FKs, índices e buckets contra o baseline. Timestamps compatíveis não comprovam corpos equivalentes.
- [ ] Conferir owner postgres, retorno event_trigger, SECURITY DEFINER, search_path pg_catalog e vínculo ativo `ensure_rls` de `rls_auto_enable()`. Comparar hash antes/depois no próprio remoto; não usar o handler substituto de teste como corpo esperado.
- [ ] Confirmar o binding/corpo original de `routes.set_updated_at` e ausência de triggers concorrentes não revisados. Conferir versões finitas/futuras e volume de registros.
- [ ] Confirmar estrutura de `supabase_migrations.schema_migrations`: o envelope espera `version`, `name`, `statements text[]` e semântica compatível.
- [ ] Se alguma adicional já tiver sido aplicada com outra fonte ou se houver drift, **parar**. Preparar nova corretiva revisada; não reparar/reescrever histórico nem reaplicar originais.

## 3. Ordem e dependências das três adicionais

| Etapa | Migration | Dependências e efeito revisado |
| --- | --- | --- |
| 1 | `20261022150000_security_hardening.sql` | Depende das funções/helpers das três originais. Restringe CREATE/EXECUTE e fixa search paths sem remover grants legítimos de leitura. Só restringe ACL do handler de evento quando o contrato conhecido corresponde; não recria seu corpo, owner ou evento. |
| 2 | `20261022170000_admin_route_stops.sql` | Depende de tabelas/RLS/has_role e do gatilho original esperado. Instala handler monotônico **apenas para routes**, constraint de versão finita e RPC admin SECURITY INVOKER com lock/CAS/substituição atômica. |
| 3 | `20261022180000_editorial_provenance.sql` | Exige handler de versão/RPC da etapa 2. Adiciona fontes/pendências, valida publicação, serializa paradas e invalida versões do pai. Constraint diferida verifica o estado final. |

- [ ] Verificar `node scripts/prepare-reviewed-deployment.mjs --check` no checkout aprovado. Os seis hashes, as três adicionais e `supabase/deploy/reviewed-additions.sql` permanecem **idênticos ao commit 685ebb5** nesta entrega.
- [ ] Revisar `supabase/deploy/manifest.json` e o envelope inteiro. Gerar artefatos não os aplica; aprovação da comparação privilegiada continua necessária.
- [ ] Escolher um único procedimento aprovado. O envelope é alternativa manual controlada: lock, limites de tempo, fonte exata e DDL/histórico atômicos por etapa. Não combinar com `migration up`/`db push` ou execução avulsa dos mesmos arquivos.
- [ ] Apenas após autorização, executar por conexão segura com parada no primeiro erro, sem imprimir senha/DSN/token. Registrar checkpoint de cada etapa; uma falha posterior não desfaz commits anteriores.
- [ ] Não executar originais, seed, reset, repair automático, importação do catálogo, scripts de fixture ou o substituto de `rls_auto_enable()`.

## 4. Validação posterior — somente leitura primeiro

- [ ] Executar `supabase/audit/infra-postflight.sql` e novo snapshot; conferir 29 tabelas/RLS, novas colunas, triggers, grants e histórico.
- [ ] Conferir o novo binding de `routes.set_updated_at` e os outros 28 bindings preservados. Verificar os três triggers de paradas e sua constraint diferida.
- [ ] Conferir que o corpo/owner/vínculo de `rls_auto_enable()` não mudou; somente a ACL aprovada deve diferir.
- [ ] Conferir grants: RPC de paradas somente authenticated, com admin real internamente; métricas negadas a anon; resgate somente service_role; EXECUTE de triggers não exposto; helpers de leitura legítimos preservados.
- [ ] Reexecutar **Security Advisor oficial** sob autorização. Classificar cada aviso; as RPCs públicas necessárias podem continuar com alertas de SECURITY DEFINER. Não converter tudo para INVOKER nem quebrar funcionalidades para zerar avisos.
- [ ] Executar o smoke HTTP de leitura autorizado. As dez sondagens de colunas precisam passar de `pending_migration` para `available`; dois cenários autenticados exigem sessões reais existentes e autorizadas.
- [ ] Comparar contagens/invariantes com o preflight e confirmar que nenhuma atração, evento ou roteiro foi publicado/importado. Conferir FKs, fontes e listas de paradas sem expor conteúdos privados.

## 5. Auth, Storage e operações administrativas

- [ ] Revisar signup (última leitura documentada: habilitado), callbacks exatos da Preview, fluxo PKCE no mesmo navegador/origem, recuperação, templates, SMTP/remetente, entrega e limites. Não criar contas/senhas fixas para contornar a homologação.
- [ ] Exigir MFA/AAL2 no backend com enrolamento/recuperação e desafio compatíveis no cliente **antes de liberar administração sensível**. O painel atual não implementa essa exigência/desafio; este item permanece bloqueante.
- [ ] Homologar autenticação e papel admin efetivos no backend; testar não admin, metadados forjados, revogação, sessão expirada e isolamento entre proprietários.
- [ ] Com autorização separada para mutações de homologação reversíveis, testar CRUD, publicação incompleta negada, conflitos de versão, ordem/rollback de paradas e preservação de dados. Não usar conteúdo turístico fictício em registros publicados.
- [ ] Homologar upload/substituição/exclusão com material autorizado, MIME/tamanho, dono, licença, RLS, compensação e limpeza. O pg_dump não restaura os arquivos dos buckets.
- [ ] Revisar a política de mídia draft: objetos de buckets públicos são acessíveis por URL conhecida. Aprovar essa exposição ou implementar fluxo privado antes de exigir sigilo; RLS de metadados não torna o arquivo confidencial.
- [ ] Registrar evidências sanitizadas e pendências. Só liberar a gestão após aprovação; importar rascunhos e publicar conteúdo exigem decisões posteriores separadas.

## 6. Se uma etapa falhar

- [ ] Fechar gravações administrativas, preservar dump e evidências; não apagar tabelas/colunas/paradas para "corrigir".
- [ ] Conferir rollback de DDL/ACL/histórico da etapa que falhou e os checkpoints anteriores. Reexecução exata só pula fontes idênticas; divergência nunca autoriza repair automático.
- [ ] Preferir correção aditiva revisada. Se necessária restauração integral, ensaiar em ambiente compatível/separado e decidir explicitamente perdas e consistência banco/Storage.
- [ ] Nunca usar o script Windows como ferramenta para restaurar no Cloud: ele não tem essa capacidade. Não desabilitar `ensure_rls`, não voltar cegamente à versão com now() e não fazer deploy de produção nesta tarefa.
