# Validar o backup no Windows

## O que já sabemos

O usuário informou em 28/10/2026: PostgreSQL e pg_dump **17.11**, formato **CUSTOM**, compressão **gzip**, **521.502 bytes**, catálogo com **942 entradas** e pg_dump com **exit code 0**. O arquivo está em:

```text
C:\Users\pedro\Documents\DescubraSJDR-Backups\descubra-sjdr-backup.dump
```

Esses resultados confirmam a criação informada pelo usuário, **não uma restauração já validada**. O Codex não recebeu nem acessou esse arquivo. Não enviar o dump, seus dados ou relatórios reais para o GitHub/chat.

## Executar — três passos

1. Tenha **PowerShell 7.2 ou superior** e **Docker Desktop com engine Linux** instalados e em execução. Não precisa criar uma senha de PostgreSQL nem usar a conexão do Supabase. O script detecta `pg_restore`, `pg_dump` e `psql` no PATH e em Program Files/PostgreSQL; se não houver pg_restore 17.11 nativo, usa o incluído na imagem. PowerShell 5.1 (`powershell.exe`) não é suportado: use `pwsh`. Instalação, se necessária, pelas instruções oficiais da Microsoft/Docker, sem alterar políticas globais de execução ou informar senhas ao script.
2. Abra PowerShell 7 na pasta do checkout que contém estes scripts. Execute:

```powershell
pwsh -NoProfile -File .\scripts\backup\Test-SjdrBackup.ps1
```

3. Leia `LEIA-ME.txt` e `resultado.json` na nova pasta `validacao-<identificador>` criada **ao lado do dump**, fora do repositório. O console informa o caminho. Preserve o dump original. A pasta de relatório nunca é reutilizada/sobrescrita.

Se o caminho precisar mudar, informe apenas um **arquivo local**:

```powershell
pwsh -NoProfile -File .\scripts\backup\Test-SjdrBackup.ps1 `
  -BackupPath 'D:\Backups\descubra-sjdr-backup.dump'
