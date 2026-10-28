O backup manual foi criado no Windows, mas ainda falta testar sua restauração. Esta PR prepara um ensaio local com PowerShell 7 e PostgreSQL 17.11 isolado, sem conexão de banco ao Supabase, credenciais solicitadas ou publicação do dump.

Base: `work/revisao-infra-homologacao`, commit `685ebb5` (PR #6). Nova branch `work/validacao-backup-local`, em rascunho. **O arquivo real não foi recebido nem testado pelo Codex.** Dados fornecidos pelo usuário: CUSTOM/gzip, 521.502 bytes, 942 entradas e pg_dump exit 0.

- Detecção de ferramentas PostgreSQL no Windows; validação de assinatura/cabeçalho, tamanho e SHA256; PostgreSQL 17.11 em Docker Desktop Linux por pipes locais fixos. Nenhum parâmetro de host/DSN/senha.
- Container sem rede, portas ou volume de dados persistente; dump read-only, dados em tmpfs e remoção condicionada à label da execução. Saída nova fora do Git, sem sobrescrever relatórios.
- Restauração das 29 tabelas/dados e objetos conhecidos da aplicação, verificação de índices, triggers, RLS e FKs internas. Dados de auth/storage/vault, owners/ACLs e FKs externas deliberadamente excluídos; extensões não são instaladas do dump.
- Relatório sanitizado de metadados, códigos e contagens. Não grava linhas ou erros brutos que possam conter conteúdo do COPY. Limitações impedem interpretar o recorte como recuperação integral do Supabase.
- Testes sintéticos PG17.11 CUSTOM/gzip, sucesso/erro de dependência, dados/escopo/limpeza e proteções de caminhos/relatórios. CI inclui integração Linux e parsing/proteções no Windows; não usa o arquivo real ou Docker Desktop no runner Windows.
- Guia simples Windows e checklist de implantação aprovado/checkpoints/rollback, triggers/RPCs, grants/RLS, Advisor, Auth/Storage e integridade.

Validação local: build, lint, **113 testes unitários**, PostgreSQL herdado, **26 E2E**, testes PowerShell e restauração sintética passaram. As **seis migrations e o envelope da PR #6 permanecem idênticos à base**; `prepare-reviewed-deployment.mjs --check` passou. Ordem reconfirmada: security_hardening → admin_route_stops → editorial_provenance, sem replay/repair das três originais.

Pendências: executar no Windows com o dump real e revisar o resultado/limitações; confirmar recuperação de Auth/Storage/roles/configurações fora do recorte; exportação privilegiada e aprovação antes do Cloud. Continuam os bloqueios de Auth/MFA/AAL2 e mídia em buckets públicos descritos na PR #6.

Instruções em `docs/BACKUP_WINDOWS.md`, procedimento em `docs/CHECKLIST_IMPLANTACAO_ADMIN.md` e resultados em `docs/REVISAO.md`. Sem alterações remotas, aplicação de migrations, restore Cloud, importação de conteúdo turístico, merge ou produção. Não enviar dump ou relatórios reais ao GitHub.
