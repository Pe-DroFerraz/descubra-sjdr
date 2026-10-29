import { useCallback, useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type FormEvent } from 'react';
import { ArrowRight, ArrowUpRight, Bookmark, Check, CheckCircle2, ChevronDown, Clock3, Compass, Copy, Download, FileText, Heart, Layers3, LayoutGrid, MapPin, Menu, Monitor, MousePointer2, Palette, RotateCcw, Save, Search, Settings2, Share2, ShieldCheck, Smartphone, SlidersHorizontal, Sparkles, Tablet, Type, Upload, X } from 'lucide-react';
import { commonsImage, journeys, topics, type PhotoKey } from '../data/editorial';
import { CURATED_MAP_POINTS } from '../data/map-landmarks';
import 'leaflet/dist/leaflet.css';
import '../styles/design-studio.css';

type Screen='inicio'|'explorar'|'mapa'|'roteiros'|'planejar'|'eventos'|'anuncie'|'editais';
type Device='desktop'|'tablet'|'mobile';
type Font='editorial'|'humanista'|'moderna';
type ButtonStyle='pill'|'soft'|'minimal';
type HeroStyle='full'|'split';
type Inspector='cores'|'tipografia'|'layout'|'elementos';
type Theme={
 primary:string;paper:string;accent:string;ink:string;soft:string;
 font:Font;radius:number;spacing:number;scale:number;
 button:ButtonStyle;hero:HeroStyle;shadows:boolean;animations:boolean;
};
type Snapshot={id:string;name:string;created:string;theme:Theme};
type ConfigFile={app:string;version:number;name?:string;theme:Theme};
const STORAGE='sjdr-atelie-v1';
const SLOTS='sjdr-atelie-versions-v1';
const APPROVAL='sjdr-atelie-aprovacao-v1';
const original:Theme={
 primary:'#173B37',paper:'#F7F5EF',accent:'#B38456',ink:'#233B33',soft:'#E7EEE8',
 font:'editorial',radius:24,spacing:22,scale:100,button:'pill',hero:'full',shadows:false,animations:true,
};
const presets:{id:string;title:string;caption:string;theme:Theme}[]=[
 {id:'serra',title:'Serra & Patrimônio',caption:'Verde mineral, luz suave e elegância editorial',theme:original},
 {id:'barroco',title:'Barroco contemporâneo',caption:'Terracota, vinho e areia quente',theme:{...original,primary:'#632F33',paper:'#FAF5EE',accent:'#B47648',ink:'#48292D',soft:'#F0E3D9',font:'humanista',radius:30,spacing:25}},
 {id:'azulejo',title:'Azulejo & Cultura',caption:'Azul profundo e detalhes em cobre',theme:{...original,primary:'#1E4660',paper:'#F7F8F5',accent:'#B97750',ink:'#213D50',soft:'#E4EDF2',font:'moderna',radius:18,spacing:20}},
 {id:'oliva',title:'Oliva & Arte',caption:'Verde oliva e papel natural',theme:{...original,primary:'#4B5B3E',paper:'#FAF7EF',accent:'#997349',ink:'#333A2E',soft:'#EEF0E1',font:'editorial',radius:34,spacing:28}},
];
const screens:{id:Screen;name:string;description:string}[]=[
 {id:'inicio',name:'Página inicial',description:'Primeira impressão'},
 {id:'explorar',name:'Explorar lugares',description:'Busca e categorias'},
 {id:'mapa',name:'Mapa turístico',description:'Pins e navegação'},
 {id:'roteiros',name:'Roteiros',description:'Experiências detalhadas'},
 {id:'planejar',name:'Planeje sua viagem',description:'Recomendação guiada'},
 {id:'eventos',name:'Agenda cultural',description:'Calendário e eventos'},
 {id:'anuncie',name:'Para anunciantes',description:'Captação comercial'},
 {id:'editais',name:'Editais e avisos',description:'Informação pública'},
];
const icons:Record<Screen,typeof Compass>={
 inicio:Compass,explorar:Search,mapa:MapPin,roteiros:Bookmark,
 planejar:SlidersHorizontal,eventos:Clock3,anuncie:Sparkles,editais:FileText,
};
const places:{name:string;group:string;photo:PhotoKey;description:string;position:string}[]=[
 {name:'Igreja de São Francisco de Assis',group:'Patrimônio',photo:'francisco',description:'Arquitetura e arte em uma das praças mais conhecidas da cidade.',position:'Praça Frei Orlando'},
 {name:'Catedral Basílica do Pilar',group:'Patrimônio',photo:'pilar',description:'Histórias e arte sacra no coração do centro histórico.',position:'Centro histórico'},
 {name:'Museu Regional',group:'Museus',photo:'museum',description:'Memórias, ofícios e patrimônio cultural em um casarão histórico.',position:'Rua Marechal Deodoro'},
 {name:'Museu Ferroviário',group:'Experiências',photo:'station',description:'Um encontro com os trilhos e a história ferroviária de Minas.',position:'Estação'},
 {name:'Igreja do Carmo',group:'Patrimônio',photo:'carmo',description:'Tradição religiosa e arquitetura no Largo do Carmo.',position:'Largo do Carmo'},
 {name:'Serra de São José',group:'Natureza',photo:'serra',description:'Caminhos, paisagens e natureza na região.',position:'Entorno de Tiradentes'},
];
const events=[
 {date:'Agenda ilustrativa',name:'Circuito de música e tradição',type:'Cultura',place:'Centro histórico',description:'Exemplo de como um evento será apresentado, sem programação oficial vinculada.'},
 {date:'Agenda ilustrativa',name:'Encontro de gastronomia mineira',type:'Gastronomia',place:'Comércio local',description:'Evento fictício para experimentar filtros e chamadas de ação.'},
 {date:'Agenda ilustrativa',name:'Visita mediada ao patrimônio',type:'Patrimônio',place:'Instituição cultural',description:'Atividade demonstrativa. Confirme eventos reais nos canais oficiais.'},
];
function validHex(v:unknown):v is string{return typeof v==='string'&&/^#[0-9a-fA-F]{6}$/.test(v);}
function validateTheme(data:unknown):Theme|null{
 if(!data||typeof data!=='object')return null;
 const x=data as Record<string,unknown>;
 if(![x.primary,x.paper,x.accent,x.ink,x.soft].every(validHex))return null;
 if(!['editorial','humanista','moderna'].includes(String(x.font)))return null;
 if(!['pill','soft','minimal'].includes(String(x.button)))return null;
 if(!['full','split'].includes(String(x.hero)))return null;
 if(![x.radius,x.spacing,x.scale].every(n=>typeof n==='number'&&Number.isFinite(n)))return null;
 if(typeof x.shadows!=='boolean'||typeof x.animations!=='boolean')return null;
 return {
   primary:x.primary as string,paper:x.paper as string,accent:x.accent as string,
   ink:x.ink as string,soft:x.soft as string,font:x.font as Font,
   radius:Math.max(0,Math.min(48,x.radius as number)),spacing:Math.max(10,Math.min(42,x.spacing as number)),
   scale:Math.max(85,Math.min(120,x.scale as number)),button:x.button as ButtonStyle,
   hero:x.hero as HeroStyle,shadows:x.shadows,animations:x.animations,
 };
}
function readSaved():Theme {
 try{const v=localStorage.getItem(STORAGE);if(v){const t=validateTheme(JSON.parse(v));if(t)return t;}}catch{/* private mode */}
 return original;
}
function readVersions():Snapshot[]{
 try{
  const raw=JSON.parse(localStorage.getItem(SLOTS)??'[]');
  return Array.isArray(raw)?raw.filter((x):x is Snapshot=>Boolean(x&&typeof x.id==='string'&&validateTheme(x.theme))).slice(0,10):[];
 }catch{return []}
}
function Photo({id,alt,className=''}:{id:PhotoKey;alt:string;className?:string}){
 const [failed,setFailed]=useState(false);
 return <div className={'st-photo '+className} style={{background:failed?'linear-gradient(140deg,#c9c6b9,#738e7d)':'#c9d0c4'}}>
   {!failed&&<img src={commonsImage(id,1280)} loading="lazy" decoding="async" alt={alt} onError={()=>setFailed(true)}/>}
 </div>;
}
function StudioMap({onPlace}:{onPlace:(name:string)=>void}){
 const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{
   if(!root.current)return;
   let active=true;let map: import('leaflet').Map|undefined;
   void import('leaflet').then(({default:L})=>{
     if(!active||!root.current)return;
     map=L.map(root.current,{zoomControl:true,scrollWheelZoom:false}).setView([-21.136,-44.262],14.4);
     L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
       maxZoom:19,attribution:'© OpenStreetMap contributors',
     }).addTo(map);
     CURATED_MAP_POINTS.forEach(p=>{
       L.circleMarker([p.lat,p.lng],{radius:10,fillColor:'#173B37',fillOpacity:1,color:'#fff',weight:3})
         .addTo(map!).bindTooltip(p.name).on('click',()=>onPlace(p.name));
     });
     requestAnimationFrame(()=>map?.invalidateSize());
   }).catch(()=>{/* map keeps a readable placeholder */});
   return()=>{active=false;map?.remove();};
 },[onPlace]);
 return <div className="st-map-canvas" ref={root} aria-label="Mapa interativo de demonstração com pontos turísticos"/>;
}
function PreviewSite({theme,screen,onNavigate,baseline=false}:{theme:Theme;screen:Screen;onNavigate:(v:Screen)=>void;baseline?:boolean}){
 const [menu,setMenu]=useState(false);
 const [query,setQuery]=useState('');
 const [category,setCategory]=useState('Todos');
 const [picked,setPicked]=useState<string|null>(null);
 const [favorites,setFavorites]=useState<string[]>([]);
 const [route,setRoute]=useState(0);
 const [day,setDay]=useState('Um dia');
 const [interest,setInterest]=useState('História');
 const [recommend,setRecommend]=useState(false);
 const [contact,setContact]=useState({name:'',company:'',email:''});
 const [sent,setSent]=useState(false);
 const [eventFilter,setEventFilter]=useState('Todos');
 const [noticeQuery,setNoticeQuery]=useState('');
 const [notice,setNotice]=useState<number|null>(null);
 const [noticeAction,setNoticeAction]=useState(false);
 const [view3d,setView3d]=useState(false);
 const [smallToast,setSmallToast]=useState('');
 const onPlace=useCallback((name:string)=>setPicked(name),[]);
 function go(s:Screen){setMenu(false);setPicked(null);onNavigate(s);}
 const css={
   '--st-primary':theme.primary,'--st-paper':theme.paper,'--st-accent':theme.accent,
   '--st-ink':theme.ink,'--st-soft':theme.soft,'--st-radius':theme.radius+'px',
   '--st-gap':theme.spacing+'px','--st-scale':String(theme.scale/100),
   '--st-btn-radius':theme.button==='pill'?'999px':theme.button==='soft'?'14px':'4px',
 } as CSSProperties;
 const catalog=places.filter(x=>(category==='Todos'||x.group===category)&&
    (query.trim()===''||[x.name,x.group,x.description].join(' ').toLowerCase().includes(query.trim().toLowerCase())));
 function toggleFavorite(name:string){setFavorites(old=>old.includes(name)?old.filter(n=>n!==name):[...old,name]);setSmallToast('Favoritos atualizados nesta demonstração.');}
 function lead(e:FormEvent){e.preventDefault();setSent(true);}
 const chosenRoute=journeys[route]??journeys[0];
 return <div className={'st-site font-'+theme.font+' hero-'+theme.hero+' '+(theme.shadows?'with-shadows ':'')+(theme.animations?'with-motion ':'')+(baseline?'is-baseline':'')} style={css}>
   <div className="st-site-top">
     <button className="st-brand" onClick={()=>go('inicio')}><span className="st-brand-symbol">sj.</span><span>descubra<small>SÃO JOÃO DEL-REI</small></span></button>
     <nav className="st-nav" aria-label="Menu do site demonstrativo">
       {(['explorar','mapa','roteiros','eventos','planejar'] as Screen[]).map(s=><button key={s} className={s===screen?'active':''} onClick={()=>go(s)}>{screens.find(x=>x.id===s)?.name.replace(' lugares','').replace(' sua viagem','')}</button>)}
     </nav>
     <button className="st-site-nav-cta" onClick={()=>go('mapa')}><MapPin size={15}/> Ver mapa</button>
     <button className="st-hamburger" aria-label="Abrir menu demonstrativo" aria-expanded={menu} onClick={()=>setMenu(!menu)}>{menu?<X size={19}/>:<Menu size={19}/>}</button>
   </div>
   {menu&&<nav className="st-mobile-nav">{screens.map(x=><button key={x.id} onClick={()=>go(x.id)}>{x.name}<ArrowRight size={15}/></button>)}</nav>}
   {screen==='inicio'&&<>
     <section className="st-hero">
       <Photo id="francisco" alt="Igreja de São Francisco de Assis" className="st-hero-photo"/>
       <div className="st-hero-content">
         <p className="st-overline">SÃO JOÃO DEL-REI · MINAS GERAIS</p>
         <h1>O melhor da viagem<br/>é <em>sentir o lugar.</em></h1>
         <p>Ruas que contam histórias. Caminhos para explorar. Uma cidade inteira para descobrir no seu ritmo.</p>
         <div className="st-actions">
           <button className="st-primary-btn" onClick={()=>go('explorar')}>Explore São João <ArrowUpRight size={16}/></button>
           <button className="st-ghost-btn" onClick={()=>go('mapa')}>Conheça o mapa <MapPin size={16}/></button>
         </div>
       </div>
       <small className="st-photo-credit">Imagem ilustrativa do destino · Wikimedia Commons</small>
     </section>
     <section className="st-section st-intro">
       <span className="st-eyebrow">EXPLORE SEU PRÓXIMO DESTINO</span>
       <div className="st-section-intro"><h2>Cada caminho,<br/><em>uma descoberta.</em></h2><p>Patrimônio, natureza, cultura e sabores. Escolha por onde começar sua experiência.</p></div>
       <div className="st-categories">
         {topics.slice(0,4).map(p=><button key={p.id} onClick={()=>{setCategory(p.id==='historia'?'Patrimônio':p.id==='cultura'?'Museus':p.id==='natureza'?'Natureza':'Experiências');go('explorar');}}>
           <Photo id={p.image} alt={p.name}/><strong>{p.name}</strong><span><ArrowUpRight size={18}/></span>
         </button>)}
       </div>
     </section>
     <section className="st-section st-map-feature">
       <div><span className="st-eyebrow">ORIENTE-SE COM FACILIDADE</span><h2>A cidade está<br/><em>no seu mapa.</em></h2><p>Encontre igrejas, museus e caminhos no centro histórico. Um mapa de verdade, com pontos para explorar.</p>
         <button className="st-primary-btn" onClick={()=>go('mapa')}>Abrir mapa turístico <ArrowUpRight size={16}/></button></div>
       <div className="st-map-illustration">
         <div className="st-map-pattern"><span>●</span><span>●</span><span>●</span></div>
         <div className="st-map-float"><MapPin size={18}/> Centro histórico</div>
         <small>Visual ilustrativo · Abra o mapa interativo</small>
       </div>
     </section>
     <section className="st-section">
       <div className="st-section-intro"><h2>Viva a cidade<br/><em>do seu jeito.</em></h2><button className="st-inline-link" onClick={()=>go('roteiros')}>Ver todos os roteiros <ArrowRight size={16}/></button></div>
       <div className="st-route-row">{journeys.map((r,i)=><button key={r.slug} onClick={()=>{setRoute(i);go('roteiros');}}>
         <Photo id={r.image} alt={r.title}/><span>{r.duration} · {r.stops.length} paradas</span><h3>{r.title}</h3><small>{r.short}</small>
       </button>)}</div>
     </section>
   </>}
   {screen==='explorar'&&<>
     <header className="st-page-heading"><span className="st-eyebrow">LUGARES PARA DESCOBRIR</span><h1>Encontre o que faz<br/><em>seus olhos brilharem.</em></h1><p>De igrejas e museus a experiências especiais pelo caminho.</p></header>
     <section className="st-section st-explore-area">
       <div className="st-search-line"><Search size={18}/><input aria-label="Buscar atrações demonstrativas" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Pesquise igrejas, museus, natureza..."/></div>
       <div className="st-pills">{['Todos','Patrimônio','Museus','Experiências','Natureza'].map(x=><button key={x} className={category===x?'active':''} onClick={()=>setCategory(x)}>{x}</button>)}</div>
       <div className="st-grid-places">{catalog.map(p=><article key={p.name} className="st-place-card">
          <button className="st-place-photo" onClick={()=>setPicked(p.name)} aria-label={'Abrir '+p.name}><Photo id={p.photo} alt={p.name}/></button>
          <button className="st-favorite" aria-label={'Favoritar '+p.name} aria-pressed={favorites.includes(p.name)} onClick={()=>toggleFavorite(p.name)}><Heart size={17} fill={favorites.includes(p.name)?'currentColor':'none'}/></button>
          <small>{p.group} · {p.position}</small><h3>{p.name}</h3><button className="st-inline-link" onClick={()=>setPicked(p.name)}>Conhecer lugar <ArrowUpRight size={16}/></button>
       </article>)}</div>
       {!catalog.length&&<div className="st-empty">Nenhum lugar encontrado nesta combinação. Experimente outro filtro.</div>}
     </section>
   </>}
   {screen==='mapa'&&<>
     <header className="st-page-heading"><span className="st-eyebrow">MAPA TURÍSTICO INTERATIVO</span><h1>A cidade está<br/><em>no seu mapa.</em></h1><p>Amplie, arraste e toque nos pontos. Esta é uma demonstração com referências geográficas do centro histórico.</p></header>
     <section className="st-section st-map-page">
       <div className="st-map-toolbar"><span><MapPin size={16}/> São João del-Rei · Centro histórico</span>
         <button onClick={()=>setView3d(!view3d)}><Layers3 size={16}/>{view3d?'Ver mapa plano':'Como funciona o 3D?'}</button></div>
       {view3d?<div className="st-map-explain"><Layers3 size={32}/><h3>Relevo tridimensional</h3><p>A experiência 3D usa dados de elevação e WebGL. Para testá-la de verdade, abra a versão pública em outra aba.</p><a href="/mapa-3d" target="_blank" rel="noopener noreferrer">Abrir mapa 3D <ArrowUpRight size={16}/></a></div>:<StudioMap onPlace={onPlace}/>}
       <div className="st-map-places"><strong>Explore pelo mapa</strong>{CURATED_MAP_POINTS.map(p=><button key={p.id} onClick={()=>setPicked(p.name)}><MapPin size={16}/><span>{p.name}</span><ArrowUpRight size={15}/></button>)}</div>
     </section>
   </>}
   {screen==='roteiros'&&<>
     <header className="st-page-heading"><span className="st-eyebrow">CAMINHOS COM HISTÓRIA</span><h1>Mais do que visitar.<br/><em>É viver a experiência.</em></h1><p>Três sugestões para começar. Ajuste o percurso no seu ritmo.</p></header>
     <section className="st-section st-trip">
       <div className="st-route-selection">{journeys.map((r,i)=><button key={r.slug} className={route===i?'active':''} onClick={()=>setRoute(i)}>{r.title}<ArrowRight size={15}/></button>)}</div>
       <div className="st-route-detail"><Photo id={chosenRoute.image} alt={chosenRoute.title}/><div className="st-route-desc"><span className="st-eyebrow">{chosenRoute.duration} · {chosenRoute.stops.length} PARADAS</span><h2>{chosenRoute.title}</h2><p>{chosenRoute.intro}</p>
         <div className="st-stop-list">{chosenRoute.stops.map((stop,i)=><div key={stop.name}><b>{String(i+1).padStart(2,'0')}</b><span><strong>{stop.name}</strong><small>{stop.duration} min · {stop.location}</small></span></div>)}</div>
         <button className="st-primary-btn" onClick={()=>setSmallToast('Roteiro adicionado aos favoritos da demonstração.')}>Salvar este roteiro <Bookmark size={15}/></button></div></div>
     </section>
   </>}
   {screen==='planejar'&&<>
     <header className="st-page-heading"><span className="st-eyebrow">SEU TEMPO, SEU ROTEIRO</span><h1>Uma viagem<br/><em>com a sua cara.</em></h1><p>Algumas escolhas e um caminho para começar. Sem prometer horários ou disponibilidade em tempo real.</p></header>
     <section className="st-section st-planner">
       <div className="st-planner-steps">
         <p className="st-eyebrow">01 / QUANTO TEMPO?</p><h3>Qual é o tamanho da sua viagem?</h3>
         <div className="st-choice-row">{['Meio dia','Um dia','Fim de semana'].map(x=><button key={x} className={day===x?'selected':''} onClick={()=>{setDay(x);setRecommend(false);}}>{x}</button>)}</div>
         <p className="st-eyebrow">02 / O QUE VOCÊ PREFERE?</p><h3>O que desperta sua curiosidade?</h3>
         <div className="st-choice-row">{['História','Igrejas','Trens'].map(x=><button key={x} className={interest===x?'selected':''} onClick={()=>{setInterest(x);setRecommend(false);}}>{x}</button>)}</div>
         <button className="st-primary-btn" onClick={()=>setRecommend(true)}>Encontrar meu roteiro <ArrowRight size={16}/></button>
       </div>
       <aside className="st-planner-recommend">
         <Photo id={interest==='Trens'?'trem':interest==='Igrejas'?'carmo':'francisco'} alt="Experiência sugerida"/>
         <div><span className="st-eyebrow">{recommend?'SUA SUGESTÃO':'PRONTO PARA COMEÇAR?'}</span>
           <h3>{recommend?(interest==='Trens'?journeys[2].title:interest==='Igrejas'?journeys[1].title:journeys[0].title):'Você escolhe. A cidade surpreende.'}</h3>
           <p>{recommend?'Uma sugestão baseada nas suas escolhas. Personalize as paradas no roteiro completo.':'Selecione o tempo disponível e seus interesses para receber uma sugestão.'}</p>
           {recommend&&<button className="st-inline-link" onClick={()=>{setRoute(interest==='Trens'?2:interest==='Igrejas'?1:0);go('roteiros');}}>Ver minhas paradas <ArrowRight size={16}/></button>}
         </div>
       </aside>
     </section>
   </>}
   {screen==='eventos'&&<>
     <header className="st-page-heading"><span className="st-eyebrow">AGENDA DA CIDADE</span><h1>O que acontece<br/><em>por aqui.</em></h1><p>Uma proposta para divulgar encontros e experiências culturais da região.</p></header>
     <div className="st-demo-warning"><ShieldCheck size={17}/> Eventos abaixo são fictícios, utilizados apenas para testar o design.</div>
     <section className="st-section"><div className="st-pills">{['Todos','Cultura','Gastronomia','Patrimônio'].map(x=><button key={x} className={eventFilter===x?'active':''} onClick={()=>setEventFilter(x)}>{x}</button>)}</div>
       <div className="st-event-list">{events.filter(e=>eventFilter==='Todos'||e.type===eventFilter).map(e=><article key={e.name}><div className="st-event-date"><small>AGENDA</small><strong>DEMO</strong></div>
         <div><span className="st-eyebrow">{e.type} · {e.place}</span><h3>{e.name}</h3><p>{e.description}</p></div><button aria-label={'Detalhes de '+e.name} onClick={()=>setPicked(e.name)}><ArrowUpRight size={20}/></button></article>)}</div>
     </section>
   </>}
   {screen==='anuncie'&&<>
     <header className="st-page-heading"><span className="st-eyebrow">PARA QUEM FAZ A CIDADE ACONTECER</span><h1>Seu negócio na<br/><em>rota de novas histórias.</em></h1><p>Uma presença profissional para conectar visitantes a empresas e experiências locais.</p></header>
     <section className="st-section st-business">
       <div className="st-business-story"><Photo id="trem" alt="Experiência na região"/><h3>Visibilidade com contexto.</h3><p>Perfis, locais no mapa, roteiros e destaques identificados. Uma plataforma feita para servir ao turismo e ao comércio.</p></div>
       <form className="st-lead-form" onSubmit={lead}>
         <span className="st-eyebrow">DEMONSTRAÇÃO DE CONTATO</span><h3>Vamos conversar sobre seu negócio?</h3>
         <label>Seu nome<input required value={contact.name} onChange={e=>setContact(c=>({...c,name:e.target.value}))} placeholder="Nome completo"/></label>
         <label>Nome do estabelecimento<input required value={contact.company} onChange={e=>setContact(c=>({...c,company:e.target.value}))} placeholder="Ex.: Café do Centro"/></label>
         <label>E-mail<input type="email" required value={contact.email} onChange={e=>setContact(c=>({...c,email:e.target.value}))} placeholder="seuemail@exemplo.com"/></label>
         <button className="st-primary-btn" type="submit">Simular envio <ArrowRight size={16}/></button>
         {sent&&<p className="st-form-success"><CheckCircle2 size={17}/> Formulário validado. Nenhum dado foi enviado ou armazenado em servidor.</p>}
         <small>Ambiente de demonstração, sem envio real de mensagens.</small>
       </form>
     </section>
   </>}
   {screen==='editais'&&<>
     <header className="st-page-heading"><span className="st-eyebrow">TRANSPARÊNCIA & INFORMAÇÃO</span><h1>Informação clara.<br/><em>Acesso para todos.</em></h1><p>Uma proposta visual para reunir avisos públicos, editais e fontes verificadas.</p></header>
     <div className="st-demo-warning"><ShieldCheck size={17}/> Documentos ilustrativos. Este estúdio não é um canal oficial de governo.</div>
     <section className="st-section st-notices">
       <div className="st-search-line"><Search size={17}/><input aria-label="Pesquisar editais de demonstração" placeholder="Pesquisar um aviso..." value={noticeQuery} onChange={e=>setNoticeQuery(e.target.value)}/></div>
       {['Chamamento cultural — documento demonstrativo','Aviso de consulta pública — documento demonstrativo','Cadastro de atividades turísticas — documento demonstrativo'].filter(x=>x.toLowerCase().includes(noticeQuery.toLowerCase())).map((x,i)=><article key={x}>
         <div><FileText size={23}/><span><small>MODELO / SEM VALIDADE LEGAL</small><h3>{x}</h3><p>Prévia de apresentação e organização, sem publicação oficial.</p></span></div>
         <button onClick={()=>{setNotice(i);setNoticeAction(false);}}>Detalhes <ArrowUpRight size={15}/></button>
       </article>)}
       {notice!==null&&<div className="st-notice-open"><strong>Documento demonstrativo selecionado</strong><p>Esta seção apresenta como avisos e editais poderiam ser exibidos, com fonte, data de publicação, anexos e atualização — após homologação institucional.</p><button onClick={()=>setNoticeAction(true)}><Copy size={15}/> Simular cópia do link</button>{noticeAction&&<span role="status">Link demonstrativo selecionado. Nenhum documento oficial foi publicado.</span>}</div>}
     </section>
   </>}
   {picked&&<div className="st-detail-backdrop" role="presentation" onClick={()=>setPicked(null)}><div className="st-detail-sheet" role="dialog" aria-modal="true" aria-label={'Detalhes de '+picked} onClick={e=>e.stopPropagation()}>
     <button className="st-close" onClick={()=>setPicked(null)} aria-label="Fechar detalhes"><X size={19}/></button>
     <span className="st-eyebrow">VISUALIZAÇÃO DE DEMONSTRAÇÃO</span><h2>{picked}</h2><p>{places.find(p=>p.name===picked)?.description??'Detalhes ilustrativos do evento. A programação real deve ser verificada.'}</p>
     <button className="st-primary-btn" onClick={()=>{toggleFavorite(picked);setPicked(null);}}>Salvar interesse <Heart size={16}/></button>
   </div></div>}
   {smallToast&&<div className="st-site-toast" role="status"><CheckCircle2 size={15}/>{smallToast}<button aria-label="Fechar aviso" onClick={()=>setSmallToast('')}><X size={13}/></button></div>}
   <footer className="st-site-footer"><span className="st-brand-foot">sj.</span><p>Descubra São João del-Rei<br/><small>Design demonstrativo · Conteúdo ilustrativo</small></p><button onClick={()=>go('anuncie')}>Seu negócio aqui <ArrowUpRight size={14}/></button></footer>
 </div>;
}
function Slider({label,value,min,max,onChange,unit='px'}:{label:string;value:number;min:number;max:number;onChange:(n:number)=>void;unit?:string}){
 return <label className="ds-slider"><span>{label}<b>{value}{unit}</b></span><input type="range" min={min} max={max} value={value} onChange={e=>onChange(Number(e.target.value))}/></label>;
}
export default function DesignStudio(){
 const [theme,setTheme]=useState<Theme>(readSaved);
 const [page,setPage]=useState<Screen>('inicio');
 const [device,setDevice]=useState<Device>('desktop');
 const [inspector,setInspector]=useState<Inspector>('cores');
 const [compare,setCompare]=useState(false);
 const [approved,setApproved]=useState(false);
 const [versions,setVersions]=useState<Snapshot[]>(readVersions);
 const [snapshotName,setSnapshotName]=useState('');
 const [showVersions,setShowVersions]=useState(false);
 const [notification,setNotification]=useState('');
 const [studioMenu,setStudioMenu]=useState(false);
 const fileRef=useRef<HTMLInputElement>(null);
 const browserRef=useRef<HTMLDivElement>(null);
 const themeIsOriginal=JSON.stringify(theme)===JSON.stringify(original);
 function update(patch:Partial<Theme>){setTheme(t=>({...t,...patch}));setApproved(false);}
 function notify(message:string){setNotification(message);}
 function setScreen(s:Screen){setPage(s);setStudioMenu(false);browserRef.current?.scrollTo({top:0,behavior:'smooth'});}
 function save(){
   try{localStorage.setItem(STORAGE,JSON.stringify(theme));notify('Alterações salvas neste navegador.');}
   catch{notify('Seu navegador não permitiu salvar. Utilize Exportar JSON.');}
 }
 function version(){
   const name=snapshotName.trim()||'Versão '+(versions.length+1);
   const next=[{id:String(Date.now()),name,created:new Date().toLocaleString('pt-BR'),theme:{...theme}},...versions].slice(0,10);
   setVersions(next);setSnapshotName('');
   try{localStorage.setItem(SLOTS,JSON.stringify(next));localStorage.setItem(STORAGE,JSON.stringify(theme));notify('Versão '+name+' salva neste navegador.');}
   catch{notify('Não foi possível persistir as versões neste navegador.');}
 }
 function download(){
   const content:ConfigFile={app:'descubra-sjdr-design-studio',version:1,name:'Minha identidade visual',theme};
   const blob=new Blob([JSON.stringify(content,null,2)],{type:'application/json'});
   const url=URL.createObjectURL(blob);
   const link=document.createElement('a');link.href=url;link.download='descubra-sjdr-identidade-visual.json';document.body.appendChild(link);link.click();link.remove();
   window.setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Arquivo JSON exportado com os ajustes atuais.');
 }
 async function share(){
   const settings=btoa(JSON.stringify(theme));
   const url=new URL(window.location.href);url.searchParams.set('tema',settings);
   try{await navigator.clipboard.writeText(url.toString());notify('Link com a identidade atual copiado.');}
   catch{window.history.replaceState(null,'',url.toString());notify('Link atualizado na barra de endereços. Copie-o para compartilhar.');}
 }

 async function approve(){
   try{
     localStorage.setItem(STORAGE,JSON.stringify(theme));
     localStorage.setItem(APPROVAL,JSON.stringify({theme,approvedAt:new Date().toISOString()}));
     setApproved(true);
   }catch{notify('Não foi possível registrar a aprovação local. Exporte o arquivo JSON.');return;}
   const url=new URL(window.location.href);
   url.searchParams.set('tema',btoa(JSON.stringify(theme)));
   url.searchParams.set('aprovado','1');
   try{
     await navigator.clipboard.writeText(url.toString());
     notify('Visual aprovado neste navegador. Envie o link copiado no chat para aplicarmos ao código definitivo.');
   }catch{
     window.history.replaceState(null,'',url.toString());
     notify('Visual aprovado neste navegador. Copie o link da barra de endereços e envie no chat.');
   }
 }
 async function upload(event:ChangeEvent<HTMLInputElement>){
   const file=event.target.files?.[0];if(!file)return;
   if(file.size>100000){notify('Arquivo muito grande. Selecione um JSON exportado pelo estúdio.');return;}
   try{
     const raw=JSON.parse(await file.text()) as ConfigFile;
     const next=validateTheme(raw?.theme);
     if(!next){notify('Arquivo não reconhecido. Utilize um JSON exportado por este estúdio.');return;}
     setTheme(next);setApproved(false);notify('Identidade importada. Confira e salve sua versão.');
   }catch{notify('Não foi possível ler o arquivo JSON.');}
   event.target.value='';
 }
 useEffect(()=>{
   const input=new URLSearchParams(window.location.search).get('tema');
   if(!input||input.length>3000)return;
   try{const t=validateTheme(JSON.parse(atob(input)));if(t){setTheme(t);setApproved(false);}}catch{/* ignore invalid shared URL */}
 },[]);
 useEffect(()=>{document.title='Ateliê Visual · Descubra SJDR';},[]);
 const currentPreset=presets.find(x=>JSON.stringify(x.theme)===JSON.stringify(theme));
 const previewClass='ds-viewport '+device+(compare?' comparison':'');
 return <div className="ds-root">
   <aside className={'ds-left '+(studioMenu?'mobile-open':'')}>
     <div className="ds-brand"><div className="ds-mark">sj.</div><div><strong>ATELIÊ VISUAL</strong><span>DESCUBRA SÃO JOÃO DEL-REI</span></div></div>
     <div className="ds-demo-tag"><span/> AMBIENTE DE DEMONSTRAÇÃO</div>
     <div className="ds-side-label">TELAS DO PROJETO</div>
     <nav className="ds-screen-nav" aria-label="Telas da prévia">{screens.map(x=>{const Icon=icons[x.id];return <button key={x.id} className={page===x.id?'selected':''} onClick={()=>setScreen(x.id)}><Icon size={18}/><span><strong>{x.name}</strong><small>{x.description}</small></span>{page===x.id&&<ArrowRight size={15}/>}</button>;})}</nav>
     <div className="ds-left-bottom"><div><ShieldCheck size={17}/><p><b>Seu banco está protegido.</b><br/>Nenhuma ação aqui altera Supabase, pagamentos ou anúncios reais.</p></div><a href="/" target="_blank" rel="noopener noreferrer">Abrir site público <ArrowUpRight size={14}/></a></div>
   </aside>
   <div className="ds-workspace">
     <header className="ds-toolbar">
       <div className="ds-toolbar-title"><button className="ds-menu-toggle" onClick={()=>setStudioMenu(!studioMenu)} aria-label="Abrir telas"><Menu size={20}/></button>
         <span className="ds-toolbar-kicker">ESTÚDIO DE EXPERIÊNCIA</span><strong>{screens.find(x=>x.id===page)?.name}</strong></div>
       <div className="ds-toolbar-actions">
         <div className="ds-devices" role="group" aria-label="Tamanho do dispositivo">{([{id:'desktop',Icon:Monitor,name:'Computador'},{id:'tablet',Icon:Tablet,name:'Tablet'},{id:'mobile',Icon:Smartphone,name:'Celular'}] as const).map(x=><button key={x.id} className={device===x.id?'active':''} aria-pressed={device===x.id} onClick={()=>setDevice(x.id)} title={x.name}><x.Icon size={18}/></button>)}</div>
         <button className={'ds-top-button '+(compare?'active':'')} aria-pressed={compare} onClick={()=>setCompare(!compare)}><Layers3 size={16}/><span>Comparar</span></button>
         <button className="ds-top-button" onClick={()=>void share()}><Share2 size={16}/><span>Compartilhar</span></button>
         <button className="ds-top-button ds-save-btn" onClick={save}><Save size={16}/><span>Salvar</span></button>
         <button className={'ds-top-button ds-approve-btn '+(approved?'is-approved':'')} onClick={()=>void approve()} title="Aprovar visual"><CheckCircle2 size={16}/><span>{approved?'Aprovado':'Aprovar visual'}</span></button>
       </div>
     </header>
     <div className="ds-preview-area" ref={browserRef}>
       <div className="ds-preview-heading"><div><span className="ds-live-dot"/> PRÉVIA INTERATIVA <small>Dados fictícios · Visualização instantânea</small></div><div>{themeIsOriginal?'Identidade-base':currentPreset?.title??'Identidade personalizada'}<span> · {device==='desktop'?'Desktop':device==='tablet'?'Tablet':'Celular'}</span></div></div>
       <div className={'ds-stage-row '+(compare?'is-comparing':'')}>
         {compare&&<div className="ds-stage-holder"><div className="ds-stage-label">ANTES <span>Identidade original</span></div><div className="ds-preview-scroll"><div className={previewClass}><PreviewSite theme={original} screen={page} onNavigate={setScreen} baseline/></div></div></div>}
         <div className="ds-stage-holder"><div className="ds-stage-label">{compare?'DEPOIS':'VISUALIZAÇÃO'} <span>{compare?'Suas alterações':'Altere os controles à direita'}</span></div><div className="ds-preview-scroll"><div className={previewClass}><PreviewSite theme={theme} screen={page} onNavigate={setScreen}/></div></div></div>
       </div>
       <div className="ds-preview-footer"><span><MousePointer2 size={15}/> Clique e teste menus, filtros, mapa, roteiros e formulários.</span><span>Visual editorial · Portal turístico</span></div>
     </div>
   </div>
   <aside className="ds-inspector">
     <header className="ds-inspector-head"><div><Settings2 size={20}/><strong>Personalizar</strong></div><p>Seu design, atualizado em tempo real.</p></header>
     <div className="ds-inspector-tabs" role="tablist">{([{id:'cores',label:'Cores',Icon:Palette},{id:'tipografia',label:'Tipo',Icon:Type},{id:'layout',label:'Layout',Icon:LayoutGrid},{id:'elementos',label:'Elementos',Icon:SlidersHorizontal}] as const).map(x=><button key={x.id} role="tab" aria-selected={inspector===x.id} className={inspector===x.id?'active':''} onClick={()=>setInspector(x.id)}><x.Icon size={16}/>{x.label}</button>)}</div>
     <div className="ds-inspector-content">
       {inspector==='cores'&&<>
         <div className="ds-control-group"><h3>Identidades prontas</h3><p>Uma boa base para começar, sem limitar suas escolhas.</p><div className="ds-presets">{presets.map(p=><button key={p.id} onClick={()=>{setTheme({...p.theme});setApproved(false);}} className={JSON.stringify(theme)===JSON.stringify(p.theme)?'active':''}><div className="ds-preset-swatches">{[p.theme.primary,p.theme.paper,p.theme.accent].map(c=><span key={c} style={{background:c}}/>)}</div><div><strong>{p.title}</strong><small>{p.caption}</small></div>{JSON.stringify(theme)===JSON.stringify(p.theme)&&<Check size={16}/>}</button>)}</div></div>
         <div className="ds-control-group"><h3>Paleta personalizada</h3><p>As cores influenciam toda a experiência demonstrativa.</p>
         {([{key:'primary',label:'Cor principal'},{key:'paper',label:'Fundo'},{key:'accent',label:'Cor de destaque'},{key:'ink',label:'Texto'},{key:'soft',label:'Superfícies'}] as const).map(x=><label className="ds-color-input" key={x.key}><span>{x.label}<small>{theme[x.key].toUpperCase()}</small></span><input aria-label={x.label} type="color" value={theme[x.key]} onChange={e=>update({[x.key]:e.target.value})}/></label>)}
         </div>
       </>}
       {inspector==='tipografia'&&<div className="ds-control-group"><h3>Personalidade da tipografia</h3><p>Escolha a voz que o destino transmite.</p><div className="ds-font-options">{([
         {id:'editorial',name:'Editorial',detail:'Clássica, cultural e sofisticada'},
         {id:'humanista',name:'Humanista',detail:'Acolhedora e contemporânea'},
         {id:'moderna',name:'Moderna',detail:'Clara, urbana e objetiva'},
       ] as const).map(x=><button key={x.id} onClick={()=>update({font:x.id})} className={theme.font===x.id?'active':''}><b className={'sample-'+x.id}>Aa</b><span><strong>{x.name}</strong><small>{x.detail}</small></span>{theme.font===x.id&&<Check size={16}/>}</button>)}</div><Slider label="Escala de texto" min={85} max={120} value={theme.scale} unit="%" onChange={n=>update({scale:n})}/></div>}
       {inspector==='layout'&&<>
         <div className="ds-control-group"><h3>Composição</h3><p>Altere ritmo visual, cantos e o destaque da capa.</p><Slider label="Arredondamento" min={0} max={48} value={theme.radius} onChange={n=>update({radius:n})}/><Slider label="Espaçamento" min={10} max={42} value={theme.spacing} onChange={n=>update({spacing:n})}/></div>
         <div className="ds-control-group"><h3>Apresentação da capa</h3><div className="ds-choice-pair"><button className={theme.hero==='full'?'active':''} onClick={()=>update({hero:'full'})}>Fotografia ampla</button><button className={theme.hero==='split'?'active':''} onClick={()=>update({hero:'split'})}>Editorial dividido</button></div></div>
       </>}
       {inspector==='elementos'&&<>
         <div className="ds-control-group"><h3>Forma dos botões</h3><div className="ds-button-choices">{([{id:'pill',name:'Orgânico'},{id:'soft',name:'Suave'},{id:'minimal',name:'Discreto'}] as const).map(x=><button key={x.id} className={theme.button===x.id?'active':''} onClick={()=>update({button:x.id})}><span className={'demo-'+x.id}/>{x.name}</button>)}</div></div>
         <div className="ds-control-group"><h3>Detalhes de interação</h3><label className="ds-toggle"><span><strong>Sombras suaves</strong><small>Destaque discreto em superfícies</small></span><input type="checkbox" checked={theme.shadows} onChange={e=>update({shadows:e.target.checked})}/></label><label className="ds-toggle"><span><strong>Microinterações</strong><small>Transições leves e elegantes</small></span><input type="checkbox" checked={theme.animations} onChange={e=>update({animations:e.target.checked})}/></label></div>
       </>}
       <div className="ds-control-group ds-versions"><div className="ds-section-title"><h3>Versões salvas</h3><button aria-label="Abrir versões salvas" onClick={()=>setShowVersions(!showVersions)}><ChevronDown size={17}/></button></div>
         <div className="ds-version-form"><input aria-label="Nome da versão" value={snapshotName} onChange={e=>setSnapshotName(e.target.value)} placeholder="Ex.: Proposta prefeitura"/><button onClick={version}>Criar versão</button></div>
         {showVersions&&<div className="ds-version-list">{versions.length?versions.map(v=><button key={v.id} onClick={()=>{setTheme({...v.theme});setApproved(false);notify('Versão '+v.name+' restaurada.');}}><strong>{v.name}</strong><small>{v.created}</small><ArrowRight size={16}/></button>):<small>Nenhuma versão salva neste navegador.</small>}</div>}
       </div>
       <div className="ds-control-group ds-import-export"><h3>Leve seu design com você</h3><button onClick={download}><Download size={16}/> Exportar identidade (JSON)</button><button onClick={()=>fileRef.current?.click()}><Upload size={16}/> Importar identidade</button><input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={e=>void upload(e)}/><button className="ds-reset" onClick={()=>{setTheme({...original});setApproved(false);notify('Identidade-base restaurada.');}}><RotateCcw size={15}/> Restaurar base original</button></div>
     </div>
     <footer className="ds-inspector-footer"><div><ShieldCheck size={16}/> ALTERAÇÕES SEGURAS</div><p>O estúdio funciona com dados demonstrativos e armazenamento local. Nenhuma alteração é aplicada automaticamente ao site em produção.</p></footer>
   </aside>
   {notification&&<div className="ds-notification" role="status"><CheckCircle2 size={18}/><span>{notification}</span><button aria-label="Fechar notificação" onClick={()=>setNotification('')}><X size={15}/></button></div>}
 </div>;
}
