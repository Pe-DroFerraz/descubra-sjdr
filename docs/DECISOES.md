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

## Etapa 2 — frontend turista
- Branch parte do HEAD Git da PR #1, sem merge. Revisão local e resultados em docs/ETAPA2.md; acesso à API GitHub permaneceu bloqueado para comentários/CI.
- Catálogo público com cliente anônimo dedicado, publicação e `is_demo=false` explícitos, paginação e validação Zod. Nenhum seed/fallback fictício em runtime.
- Leaflet/markercluster carregados sob demanda; OSM com atribuição, sem cache massivo. Nenhum HTML de banco é interpolado em popup.
- Horários no fuso de São Paulo, verificação com validade editorial de 30 dias; desconhecido é diferente de fechado. GPS só por ação explícita e sem gravação no banco.
- RPCs públicas mínimas para benefícios/patrocinadores preservam sigilo de dados comerciais; assinatura válida tem prazo conhecido pelo cliente e revalidação periódica. Sem benefício conhecido, não há selo/pin pago.
- Favoritos e dias locais, compartilhados por UUIDs validados em URL, com confirmação antes de substituir o plano local. Reordenação com alternativa de teclado; storage bloqueado não derruba o app.
- Conteúdo traduzido consultado do banco com fallback PT explícito; labels PT/EN/ES. Tradução automática e integrações comerciais não foram antecipadas.
- Ilustração vetorial editorial local no hero e placeholders neutros para mídia ausente. Não usamos fotos ou dados de estabelecimentos inventados.
- Testes de navegador com fixtures HTTP estritamente de teste e PostgreSQL com fixtures isolados. Isso verifica frontend e políticas, sem alegar homologação do Supabase Cloud.

## Cloud/Auth/hardening — entrega incremental
- Usuário informou core/storage/tourist_catalog já aplicadas no Cloud. Nenhuma reaplicação, reset, seed ou DDL remota. Arquivos originais preservados. Resultados verificados de outra sessão autorizada transcritos pelo usuário e preservados em docs/RELATORIO_SUPABASE_CODEX.md, com procedência explícita. Não confundir com homologação HTTP completa.
- Auth PKCE separado do catálogo anônimo, sem signup/admin automático. Identidade verificada via Auth e permissões obtidas da RLS/RPC, nunca de metadados editáveis. Erros públicos não enumeram contas.
- Sessões/verificadores isolados por projeto no browser, fallback em memória, callback deduplicado e sem redirects externos. CSP/referrer preparados para a prévia, sem deploy.
- Hardening aditivo preserva SECURITY DEFINER necessário e grants legítimos; fixa search_path/ACL/schema CREATE. Não muda defaults globais de postgres; futuras funções exigem revogações/grants explícitos (REVOKE por schema não supera o default global PUBLIC). Preservar rls_auto_enable: auditoria externa confirma postgres/event_trigger/search_path pg_catalog; corpo/ACL/dependências ainda precisam de inspeção.
- Auditoria de metadados em READ ONLY, baseline antes/depois em PostgreSQL descartável e comparação sem repair automático. Mapeamento explícito das versões locais para 20261022141818/28/35; hardening adicional 20261022150000 posterior. Histórico de nomes/versões não prova equivalência do SQL.
- Testes Cloud e Advisor oficial opt-in, sem dados fictícios ou escrita. Falta de chave/autorização/rede é bloqueio, não aprovação. Ver docs/CLOUD_HOMOLOGACAO.md.

## Preparo de Preview após CI da PR #3
- Base b8e45a9 preservada na aplicação; complementar documentação/ignore sem repetir manualmente testes locais aprovados. PRs permanecem sem merge.
- Variáveis públicas agora ativas; Node precisa de proxy nativo neste ambiente. Runner somente leitura com --use-env-proxy passou 23 verificações, papéis reais não executados. Métricas privadas negaram anon (401/42501).
- Auth público confirma e-mail habilitado, signup habilitado e autoconfirmação desabilitada. Não alterar remotamente sem acesso; registrar revisão de signup para contas existentes. Isso não comprova SMTP/CAPTCHA/MFA/callbacks.
- Preview Vercel preparado por guia específico, sem vínculo/acesso/deployment. Registrar as variantes reais de callback com next e preservar origem do PKCE. Variáveis Codex não são copiadas automaticamente para Preview. Nenhuma mudança no banco/hardening remoto.

