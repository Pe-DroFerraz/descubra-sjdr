// Curadoria editorial provisória: referências verificadas no Wikimedia Commons e no guia
// do Museu Regional. Visitas e deslocamentos são sugestões; confirme horários na origem.
export type PhotoKey = 'francisco'|'carmo'|'pilar'|'trem'|'serra'|'museum'|'station';
export const imageSources: Record<PhotoKey,{file:string;alt:string;credit:string}> = {
  museum:{file:'Museu Regional de São João Del-Rei.jpg',alt:'Museu Regional de São João del-Rei',credit:'Tissiana de A. de Souza · Wikimedia Commons (CC BY-SA 4.0)'},
  station:{file:'PedroVilela Museu Ferroviário São João Del Rei MG (40824512992).jpg',alt:'Museu Ferroviário de São João del-Rei',credit:'Pedro Vilela / MTur · Wikimedia Commons'},

  francisco: {
    file:'Igreja de São Francisco de Assis, São João del-Rei, MG - 2023-11-08 - DSC05317.jpg',
    alt:'Igreja de São Francisco de Assis em São João del-Rei',
    credit:'Fotografia de São Francisco de Assis · Wikimedia Commons',
  },
  carmo: {
    file:'Igreja do Carmo - São João del-Rei.jpg',
    alt:'Igreja de Nossa Senhora do Carmo em São João del-Rei',
    credit:'Gabriel Carvalho Leal · Wikimedia Commons (CC BY-SA 4.0)',
  },
  pilar: {
    file:'Catedral Basílica de Nossa Senhora do Pilar, São João del-Rei, MG - 2023-11-08 - DSC05258.jpg',
    alt:'Catedral Basílica de Nossa Senhora do Pilar em São João del-Rei',
    credit:'Paulo SP · Wikimedia Commons',
  },
  trem: {
    file:'Maria-Fumaca entre Sao Joao del Rey et Tiradentes (1).jpg',
    alt:'Trem turístico entre São João del-Rei e Tiradentes',
    credit:'Pierre André Leclercq · Wikimedia Commons',
  },
  serra: {
    file:'Serra de São José em TIRADENTES.jpg',
    alt:'Paisagem da Serra de São José na região de Tiradentes',
    credit:'Paisagem da Serra de São José · Wikimedia Commons',
  },
};
export function commonsImage(key:PhotoKey,width=1280) {
  return 'https://commons.wikimedia.org/wiki/Special:FilePath/'+encodeURIComponent(imageSources[key].file)+'?width='+width;
}
export function commonsCredit(key:PhotoKey) {
  return 'https://commons.wikimedia.org/wiki/File:'+encodeURIComponent(imageSources[key].file.replaceAll(' ','_'));
}
export const visitorGuide = 'https://museuregionaldesaojoaodelrei.museus.gov.br/guia-de-turismo/';
export const topics = [
  {id:'historia',name:'História & patrimônio',eyebrow:'01 / DESCUBRIR',copy:'Igrejas, ruas coloniais, museus e a memória viva das Minas.',image:'francisco',count:'Patrimônio'},
  {id:'natureza',name:'Ar livre & natureza',eyebrow:'02 / RESPIRAR',copy:'Serra de São José e paisagens do entorno. Para trilhas, consulte os acessos locais.',image:'serra',count:'Ar livre'},
  {id:'cultura',name:'Cultura & tradições',eyebrow:'03 / SENTIR',copy:'Sinos, arte sacra, museus, manifestações e calendário cultural.',image:'carmo',count:'Cultura'},
  {id:'experiencias',name:'Passeios únicos',eyebrow:'04 / VIVER',copy:'Trem turístico, encontros com a história e lugares para guardar.',image:'trem',count:'Experiências'},
] as const satisfies ReadonlyArray<{id:string;name:string;eyebrow:string;copy:string;image:PhotoKey;count:string}>;
export type Stop = {name:string;note:string;duration:number;placeSlug?:string;location:string};
export type Journey = {slug:string;title:string;short:string;intro:string;image:PhotoKey;label:string;difficulty:string;duration:string;min:number;tags:string[];stops:Stop[]};
export const journeys: Journey[] = [
  {
    slug:'primeira-vez-em-sao-joao',
    title:'Primeira vez em São João',
    short:'Um primeiro encontro com igrejas, museus e ruas históricas.',
    intro:'Comece pelo centro histórico, caminhe sem pressa e descubra parte da memória da cidade. O trajeto é uma sugestão editorial; adapte os pontos conforme horários e acessibilidade.',
    image:'francisco',label:'Para começar',difficulty:'Caminhada urbana',duration:'Meio dia',min:210,tags:['patrimônio','cultura','primeira visita'],
    stops:[
      {name:'Igreja de São Francisco de Assis',note:'Observe o conjunto arquitetônico e os jardins. A visita interna depende das condições atuais do templo.',duration:35,placeSlug:'igreja-sao-francisco-de-assis-sjdr',location:'Praça Frei Orlando'},
      {name:'Museu Regional',note:'Conheça o casarão histórico e o acervo. Verifique o horário atualizado no site oficial.',duration:65,placeSlug:'museu-regional-sao-joao-del-rei',location:'Rua Marechal Deodoro, 12'},
      {name:'Catedral Basílica do Pilar',note:'Contemple a arquitetura e confira as restrições de acesso antes da viagem.',duration:35,placeSlug:'catedral-nossa-senhora-do-pilar',location:'Rua Monsenhor Gustavo, 61'},
      {name:'Largo do Carmo e Solar da Baronesa',note:'Termine com a paisagem urbana do Largo do Carmo e o entorno cultural da UFSJ.',duration:45,placeSlug:'centro-cultural-ufsj-solar-baronesa',location:'Largo do Carmo'},
    ],
  },
  {
    slug:'igrejas-sinos-e-tradicoes',
    title:'Igrejas, sinos & tradições',
    short:'Uma viagem pela religiosidade, arte e identidade são-joanense.',
    intro:'O patrimônio religioso conta parte importante da história da cidade. Algumas igrejas podem ter acesso restrito ou funcionar apenas em horários específicos.',
    image:'carmo',label:'Cultura viva',difficulty:'Caminhada urbana',duration:'Meio dia',min:180,tags:['igrejas','arte sacra','cultura'],
    stops:[
      {name:'Igreja de São Francisco de Assis',note:'Repare na fachada e no conjunto paisagístico da Praça Frei Orlando.',duration:35,placeSlug:'igreja-sao-francisco-de-assis-sjdr',location:'Praça Frei Orlando'},
      {name:'Catedral Basílica do Pilar',note:'Referência da arte religiosa local; informe-se sobre a situação de visitação.',duration:35,placeSlug:'catedral-nossa-senhora-do-pilar',location:'Rua Monsenhor Gustavo'},
      {name:'Igreja do Rosário',note:'Explore o entorno da Praça Embaixador Gastão da Cunha.',duration:30,location:'Praça Embaixador Gastão da Cunha'},
      {name:'Igreja do Carmo',note:'Observe a arquitetura e a tradição religiosa do Largo do Carmo.',duration:40,location:'Praça Carlos Gomes'},
    ],
  },
  {
    slug:'trilhos-memorias-e-cidade',
    title:'Entre trilhos & memórias',
    short:'Ferrovia, museus e histórias para quem gosta de ir mais fundo.',
    intro:'Um dia para conhecer a relação entre o patrimônio ferroviário e a memória urbana. Passeios de trem dependem da programação do operador e não estão incluídos automaticamente.',
    image:'trem',label:'Experiência regional',difficulty:'Urbano, com deslocamentos',duration:'Um dia',min:300,tags:['trem','museus','família'],
    stops:[
      {name:'Museu Ferroviário',note:'Comece pelo complexo ferroviário e pela história da Estrada de Ferro Oeste de Minas.',duration:65,placeSlug:'museu-ferroviario-estacao-efom',location:'Av. Hermílio Alves, 366'},
      {name:'Passeio de Maria-Fumaça (opcional)',note:'Consulte programação, preços e disponibilidade no operador oficial antes de incluir no dia.',duration:90,location:'Estação ferroviária'},
      {name:'Museu Regional',note:'Retome a história da cidade por meio do acervo e da arquitetura.',duration:75,placeSlug:'museu-regional-sao-joao-del-rei',location:'Rua Marechal Deodoro, 12'},
      {name:'Caminhada pelo centro',note:'Reserve tempo livre para visitar fachadas históricas e o comércio do centro.',duration:45,location:'Centro histórico'},
    ],
  },
];
export const editorialSource = visitorGuide;
