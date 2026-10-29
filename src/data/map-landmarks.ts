// Reference pins from OpenStreetMap/Mapcarta and official cultural inventory.
// A reference pin does not imply that a museum/temple is open, or that an event is taking place.
export type PublicMapKind = 'church' | 'museum' | 'food' | 'event' | 'place';
export type PublicMapPoint = {
  id:string; name:string;lat:number;lng:number;kind:PublicMapKind;
  description:string;href:string;source?:string;date?:string;
};
export const CURATED_MAP_POINTS: PublicMapPoint[] = [
  {
    id:'igreja-sao-francisco-de-assis-sjdr',
    name:'Igreja de São Francisco de Assis',lat:-21.13891,lng:-44.26005,
    kind:'church',description:'Praça Frei Orlando · Patrimônio histórico',
    href:'/lugares/igreja-sao-francisco-de-assis-sjdr',
    source:'https://mapcarta.com/pt/W164767346',
  },
  {
    id:'catedral-nossa-senhora-do-pilar',
    name:'Catedral Basílica do Pilar',lat:-21.1351,lng:-44.26211,
    kind:'church',description:'Rua Monsenhor Gustavo · Patrimônio religioso',
    href:'/lugares/catedral-nossa-senhora-do-pilar',
    source:'https://mapcarta.com/pt/W164767347',
  },
  {
    id:'museu-regional-sao-joao-del-rei',
    name:'Museu Regional',lat:-21.13597541801312,lng:-44.26123380661011,
    kind:'museum',description:'Rua Marechal Deodoro, 12 · História',
    href:'/lugares/museu-regional-sao-joao-del-rei',
    source:'https://visite.museus.gov.br/instituicoes/museu-regional-de-sao-joao-del-rei/',
  },
];
