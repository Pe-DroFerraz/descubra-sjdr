# Catálogo editorial inicial de São João del-Rei

**Proposta para revisão, não catálogo homologado.** Preparada em 22/10/2026: 24 candidatos reais identificados em referências, 15 endereços provisórios e nove ainda não confirmados. Nomes e situação atual também precisam de conferência institucional; todos os registros são rascunhos.

Os portais primários Minas Gerais Turismo, IPHAN, Prefeitura e Museu Regional retornaram `Tunnel connection failed: 403 Forbidden` nesta sessão, inclusive após autorização de rede. Não foram considerados consultados. Acesso direto também falhou por DNS. Foi possível pesquisar cópias versionadas no GitHub de dados SICG/IPHAN, extração histórica MuseusBr e artigo da Wikipédia. São evidências secundárias, não confirmação de funcionamento atual. Os links consultados e extratos factuais necessários estão versionados em `content/fontes-consultadas.json`.

A cópia SICG repete Rua Ministro Gabriel Passos para diversos bens distintos. Esse campo foi rejeitado para os templos e Passos; não geocodificamos ou inventamos números de porta. Endereços de Passos vêm do nome do bem, o do Museu Regional do título/síntese e MuseusBr, e os demais conforme evidência individual. Os registros MuseusBr são históricos e podem conter mudança de sede; não importamos seus contatos, acessibilidade ou horários como atuais.

## Fontes efetivamente consultadas