```

Para o arquivo informado nesta tarefa, mantenha os valores esperados padrão. Os parâmetros numéricos `ExpectedBytes` e `ExpectedEntries` existem para testes sintéticos ou um futuro backup identificado e revisado; alterá-los não demonstra que outro arquivo é o backup original. Não existe parâmetro de host, DSN, porta, usuário, senha ou Docker remoto.

A primeira execução pode baixar a imagem oficial `postgres:17.11`. Isso requer conectividade para o registro de imagens; **a restauração do banco não usa rede**. O script não faz login em registro, não pede senha e não lê `.env`, `.pgpass`, perfis de conexão ou configurações privadas. Não muda serviços PostgreSQL já instalados.

## O que o script verifica

- Arquivo local com tamanho esperado, assinatura `PGDMP`, SHA256, cabeçalho CUSTOM/gzip, origem/pg_dump 17.11 e 942 entradas declaradas no catálogo. Registra também quantas entradas foram listadas, sem presumir que todo item da listagem será restaurado.
- Ferramentas nativas disponíveis, engine Linux do Docker Desktop e servidor isolado efetivamente em PostgreSQL 17.11. Espera o processo final do PostgreSQL, não apenas o servidor temporário da inicialização.
- Banco **novo e descartável**, com nome aleatório. Somente pipes locais fixos do Docker Desktop; `DOCKER_HOST`/contextos e variáveis de conexão PG herdadas não selecionam o destino. A conexão PostgreSQL é por socket Unix **dentro do container**.
- Container sem rede, sem portas publicadas, filesystem somente leitura e dados em tmpfs. O dump é montado somente para leitura; não é copiado para o checkout nem regravado. Arquivos temporários contêm apenas DDL auxiliar e listas de objetos, não exportações de dados.
- As 29 tabelas previstas da aplicação e suas 29 entradas TABLE DATA. A restauração faz pre-data, data e post-data com parada no primeiro erro. Índices secundários, políticas, triggers e FKs internas são conferidos contra o inventário selecionado; constraints precisam estar validadas e RLS habilitada nas 29 tabelas.
- Contagem de linhas por tabela, sem consultar/exibir seus valores. Contagens zero são válidas; não são preenchidas com exemplos. Confere que o SHA256 do original não mudou durante o ensaio.
- Limpeza do container/volumes criados por esta execução e da área temporária, inclusive quando a restauração falha. O script só remove container com o identificador/label da própria execução.

O fingerprint gerado serve como registro para futuras comparações; sem um hash confiável anterior ele não comprova autenticidade. O teste não compara as contagens com o Cloud, porque não acessa o Cloud. A leitura do catálogo e a restauração selecionada não verificam os dados deliberadamente excluídos do arquivo.

## Escopo e limitações obrigatórias

Este é um **ensaio do recorte da aplicação**, não uma reprodução do Supabase completo:

| Item | Tratamento |
| --- | --- |
| `public` | As 29 tabelas esperadas, dados, tipos conhecidos, funções da aplicação, constraints, índices, triggers e RLS/policies |
| `private` | Somente helpers conhecidos da aplicação, sem tabelas/dados privados adicionais |
| `auth`, `storage`, `vault` e outros gerenciados | Dados excluídos. Não restaura `auth.users`, senhas/hashes, configurações privadas ou objetos binários do Storage |
| `auth.uid()` | Substituto local que retorna NULL, apenas para compilar dependências; não é autenticação real |
| FKs para schemas gerenciados | Identificadas no DDL e excluídas do ensaio; quantidade declarada no relatório. Nenhuma identidade artificial é criada para fazê-las passar |
| FKs entre tabelas da aplicação | Restauradas e validadas; falhas impedem sucesso |
| Extensões | Nomes e disponibilidade no PostgreSQL comum registrados; não instala extensões extraídas do dump. Prepara somente pgcrypto local. Dependências incompatíveis causam falha |
| Roles, owners e grants | Roles locais NOLOGIN permitem recriar políticas. `--no-owner --no-privileges` evita reproduzir roles/ACLs gerenciadas; permissões originais não são homologadas |
| `rls_auto_enable()` / `ensure_rls` | Não restaura o handler nem o event trigger de plataforma. Isso não testa sua recuperação real |
| Histórico de migrations / serviços | Não fabrica o histórico remoto nem restaura toda a plataforma. Não usar este banco parcial para marcar migrations como aplicadas |

As tabelas da aplicação podem conter dados pessoais. O ensaio processa esses dados **somente no PostgreSQL local temporário** para restaurar/contar, sem exportar registros. Saídas brutas de `pg_restore` podem incluir valores de uma linha com erro: ficam em memória e **não são gravadas ou reproduzidas**. O relatório só guarda códigos permitidos, metadados e contagens. Isso não é uma garantia de apagamento forense da memória/swap do computador.

**Não usar sucesso deste recorte como evidência de recuperação integral de Auth/Storage/roles/extensões.** Uma recuperação completa exige procedimento compatível com a infraestrutura Supabase e proteção das configurações/segredos fora do pg_dump. O dump do banco não contém os arquivos físicos dos buckets nem, necessariamente, configurações de SMTP/provedores/Edge Functions.

## Interpretar o relatório

- `application_restored_with_limitations`, exit 0: o recorte descrito restaurou, as verificações passaram e o container foi removido. Ler todas as limitações; `real_supabase_homologated` permanece false.
- `failed`, exit 1: arquivo, ferramenta, restauração, integridade ou limpeza não passou. Não tratar esse backup como validado por este ensaio.
- Se a pasta de saída for inválida, já existir ou estiver em um repositório, o script recusa a execução sem escrever nela e informa um código seguro. Pode não haver relatório nessa situação.

| Código / etapa | Próxima ação local |
| --- | --- |
| `backup_not_found` / `backup_size_or_expectation_mismatch` | Conferir o arquivo certo; não mudar os números para mascarar uma diferença |
| `not_custom_pg_dump` / `archive_header_mismatch` / `failed_archive_list` | Confirmar ferramenta/arquivo e preservar o original; investigar integridade/origem |
| `docker_desktop_missing` / `local_docker_linux_engine_unavailable` | Abrir Docker Desktop em modo Linux; não usar Docker remoto |
| `failed_pull_image` | Resolver acesso à imagem pública; não fornecer credenciais ao script |
| `postgres_start_timeout` | Verificar recursos/engine local; a restauração não começou |
| `failed_container_start` | Conferir compartilhamento local do arquivo, caminho e espaço/recursos do Docker Desktop |
| `failed_restore_pre_data`, `failed_restore_data`, `failed_restore_post_data` | Ensaio falhou nessa seção. Investigar dependências num ambiente local controlado sem divulgar saídas com dados; não ignorar erros para declarar sucesso |
| `restored_object_inventory_mismatch` / `application_integrity_check_failed` | Estruturas/políticas/constraints não correspondem ao inventário; revisão necessária |
| `backup_changed_during_validation` | O arquivo mudou durante a execução; repetir só com uma cópia original estável |
| `cleanup=failed` ou `unverified_not_removed` | Manter o relatório privado e remover apenas o container indicado, após conferir a label da execução |

Em caso de encerramento forçado do PowerShell/computador, `finally` pode não executar. Para localizar **somente os containers deste tipo** no Docker Desktop local:

```powershell
docker --host npipe:////./pipe/docker_engine ps -a --filter label=org.descubrasjdr.restore
```

Conferir o nome `sjdr-backup-<identificador>` e a label antes de remover aquele container específico. Não usar `prune`, não apagar outros bancos/volumes e não remover o dump. Se precisar de suporte, compartilhar somente o código seguro da falha e a etapa; não publicar dump, relatórios completos, usuários ou linhas de erro.

## Evidência disponível nesta entrega

O arquivo real não foi recebido. Os scripts foram exercitados com **dumps sintéticos** criados localmente por PostgreSQL/pg_dump 17.11 em CUSTOM/gzip. Testes verificam dados da aplicação, exclusão de dados de Auth, nove FKs externas identificadas na fixture, índices/RLS/constraints, erro de dependência não suportada, omissão de valores/erros brutos e limpeza. O Windows CI verifica parser, caminhos e proteções; não executa Docker Desktop nem usa seu arquivo. O ensaio completo com o dump real ainda precisa ser executado por você no Windows.
