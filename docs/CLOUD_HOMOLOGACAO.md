# Supabase Cloud, autenticação e hardening — entrega incremental

Branch: `work/cloud-auth-homologacao`, baseada em `work/etapa-2-turista` (`01c152e5c943c70202cfa776d07ec0a0f8e134ae`). Projeto informado pelo usuário: `descubra-sjdr`, ref `itegpsgjtuclbsatcdxr`, URL `https://itegpsgjtuclbsatcdxr.supabase.co`.

## Limites desta execução e relatório externo

O usuário forneceu os resultados de consultas reais, somente leitura, realizadas em outra sessão autorizada. Foram registrados fielmente em [RELATORIO_SUPABASE_CODEX.md](RELATORIO_SUPABASE_CODEX.md): PostgreSQL 17, 29 tabelas com RLS, três buckets, histórico remoto, negações anônimas e alertas do Advisor. Essa evidência é externa, não uma reexecução nesta sessão. **Nenhuma migration, seed, DDL ou escrita foi executada remotamente por esta entrega**.

A auditoria externa confirmou `has_role(admin)=false`, resgate/relatórios privados negados para anon e catálogo publicado vazio. O Security Advisor sinalizou quatro funções executáveis por anon e cinco por authenticated. Isso não é uma homologação completa de Auth/Storage HTTP e não fornece corpos completos, ACLs, políticas ou hashes para comparar equivalência.

Atualização em 22/10/2026: as duas variáveis públicas agora estão injetadas no processo e foram aceitas pelo gateway. Não foi necessário imprimir valores ou alterar o `.env.local` ignorado, cuja chave continua vazia; as variáveis do processo têm precedência. O runtime registra os dois requisitos ativos e nenhuma pendência de variável.

A primeira execução de `npm run test:cloud` retornou exit 2, `BLOCKED: Supabase gateway unreachable. No remote assertions executed.` Diagnóstico sem chave: DNS direto com `[Errno -3] Temporary failure in name resolution`, mas HTTPS pelo proxy autorizado retornou HTTP 401 (esperado sem chave). Ativando proxy nativo do Node 24, `node --use-env-proxy --env-file-if-exists=.env.local scripts/cloud-smoke.mjs` passou **23 verificações HTTP de leitura, zero falhas**. As duas verificações anunciante/admin ficaram `not_run`, sem sessões autorizadas.

Uma chamada de leitura adicional a `place_daily_metrics` confirmou negação para anon: HTTP 401, SQLSTATE 42501. As configurações públicas de Auth confirmaram e-mail habilitado, signup habilitado (`disable_signup=false`) e autoconfirmação desabilitada. Isso não comprova SMTP, CAPTCHA, callbacks ou login/recuperação com contas reais. Revisar o signup remoto para a fase de contas existentes; a interface sozinha não bloqueia a API.

Não há binding `SUPABASE_ACCESS_TOKEN`, conector Supabase ou acesso Vercel nesta sessão. Advisor, comparação privilegiada de definições, Auth com e-mail/usuários reais e Storage HTTP continuam pendentes. Roteiro completo de Preview, incluindo callbacks com query e limites operacionais: [VERCEL_PREVIEW.md](VERCEL_PREVIEW.md). Nenhuma configuração remota, dado, migration ou deployment foi alterado.

## Implementação da conexão

- Configuração única validada em `src/lib/supabase-config.ts`, compartilhada pelos dois clientes. Rejeita chaves privadas conhecidas, JWTs sem papel `anon`, quebras de linha e URLs com credenciais, caminho, query ou fragmento.
- Cliente de catálogo anônimo separado, sem persistência de sessão. O login não fornece seu JWT ao catálogo público. As projeções de dados foram centralizadas em `src/data/projections.json`, também usadas pelos testes remotos para validar colunas/relacionamentos mesmo com catálogo vazio.
- Cliente autenticado com PKCE, chave pública, renovação suportada pelo SDK e armazenamento isolado por projeto. Sessão/verificador no navegador; fallback em memória se o storage for bloqueado. Tokens não são impressos, enviados ao catálogo ou colocados em `VITE_*`.
- `npm run cloud:configure` recebe a chave pública **já autorizada** pela variável `VITE_SUPABASE_ANON_KEY`, valida formato, recusa conflito de projeto e grava apenas URL/chave em `.env.local` ignorado, com modo 0600. Não obtém/consulta chaves privadas nem substitui autenticação na Management API. Variáveis injetadas diretamente no processo também funcionam sem arquivo.

