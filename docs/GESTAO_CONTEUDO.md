> Revisão de infraestrutura em 27/10/2026: as três migrations adicionais pendentes foram revisadas; versões de roteiros agora são monotônicas e mudanças diretas de paradas invalidam o pai. A proposta restringe apenas EXECUTE do handler de RLS, preservando corpo/owner/evento. Ver [INFRA_HOMOLOGACAO.md](INFRA_HOMOLOGACAO.md) para fontes, testes, limites e implantação segura. Não aplicar remotamente sem aprovação.

# Gestão de conteúdo turístico — revisão incremental

Base: `work/cloud-auth-homologacao`, commit `3d14509e954b142c793a88f4319d60ef7f26b412`, atualizada antes das alterações. Nova branch: `work/gestao-conteudo-turistico`. O usuário informou que a versão anterior já está em Preview Vercel integrada ao Cloud, sem conteúdo cadastrado. Esta entrega não publica produção nem altera banco, Auth, Storage ou dados remotos durante o desenvolvimento.

## Atualização com referências oficiais externas

Entrega incremental em `work/fontes-oficiais-editorial`, baseada no commit `d325646f70d57b278bbeae2d330da0b95f8e7ba0` da branch `work/gestao-conteudo-turistico`, previamente atualizada. A base original `work/cloud-auth-homologacao` permanece preservada. Esta versão amplia o painel existente; nenhuma PR foi mesclada.

Todos os formulários agora editam `source_urls` e `pending_fields`, uma entrada por linha, com validação e persistência. São **campos potencialmente públicos**, inclusive via API dos registros publicados. Use apenas referências e nomes de campos, nunca comentários privados ou dados pessoais. Os detalhes da evidência externa ficam no JSON versionado. A prévia do catálogo identifica referências fornecidas em outra sessão e o endereço externo do Museu Regional, sem afirmar acesso local aos portais.

Publicação exige fontes HTTPS sem credenciais, nenhuma pendência, nome/título e descrição; locais também exigem endereço. A confirmação humana continua obrigatória na interface e não substitui revisão factual. Não é obrigatório inventar horários/preços/coordenadas/fotos: quando permanecerem desconhecidos, não preencher; a retirada de uma pendência depende de revisão consciente do que pode ser publicado sem esse dado. Roteiros só publicam com paradas existentes, publicadas e sem demonstração. É preciso despublicar os roteiros relacionados antes de retirar um local do catálogo.

O banco Cloud ainda precisa oferecer as novas colunas. Se ausentes, o painel identifica **migration pendente**, bloqueia a edição e mantém a consulta do pacote editorial disponível. Não usa fallback que descarte fontes. O frontend público mantém suas projeções anteriores e não depende dessas colunas.

## Painel executável

Acesso em `/admin`, por link na conta somente para quem possui papel admin verificado. Interface responsiva com navegação por seções, busca, filtros editoriais, formulários, confirmações e PT/EN/ES. O conteúdo editorial do pacote permanece em português, como as demais traduções editoriais com fallback explícito da aplicação.

| Seção | Operações |
| --- | --- |
| Categorias | Criar, listar, buscar, editar, publicar/despublicar e excluir, respeitando vínculos |
| Pontos turísticos | Nome/URL, categoria, descrição, endereço, coordenadas, contatos, site, preço opcional, verificação e estado editorial |
| Fotografias de locais | Upload com direitos, listagem, edição de descrição acessível/posição, consulta de direitos e exclusão de vínculo/objeto |
| Roteiros | CRUD dos metadados, clima editorial e duração opcional; gestão ordenada de paradas em seção própria |
| Paradas | Adicionar/remover locais, duração opcional, ordenar com botões acessíveis e gravar atomicamente com verificação de versão |
| Eventos | CRUD com início/fim reais informados pelo editor e verificação obrigatória para publicar; upload, troca e remoção da imagem |
| Dicas úteis | CRUD de texto, tipo, coordenadas opcionais e estado editorial |
| Catálogo inicial | Consulta dos candidatos, fontes e roteiros versionados; nenhuma importação automática |

