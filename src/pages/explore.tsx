import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Compass, Search, SlidersHorizontal } from 'lucide-react';
import { EditorialImage } from '../components/tourism/editorial-image';
import { topics, visitorGuide, type PhotoKey } from '../data/editorial';
import { usePlaces } from '../data/queries';
import { HeritagePhoto } from '../components/tourism/heritage-photo';

const attractions: {slug:string;title:string;type:string;description:string;photo:PhotoKey;interest:string}[]=[
 {slug:'igreja-sao-francisco-de-assis-sjdr',title:'Igreja de São Francisco de Assis',type:'Patrimônio religioso',description:'Arquitetura, jardins e um dos cartões-postais da cidade.',photo:'francisco',interest:'historia'},
 {slug:'catedral-nossa-senhora-do-pilar',title:'Catedral Basílica do Pilar',type:'Arte e memória',description:'Um encontro com a história religiosa são-joanense.',photo:'pilar',interest:'historia'},
 {slug:'museu-regional-sao-joao-del-rei',title:'Museu Regional',type:'Museus e acervos',description:'Um casarão histórico com memórias do cotidiano mineiro.',photo:'carmo',interest:'cultura'},
 {slug:'centro-cultural-ufsj-solar-baronesa',title:'Solar da Baronesa',type:'Cultura e arquitetura',description:'Patrimônio preservado no Largo do Carmo.',photo:'carmo',interest:'cultura'},
 {slug:'museu-ferroviario-estacao-efom',title:'Museu Ferroviário',type:'Trilhos e experiências',description:'A história dos trens na cidade e na região.',photo:'trem',interest:'experiencias'},
];
export default function Explore() {
 const [params,setParams]=useSearchParams();
 const [search,setSearch]=useState(params.get('q')??'');
 const interest=params.get('interesse')??'todos';
 const places=usePlaces();
 const selected=useMemo(()=>attractions.filter(item=>(interest==='todos'||item.interest===interest)
   && (!search.trim()||([item.title,item.type,item.description].join(' ').toLocaleLowerCase('pt-BR')).includes(search.trim().toLocaleLowerCase('pt-BR')))),[search,interest]);
 function update(id:string){setParams(p=>{const n=new URLSearchParams(p);if(id==='todos')n.delete('interesse');else n.set('interesse',id);return n;},{replace:true});}
 return <>
 <div className="editorial-page-hero"><p className="destination-kicker">GUIA DE EXPLORAÇÃO</p><h1>Encontre seu<br/><em>próximo lugar.</em></h1><p>Dos templos centenários ao patrimônio ferroviário, explore a cidade por aquilo que move você.</p></div>
 <section className="editorial-explore-shell">
  <div className="editorial-filter-head"><div><SlidersHorizontal size={19}/><span>Explore por interesse</span></div><label className="editorial-filter-search"><Search size={18}/><span className="sr-only">Buscar lugares</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="O que você quer conhecer?"/></label></div>
  <div className="editorial-chips" role="group" aria-label="Interesses de viagem">{[{id:'todos',name:'Tudo'},...topics.map(({id,name})=>({id,name}))].map(t=><button type="button" key={t.id} onClick={()=>update(t.id)} aria-pressed={interest===t.id} className={interest===t.id?'active':''}>{t.name}</button>)}</div>
  {interest==='natureza'&&<article className="editorial-nature-promo"><EditorialImage photo="serra"/><div><p className="destination-kicker">NO ENTORNO</p><h2>Serra de São José</h2><p>Natureza e paisagens na região de Tiradentes e São João del-Rei. Para trilhas e cachoeiras, confirme acessos, segurança e condições locais.</p><Link to="/mapa-3d">Explorar o mapa <ArrowUpRight size={17}/></Link></div></article>}
  <div className="editorial-explore-grid">{selected.map(item=><article key={item.slug} className="editorial-explore-card">
     <div className="editorial-explore-photo"><HeritagePhoto slug={item.slug} alt={item.title}/></div>
     <div className="editorial-explore-content"><span>{item.type}</span><h2>{item.title}</h2><p>{item.description}</p><Link to={'/lugares/'+item.slug}>Conhecer lugar <ArrowUpRight size={16}/></Link></div>
  </article>)}</div>
  {selected.length===0&&interest!=='natureza'&&<p className="editorial-empty">Não encontramos essa combinação. Tente outra busca ou escolha um interesse diferente.</p>}
  <div className="editorial-explore-more"><div><p className="destination-kicker">CATÁLOGO ATUALIZADO</p><h2>Mais lugares, uma cidade inteira.</h2><p>{places.isError?'O catálogo dinâmico está indisponível agora. O guia editorial acima continua acessível.':'Consulte as atrações publicadas na plataforma com informações e endereços.'}</p></div><Link to="/lugares">Ver catálogo completo <ArrowRight size={18}/></Link></div>
 </section>
 <section className="editorial-bottom-banner"><div><Compass size={32}/><h2>Não sabe por onde começar?</h2><p>Descubra roteiros com paradas organizadas e dicas para cada tipo de visita.</p></div><Link to="/roteiros">Ver roteiros sugeridos <ArrowUpRight size={18}/></Link></section>
 <p className="destination-source-note">Referências culturais no <a href={visitorGuide} target="_blank" rel="noopener noreferrer">Guia Turístico do Museu Regional</a>. Informações operacionais mudam; confirme antes da visita.</p>
 </>;
}
