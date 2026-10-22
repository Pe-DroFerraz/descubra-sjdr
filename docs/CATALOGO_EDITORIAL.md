# Catálogo editorial inicial de São João del-Rei

**Proposta para revisão, sem autorização de importação ou publicação.** Atualizada em 22/10/2026: 28 candidatos, seis roteiros e cinco categorias em rascunho. Um endereço confirmado na evidência externa fornecida pelo usuário, 14 provisórios de referências secundárias e 13 ausentes. Não há horários, preços, coordenadas, contatos, eventos futuros ou fotografias preenchidos por inferência.

## Procedência e limites

As cinco fontes oficiais abaixo foram fornecidas pelo usuário a partir de outra sessão do ChatGPT. Seus portais **não foram acessados nesta entrega**. `consulted:false`, `accessed_here:false` e `verification_origin:user_external_session` preservam essa distinção em `content/referencias-oficiais-externas.json` e no catálogo. A atribuição individual não amplia o escopo das informações fornecidas.

- [IPHAN — Patrimônio histórico de Minas Gerais](https://www.gov.br/iphan/pt-br/superintendencias/minas-gerais/patrimonio-material)
- [IPHAN — Pontes históricas de São João del-Rei](https://www.gov.br/iphan/pt-br/assuntos/noticias/restauracoes-de-pontes-historicas-sao-concluidas-em-sao-joao-del-rei-mg/)
- [Ibram — Museu Regional de São João del-Rei](https://www.gov.br/museus/pt-br/museus-ibram/museu-regional-de-sao-joao-del-rei)
- [Ibram — Lista de museus de São João del-Rei](https://visite.museus.gov.br/cidade-instituicoes/sao-joao-del-rei/)
- [IPHAN — Igrejas históricas de São João del-Rei](https://www.gov.br/iphan/pt-br/unidades-especiais/centro-lucio-costa/mestrado-profissional/dissertacoes-1/ficha-tecnica-as-praticas-de-restauracao-de-bens-moveis-e-integrados-nas-igrejas-matriz-de-nossa-senhora-do-pilar-nossa-senhora-do-carmo-e-sao-francisco-de-assis-em-sao-joao-del-rei-mg-1947-1976)

As referências identificam dez atrações: São Francisco, Pilar, Carmo, Museu Regional, pontes da Cadeia/Rosário/Teatro, Complexo Ferroviário, Maria Fumaça e Fortim dos Emboabas. Para Complexo Ferroviário e Maria Fumaça, as fontes foram fornecidas como conjunto; a página e o trecho específicos ainda precisam ser vinculados. O link geral do IPHAN não comprova operação de trem.

**Museu Regional:** somente o endereço `Rua Marechal Deodoro, 12, Centro, São João del-Rei, MG` foi confirmado na informação fornecida do Ibram. Os horários apresentam divergências entre páginas oficiais: ficam pendentes, sem registros em `place_hours`. Não se presume abertura atual ou disponibilidade de visita.

As três cópias versionadas abaixo foram consultadas na entrega anterior. São evidência secundária/histórica, sujeita a revisão institucional. Os portais primários bloquearam acesso naquela entrega (proxy HTTP 403/DNS), e não houve nova tentativa nesta atualização. Os extratos mínimos estão em `content/fontes-consultadas.json`.

- [Cópia acadêmica de dados SICG/IPHAN — Tainacan/FAPESP](https://github.com/tainacan/data_science/blob/885114f20e2c441db87dcfcc534d1247e6633b9d/FAPESP/DADOS%20COLETADOS/iphan_sicg_material.csv): Cópia consultada; páginas primárias bloqueadas pelo proxy. Inconsistências de endereço detectadas. Não comprova situação de visitação atual.
- [Cópia da Wikipédia — artigo São João del-Rei](https://github.com/CarwilB/wiki-graph/blob/4f0fb152f2d9d4174e90c8b08b2f33977500afb3/wikipedia-pages/sa_admin/pt/S%C3%A3o%20Jo%C3%A3o%20del-Rei.txt): Cópia consultada para identificar candidatos. Requer corroboração institucional de nomes, sede e funcionamento antes da publicação.
- [Cópia de extração da API MuseusBr — registros de São João del-Rei](https://github.com/fgabreu/azure-databricks-pipeline-museusbr/blob/7d5cf42dd743fef8c6ae84d5ffa6b3738742c4f3/03%20-%20notebook_jupyter(API%20to%20Blob)/arquivos%20extra%C3%ADdos%20-%20Blob%20Storage/space.json): Extração histórica disponibilizada em projeto de dados. Confere nomes e endereços registrados, não funcionamento, acessibilidade ou contato atuais; requer confirmação institucional.

O campo de endereço repetido da cópia SICG foi rejeitado onde inconsistente. Endereços antigos MuseusBr não confirmam sede atual. Complexo, estação, museu e passeio ferroviário têm escopos relacionados: revisar agrupamento antes de publicar, sem contar componentes como atrações independentes por conveniência.

## Candidatos e fontes individuais

| Nome | Endereço / estado | Fontes |
| --- | --- | --- |
| Igreja de São Francisco de Assis | Não confirmado — pendente | [sicg-mirror](https://github.com/tainacan/data_science/blob/885114f20e2c441db87dcfcc534d1247e6633b9d/FAPESP/DADOS%20COLETADOS/iphan_sicg_material.csv), [iphan-igrejas-externo](https://www.gov.br/iphan/pt-br/unidades-especiais/centro-lucio-costa/mestrado-profissional/dissertacoes-1/ficha-tecnica-as-praticas-de-restauracao-de-bens-moveis-e-integrados-nas-igrejas-matriz-de-nossa-senhora-do-pilar-nossa-senhora-do-carmo-e-sao-francisco-de-assis-em-sao-joao-del-rei-mg-1947-1976) |
| Catedral Basílica de Nossa Senhora do Pilar | Não confirmado — pendente | [sicg-mirror](https://github.com/tainacan/data_science/blob/885114f20e2c441db87dcfcc534d1247e6633b9d/FAPESP/DADOS%20COLETADOS/iphan_sicg_material.csv), [iphan-igrejas-externo](https://www.gov.br/iphan/pt-br/unidades-especiais/centro-lucio-costa/mestrado-profissional/dissertacoes-1/ficha-tecnica-as-praticas-de-restauracao-de-bens-moveis-e-integrados-nas-igrejas-matriz-de-nossa-senhora-do-pilar-nossa-senhora-do-carmo-e-sao-francisco-de-assis-em-sao-joao-del-rei-mg-1947-1976) |
| Igreja de Nossa Senhora do Carmo | Não confirmado — pendente | [sicg-mirror](https://github.com/tainacan/data_science/blob/885114f20e2c441db87dcfcc534d1247e6633b9d/FAPESP/DADOS%20COLETADOS/iphan_sicg_material.csv), [iphan-igrejas-externo](https://www.gov.br/iphan/pt-br/unidades-especiais/centro-lucio-costa/mestrado-profissional/dissertacoes-1/ficha-tecnica-as-praticas-de-restauracao-de-bens-moveis-e-integrados-nas-igrejas-matriz-de-nossa-senhora-do-pilar-nossa-senhora-do-carmo-e-sao-francisco-de-assis-em-sao-joao-del-rei-mg-1947-1976) |
| Igreja de Nossa Senhora das Mercês | Não confirmado — pendente | [wikipedia-mirror](https://github.com/CarwilB/wiki-graph/blob/4f0fb152f2d9d4174e90c8b08b2f33977500afb3/wikipedia-pages/sa_admin/pt/S%C3%A3o%20Jo%C3%A3o%20del-Rei.txt) |
| Igreja de Nossa Senhora do Rosário | Não confirmado — pendente | [wikipedia-mirror](https://github.com/CarwilB/wiki-graph/blob/4f0fb152f2d9d4174e90c8b08b2f33977500afb3/wikipedia-pages/sa_admin/pt/S%C3%A3o%20Jo%C3%A3o%20del-Rei.txt) |
| Igreja do Senhor Bom Jesus do Monte | Não confirmado — pendente | [wikipedia-mirror](https://github.com/CarwilB/wiki-graph/blob/4f0fb152f2d9d4174e90c8b08b2f33977500afb3/wikipedia-pages/sa_admin/pt/S%C3%A3o%20Jo%C3%A3o%20del-Rei.txt) |
| Museu Regional de São João del-Rei | Rua Marechal Deodoro, 12, Centro, São João del-Rei, MG — confirmado na referência externa | [sicg-mirror](https://github.com/tainacan/data_science/blob/885114f20e2c441db87dcfcc534d1247e6633b9d/FAPESP/DADOS%20COLETADOS/iphan_sicg_material.csv), [museusbr-mirror](https://github.com/fgabreu/azure-databricks-pipeline-museusbr/blob/7d5cf42dd743fef8c6ae84d5ffa6b3738742c4f3/03%20-%20notebook_jupyter(API%20to%20Blob)/arquivos%20extra%C3%ADdos%20-%20Blob%20Storage/space.json), [ibram-regional-externo](https://www.gov.br/museus/pt-br/museus-ibram/museu-regional-de-sao-joao-del-rei) |
| Museu Ferroviário de São João del-Rei | Rua Hermílio Alves 366, Centro, 36307-328, São João del Rei, MG — provisório | [wikipedia-mirror](https://github.com/CarwilB/wiki-graph/blob/4f0fb152f2d9d4174e90c8b08b2f33977500afb3/wikipedia-pages/sa_admin/pt/S%C3%A3o%20Jo%C3%A3o%20del-Rei.txt), [museusbr-mirror](https://github.com/fgabreu/azure-databricks-pipeline-museusbr/blob/7d5cf42dd743fef8c6ae84d5ffa6b3738742c4f3/03%20-%20notebook_jupyter(API%20to%20Blob)/arquivos%20extra%C3%ADdos%20-%20Blob%20Storage/space.json) |
| Museu de Arte Sacra de São João del-Rei | Praça Embaixador Gastão da Cunha, 8 , Centro, 36300-084, São João del Rei, MG — provisório | [wikipedia-mirror](https://github.com/CarwilB/wiki-graph/blob/4f0fb152f2d9d4174e90c8b08b2f33977500afb3/wikipedia-pages/sa_admin/pt/S%C3%A3o%20Jo%C3%A3o%20del-Rei.txt), [museusbr-mirror](https://github.com/fgabreu/azure-databricks-pipeline-museusbr/blob/7d5cf42dd743fef8c6ae84d5ffa6b3738742c4f3/03%20-%20notebook_jupyter(API%20to%20Blob)/arquivos%20extra%C3%ADdos%20-%20Blob%20Storage/space.json) |
| Memorial Tancredo Neves | Rua Padre José Maria Xavier 7, Centro, 36307-340, São João del Rei, MG — provisório | [wikipedia-mirror](https://github.com/CarwilB/wiki-graph/blob/4f0fb152f2d9d4174e90c8b08b2f33977500afb3/wikipedia-pages/sa_admin/pt/S%C3%A3o%20Jo%C3%A3o%20del-Rei.txt), [museusbr-mirror](https://github.com/fgabreu/azure-databricks-pipeline-museusbr/blob/7d5cf42dd743fef8c6ae84d5ffa6b3738742c4f3/03%20-%20notebook_jupyter(API%20to%20Blob)/arquivos%20extra%C3%ADdos%20-%20Blob%20Storage/space.json) |
| Memorial Cardeal Dom Lucas Moreira Neves | Rua Getúlio Vargas 52, Centro, 36300-086, São João del Rei, MG — provisório | [wikipedia-mirror](https://github.com/CarwilB/wiki-graph/blob/4f0fb152f2d9d4174e90c8b08b2f33977500afb3/wikipedia-pages/sa_admin/pt/S%C3%A3o%20Jo%C3%A3o%20del-Rei.txt), [museusbr-mirror](https://github.com/fgabreu/azure-databricks-pipeline-museusbr/blob/7d5cf42dd743fef8c6ae84d5ffa6b3738742c4f3/03%20-%20notebook_jupyter(API%20to%20Blob)/arquivos%20extra%C3%ADdos%20-%20Blob%20Storage/space.json) |
| Museu Municipal Tomé Portes del-Rei | Praça Frei Orlando 90, Centro, 36307-352, São João del Rei, MG — provisório | [wikipedia-mirror](https://github.com/CarwilB/wiki-graph/blob/4f0fb152f2d9d4174e90c8b08b2f33977500afb3/wikipedia-pages/sa_admin/pt/S%C3%A3o%20Jo%C3%A3o%20del-Rei.txt), [museusbr-mirror](https://github.com/fgabreu/azure-databricks-pipeline-museusbr/blob/7d5cf42dd743fef8c6ae84d5ffa6b3738742c4f3/03%20-%20notebook_jupyter(API%20to%20Blob)/arquivos%20extra%C3%ADdos%20-%20Blob%20Storage/space.json) |
| Teatro Municipal de São João del-Rei | Não confirmado — pendente | [wikipedia-mirror](https://github.com/CarwilB/wiki-graph/blob/4f0fb152f2d9d4174e90c8b08b2f33977500afb3/wikipedia-pages/sa_admin/pt/S%C3%A3o%20Jo%C3%A3o%20del-Rei.txt) |
| Solar da Baronesa | Não confirmado — pendente | [wikipedia-mirror](https://github.com/CarwilB/wiki-graph/blob/4f0fb152f2d9d4174e90c8b08b2f33977500afb3/wikipedia-pages/sa_admin/pt/S%C3%A3o%20Jo%C3%A3o%20del-Rei.txt) |
| Ponte da Cadeia | Não confirmado — pendente | [wikipedia-mirror](https://github.com/CarwilB/wiki-graph/blob/4f0fb152f2d9d4174e90c8b08b2f33977500afb3/wikipedia-pages/sa_admin/pt/S%C3%A3o%20Jo%C3%A3o%20del-Rei.txt), [iphan-pontes-externo](https://www.gov.br/iphan/pt-br/assuntos/noticias/restauracoes-de-pontes-historicas-sao-concluidas-em-sao-joao-del-rei-mg/) |
| Biblioteca Municipal Baptista Caetano d’Almeida | Praça Frei Orlando, 90, Centro, São João del-Rei — MG — provisório | [wikipedia-mirror](https://github.com/CarwilB/wiki-graph/blob/4f0fb152f2d9d4174e90c8b08b2f33977500afb3/wikipedia-pages/sa_admin/pt/S%C3%A3o%20Jo%C3%A3o%20del-Rei.txt) |
| Passo da Rua Getúlio Vargas | Rua Getúlio Vargas, São João del-Rei — MG — provisório | [sicg-mirror](https://github.com/tainacan/data_science/blob/885114f20e2c441db87dcfcc534d1247e6633b9d/FAPESP/DADOS%20COLETADOS/iphan_sicg_material.csv) |
| Passo da Rua Duque de Caxias | Rua Duque de Caxias, São João del-Rei — MG — provisório | [sicg-mirror](https://github.com/tainacan/data_science/blob/885114f20e2c441db87dcfcc534d1247e6633b9d/FAPESP/DADOS%20COLETADOS/iphan_sicg_material.csv) |
| Estação Ferroviária de São João del-Rei | Rua Hermílio Alves, Centro, São João del-Rei — MG — provisório | [sicg-mirror](https://github.com/tainacan/data_science/blob/885114f20e2c441db87dcfcc534d1247e6633b9d/FAPESP/DADOS%20COLETADOS/iphan_sicg_material.csv) |
| Fundação Centro de Referência Musicológica José Maria Neves - Universidade Federal de São João del-Rei - UFSJ | Rua Marechal Bittencourt, 24 , Centro, 36300-070, São João Del Rei, MG — provisório | [museusbr-mirror](https://github.com/fgabreu/azure-databricks-pipeline-museusbr/blob/7d5cf42dd743fef8c6ae84d5ffa6b3738742c4f3/03%20-%20notebook_jupyter(API%20to%20Blob)/arquivos%20extra%C3%ADdos%20-%20Blob%20Storage/space.json) |
| Instituto Histórico e Geográfico de São João del Rei | Rua Santa Teresa 127, Centro, 36300-114, São João del Rei, MG — provisório | [museusbr-mirror](https://github.com/fgabreu/azure-databricks-pipeline-museusbr/blob/7d5cf42dd743fef8c6ae84d5ffa6b3738742c4f3/03%20-%20notebook_jupyter(API%20to%20Blob)/arquivos%20extra%C3%ADdos%20-%20Blob%20Storage/space.json) |
| Museu de Estanho John Somers | Avenida Leite de Castro 1150, Fábricas, 36301-180, São João del Rei, MG — provisório | [museusbr-mirror](https://github.com/fgabreu/azure-databricks-pipeline-museusbr/blob/7d5cf42dd743fef8c6ae84d5ffa6b3738742c4f3/03%20-%20notebook_jupyter(API%20to%20Blob)/arquivos%20extra%C3%ADdos%20-%20Blob%20Storage/space.json) |
| Centro Cultural da Universidade Federal de São João del Rei | Praça Doutor Augusto das Chagas Viegas, 17 , Largo do Carmo, 36300-088, São João del Rei, MG — provisório | [museusbr-mirror](https://github.com/fgabreu/azure-databricks-pipeline-museusbr/blob/7d5cf42dd743fef8c6ae84d5ffa6b3738742c4f3/03%20-%20notebook_jupyter(API%20to%20Blob)/arquivos%20extra%C3%ADdos%20-%20Blob%20Storage/space.json) |
| Centro de Referência de Cultura Popular Max Justo Guedes - Fortim dos Emboabas - Universidade Federal de São João del-Rei - UFSJ | Rua Altamiro Flor, s/n , Alto das Mercês, 36300-212, São João Del-Rei, MG — provisório | [museusbr-mirror](https://github.com/fgabreu/azure-databricks-pipeline-museusbr/blob/7d5cf42dd743fef8c6ae84d5ffa6b3738742c4f3/03%20-%20notebook_jupyter(API%20to%20Blob)/arquivos%20extra%C3%ADdos%20-%20Blob%20Storage/space.json), [ibram-museus-externo](https://visite.museus.gov.br/cidade-instituicoes/sao-joao-del-rei/) |
| Ponte do Rosário | Não confirmado — pendente | [iphan-pontes-externo](https://www.gov.br/iphan/pt-br/assuntos/noticias/restauracoes-de-pontes-historicas-sao-concluidas-em-sao-joao-del-rei-mg/) |
| Ponte do Teatro | Não confirmado — pendente | [iphan-pontes-externo](https://www.gov.br/iphan/pt-br/assuntos/noticias/restauracoes-de-pontes-historicas-sao-concluidas-em-sao-joao-del-rei-mg/) |
| Complexo Ferroviário de São João del-Rei | Não confirmado — pendente | [iphan-patrimonio-externo](https://www.gov.br/iphan/pt-br/superintendencias/minas-gerais/patrimonio-material) |
| Maria Fumaça — passeio ferroviário | Não confirmado — pendente | [iphan-patrimonio-externo](https://www.gov.br/iphan/pt-br/superintendencias/minas-gerais/patrimonio-material) |

Todos os candidatos possuem `status=draft`, `is_demo=false`, `verified_at=null`, `source_urls` e `pending_fields`. As notas detalhadas e o escopo da evidência permanecem no JSON versionado. Somente URLs de referência e nomes de campos pendentes serão armazenados nas novas colunas públicas: nunca notas privadas, credenciais ou dados pessoais.

## Seis propostas de roteiro

### 1 dia em SJDR

Igreja de São Francisco de Assis → Ponte da Cadeia → Museu Regional de São João del-Rei → Catedral Basílica de Nossa Senhora do Pilar → Igreja de Nossa Senhora do Carmo → Complexo Ferroviário de São João del-Rei

- Sequência editorial preliminar; validar deslocamentos, acessibilidade, segurança, entradas e visitação.
- Nenhum horário ou duração de visita foi presumido.
- Paradas com identidade referenciada oficialmente pelo usuário. Não há confirmação de abertura, trajeto seguro, duração ou adequação ao público proposto.

### Roteiro histórico

Catedral Basílica de Nossa Senhora do Pilar → Museu Regional de São João del-Rei → Ponte do Rosário → Ponte da Cadeia → Igreja de Nossa Senhora do Carmo → Igreja de São Francisco de Assis

- Sequência editorial preliminar; validar deslocamentos, acessibilidade, segurança, entradas e visitação.
- Nenhum horário ou duração de visita foi presumido.
- Paradas com identidade referenciada oficialmente pelo usuário. Não há confirmação de abertura, trajeto seguro, duração ou adequação ao público proposto.

### Roteiro gastronômico

Ponte da Cadeia → Museu Regional de São João del-Rei → Catedral Basílica de Nossa Senhora do Pilar

- Sequência editorial preliminar; validar deslocamentos, acessibilidade, segurança, entradas e visitação.
- Nenhum horário ou duração de visita foi presumido.
- As paradas atuais são referências urbanas para planejamento. Restaurantes, mercados e cafés ainda não foram pesquisados/selecionados. NÃO é uma recomendação gastronômica pronta para publicação.
- Paradas com identidade referenciada oficialmente pelo usuário. Não há confirmação de abertura, trajeto seguro, duração ou adequação ao público proposto.

### SJDR com crianças

Complexo Ferroviário de São João del-Rei → Ponte do Teatro → Ponte da Cadeia → Museu Regional de São João del-Rei

- Sequência editorial preliminar; validar deslocamentos, acessibilidade, segurança, entradas e visitação.
- Nenhum horário ou duração de visita foi presumido.
- Paradas com identidade referenciada oficialmente pelo usuário. Não há confirmação de abertura, trajeto seguro, duração ou adequação ao público proposto.

### Fim de semana romântico

Igreja de São Francisco de Assis → Ponte do Rosário → Ponte da Cadeia → Igreja de Nossa Senhora do Carmo

- Sequência editorial preliminar; validar deslocamentos, acessibilidade, segurança, entradas e visitação.
- Nenhum horário ou duração de visita foi presumido.
- Paradas com identidade referenciada oficialmente pelo usuário. Não há confirmação de abertura, trajeto seguro, duração ou adequação ao público proposto.

### SJDR em dia de chuva

Museu Regional de São João del-Rei → Catedral Basílica de Nossa Senhora do Pilar → Igreja de Nossa Senhora do Carmo → Igreja de São Francisco de Assis

- Sequência editorial preliminar; validar deslocamentos, acessibilidade, segurança, entradas e visitação.
- Nenhum horário ou duração de visita foi presumido.
- Paradas com identidade referenciada oficialmente pelo usuário. Não há confirmação de abertura, trajeto seguro, duração ou adequação ao público proposto.
- Revisar proteção real contra chuva e deslocamentos externos. Não foi afirmado que os espaços estão abertos ou que o percurso é coberto.

Todas as paradas destes roteiros têm identidade mencionada nas referências oficiais fornecidas externamente; isto **não confirma condições de visitação nem os percursos**. Não foram inventadas durações, adequação infantil, proteção contra chuva, reservas ou ofertas comerciais. O gastronômico contém apenas referências urbanas e permanece bloqueado até pesquisar estabelecimentos reais.

## Importação e publicação são aprovações distintas

`npm run catalog:check` valida os relacionamentos/procedência; `npm run catalog:sql` gera a proposta SQL, sem conectar ao banco. O SQL contém apenas rascunhos, persiste fontes/pendências, preserva IDs existentes e não recria paradas retiradas por um editor. Requer a migration adicional de proveniência previamente revisada e homologada. Não é migration nem seed demonstrativo.

Antes de importar: revisar cada cadastro, fontes, agrupamentos ferroviários, IDs/slugs e conflitos; aprovar explicitamente o pacote de rascunhos. Antes de publicar: verificar descrição/endereço/entrada atuais, resolver pendências individualmente, conferir visitação/itinerários e direitos das imagens. Campos operacionais não confirmados ficam vazios. Ausência de pendências no banco não comprova a veracidade do conteúdo; a responsabilidade da revisão é humana.

O painel permite examinar tudo sem importar remotamente. Veja [GESTAO_CONTEUDO.md](GESTAO_CONTEUDO.md) para Auth, Storage e dependências de schema.