Não há criação automática de usuários/admins ou uso de `service_role` no navegador. Atribuir o papel admin a uma conta existente é uma ação privilegiada separada: confirmar a identidade e o responsável, revisar a concessão e a política MFA no projeto real, e somente então conceder pelo procedimento administrativo autorizado. Nenhuma concessão foi executada aqui.

## Autorização e consistência

- O guard valida a identidade com `auth.getUser()` e o papel via `has_role('admin')` no backend. `user_metadata.role` não concede acesso. Usuário sem sessão volta ao login; usuário sem papel recebe acesso restrito.
- Cada consulta/mutação do módulo revalida usuário e papel no servidor. As políticas RLS existentes decidem o acesso final, inclusive se o papel for revogado depois da checagem. O gate visual não é a única proteção.
- Queries administrativas usam namespace e ID do usuário; cancelamento/remoção do cache ocorre ao sair do painel ou trocar a identidade. O catálogo continua com cliente anônimo separado e não herda o JWT administrativo.
- Payloads passam por schemas Zod e lista fechada de tabelas/campos. URLs somente HTTPS, coordenadas em pares, datas locais convertidas por `America/Sao_Paulo`, término posterior ao início, nenhuma data de verificação futura. Datas existentes não são arredondadas em edição de outro campo.
- UPDATE e DELETE exigem o `updated_at` lido pelo editor. Nenhuma linha alterada implica conflito; não ocorre overwrite silencioso. Exclusões pedem confirmação e preservam os vínculos que exigem revisão.
- Publicação exige confirmação editorial explícita. Eventos publicados precisam de verificação; conteúdo de demonstração não pode ser publicado pelo painel. Essa confirmação humana não comprova, por si só, a veracidade de fontes; a revisão do pacote é necessária.
- Anunciantes mantêm os direitos legítimos definidos na RLS anterior. Não podem usar o módulo administrativo ou a RPC de paradas apenas por possuir uma conta autenticada.

## Migration adicional — somente preparada

`supabase/migrations/20261022170000_admin_route_stops.sql` cria apenas `admin_set_route_stops(uuid,timestamptz,jsonb)`, sem novas tabelas ou importação de conteúdo. A função é **SECURITY INVOKER**, fixa `search_path`, exige admin real, mantém RLS, bloqueia a linha do roteiro, compara a versão e substitui as paradas em uma transação. Posição é derivada da ordem do array. Quantidade limitada, campos extras rejeitados, duplicatas/referências inválidas fazem rollback. Roteiros já publicados não aceitam paradas em locais não publicados/demonstração. EXECUTE público/anon é revogado, authenticated recebe execução com autorização interna.

Ela foi aplicada **apenas** no PostgreSQL 17 descartável dos testes. Não foi aplicada no Cloud. Se a RPC ainda não existir remotamente, o painel mostra a pendência de homologação e não tenta salvar a ordem em operações parciais. CRUD usa as tabelas existentes com novas colunas editoriais; esta versão depende também da migration de proveniência, e as paradas dependem da nova RPC.

As três migrations Cloud originais continuam intactas e não foram reaplicadas. A migration anterior `20261022150000_security_hardening.sql` também permanece intacta e pendente. Antes de qualquer nova aplicação, reconciliar versões e definições reais com o mapeamento/auditoria já documentados em `CLOUD_HOMOLOGACAO.md`; revisar cada migration adicional separadamente. Não usar `db push`, reset, repair ou seed genérico para tentar resolver o histórico divergente. `rls_auto_enable()` não foi alterada.

### Proveniência e bloqueios no PostgreSQL

`supabase/migrations/20261022180000_editorial_provenance.sql`, **somente local**, adiciona duas colunas às cinco tabelas editoriais. Não cria tabelas, não importa/publica dados, não altera RLS/grants e não modifica `rls_auto_enable()` ou as três migrations originais. Três funções de trigger no schema `private` usam SECURITY INVOKER, search_path vazio e EXECUTE revogado para PUBLIC/anon/authenticated; funcionam via triggers, sem criar RPC privilegiada.

