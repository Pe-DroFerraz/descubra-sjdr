# Descubra SJDR — homologação Cloud (28/10/2026)

## Alterações confirmadas no Supabase Cloud

- Projeto: `itegpsgjtuclbsatcdxr`, PostgreSQL 17.11.
- Aplicadas as três migrations adicionais **exatamente a partir do pacote revisado** em `supabase/deploy/reviewed-additions.sql` do commit `31b280163ac2b6304cf0d30ed93b50e824a4036a` (conteúdo das migrations da PR #6):
  - `20261022150000_security_hardening`
  - `20261022170000_admin_route_stops`
  - `20261022180000_editorial_provenance`
- As três migrations originais (`core`, `storage`, `tourist_catalog`) permaneceram registradas, sem replay.
- O script versionado `supabase/audit/infra-postflight.sql` foi executado em transação READ ONLY com sucesso.
- Inspeção adicional: 29 tabelas em `public` com RLS; dez novas colunas editoriais nas cinco tabelas; RPC `admin_set_route_stops` instalada; três triggers de `route_stops` presentes.
- Nenhum lugar, roteiro, evento ou dica foi publicado ou importado. No instante da auditoria não existiam usuários `auth.users` ou arquivos em `storage.objects`.
- O Security Advisor continuou com avisos de SECURITY DEFINER públicos/autenticados (ver classificação no arquivo `docs/INFRA_HOMOLOGACAO.md`). Não revogar permissões legítimas sem auditoria funcional.

## Vercel

- Equipe `pedroeferraz-1272s-projects`, projeto `descubra-sjdr`, framework Vite.
- Variável pública `VITE_SUPABASE_URL=https://itegpsgjtuclbsatcdxr.supabase.co` **cadastrada para Preview** nesta sessão.
- `VITE_SUPABASE_ANON_KEY` já existe no Preview; confirmar apenas sua validade, sem revelar o valor.
- A nova Preview exige rebuild **após** a configuração para incorporar `VITE_*` ao bundle. Não tratar deploys anteriores como atualizados.
- Nenhuma implantação Production foi executada nesta sessão.

## Pendências para liberação administrativa

1. Rebuild Preview, verificar leitura pública, erro de configuração, rotas e headers.
2. Cadastrar URLs exatas de callback Supabase Auth; testar SMTP, PKCE, recuperação e entrega de e-mail.
3. Implementar/verificar MFA/AAL2 com desafio no cliente e enforcement na autorização administrativa. O frontend existente não o garante.
4. Homologar usuário administrador real, Storage HTTP (inclusive políticas de acesso a mídia draft), CRUD, RLS com sessões reais.
5. Revisar Security Advisor após homologação, com critérios de função legítima.
6. Validar e publicar informações turísticas reais uma a uma; não importar rascunhos como conteúdo publicado.
7. Implementar/homologar fluxos de anunciantes, cobranças, QR Codes e serviços auxiliares definidos na especificação.

## Recuperação

Foi informado teste local do backup CUSTOM no Docker com resultado `application_restored_with_limitations`. Esse teste restaura apenas o recorte da aplicação; não demonstra recuperação integral do Supabase Auth, Storage físico, ACLs ou serviços gerenciados. O dump real permanece apenas no computador do usuário. Não colocá-lo neste repositório.

## Segurança do release

Todas as alterações de banco acima foram concluídas antes desta atualização documental. Este commit não cria usuários, não altera auth settings, não configura produção e não contém credenciais. A liberação da administração continua bloqueada até a homologação.
