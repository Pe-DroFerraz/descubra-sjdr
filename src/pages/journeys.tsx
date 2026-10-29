import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUpRight, Bookmark, Check, Clock3, Compass, Copy, Footprints, MapPin, ShieldCheck } from 'lucide-react';
import { EditorialImage } from '../components/tourism/editorial-image';
import { journeys, visitorGuide, type Journey } from '../data/editorial';

function JourneyCard({route}: {route:Journey}) {
 return <article className="journey-editorial-card">
  <div className="journey-editorial-photo"><EditorialImage photo={route.image}/><span>{route.label}</span></div>
  <div className="journey-editorial-body"><p>{route.duration} · {route.stops.length} paradas</p><h2>{route.title}</h2><span>{route.short}</span><Link to={'/roteiros/guias/'+route.slug}>Explorar roteiro <ArrowUpRight size={18}/></Link></div>
 </article>;
}
export default function JourneyLibrary(){
 return <>
 <div className="editorial-page-hero editorial-page-hero-dark"><p className="destination-kicker">VIVA CADA CAMINHO</p><h1>Roteiros que<br/><em>contam histórias.</em></h1><p>De uma primeira caminhada pelo centro a um dia de descobertas: sugestões para organizar seu tempo e se surpreender.</p></div>
 <div className="editorial-route-intro"><span>COMO VOCÊ GOSTA DE VIAJAR?</span><p>Escolha um percurso para ver cada parada, estimar o tempo de visita e decidir o que deseja incluir.</p><Link to="/planejar">Ou personalize seu roteiro <ArrowUpRight size={18}/></Link></div>
 <section className="editorial-route-list">{journeys.map(route=><JourneyCard key={route.slug} route={route}/>)}</section>
 <div className="editorial-route-advice"><ShieldCheck size={27}/><p>Os roteiros são sugestões editoriais. As durações são estimadas e não incluem deslocamentos. Horários, preços, reformas e disponibilidade devem ser confirmados antes da visita.</p></div>
 </>;
}
const routeText=(route:Journey,selected:number[])=>[
 'Descubra SJDR — '+route.title,
 route.short,
 'Paradas sugeridas (tempo de visita, sem deslocamento):',
 ...route.stops.filter((_,i)=>selected.includes(i)).map((s,i)=>(i+1)+'. '+s.name+' ('+s.duration+' min) — '+s.location+'. '+s.note),
 'Fonte: '+visitorGuide,
 'Roteiro: '+window.location.href
].join('\n');
export function JourneyDetail(){
 const {slug}=useParams();
 const route=journeys.find(item=>item.slug===slug);
 const [selected,setSelected]=useState<number[]>(route?.stops.map((_,i)=>i)??[]);
 const [message,setMessage]=useState('');
 const [saved,setSaved]=useState(false);
 if(!route)return <div className="editorial-page-hero"><h1>Roteiro não encontrado.</h1><Link to="/roteiros">Voltar aos roteiros</Link></div>;
 const time=route.stops.reduce((sum,stop,i)=>sum+(selected.includes(i)?stop.duration:0),0);
 function toggle(i:number){setSelected(x=>x.includes(i)?x.filter(n=>n!==i):[...x,i].sort((a,b)=>a-b));setSaved(false);}
 function save(){
   try{localStorage.setItem('sjdr-curated-route',JSON.stringify({slug:route!.slug,selected,updatedAt:new Date().toISOString()}));setSaved(true);setMessage('Roteiro salvo neste navegador.');}
   catch{setMessage('Seu navegador bloqueou o salvamento. Use a opção Copiar roteiro.');}
 }
 async function copy(){
   try{await navigator.clipboard.writeText(routeText(route!,selected));setMessage('Roteiro copiado para compartilhar.');}
   catch{setMessage('Não foi possível copiar. Compartilhe o link desta página.');}
 }
 return <>
 <div className="editorial-journey-hero"><div className="editorial-journey-hero-photo"><EditorialImage photo={route.image} eager /></div><div className="editorial-journey-hero-copy"><Link to="/roteiros"><ArrowLeft size={16}/> Voltar aos roteiros</Link><span>{route.label} · {route.duration}</span><h1>{route.title}</h1><p>{route.short}</p></div></div>
 <section className="editorial-journey-detail">
 <div className="editorial-journey-main"><p className="destination-kicker">O SEU PERCURSO</p><h2>Passo a passo,<br/><em>sem pressa.</em></h2><p>{route.intro}</p>
  <div className="editorial-journey-meta"><span><Clock3 size={17}/> {time} min de visita (estimativa)</span><span><Footprints size={17}/> {route.difficulty}</span></div>
  <div className="editorial-stops">{route.stops.map((stop,i)=><article key={stop.name} className={selected.includes(i)?'':'muted'}>
    <label className="editorial-stop-check"><input type="checkbox" checked={selected.includes(i)} onChange={()=>toggle(i)} aria-label={'Incluir '+stop.name}/><span>{String(i+1).padStart(2,'0')}</span></label>
    <div><p>{stop.duration} MIN · {stop.location}</p><h3>{stop.name}</h3><span>{stop.note}</span><div className="editorial-stop-links">{stop.placeSlug&&<Link to={'/lugares/'+stop.placeSlug}>Detalhes <ArrowUpRight size={15}/></Link>}<a target="_blank" rel="noopener noreferrer" href={'https://www.openstreetmap.org/search?query='+encodeURIComponent(stop.name+', São João del-Rei, MG')}>Ver no mapa <MapPin size={15}/></a></div></div>
   </article>)}</div>
 </div>
 <aside className="editorial-journey-aside"><div className="editorial-planner-sticky"><p className="destination-kicker">MONTE DO SEU JEITO</p><h3>Seu roteiro, suas escolhas.</h3><p>Marque as paradas que deseja conhecer. O tempo abaixo soma apenas as visitas, sem deslocamentos e filas.</p><strong>{selected.length} paradas</strong><div className="editorial-time-number">{Math.floor(time/60)}<small>h</small> {String(time%60).padStart(2,'0')}<small>min</small></div>
 <button onClick={save} disabled={!selected.length} className="destination-button-dark"><Bookmark size={17}/>{saved?'Atualizar roteiro salvo':'Salvar roteiro'}</button>
 <button onClick={()=>void copy()} disabled={!selected.length} className="editorial-secondary-button"><Copy size={16}/> Copiar para compartilhar</button>
 {message&&<p role="status" className="editorial-feedback">{message}</p>}
 </div></aside>
 </section>
 <p className="destination-source-note">Base cultural: <a href={visitorGuide} target="_blank" rel="noopener noreferrer">Museu Regional de São João del-Rei</a> (guia atualizado em julho/2025). Confirme horários, ingressos e acessibilidade nos canais oficiais.</p>
 </>;
}
export function Planner(){
 const [period,setPeriod]=useState('meio');
 const [interest,setInterest]=useState('cultura');
 const [result,setResult]=useState(false);
 const recommendation=useMemo(()=>{
  if(interest==='trilhos'||period==='dia')return journeys[2];
  if(interest==='igrejas')return journeys[1];
  return journeys[0];
 },[interest,period]);
 return <>
 <div className="editorial-page-hero editorial-page-hero-dark"><p className="destination-kicker">PLANEJADOR DE VIAGEM</p><h1>Uma viagem<br/><em>com a sua cara.</em></h1><p>Escolha seu tempo e o que mais interessa. Receba um percurso editorial que você pode adaptar, salvar e compartilhar.</p></div>
 <section className="editorial-planner-page">
 <div className="editorial-planner-form">
  <div className="editorial-planner-step"><span>01 / TEMPO DISPONÍVEL</span><h2>Quanto tempo você tem?</h2>
   <div className="editorial-option-grid">{[{id:'meio',label:'Meio dia',desc:'Um primeiro encontro'},{id:'dia',label:'Um dia',desc:'Um mergulho na cidade'}].map(option=><button key={option.id} type="button" className={period===option.id?'selected':''} aria-pressed={period===option.id} onClick={()=>{setPeriod(option.id);setResult(false);}}><Check size={17}/><strong>{option.label}</strong><small>{option.desc}</small></button>)}</div>
  </div>
  <div className="editorial-planner-step"><span>02 / INTERESSES</span><h2>O que faz seus olhos brilharem?</h2>
   <div className="editorial-option-grid">{[{id:'cultura',label:'História & museus',desc:'Conhecer a memória local'},{id:'igrejas',label:'Igrejas & arte',desc:'Patrimônio religioso'},{id:'trilhos',label:'Trens & experiências',desc:'Caminhos e descobertas'}].map(option=><button key={option.id} type="button" className={interest===option.id?'selected':''} aria-pressed={interest===option.id} onClick={()=>{setInterest(option.id);setResult(false);}}><Compass size={17}/><strong>{option.label}</strong><small>{option.desc}</small></button>)}</div>
  </div>
  <button type="button" onClick={()=>setResult(true)} className="destination-button-dark">Encontrar meu roteiro <ArrowRight size={18}/></button>
 </div>
 <aside className="editorial-planner-preview"><div className="editorial-planner-cover"><EditorialImage photo={recommendation.image}/></div><div className="editorial-planner-preview-copy"><span>{result?'RECOMENDAÇÃO PARA VOCÊ':'SEU PRÓXIMO CAMINHO'}</span><h2>{result?recommendation.title:'Tudo começa com uma escolha.'}</h2><p>{result?recommendation.intro:'Selecione o tempo disponível e seus interesses. A sugestão aparecerá aqui, pronta para você adaptar.'}</p>
 {result&&<Link className="destination-button-primary" to={'/roteiros/guias/'+recommendation.slug}>Ver roteiro com {recommendation.stops.length} paradas <ArrowUpRight size={18}/></Link>}</div></aside>
 </section>
 <p className="destination-source-note">O planejador utiliza roteiros editoriais, não IA generativa nem disponibilidade em tempo real. Durações estimadas; verifique informações na fonte.</p>
 </>;
}