O banco valida fontes/pendências e completude de cada gravação publicada; demonstrações não podem publicar. Roteiros exigem paradas publicadas. Triggers sobre paradas também protegem gravações REST diretas: locks serializam o acesso relacionado, e uma constraint diferida verifica o estado final após substituição transacional. Retirar o último ponto ou vincular rascunho a um roteiro publicado faz rollback. A retirada de um local exige primeiro despublicar seus roteiros.

**Efeitos a revisar:** gravações futuras em conteúdo publicado legado sem proveniência serão recusadas até revisão; a migration não despublica nem corrige automaticamente esses registros. `supabase/audit/editorial-preflight.sql` apresenta contagens de impacto sem modificar dados. Não é teste de veracidade de fontes. Revisar também concorrência/volume e comportamento das políticas efetivas no Cloud; a suíte local não substitui homologação remota.

Antes do Cloud, reconciliar os três timestamps locais/remotos conhecidos e revisar separadamente as adicionais: hardening (150000), paradas (170000) e proveniência (180000). Não executar `db push`, repair/reset/seed ou o pacote SQL automaticamente. As três adicionais permanecem pendentes de aplicação remota autorizada.

## Storage e direitos das imagens

Buckets existentes: `place-photos` e `event-images`. O módulo não cria/reconfigura buckets ou permissões.

- Arquivo original não vazio, até 5 MiB, MIME/assinatura real JPEG, PNG, WebP ou AVIF; decodificação validada e limite de 40 megapixels. Conversão para WebP até 2400 px remove EXIF/localização embutida. O nome original do arquivo não é usado no Storage.
- Caminho `<UUID-do-local-ou-evento>/<UUID-aleatório>.webp`, `upsert:false`, MIME real e metadata de autor, fonte, licença, descrição e confirmação de direitos. As regras de bucket/RLS do servidor continuam obrigatórias; validação no browser não as substitui.
- São aceitos apenas autoria própria com autorização de exibição sem crédito obrigatório, CC0 ou domínio público com fonte. Não copiar fotos de busca, redes sociais ou páginas oficiais presumindo licença livre. CC BY/SA e demais licenças com crédito/compartilhamento obrigatório aguardam suporte de créditos públicos antes de serem aceitas.
- Nenhuma imagem externa foi baixada/republicada ou incluída no catálogo inicial. Direitos de uso continuam sujeitos a revisão humana e comprovação.
- Se o vínculo é recusado pelo banco após upload, tentamos remover o novo objeto. Se uma falha de transporte torna incerto se a gravação foi confirmada, preservamos o objeto e informamos o caminho para reconciliar vínculo/arquivo antes de reenviar; não apagamos uma imagem que pode estar vinculada. Se a compensação falha, informamos caminho órfão para revisão no Storage. Na exclusão ou troca, falha ao remover o objeto antigo gera aviso, sem esconder a operação parcial. Não há limpeza automática genérica de objetos.
- Antes de excluir local/evento, remover imagens vinculadas. FKs e patrocinadores impedem exclusões indevidas. Caminhos legados fora do padrão exigem revisão manual antes de remoção pelo módulo.
- Buckets públicos permitem leitura por URL conhecida **mesmo para imagens de rascunhos**. O aviso existe no painel; nunca enviar documentos pessoais, dados privados ou materiais sem direitos.

Storage HTTP real com conta admin e arquivos autorizados ainda precisa de homologação. Os E2E usam servidor HTTP interceptado, e PostgreSQL usa contratos mínimos simulados de Auth/Storage. Não equivalem a uploads reais no projeto Cloud.

## Catálogo e interface pública

