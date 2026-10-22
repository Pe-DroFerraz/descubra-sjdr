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
