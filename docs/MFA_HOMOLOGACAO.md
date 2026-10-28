# MFA e autorização administrativa — etapa de homologação

O painel editorial é protegido em **duas camadas**:

1. No React, somente usuários com participação administrativa verificada no banco veem o fluxo TOTP. Após o desafio, o frontend consulta novamente os papéis.
2. No PostgreSQL, \`public.has_role('admin')\` exige simultaneamente a associação em \`user_roles\` e JWT Supabase com claim \`aal=aal2\`. Todas as políticas e RPCs que reutilizam \`has_role('admin')\` passam pelo requisito do segundo fator. A função \`admin_membership()\` apenas informa ao próprio usuário autenticado se ele deve completar MFA; não concede acesso.

## Aplicação e homologação

A migration adicional \`20261028190000_admin_mfa_aal2.sql\` deve ser aplicada **após** as seis migrations já conferidas. Testar em preview e verificar os privilégios efetivos antes de liberar a área administrativa.

1. Criar conta de teste por convite/autenticação autorizada no painel Supabase, nunca inserindo senha diretamente em SQL. O banco anterior não possuía usuários; ninguém tem automaticamente acesso de admin.
2. Atribuir o papel admin ao UUID de uma conta real por sessão de administrador autorizado, após validar identidade; não usar e-mail digitado no cliente para atribuir papel.
3. Autenticar no preview e acessar \`/admin\`. Enrolar TOTP; verificar código real do aplicativo. Confirmar que no estado \`aal1\` o acesso admin é negado no **SQL/RLS** e em \`aal2\` é permitido.
4. Testar tentativas cruzadas de leitura/escrita nos dados de outro anunciante, além de INSERT/UPDATE/DELETE e RPCs como \`admin_set_route_stops\`.
5. Conferir configurações Auth: confirmação de e-mail, callback exato \`/auth/confirmar\`, SMTP, signup desabilitado ou explicitamente justificado, MFA TOTP habilitado. Usar domínio de produção aprovado posteriormente.
6. Não remover o último fator de administrador sem processo seguro de recuperação; provisionamento de novas contas e recuperação de TOTP são operações supervisionadas no Supabase.

**Não é possível comprovar autenticação AAL2 com contas reais sem criar/enrolar um usuário e confirmar o código do autenticador.** Os testes automatizados verificam contratos; não substituem homologação humana do segundo fator.

O restante do produto (assinaturas Asaas, QR tracking, IA, redes sociais e catálogo real) depende de integrações e revisões independentes. Este pacote não declara essas funções concluídas.
