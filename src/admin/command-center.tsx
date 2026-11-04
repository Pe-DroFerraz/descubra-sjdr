import {useCallback,useEffect,useMemo,useRef,useState,type FormEvent} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {Link} from 'react-router-dom';
import {ArrowRight,ArrowUpRight,CalendarClock,CheckCircle2,Clock3,Compass,ExternalLink,FileText,LayoutDashboard,MapPin,MessageSquareText,RefreshCw,Search,ShieldCheck,TrendingUp,UsersRound,Wallet,X} from 'lucide-react';
import type L from 'leaflet';
import {adminClient} from './api';
import {CURATED_MAP_POINTS} from '../data/map-landmarks';
import 'leaflet/dist/leaflet.css';
import '../styles/admin-console.css';
type Section='overview'|'leads'|'commerce'|'map';
type Place={id:string;name:string;slug:string;status:string;latitude:number|null;longitude:number|null;is_demo:boolean;address:string|null};
type Lead={id:string;name:string;contact:string;contact_name:string|null;phone:string|null;message:string|null;stage:string;plan_slug:string|null;follow_up_at:string|null;created_at:string;updated_at:string};
type Company={id:string;name:string;status:string;updated_at:string};
type Review={id:string;display_name:string;rating:number;comment:string;status:string;created_at:string};
type Payment={id:string;amount_cents:number;status:string;paid_at:string|null};
type Simple={id:string;name:string;status:string};
type Plan={id:string;name:string;price_cents:number;published:boolean};
type Note={id:string;lead_id:string;body:string;created_at:string};
type Log={id:string;action:string;table_name:string;created_at:string};
type Subscription={id:string;status:string;verified_at:string|null};
type Data={places:Place[];leads:Lead[];advertisers:Company[];reviews:Review[];payments:Payment[];routes:Simple[];events:Simple[];plans:Plan[];notes:Note[];logs:Log[];subscriptions:Subscription[]};
type MapPoint={id:string;name:string;lat:number;lng:number;status:string;ref:boolean};
const demo:Data={
 places:[
 {id:'p1',name:'Igreja de São Francisco de Assis',slug:'igreja-sao-francisco-de-assis-sjdr',status:'published',latitude:-21.13891,longitude:-44.26005,is_demo:true,address:'Praça Frei Orlando'},
 {id:'p2',name:'Catedral Basílica do Pilar',slug:'catedral-nossa-senhora-do-pilar',status:'published',latitude:-21.1351,longitude:-44.26211,is_demo:true,address:'Centro histórico'},
 {id:'p3',name:'Museu Regional',slug:'museu-regional-sao-joao-del-rei',status:'draft',latitude:-21.135975,longitude:-44.261233,is_demo:true,address:'Rua Marechal Deodoro'}],
 leads:[
 {id:'l1',name:'Café do Largo — exemplo',contact:'cafe@exemplo.invalid',contact_name:'Contato ilustrativo',phone:null,message:'Gostaria de divulgar meu estabelecimento.',stage:'prospect',plan_slug:'destaque',follow_up_at:null,created_at:'2026-11-02',updated_at:'2026-11-02'},
 {id:'l2',name:'Pousada da Serra — exemplo',contact:'pousada@exemplo.invalid',contact_name:'Contato ilustrativo',phone:null,message:'Solicito informações sobre anúncios.',stage:'contacted',plan_slug:'basico',follow_up_at:null,created_at:'2026-11-01',updated_at:'2026-11-01'}],
 advertisers:[{id:'a1',name:'Pousada demonstrativa',status:'pending',updated_at:'2026-11-01'}],
 reviews:[{id:'rev1',display_name:'Visitante exemplo',rating:5,comment:'Avaliação fictícia para testar moderação.',status:'pending',created_at:'2026-11-02'}],
 payments:[],routes:[{id:'r1',name:'Um dia pelo centro',status:'draft'}],events:[],plans:[{id:'pl1',name:'Plano demonstrativo',price_cents:0,published:false}],
 notes:[],logs:[],subscriptions:[],
};
const stages=['prospect','contacted','proposal','active','lost'] as const;
const stageLabels:Record<string,string>={prospect:'Novo',contacted:'Contato feito',proposal:'Proposta',active:'Convertido',lost:'Encerrado'};
const stageStatus=(name:string)=>'oc-status status-'+name.replace(/[^a-z]/g,'');
const money=(cents:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(cents/100);
const formatDate=(value:string|null)=>value?new Date(value).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'}):'—';
async function rows<T>(table:string,fields:string,limit=350):Promise<T[]>{
 const db=await adminClient();
 const {data,error}=await db.from(table).select(fields).limit(limit);
 if(error)throw new Error(table+': '+error.message);
 return (data??[]) as unknown as T[];
}
async function read():Promise<Data>{
 const [places,leads,advertisers,reviews,payments,routes,events,plans,notes,logs,subscriptions]=await Promise.all([
 rows<Place>('places','id,name,slug,status,latitude,longitude,is_demo,address'),
 rows<Lead>('leads','id,name,contact,contact_name,phone,message,stage,plan_slug,follow_up_at,created_at,updated_at'),
 rows<Company>('advertisers','id,name,status,updated_at'),
 rows<Review>('reviews','id,display_name,rating,comment,status,created_at'),
 rows<Payment>('payments','id,amount_cents,status,paid_at'),
 rows<Simple>('routes','id,name,status'),rows<Simple>('events','id,name,status'),
 rows<Plan>('plans','id,name,price_cents,published'),
 rows<Note>('lead_notes','id,lead_id,body,created_at'),
 rows<Log>('audit_logs','id,action,table_name,created_at',100),
 rows<Subscription>('subscriptions','id,status,verified_at'),
 ]);
 return {places,leads,advertisers,reviews,payments,routes,events,plans,notes,logs,subscriptions};
}
const navItems:[Section,string,typeof Compass][]=[
 ['overview','Visão geral',LayoutDashboard],['leads','Interessados',MessageSquareText],
 ['commerce','Comercial',Wallet],['map','Mapa editorial',MapPin],
];
function Overview({data,setPage}:{data:Data;setPage:(s:Section)=>void}){
 const paid=data.payments.filter(p=>p.status==='paid'&&p.paid_at).reduce((n,p)=>n+p.amount_cents,0);
 const metrics=[
  {title:'Locais publicados',number:String(data.places.filter(p=>p.status==='published'&&!p.is_demo).length),note:String(data.places.length)+' locais cadastrados',icon:MapPin},
  {title:'Novos contatos',number:String(data.leads.filter(l=>l.stage==='prospect').length),note:String(data.leads.length)+' no funil',icon:MessageSquareText},
  {title:'Assinaturas verificadas',number:String(data.subscriptions.filter(s=>s.status==='active'&&s.verified_at).length),note:'Sem valores estimados',icon:CheckCircle2},
  {title:'Pagamentos confirmados',number:money(paid),note:'Sem transações fictícias',icon:Wallet},
 ];
 const max=Math.max(1,...stages.map(x=>data.leads.filter(l=>l.stage===x).length));
 return <>
  <div className="oc-welcome"><div><span className="oc-eyebrow">PAINEL DE OPERAÇÕES · DESTINO TURÍSTICO</span><h2>Sua cidade.<br/><em>Sua operação.</em></h2><p>Um centro para acompanhar conteúdo, parceiros e resultados com informações verificáveis.</p></div><button onClick={()=>setPage('map')}>Explorar mapa <ArrowUpRight size={17}/></button></div>
  <div className="oc-metrics">{metrics.map(m=>{const Icon=m.icon;return <article key={m.title}><span>{m.title}<Icon size={17}/></span><strong>{m.number}</strong><small>{m.note}</small></article>})}</div>
  <div className="oc-grid-two">
   <section className="oc-sheet"><div className="oc-sheet-head"><div><small>RELACIONAMENTO</small><h3>Funil comercial</h3></div><button onClick={()=>setPage('leads')}>Abrir <ArrowUpRight size={16}/></button></div>
    <div className="oc-bars">{stages.map(x=>{const n=data.leads.filter(l=>l.stage===x).length;return <div key={x}><span>{stageLabels[x]}</span><i><b style={{width:String(n/max*100)+'%'}}/></i><strong>{n}</strong></div>})}</div>
   </section>
   <section className="oc-sheet"><div className="oc-sheet-head"><div><small>PUBLICAÇÃO</small><h3>Curadoria do catálogo</h3></div><FileText size={20}/></div>
    <div className="oc-publishing"><div><strong>{data.places.filter(p=>p.status==='draft').length}</strong><span>Rascunhos</span></div><div><strong>{data.places.filter(p=>p.status==='pending').length}</strong><span>Em revisão</span></div><div><strong>{data.reviews.filter(r=>r.status==='pending').length}</strong><span>Avaliações</span></div></div>
    <Link className="oc-text-link" to="/admin?secao=places">Gerenciar conteúdo <ArrowRight size={16}/></Link>
   </section>
  </div>
  <section className="oc-sheet"><div className="oc-sheet-head"><div><small>HISTÓRICO DE OPERAÇÕES</small><h3>Atividade recente</h3></div><Clock3 size={20}/></div>
   {data.logs.length?<div className="oc-logs">{[...data.logs].sort((a,b)=>b.created_at.localeCompare(a.created_at)).slice(0,6).map(l=><p key={l.id}><span/>{l.action.replace(/_/g,' ')} <small>{l.table_name} · {formatDate(l.created_at)}</small></p>)}</div>:<p className="oc-empty">Nenhum movimento registrado no histórico.</p>}
  </section>
 </>;
}
function Leads({data,demoMode,refresh}:{data:Data;demoMode:boolean;refresh:()=>Promise<void>}){
 const [query,setQuery]=useState('');const [stage,setStage]=useState('all');const [current,setCurrent]=useState<string|null>(null);
 const [note,setNote]=useState('');const [follow,setFollow]=useState('');const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(false);const [draftStages,setDraftStages]=useState<Record<string,string>>({});
 const selected=data.leads.find(x=>x.id===current);
 const filtered=data.leads.filter(l=>(stage==='all'||(draftStages[l.id]??l.stage)===stage)&&
  [l.name,l.contact,l.contact_name??''].some(x=>x.toLowerCase().includes(query.toLowerCase())))
  .sort((a,b)=>b.created_at.localeCompare(a.created_at));
 async function setLeadStage(lead:Lead,value:string){
  if(demoMode){setDraftStages(o=>({...o,[lead.id]:value}));setMessage('Etapa simulada, sem alterar dados reais.');return;}
  setBusy(true);setMessage('');
  try{
   const db=await adminClient();
   const {data:updated,error}=await db.from('leads').update({stage:value}).eq('id',lead.id).eq('updated_at',lead.updated_at).select('id').maybeSingle();
   if(error)throw error;if(!updated)throw Error('Registro alterado por outra sessão. Atualize.');
   await refresh();setMessage('Etapa salva no banco.');
  }catch(e){setMessage(e instanceof Error?e.message:'Erro ao atualizar.');}finally{setBusy(false);}
 }
 async function submitNote(e:FormEvent){
  e.preventDefault();if(!selected||!note.trim())return;
  if(demoMode){setMessage('Nota simulada; nenhum dado gravado.');setNote('');return;}
  setBusy(true);
  try{
   const db=await adminClient();const {data,error}=await db.auth.getUser();if(error||!data.user)throw Error('Sessão não verificada.');
   const result=await db.from('lead_notes').insert({lead_id:selected.id,author_id:data.user.id,body:note.trim()});
   if(result.error)throw result.error;setNote('');await refresh();setMessage('Nota registrada.');
  }catch(e){setMessage(e instanceof Error?e.message:'Erro ao gravar nota.');}finally{setBusy(false);}
 }
 async function submitFollow(e:FormEvent){
  e.preventDefault();if(!selected)return;
  if(demoMode){setMessage('Retorno agendado apenas nesta demonstração.');return;}
  setBusy(true);
  try{
   const db=await adminClient();
   const {data:updated,error}=await db.from('leads').update({follow_up_at:follow?new Date(follow).toISOString():null}).eq('id',selected.id).eq('updated_at',selected.updated_at).select('id').maybeSingle();
   if(error)throw error;if(!updated)throw Error('Registro alterado. Atualize.');
   await refresh();setMessage('Retorno atualizado.');
  }catch(e){setMessage(e instanceof Error?e.message:'Falha ao agendar.');}finally{setBusy(false);}
 }
 return <><div className="oc-section-title"><span className="oc-eyebrow">GESTÃO DE RELACIONAMENTO</span><h2>Converse com quem quer fazer parte.</h2><p>Busque, classifique e acompanhe interessados vindos do formulário público.</p></div>
  <div className="oc-lead-tools"><label><Search size={16}/><input aria-label="Pesquisar interessados" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Empresa, e-mail ou contato"/></label><select aria-label="Filtrar etapa" value={stage} onChange={e=>setStage(e.target.value)}><option value="all">Todas as etapas</option>{stages.map(x=><option key={x} value={x}>{stageLabels[x]}</option>)}</select></div>
  <div className="oc-lead-area"><div className="oc-lead-items">{filtered.length?filtered.map(lead=><button key={lead.id} className={current===lead.id?'active':''} onClick={()=>{setCurrent(lead.id);setFollow(lead.follow_up_at?new Date(lead.follow_up_at).toISOString().slice(0,16):'');setMessage('')}}><span className="oc-avatar">{lead.name.slice(0,1)}</span><span><strong>{lead.name}</strong><small>{lead.contact_name??lead.contact}</small><time>{formatDate(lead.created_at)}</time></span><i className={stageStatus(draftStages[lead.id]??lead.stage)}>{stageLabels[draftStages[lead.id]??lead.stage]}</i></button>):<p className="oc-empty">Não há interessados neste filtro.</p>}</div>
   <div className="oc-lead-detail">{selected?<><header><button aria-label="Fechar interessado" onClick={()=>setCurrent(null)}><X size={18}/></button><span className="oc-eyebrow">FICHA COMERCIAL</span><h3>{selected.name}</h3><p>{selected.contact_name??'Contato não informado'}</p></header>
    <dl><div><dt>E-mail ou contato</dt><dd>{selected.contact}</dd></div><div><dt>Telefone</dt><dd>{selected.phone||'Não informado'}</dd></div><div><dt>Plano</dt><dd>{selected.plan_slug||'Não definido'}</dd></div><div><dt>Recebido em</dt><dd>{formatDate(selected.created_at)}</dd></div></dl><blockquote>{selected.message||'Nenhuma mensagem informada.'}</blockquote>
    <label className="oc-label">Etapa comercial<select aria-label="Etapa comercial" value={draftStages[selected.id]??selected.stage} disabled={busy} onChange={e=>void setLeadStage(selected,e.target.value)}>{stages.map(x=><option key={x} value={x}>{stageLabels[x]}</option>)}</select></label>
    <form className="oc-inline-form" onSubmit={e=>void submitFollow(e)}><label className="oc-label">Próximo retorno<input type="datetime-local" value={follow} onChange={e=>setFollow(e.target.value)}/></label><button disabled={busy}>Agendar <CalendarClock size={15}/></button></form>
    <form onSubmit={e=>void submitNote(e)}><label className="oc-label">Nota de acompanhamento<textarea rows={3} maxLength={1200} placeholder="Próximo passo, responsável e contexto..." value={note} onChange={e=>setNote(e.target.value)}/></label><button className="oc-primary-action" disabled={busy||!note.trim()}>Registrar nota <ArrowRight size={15}/></button></form>
    {data.notes.filter(n=>n.lead_id===selected.id).map(n=><p className="oc-note" key={n.id}>{n.body}<small>{formatDate(n.created_at)}</small></p>)}
    {message&&<p className="oc-feedback" role="status">{message}</p>}</>:<p className="oc-empty">Selecione um interessado para consultar detalhes e acompanhar o atendimento.</p>}</div></div>
 </>;
}
function Commerce({data,demoMode,refresh}:{data:Data;demoMode:boolean;refresh:()=>Promise<void>}){
 const [busy,setBusy]=useState(false);const [feedback,setFeedback]=useState('');
 async function change(table:'advertisers'|'reviews',row:{id:string;status:string},value:string){
  if(demoMode){setFeedback('Alteração simulada. Nenhum dado enviado.');return;}
  setBusy(true);
  try{
   const db=await adminClient();
   const {data:updated,error}=await db.from(table).update({status:value}).eq('id',row.id).eq('status',row.status).select('id').maybeSingle();
   if(error)throw error;if(!updated)throw Error('Registro alterado. Atualize o painel.');
   await refresh();setFeedback('Status atualizado.');
  }catch(e){setFeedback(e instanceof Error?e.message:'Falha ao atualizar.');}finally{setBusy(false);}
 }
 const revenue=data.payments.filter(x=>x.status==='paid'&&x.paid_at).reduce((n,x)=>n+x.amount_cents,0);
 return <><div className="oc-section-title"><span className="oc-eyebrow">RECEITAS E PARCERIAS</span><h2>Uma operação comercial saudável.</h2><p>Cadastros, planos e moderação sem confundir previsões com dinheiro recebido.</p></div>
 <div className="oc-summary-row"><div><small>Anunciantes</small><strong>{data.advertisers.length}</strong></div><div><small>Assinaturas verificadas</small><strong>{data.subscriptions.filter(x=>x.status==='active'&&x.verified_at).length}</strong></div><div><small>Pagamentos reais</small><strong>{money(revenue)}</strong></div></div>
 <div className="oc-grid-two"><section className="oc-sheet"><div className="oc-sheet-head"><h3>Empresas cadastradas</h3><UsersRound size={19}/></div>{data.advertisers.length?data.advertisers.map(a=><div className="oc-company" key={a.id}><span className="oc-avatar">{a.name.slice(0,1)}</span><span><strong>{a.name}</strong><small>Atualização {formatDate(a.updated_at)}</small></span><select aria-label={'Situação de '+a.name} value={a.status} disabled={busy} onChange={e=>void change('advertisers',a,e.target.value)}><option value="pending">Pendente</option><option value="approved">Aprovado</option><option value="suspended">Suspenso</option></select></div>):<p className="oc-empty">Ainda não existem empresas cadastradas.</p>}</section>
 <section className="oc-sheet"><div className="oc-sheet-head"><h3>Planos disponíveis</h3><Wallet size={19}/></div>{data.plans.length?data.plans.map(p=><div className="oc-plan" key={p.id}><strong>{p.name}</strong><span>{money(p.price_cents)}</span><small>{p.published?'Publicado':'Não publicado'}</small></div>):<p className="oc-empty">Ainda não há planos comerciais.</p>}<p className="oc-footnote">Cobranças exigem integração com provedor, webhook verificado e conciliação.</p></section></div>
 <section className="oc-sheet"><div className="oc-sheet-head"><h3>Moderação de avaliações</h3><ShieldCheck size={19}/></div>{data.reviews.length?data.reviews.map(r=><div className="oc-review" key={r.id}><div><strong>{r.display_name} · {r.rating}/5</strong><p>{r.comment}</p></div><div><span className={stageStatus(r.status)}>{r.status}</span><button disabled={busy||r.status==='published'} onClick={()=>void change('reviews',r,'published')}>Aprovar</button><button disabled={busy||r.status==='suspended'} onClick={()=>void change('reviews',r,'suspended')}>Ocultar</button></div></div>):<p className="oc-empty">Não há avaliações aguardando moderação.</p>}</section>
 {feedback&&<p className="oc-feedback" role="status">{feedback}</p>}</>;
}
function AdminMap({data}:{data:Data}){
 const root=useRef<HTMLDivElement|null>(null);const map=useRef<L.Map|null>(null);
 const [focus,setFocus]=useState<string|null>(null);const [error,setError]=useState(false);
 const points=useMemo(()=>{
  const registered=data.places.filter(x=>x.latitude!=null&&x.longitude!=null&&Number.isFinite(x.latitude)&&Number.isFinite(x.longitude))
  .map(p=>({id:p.id,name:p.name,lat:p.latitude as number,lng:p.longitude as number,status:p.status,slug:p.slug}));
  const used=new Set(registered.map(x=>x.slug));
  const ref=CURATED_MAP_POINTS.filter(x=>!used.has(x.id)).map(x=>({id:x.id,name:x.name,lat:x.lat,lng:x.lng,status:'referência',slug:x.id}));
  return [...registered,...ref];
 },[data.places]);
 const pinRef=useRef<globalThis.Map<string,L.Marker>>(new globalThis.Map());
 useEffect(()=>{
  if(!root.current)return;let active=true;let instance:L.Map|undefined;
  void import('leaflet').then(({default:L})=>{
   if(!active||!root.current)return;
   try{
    instance=L.map(root.current,{scrollWheelZoom:false}).setView([-21.136,-44.262],14);
    map.current=instance;
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'})
     .on('tileerror',()=>setError(true)).addTo(instance);
    for(const p of points){
      const marker=L.marker([p.lat,p.lng],{title:p.name}).addTo(instance).bindTooltip(p.name);
      pinRef.current.set(p.id,marker);
      marker.on('click',()=>setFocus(p.id));
    }
    requestAnimationFrame(()=>instance?.invalidateSize());
   }catch{if(active)setError(true)}
  }).catch(()=>{if(active)setError(true)});
  return()=>{active=false;instance?.remove();pinRef.current.clear();map.current=null};
 },[points]);
 return <><div className="oc-section-title"><span className="oc-eyebrow">GEOLOCALIZAÇÃO TURÍSTICA</span><h2>O território, em primeiro plano.</h2><p>Mapa dos locais com coordenadas e pontos de referência. Clique em uma atração para localizá-la.</p></div>
  <section className="oc-map-area"><div className="oc-map-toolbar"><span><MapPin size={16}/> São João del-Rei · Minas Gerais</span><a href="/mapa" target="_blank" rel="noopener noreferrer">Ver mapa público <ExternalLink size={15}/></a></div>
  <div className="oc-map-layout"><div className="oc-map-canvas-wrap"><div className="oc-map-canvas" ref={root} aria-label="Mapa de atrações e referências do centro histórico"/>{error&&<p className="oc-map-alert" role="status">A base cartográfica está indisponível. <a href="https://www.openstreetmap.org/#map=15/-21.136/-44.262" target="_blank" rel="noopener noreferrer">Abrir no OpenStreetMap</a></p>}</div><aside className="oc-map-items"><h3>{points.length} lugares no mapa</h3><p>Marcadores de referência não implicam publicação no catálogo.</p>{points.map(p=><button key={p.id} className={focus===p.id?'selected':''} onClick={()=>{setFocus(p.id);map.current?.flyTo([p.lat,p.lng],16);pinRef.current.get(p.id)?.openTooltip()}}><MapPin size={15}/><span><strong>{p.name}</strong><small>{p.status}</small></span><ArrowUpRight size={14}/></button>)}</aside></div>
  <p className="oc-footnote">© OpenStreetMap contributors. Revise a localização antes de publicar uma atração.</p></section></>;
}
export default function AdminCommandCenter({demoMode=false}:{demoMode?:boolean}){
 const [page,setPage]=useState<Section>('overview');const cache=useQueryClient();
 const result=useQuery({queryKey:['admin','command-center'],queryFn:read,enabled:!demoMode,staleTime:30000,retry:1});
 const data=demoMode?demo:result.data;
 const refresh=useCallback(async()=>{await cache.invalidateQueries({queryKey:['admin','command-center']});},[cache]);
 return <div className="oc-root">
  {demoMode&&<div className="oc-demo-warning"><ShieldCheck size={19}/><span>AMBIENTE DEMONSTRATIVO — Empresas, números e contatos ilustrativos. Nenhum acesso ao Supabase e nenhuma alteração real.</span></div>}
  <div className="oc-tabs"><nav aria-label="Módulos do painel de gestão">{navItems.map(([id,name,Icon])=><button key={id} aria-current={page===id?'page':undefined} className={page===id?'selected':''} onClick={()=>setPage(id)}><Icon size={17}/>{name}</button>)}</nav><button className="oc-refresh" disabled={demoMode||result.isFetching} onClick={()=>void refresh()}><RefreshCw size={16}/> Atualizar</button></div>
  {!data&&result.isLoading&&<p className="oc-empty" role="status">Carregando dados com permissões administrativas…</p>}
  {!data&&result.isError&&<div className="oc-error" role="alert"><strong>Não foi possível conectar à gestão.</strong><p>{result.error instanceof Error?result.error.message:'Verifique a conexão e o papel da sua conta.'}</p><button onClick={()=>void result.refetch()}>Tentar novamente</button></div>}
  {data&&<>{page==='overview'?<Overview data={data} setPage={setPage}/>:page==='leads'?<Leads data={data} demoMode={demoMode} refresh={refresh}/>:page==='commerce'?<Commerce data={data} demoMode={demoMode} refresh={refresh}/>:<AdminMap data={data}/>}</>}
  <footer className="oc-footer"><span><ShieldCheck size={15}/>{demoMode?'Demonstração isolada':'Sessão protegida por Auth, MFA e RLS'}</span><span>Descubra SJDR · Gestão de destinos</span></footer>
 </div>;
}