Para disponibilizar a chave, use o painel/API/conexão autorizada do projeto e configure a anon/publishable nas configurações seguras do ambiente. Não enviar `service_role`, senha do banco ou token administrativo para o frontend/chat. Reiniciar Vite/build após mudança das variáveis.

## Autenticação preparada

Rotas: `/entrar`, `/recuperar-senha`, `/auth/confirmar`, `/auth/nova-senha` e `/conta` (link no rodapé).

- Login por senha e magic link para **contas existentes**. `shouldCreateUser:false`; sem signup automático, credenciais padrão, perfis ou papéis administrativos criados pelo frontend.
- Recuperação de senha e troca com confirmação, mínimo 12 caracteres, maiúsculas/minúsculas/números, limite 128. A troca pela interface exige contexto de recuperação do SDK e usuário validado; query `type=recovery` não libera o formulário.
- PKCE com código de uso único, troca deduplicada para React StrictMode, remoção de parâmetros/fragmento da URL e redirecionamento restrito a `/conta` ou `/favoritos`. Não aceita token implícito ou destino externo da URL.
- `auth.getUser()` verifica o usuário no servidor. Admin vem de `has_role('admin')`, anunciante vem de vínculo próprio aprovado no banco. `user_metadata.role` é ignorado. Falhas de verificação fecham o acesso. Sair limpa a sessão deste navegador.
- Resposta genérica a magic link/recuperação evita expor se o e-mail existe. Erros brutos e tokens não são exibidos. Controles de rate limit/CAPTCHA/SMTP continuam dependendo do Auth remoto.
- Configuração local `supabase/config.toml` prepara callbacks explícitos, confirmação de e-mail e política de senha, sem alterar o Auth Cloud. Esse arquivo local **não comprova** que os mesmos ajustes estejam ativos no remoto.
- `/conta` exibe apenas a identidade/permissões verificadas. Não apresenta painel de gestão como pronto. MFA e exigência de `aal2` no servidor precisam ser homologados antes de liberar um painel administrativo em produção; esta entrega não bloqueia administradores legítimos por uma mudança cega na RLS.

O SDK persiste a sessão/verificador no navegador para permitir PKCE no mesmo navegador após abrir o e-mail. Isso requer defesa contra XSS; não equivale a cookies HttpOnly. O aviso de privacidade foi atualizado. Se o storage estiver bloqueado, o login por senha funciona em memória, mas PKCE entre recarregamentos pode exigir novo link. Recarregar a página de troca de senha requer iniciar novo contexto válido de recuperação.

## Segurança e migration adicional

Os arquivos `202610220001_core.sql`, `202610220002_storage.sql` e `202610220003_tourist_catalog.sql` permanecem sem alterações. A nova `20261022150000_security_hardening.sql` está **preparada e testada somente no PostgreSQL local descartável**. Não foi aplicada no Cloud.

Ela:

- reafirma ausência de `CREATE` em schemas confiáveis dos papéis PUBLIC/anon/authenticated (a auditoria externa já confirmou ausência de CREATE para anon/authenticated; não se trata de uma vulnerabilidade remota recém-detectada);
- fixa/reafirma `search_path` vazio nas funções conhecidas, sem trocar corpo, dono ou converter para INVOKER;
- restringe execução implícita de helpers/funções conhecidas com REVOKE explícito;
- preserva EXECUTE explícito necessário às políticas e às RPCs públicas, autenticação e backend;
- mantém resgate de cupom exclusivo do backend e analytics brutos restritos.

Não altera defaults globais de `postgres`: outras funções da plataforma podem ter esse dono. PostgreSQL não permite que um REVOKE de default por schema remova um grant global padrão; um teste local detectou essa limitação durante a revisão. A medida ineficaz foi retirada. Toda futura migration de aplicação deve fazer REVOKE PUBLIC e GRANT explícitos para cada nova função. O hardening cobre os objetos existentes conhecidos, sem prometer proteção automática de funções futuras.

