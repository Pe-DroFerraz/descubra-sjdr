# Auditoria Supabase Cloud — resultados fornecidos pelo usuário

Origem: consultas reais, somente leitura, realizadas em outra conversa do ChatGPT com conexão autorizada. O usuário transcreveu os resultados nesta sessão em 22/10/2026. Este registro preserva esses resultados; não significa que as consultas foram reexecutadas neste ambiente.

## Projeto

- Nome: `descubra-sjdr`.
- Project ID: `itegpsgjtuclbsatcdxr`.
- URL pública: `https://itegpsgjtuclbsatcdxr.supabase.co`.
- PostgreSQL 17.

## Histórico remoto confirmado

| Versão | Nome |
| --- | --- |
| `20261022141818` | `core` |
| `20261022141828` | `storage` |
| `20261022141835` | `tourist_catalog` |

As três migrations já foram aplicadas com sucesso. **Não executar novamente, recriar estruturas, apagar dados, semear ou reparar o histórico automaticamente.** Os arquivos locais usam versões diferentes; o mapeamento está registrado em `supabase/audit/remote-history.json`. Ainda é necessário comparar definições antes de concluir equivalência e planejar qualquer migration adicional.

## Estrutura e permissões verificadas

- 29 tabelas no schema `public`, todas com RLS habilitada.
- Buckets `place-photos` e `event-images` públicos; `qr-codes` privado.
- Papéis `anon` e `authenticated` sem permissão `CREATE` nos schemas `public` e `private`.

## Acesso anônimo verificado

- `has_role('admin')`: `false`.
- Resgate de cupons: negado.
- Relatórios privados: negados.
- Categorias, locais, roteiros e benefícios publicados: zero registros. O banco ainda não possui conteúdo publicado; isso não é falha nem autorização para cadastrar dados fictícios.

## Supabase Security Advisor

- Quatro alertas de funções `SECURITY DEFINER` executáveis por `anon`.
- Cinco alertas de funções `SECURITY DEFINER` executáveis por `authenticated`.
- Funções sinalizadas: `has_role`, `public_place_benefits`, `public_route_sponsors`, `place_daily_metrics` e `rls_auto_enable`.
- `public.rls_auto_enable()`: dona `postgres`, retorno `event_trigger`, `search_path=pg_catalog`. Não alterar sem revisar suas dependências.

Os avisos exigem revisão de corpos, permissões e dependências. Executabilidade de uma RPC pública com `SECURITY DEFINER` não comprova, por si só, vazamento ou escalada de privilégio. O relatório fornecido não contém corpos completos, ACLs completas, hashes de funções, vínculos de event triggers ou exportação das políticas.

## Alcance e continuidade

Este resultado **não constitui homologação completa de Supabase Auth ou Storage HTTP**. Permanecem testes de login/recuperação/e-mail, usuários reais anunciantes/admin, uploads/downloads e permissões HTTP dos buckets. O novo hardening deve ser revisado e testado, sem aplicação remota antes da reconciliação do histórico e análise dos efeitos.

Utilizar somente URL e chave anon/publishable no frontend, por variáveis de ambiente. Nenhuma chave, token, senha ou dado pessoal faz parte deste relatório. As variáveis declaradas pelo usuário como configuradas em outro contexto ainda precisam estar disponíveis no processo deste ambiente para executar integração HTTP aqui. Ver `CLOUD_HOMOLOGACAO.md` e `REVISAO.md` para os resultados locais e pendências desta entrega.