Proposta e fontes em `content/catalogo-inicial.json`, `content/fontes-consultadas.json` e [CATALOGO_EDITORIAL.md](CATALOGO_EDITORIAL.md). São 28 candidatos, um endereço confirmado na referência externa fornecida, 14 provisórios e 13 não confirmados; todos em rascunho e sem `verified_at`. Há cinco categorias não publicadas, seis roteiros com paradas relacionadas e nenhuma programação futura, avaliação, preço, assinatura ou foto inventada. O roteiro gastronômico precisa de seleção real de estabelecimentos; suas paradas atuais são referências urbanas, explicitamente provisórias.

```sh
npm run catalog:check
npm run catalog:sql
```

Esses comandos validam o pacote e geram `content/catalogo-inicial.sql`; **não conectam ao banco**. O SQL é uma proposta separada de migrations e do seed demonstrativo, para revisão antes de qualquer importação autorizada. Preserva registros por ID, falha diante de conflitos de slug com outros IDs e não insere paradas novamente em roteiros já existentes. Registros já existentes não recebem automaticamente as novas fontes ou alterações das paradas: reconciliar manualmente sob revisão, sem sobrescrever curadoria. Nunca executar o seed demonstrativo para preencher o Cloud.

A interface pública diferencia ausência de locais publicados, roteiros em preparação, eventos sem programação confirmada e filtros sem resultado. Erro de rede tem mensagem própria e botão de repetição. Cards exibem endereço real quando informado, fotografia com proporção consistente e interação discreta; imagem que falha vira placeholder explícito, sem trocar por outra fotografia. Contraste e overflow mobile são verificados nos testes automatizados; não é uma auditoria manual completa.

## Preview e Auth

O módulo pode ser revisado em Preview da nova branch após CI. Não altera automaticamente o Preview existente ou as variáveis Vercel. Manter URL/chave pública do mesmo Supabase no escopo Preview; nunca copiar sessões/admin tokens para `VITE_*`.

A allowlist de Auth precisa incluir, para a origem HTTPS real e confiável usada nesta branch, **também** `<origem-preview>/auth/confirmar?next=%2Fadmin`. O login aceita somente `/admin`, `/conta` ou `/favoritos` como destino; subcaminhos arbitrários não são aceitos. Preservar os callbacks anteriores, templates `ConfirmationURL` e origem do verificador PKCE conforme `VERCEL_PREVIEW.md`. Nenhuma configuração de Auth remoto foi alterada.

MFA/AAL2, signup habilitado na última leitura, SMTP/CAPTCHA, sessão admin existente e permissões HTTP de Storage continuam exigindo homologação autorizada no ambiente real antes de liberar gestão em produção. Não criamos usuários nem ativamos credenciais fixas para contornar essas pendências.

## Aprovações antes de alterar dados no Cloud

1. Revisar a PR, o código do módulo, resultados e limites de homologação. Não fazer merge/deploy de produção automaticamente.
2. Reconciliar histórico/definições e revisar o efeito das migrations adicionais, incluindo a RPC de paradas. Aprovar explicitamente a aplicação pretendida; não reaplicar as três originais.
3. Aprovar separadamente a importação dos **rascunhos**, após conferir JSON/SQL, IDs, slugs, categorias, procedência e conflitos com conteúdo eventualmente criado no painel. O pacote não possui comando de importação remota.
4. Antes de tornar qualquer registro público, confirmar fontes primárias, nomes/sede atuais, endereços/entradas (13 ainda ausentes), descrições, mapa, acessibilidade e visitação. Revisar percursos e a seleção gastronômica. Horários/preços desconhecidos permanecem desconhecidos.
5. Aprovar fotografias e sua licença/autorizações, revisar a exposição dos buckets públicos e testar operações HTTP com uma conta administrativa existente e autorizada.
6. Confirmar o responsável administrativo, papel no banco, callback da prévia e política de autenticação/MFA. Publicar manualmente só os conteúdos individualmente aprovados pelo editor.

Não houve escrita remota, aplicação de migrations, importação, upload real, envio de e-mail, merge ou deploy de produção nesta entrega.