O padrão `SECURITY DEFINER` é intencional em `has_role()` (evitar recursão de `user_roles`), `public_place_benefits()` e `public_route_sponsors()` (consultas públicas mínimas sem conceder leitura das tabelas comerciais). Busca fixa, projeções mínimas, publicação/propriedade, validade e grants explícitos são os controles; converter essas funções cegamente para INVOKER quebra permissões legítimas.

`public.rls_auto_enable()` não existe nas migrations locais. A auditoria externa verificou dona `postgres`, retorno `event_trigger` e `search_path=pg_catalog`. Seu corpo, ACL completa e dependências/event triggers ainda precisam ser inspecionados. Um event trigger pode precisar de SECURITY DEFINER para habilitar RLS em DDL. A migration **não cria, substitui, remove, desabilita ou altera** essa função. Não aplicar uma correção inferida só pelo nome do aviso. Os avisos de executabilidade por papéis da API continuam em revisão: remover toda execução de `has_role`/RPCs públicas impediria funcionalidades legítimas e não é uma solução segura.

Também foram preparados headers para a futura prévia Vercel: CSP sem scripts externos/eval, restrita ao projeto/OSM/Open-Meteo, `Referrer-Policy:no-referrer`, `nosniff`, proteção de framing e Permissions-Policy. Meta de referrer também foi adicionada. Esses headers não foram publicados em um CDN; precisam ser conferidos na prévia. Estilos inline são permitidos para compatibilidade com Leaflet.

## Reconciliação — antes de qualquer alteração remota

| Arquivo local preservado | Versão local | Nome esperado | Versão real remota |
| --- | --- | --- | --- |
| `202610220001_core.sql` | `202610220001` | `core` | `20261022141818` |
| `202610220002_storage.sql` | `202610220002` | `storage` | `20261022141828` |
| `202610220003_tourist_catalog.sql` | `202610220003` | `tourist_catalog` | `20261022141835` |

A divergência de timestamps está confirmada e o mapeamento autorizado está em `supabase/audit/remote-history.json`, com equivalência de definições explicitamente não confirmada. O comparador reconhece essas três correspondências, mantém a revisão de SQL pendente e detecta colisões/duplicações. A adicional usa `20261022150000`, posterior às versões remotas conhecidas. Não renomear as três originais nem considerar nomes iguais prova de SQL equivalente. Não executar `db reset`, seed, `db push` genérico, as três migrations antigas ou `migration repair` automaticamente. Não inserir/apagar registros do histórico para forçar compatibilidade.

1. Executar `supabase/audit/cloud-readonly.sql` via SQL Editor/conexão autorizada, em transação READ ONLY. Exportar **apenas** o JSON de metadados para `.audit/remote-readonly.json` ignorado. Não contém linhas de usuários/conteúdo, chaves ou configurações privadas de Auth.
2. `npm run test:db` gera `.audit/local-baseline.json` a partir das três migrations originais, antes do hardening, e `.audit/local-hardened.json` após a quarta. Esses arquivos são metadados de fixtures locais; **não são auditoria Cloud**.
3. Rodar `npm run cloud:audit -- .audit/remote-readonly.json .audit/local-baseline.json`. O comparador confere versões/nomes e colisões, tabelas/RLS, definições de colunas/constraints/índices, políticas, buckets e hashes de funções. Só nomes/versões não provam equivalência do SQL.
4. Inspecionar especificamente `supabase/audit/rls-auto-enable-readonly.sql`, comparar a definição real e os event triggers. Não publicar fontes se incluírem configuração sensível inesperada.
5. Executar o **Security Advisor oficial** no painel/conector autorizado ou `npm run cloud:advisors` com binding autorizado `SUPABASE_ACCESS_TOKEN` no servidor. O script faz apenas GET na Management API e salva achados sanitizados em `.audit/security-advisors.json`. Não baixa chaves de projeto ou senhas. A auditoria SQL customizada não substitui o Advisor oficial.
6. Revisar diferenças, efeitos/grants e os achados oficiais, escolher um timestamp novo sem colisão e reconciliar a procedência do histórico com o mantenedor. Só então planejar a aplicação **da migration adicional**, conforme autorização. Não há automação de aplicação nesta entrega.

Hashes de `pg_get_functiondef` podem divergir por versão/normalização/edição editorial; divergência exige inspeção, não substituição automática. O comparador nunca modifica banco ou histórico. Um resultado local sem achados não confirma o estado do remoto nem encerra pendências manuais.