- [Cópia acadêmica de dados SICG/IPHAN — Tainacan/FAPESP](https://github.com/tainacan/data_science/blob/885114f20e2c441db87dcfcc534d1247e6633b9d/FAPESP/DADOS%20COLETADOS/iphan_sicg_material.csv): Cópia consultada; páginas primárias bloqueadas pelo proxy. Inconsistências de endereço detectadas. Não comprova situação de visitação atual.
- [Cópia da Wikipédia — artigo São João del-Rei](https://github.com/CarwilB/wiki-graph/blob/4f0fb152f2d9d4174e90c8b08b2f33977500afb3/wikipedia-pages/sa_admin/pt/S%C3%A3o%20Jo%C3%A3o%20del-Rei.txt): Cópia consultada para identificar candidatos. Requer corroboração institucional de nomes, sede e funcionamento antes da publicação.
- [Cópia de extração da API MuseusBr — registros de São João del-Rei](https://github.com/fgabreu/azure-databricks-pipeline-museusbr/blob/7d5cf42dd743fef8c6ae84d5ffa6b3738742c4f3/03%20-%20notebook_jupyter(API%20to%20Blob)/arquivos%20extra%C3%ADdos%20-%20Blob%20Storage/space.json): Extração histórica disponibilizada em projeto de dados. Confere nomes e endereços registrados, não funcionamento, acessibilidade ou contato atuais; requer confirmação institucional.

## Candidatos e pendências

| Nome | Endereço provisório pesquisado | Fonte consultada |
| --- | --- | --- |
| Igreja de São Francisco de Assis | **Não confirmado** | sicg-mirror |
| Catedral Basílica de Nossa Senhora do Pilar | **Não confirmado** | sicg-mirror |
| Igreja de Nossa Senhora do Carmo | **Não confirmado** | sicg-mirror |
| Igreja de Nossa Senhora das Mercês | **Não confirmado** | wikipedia-mirror |
| Igreja de Nossa Senhora do Rosário | **Não confirmado** | wikipedia-mirror |
| Igreja do Senhor Bom Jesus do Monte | **Não confirmado** | wikipedia-mirror |
| Museu Regional de São João del-Rei | Rua Marechal Deodoro 12, Centro, 36300-074, São João del Rei, MG | sicg-mirror, museusbr-mirror |
| Museu Ferroviário de São João del-Rei | Rua Hermílio Alves 366, Centro, 36307-328, São João del Rei, MG | wikipedia-mirror, museusbr-mirror |
| Museu de Arte Sacra de São João del-Rei | Praça Embaixador Gastão da Cunha, 8 , Centro, 36300-084, São João del Rei, MG | wikipedia-mirror, museusbr-mirror |
| Memorial Tancredo Neves | Rua Padre José Maria Xavier 7, Centro, 36307-340, São João del Rei, MG | wikipedia-mirror, museusbr-mirror |
| Memorial Cardeal Dom Lucas Moreira Neves | Rua Getúlio Vargas 52, Centro, 36300-086, São João del Rei, MG | wikipedia-mirror, museusbr-mirror |
| Museu Municipal Tomé Portes del-Rei | Praça Frei Orlando 90, Centro, 36307-352, São João del Rei, MG | wikipedia-mirror, museusbr-mirror |
| Teatro Municipal de São João del-Rei | **Não confirmado** | wikipedia-mirror |
| Solar da Baronesa | **Não confirmado** | wikipedia-mirror |
| Ponte da Cadeia | **Não confirmado** | wikipedia-mirror |
| Biblioteca Municipal Baptista Caetano d’Almeida | Praça Frei Orlando, 90, Centro, São João del-Rei — MG | wikipedia-mirror |
| Passo da Rua Getúlio Vargas | Rua Getúlio Vargas, São João del-Rei — MG | sicg-mirror |
| Passo da Rua Duque de Caxias | Rua Duque de Caxias, São João del-Rei — MG | sicg-mirror |
| Estação Ferroviária de São João del-Rei | Rua Hermílio Alves, Centro, São João del-Rei — MG | sicg-mirror |
| Fundação Centro de Referência Musicológica José Maria Neves - Universidade Federal de São João del-Rei - UFSJ | Rua Marechal Bittencourt, 24 , Centro, 36300-070, São João Del Rei, MG | museusbr-mirror |
| Instituto Histórico e Geográfico de São João del Rei | Rua Santa Teresa 127, Centro, 36300-114, São João del Rei, MG | museusbr-mirror |
| Museu de Estanho John Somers | Avenida Leite de Castro 1150, Fábricas, 36301-180, São João del Rei, MG | museusbr-mirror |
| Centro Cultural da Universidade Federal de São João del Rei | Praça Doutor Augusto das Chagas Viegas, 17 , Largo do Carmo, 36300-088, São João del Rei, MG | museusbr-mirror |
| Centro de Referência de Cultura Popular Max Justo Guedes - Fortim dos Emboabas - Universidade Federal de São João del-Rei - UFSJ | Rua Altamiro Flor, s/n , Alto das Mercês, 36300-212, São João Del-Rei, MG | museusbr-mirror |

Todos possuem `status=draft`, `is_demo=false` (candidatos identificados, distintos do seed fictício) e `verified_at=null`. Coordenadas, horários, preços, contatos e mídias permanecem vazios. Menção em diretório histórico não comprova abertura atual ao público. Solar, templo, instituição e museu podem exigir autorização de visita; não presumir acesso livre.

## Seis roteiros preliminares

### 1 dia em SJDR

Igreja de São Francisco de Assis → Ponte da Cadeia → Museu Regional de São João del-Rei → Catedral Basílica de Nossa Senhora do Pilar → Igreja de Nossa Senhora do Carmo → Estação Ferroviária de São João del-Rei

- Sequência editorial preliminar; validar deslocamentos, acessibilidade, segurança, entradas e visitação.
- Nenhum horário ou duração de visita foi presumido.

### Roteiro histórico

Catedral Basílica de Nossa Senhora do Pilar → Passo da Rua Getúlio Vargas → Museu Regional de São João del-Rei → Ponte da Cadeia → Igreja de Nossa Senhora do Carmo → Igreja de São Francisco de Assis

- Sequência editorial preliminar; validar deslocamentos, acessibilidade, segurança, entradas e visitação.
- Nenhum horário ou duração de visita foi presumido.

### Roteiro gastronômico

Ponte da Cadeia → Museu Regional de São João del-Rei → Catedral Basílica de Nossa Senhora do Pilar

- Sequência editorial preliminar; validar deslocamentos, acessibilidade, segurança, entradas e visitação.
- Nenhum horário ou duração de visita foi presumido.
- As paradas atuais são referências urbanas para planejamento. Restaurantes, mercados e cafés ainda não foram pesquisados/selecionados. NÃO é uma recomendação gastronômica pronta para publicação.

### SJDR com crianças

Estação Ferroviária de São João del-Rei → Museu Ferroviário de São João del-Rei → Ponte da Cadeia → Biblioteca Municipal Baptista Caetano d’Almeida

- Sequência editorial preliminar; validar deslocamentos, acessibilidade, segurança, entradas e visitação.
- Nenhum horário ou duração de visita foi presumido.

### Fim de semana romântico

Igreja de São Francisco de Assis → Solar da Baronesa → Ponte da Cadeia → Igreja de Nossa Senhora do Carmo

- Sequência editorial preliminar; validar deslocamentos, acessibilidade, segurança, entradas e visitação.
- Nenhum horário ou duração de visita foi presumido.

### SJDR em dia de chuva

Museu Regional de São João del-Rei → Museu de Arte Sacra de São João del-Rei → Memorial Tancredo Neves → Centro Cultural da Universidade Federal de São João del Rei

- Sequência editorial preliminar; validar deslocamentos, acessibilidade, segurança, entradas e visitação.
- Nenhum horário ou duração de visita foi presumido.

Nenhuma duração foi estimada como fato, e não há reservas, parceiros pagos ou disponibilidade confirmados. As sequências são propostas de curadoria, não orientações de deslocamento homologadas. O gastronômico fica bloqueado editorialmente até pesquisar e selecionar estabelecimentos reais; não convertemos equipamentos culturais em restaurantes.

## Artefatos para aprovação

- `content/catalogo-inicial.json`: dados estruturados, relações, fontes e pendências individuais.
- `content/fontes-consultadas.json`: extratos mínimos de nomes/endereços de referências consultadas; nenhum arquivo de imagem ou dado pessoal foi copiado.
- `content/catalogo-inicial.sql`: importação proposta de rascunhos; não foi executada remotamente e não é migration/seed de demonstração.
- `npm run catalog:check` e `npm run catalog:sql`: somente validação/geração local, sem conexão ao Cloud.

A tela administrativa “Catálogo inicial para revisão” permite examinar estes candidatos, sem botão que os importe remotamente. Requisitos de aprovação e homologação em [GESTAO_CONTEUDO.md](GESTAO_CONTEUDO.md).
