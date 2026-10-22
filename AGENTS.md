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
Etapa 0: scaffold configurado com build, lint, testes, lockfile e base shadcn/ui. Etapa 1: migrations, RLS, Storage e seed demonstrativo implementados; veja docs/BANCO.md e docs/REVISAO.md para validação e limites. Home/rotas continuam demonstrativas. Próximo: Etapa 2 (frontend turista) e validação de integrações externas pendentes.
