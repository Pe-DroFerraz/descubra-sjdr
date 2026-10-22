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
Etapas 0/1 implementadas, PR #1 sem merge automático. Etapa 2 implementada na branch `work/etapa-2-turista`: catálogo turístico real via Supabase, Home, Leaflet, lugares/detalhes, roteiros, viagem/favoritos, eventos e dicas. Leia docs/ETAPA2.md e docs/REVISAO.md para testes e limites. Sem variáveis públicas Supabase, não apresentar dados de demonstração como produção. Branch incremental `work/cloud-auth-homologacao` prepara Auth, auditoria e migration adicional; leia docs/CLOUD_HOMOLOGACAO.md. A auditoria externa em docs/RELATORIO_SUPABASE_CODEX.md registra versões remotas diferentes (mapeadas em supabase/audit/remote-history.json). O usuário confirma as três migrations já aplicadas no Cloud: NUNCA reaplicar/resetar/semear remotamente. Não aplicar o hardening antes de reconciliar o histórico e revisar efeitos. Próximo: concluir homologação autorizada e Etapa 3.