## Testes remotos preparados, sem dados fictícios

`npm run test:cloud` usa somente a chave pública para GET/HEAD e as RPCs de leitura conhecidas. Valida projeções do catálogo, publicação, ausência de dados administrativos para anon, `has_role`, benefícios, patrocinadores e leitura das configurações públicas de Auth. Um preflight impede repetição de chamadas quando o gateway está bloqueado. Não executa DDL, seed, signup, envio de e-mail, INSERT/UPDATE/DELETE ou resgates.

Para testar anunciante/admin reais, bindings opcionais `CLOUD_ADVERTISER_ACCESS_TOKEN` e `CLOUD_ADMIN_ACCESS_TOKEN` devem vir de contas de teste **existentes e autorizadas**, somente em ambiente seguro. Sem eles, esses cenários ficam `not_run`, não passam por omissão. O script verifica identidade no Auth, papéis e limites de leitura sem imprimir usuários/tokens. Não cria identidades, senhas ou administradores.

Buckets e controles de escrita remotos são inspecionados pelo relatório SQL/grants/policies e devem ser homologados em ambiente adequado; este smoke não tenta escrever objetos fictícios no Cloud. Os testes locais cobrem escrita/negação por dono e admin, manipulação de caminhos, RLS, resgate, concorrência e invariantes.

Resultados da execução atual:

- Build, lint e suítes locais: aprovados no commit `b8e45a9` e nos dois jobs do GitHub Actions da PR #3; não repetidos nesta atualização de documentação.
- Vitest e Chromium: resultados finais em `REVISAO.md`; navegador usa respostas HTTP sintéticas exclusivas de teste.
- `test:db`: PostgreSQL 17 real descartável, quatro migrations **locais**, seed reexecutado, RLS e grants/hardening. Nenhuma conexão ao Cloud pelo runner.
- Comparação `.audit/local-hardened.json` × `.audit/local-baseline.json`: sem achados de hardening; `rls_auto_enable` ausente na fixture continua item de revisão. Não é comparação com Cloud.
- `test:cloud`: primeira tentativa sem proxy, exit 2. Execução com proxy nativo Node 24 passou 23 verificações HTTP, zero falhas; papéis autenticados `not_run`. Negação de métricas confirmada separadamente.
- `cloud:advisors`: bloqueio por ausência de binding Management API continua; comando não repetido desnecessariamente. Advisor oficial não reexecutado nesta sessão.
- Histórico Cloud e resultados do Advisor: conhecidos pelo relatório externo, sem reexecução aqui. Equivalência estrutural completa, corpos/ACLs/dependências, permissões dos usuários reais, Auth/CAPTCHA/MFA/SMTP e buckets HTTP: pendentes de acesso autorizado.

## Primeira prévia Vercel — sem publicar produção agora

1. Revisar esta PR e disponibilizar URL/chave pública corretas nas variáveis **Preview** da Vercel. Não copiar tokens privados, senhas ou bindings administrativos para `VITE_*`. Build `npm run build`, saída `dist`, Node 22.12+.
2. Confirmar a reconciliação do histórico e revisar a migration adicional; a existência das três migrations não autoriza reaplicação. Resolver achados remotos relevantes antes de declarar homologação concluída.
3. No Auth remoto, revisar Site URL e cadastrar o callback exato e suas variantes `?next=%2Fconta` e `?next=%2Ffavoritos`, conforme `VERCEL_PREVIEW.md`. Preservar URLs legítimas existentes, evitar wildcard amplo para previews não confiáveis e não substituir produção automaticamente.
4. Confirmar e-mail habilitado, SMTP/cotas de entrega, templates compatíveis com PKCE (`ConfirmationURL`), rate limit, CAPTCHA se exigido, política de senha e estratégia MFA administrativa. Nenhuma dessas opções Cloud foi alterada aqui.
5. Conferir na prévia os headers, assets/PWA, callback sem código visível, mapa/atribuição, catálogo vazio legítimo, busca, idiomas, favoritos, login/logout e recuperação com conta existente. Não publicar dados de demonstração para preencher a tela.
6. Manter pagamentos, criação automática de admin e deploy de produção desativados. O código está preparado para revisão; conexão/segurança remotas precisam das validações acima para afirmar que a prévia está homologada.
