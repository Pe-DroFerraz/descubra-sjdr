# Instruções para Codex — Descubra SJDR

Leia `docs/ESPECIFICACAO.md` antes de toda implementação. O projeto é uma PWA turística React 18 + Vite + TypeScript + Supabase. O objetivo é um produto completo e seguro, não apenas uma demonstração visual.

## Regras
- Implemente etapas progressivas, priorizando código executável, testes e documentação.
- Segurança: RLS em todas as tabelas, validação de payloads, Edge Functions para credenciais, não expor chaves privadas no frontend.
- Cuidados: dados de lugares e eventos de exemplo são fictícios até validação; não simular disponibilidade, horário ou preços como reais.
- Acessibilidade, responsividade, PT/EN/ES, estados de erro e carregamento.
- Nunca comitar arquivos .env privados, chaves ou credenciais.
- Após cada etapa, rodar `npm run build` e testes, corrigir falhas e documentar lacunas de integrações externas.
- Dividir alterações em branches/PRs para revisão. Não promover funcionalidades à produção sem testes.

## Estado
Etapas 0/1 implementadas, PR #1 sem merge automático. Etapa 2 implementada na branch `work/etapa-2-turista`: catálogo turístico real via Supabase, Home, Leaflet, lugares/detalhes, roteiros, viagem/favoritos, eventos e dicas. Leia docs/ETAPA2.md e docs/REVISAO.md para testes e limites. Sem variáveis públicas Supabase, não apresentar dados de demonstração como produção. Branch incremental `work/cloud-auth-homologacao` prepara Auth, auditoria e migration adicional; leia docs/CLOUD_HOMOLOGACAO.md. A auditoria externa em docs/RELATORIO_SUPABASE_CODEX.md registra versões remotas diferentes (mapeadas em supabase/audit/remote-history.json). O usuário confirma as três migrations já aplicadas no Cloud: NUNCA reaplicar/resetar/semear remotamente. Não aplicar o hardening antes de reconciliar o histórico e revisar efeitos. Nova prioridade do usuário: gestão editorial implementada em work/gestao-conteudo-turistico, baseada em 3d14509; leia docs/GESTAO_CONTEUDO.md e docs/CATALOGO_EDITORIAL.md. Nenhuma escrita remota autorizada sem revisão. Proposta atual com 28 candidatos/um endereço confirmado externamente, 14 provisórios, 13 ausentes e seis roteiros; não considerar homologada. Não aplicar arquivos de supabase/tests no Cloud. Próximo: revisão editorial e homologação administrativa autorizadas.

## Atualização editorial incremental

A branch work/fontes-oficiais-editorial parte de d325646 (work/gestao-conteudo-turistico), não da main. O pacote contém 28 candidatos, um endereço confirmado externamente, 14 provisórios e 13 ausentes. Fontes oficiais fornecidas pelo usuário são evidência de outra sessão, não acesso local. Horários do Museu Regional permanecem divergentes/pendentes. Todos os candidatos e seis roteiros continuam draft. A migration 20261022180000_editorial_provenance.sql foi preparada/testada somente localmente, como as adicionais anteriores; não aplicar remotamente sem reconciliação/revisão/autorização. Formulários dependem dessas novas colunas, e informam a ausência sem descartar fontes. Não importar dados remotamente sem aprovação separada.

## Revisão de infraestrutura (27/10/2026)

Nova entrega sobre 76459ad: work/revisao-infra-homologacao. Leia docs/INFRA_HOMOLOGACAO.md antes de implantação. As três adicionais pendentes foram revisadas; NÃO executar se alguma já tiver sido aplicada com fonte diferente. Função específica torna versões de routes monotônicas; stop edits diretos invalidam o pai. Hardening só restringe ACL de rls_auto_enable, sem mudar corpo/owner/evento. O envelope supabase/deploy/reviewed-additions.sql é proposta, não autorização: guarda mapeamento do histórico, fonte exata e commits por etapa. Não combinar com db push/up/repair. Não usar fixtures ou o substituto de event trigger no Cloud. Testes locais não homologam Auth/Storage reais. AAL2 ainda não é exigido no painel e mídia draft em bucket público não é confidencial; resolver/revisar antes de liberar administração sensível.

## Backup Windows (28/10/2026)

Base 685ebb5/PR #6; entrega work/validacao-backup-local. O dump real fica somente no Windows do usuário e NÃO está disponível aqui. Não solicitar/uploadar o dump nem publicar relatórios reais. Leia docs/BACKUP_WINDOWS.md e docs/CHECKLIST_IMPLANTACAO_ADMIN.md. O script testa recorte da aplicação em PG17.11 local sem rede/portas; exclui dados gerenciados, owners/ACLs e FKs externas, com limitações explícitas. Testes sintéticos não validam o arquivo real nem recuperação integral do Supabase. Não aplicar migrations/restore no Cloud; seis migrations/envelope da base preservados.
