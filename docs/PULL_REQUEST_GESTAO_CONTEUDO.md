## Resultado

O catálogo remoto está vazio e faltava uma interface editorial. Esta PR adiciona `/admin` com CRUD responsivo de categorias, pontos turísticos, fotografias, roteiros/paradas, eventos e dicas. A identidade e o papel admin são verificados no servidor antes das operações, e RLS continua sendo a autorização final. Não há criação automática de contas ou chaves privadas no frontend.

Base: `work/cloud-auth-homologacao` (`3d14509`). Entrega incremental em rascunho, sem merge ou produção.

- Formulários validados, estados editoriais, confirmação para publicar/excluir, datas de São Paulo e controle de versão para evitar overwrite de edição concorrente.
- Upload de imagens com validação de arquivo/assinatura/limites, reprocessamento sem EXIF, direitos declarados, UUIDs no caminho, compensação e aviso de objetos órfãos. Nenhuma fotografia externa foi copiada/publicada.
- RPC de paradas SECURITY INVOKER com validação de admin/RLS, lock, verificação da versão e substituição atômica. Migration adicional preparada/testada **somente localmente**.
- Estados públicos específicos de locais, roteiros e eventos; filtros vazios diferentes de catálogo vazio/erro de rede; cards/endereço/fotos e contraste mobile melhorados.
- Pacote editorial separado do seed: **24 candidatos em rascunho, 15 endereços provisórios e nove não confirmados**, cinco categorias não publicadas e seis roteiros relacionados. Sem horários, preços, avaliações, eventos futuros ou assinaturas inventados. O gastronômico ainda exige seleção real de estabelecimentos.

## Pesquisa e revisão editorial

Os portais primários de turismo/IPHAN/museus ficaram bloqueados pelo proxy (`Tunnel connection failed: 403 Forbidden`). Foram consultados espelhos versionados de dados SICG/IPHAN, extração MuseusBr e Wikipédia. Inconsistências de endereço foram identificadas e rejeitadas; não apresentamos essas cópias como verificação atual no responsável.

A meta de vinte atrações com endereço plenamente confirmado **ainda depende de pesquisa primária/revisão**: há 24 candidatos, apenas 15 endereços provisórios e nove ausentes. Tudo fica draft, sem verified_at ou coordenadas inferidas. Fontes e extratos em `content/` e `docs/CATALOGO_EDITORIAL.md`. A tela de revisão não tem ação de importação remota.

## Validação executada

| Comando/verificação | Resultado |
| --- | --- |
| `npm run build` | Passou — TypeScript, Vite e PWA |
| `npm run lint` | Passou |
| `npm test` | 100 testes passaram, 15 arquivos |
| `npm run test:db` | Passou — PostgreSQL 17 isolado, cinco migrations locais, RLS/admin/non-admin, CRUD, rollback/ordem/conflito de paradas, Storage SQL, seed e resgate concorrente |
| Proposta editorial no banco descartável | Importação repetida, drafts invisíveis para anon, relações preservadas e respeito a edições/paradas removidas |
| `npm run test:e2e` | 23 cenários passaram em Chromium: CRUD, papel forjado/revogado, concorrência, mídia, paradas, frontend turista, idiomas e estados |
| axe WCAG automático | Home desktop/mobile e painel mobile passaram nas regras executadas; não substitui auditoria manual completa |
| `npm run catalog:check` | 24 candidatos, 15 endereços provisórios, seis roteiros; sem conexão/escrita remota |

Fixtures de navegador e banco são exclusivamente locais, com contratos mínimos de Auth/Storage. CRUD/upload HTTP no Cloud com conta admin existente ainda precisa de homologação autorizada. Não executamos writes, uploads, atribuição de papel ou e-mails no projeto real.

## Antes de importar ou publicar no Cloud

1. Revisar esta PR e reconciliar histórico/definições antes de aprovar a nova migration RPC. As três migrations originais e o hardening anterior permanecem intactos; não reaplicar/resetar/seed/db push genérico.
2. Aprovar separadamente JSON/SQL e conflitos de IDs/slugs antes de importar rascunhos. Não há automação de importação.
3. Confirmar fontes primárias, sede/endereços/entradas, descrições, mapa, acessibilidade e percursos; concluir a pesquisa gastronômica. Publicar apenas os registros aprovados individualmente.
4. Aprovar direitos das fotografias. Nesta versão, licenças que exigem créditos públicos (CC BY/SA) não são aceitas. Buckets públicos expõem arquivos por URL conhecida mesmo em rascunho.
5. Homologar conta admin/MFA, Storage HTTP e callback exato da prévia incluindo `?next=%2Fadmin`. Nenhuma configuração de Auth remoto foi alterada.

Guia completo: `docs/GESTAO_CONTEUDO.md`. Sem merge automático das PRs anteriores, alteração de `rls_auto_enable`, publicação de dados turísticos ou deploy de produção.