## Gestão editorial e catálogo inicial
- Branch work/gestao-conteudo-turistico a partir de work/cloud-auth-homologacao (3d14509), conforme nova prioridade do usuário. Painel `/admin`, autorização por getUser/has_role a cada operação e RLS como limite final; sem service_role ou contas automáticas.
- CRUD em tabelas existentes, controle otimista updated_at e cache administrativo por usuário. Publicação requer confirmação editorial; data operacional desconhecida não é preenchida automaticamente. UI PT/EN/ES e estados públicos específicos por recurso.
- Nova RPC de paradas é SECURITY INVOKER, transacional e restrita a admin real, preservando RLS. Migration preparada/testada apenas localmente; originais e hardening anterior preservados e sem aplicação remota.
- Upload reprocessa imagem, valida tamanho/assinatura e confirma direitos, registra licença no Storage e compensa falha de vínculo; falha de limpeza é visível. Licenças com crédito obrigatório ficam fora até implementar créditos públicos. Buckets públicos não são cofres para rascunhos.
- Fontes primárias bloquearam HTTP por proxy403; fontes secundárias versionadas foram consultadas. Inconsistências SICG rejeitadas. Pacote separado do seed fictício: 24 candidatos, 15 endereços provisórios, nove ausentes, todos draft sem verified_at, seis roteiros preliminares. Gastronômico não recomenda estabelecimentos sem pesquisa.
- SQL de proposta preserva edições e não ressuscita paradas de roteiros existentes. Só geração/validação e execução no PostgreSQL descartável. Revisão humana e autorização separadas para importar rascunhos e publicar conteúdo real.

## Referências oficiais fornecidas externamente e proveniência

Em work/fontes-oficiais-editorial, preservar evidência local secundária separada das cinco referências oficiais fornecidas pelo usuário. Somente identidade de dez atrações e endereço do Museu Regional foram informados; horários divergentes continuam pendentes. Expandir para 28 candidatos, sem operação inferida. Seis propostas usam apenas identidades com essa referência oficial externa; gastronômico ainda sem estabelecimentos selecionados. Persistir URLs e nomes de campos pendentes em colunas públicas, mantendo notas detalhadas no controle de versão. Triggers SECURITY INVOKER preparados localmente impedem publicação incompleta, roteiros vazios e paradas não publicadas. Revisar impacto em conteúdo publicado legado e reconciliar histórico antes de aplicar qualquer adicional. Nenhuma escrita remota foi autorizada nesta entrega.

## Revisão de infraestrutura de 27/10/2026

Base 76459ad em work/fontes-oficiais-editorial; nova branch work/revisao-infra-homologacao. Revisar nos próprios arquivos somente as três adicionais ainda pendentes segundo o contexto fornecido. Originais preservadas. Corrigir versão apenas em routes com greatest(clock_timestamp(), OLD.updated_at + 1 microsecond), handler específico e constraint finita; mudanças diretas de paradas invalidam o pai, com validação final diferida. Preservar os demais 28 triggers e o contrato updated_at em microssegundos. Restrição de EXECUTE de rls_auto_enable sem substituir corpo/owner/evento, condicionada à forma/dependência auditadas e testada somente em substituto local. Implantação proposta com lock, fonte fixada, histórico/DDL atômicos por etapa e replay exato; nunca repair/replay de originais. MFA/AAL2 e confidencialidade de imagens em buckets públicos são bloqueios explícitos, sem alegar que foram resolvidos. Metadados privilegiados, Advisor e Auth/Storage reais ainda precisam de acesso/homologação.
