import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Compass, ExternalLink, LocateFixed, MapPin, Navigation, Sparkles } from 'lucide-react';
import { usePlaces, useEvents, useCategories } from '../../data/queries';
import { CURATED_MAP_POINTS, type PublicMapKind, type PublicMapPoint } from '../../data/map-landmarks';
import { useLocation } from '../../hooks/local-state';
import { coordinates } from '../../lib/tourism';
import 'leaflet/dist/leaflet.css';
import type L from 'leaflet';
type Filter = 'all'|'church'|'museum'|'food'|'event';
const filterOptions: {id:Filter;name:string}[] = [
 {id:'all',name:'Todos'}, {id:'church',name:'Igrejas'},
 {id:'museum',name:'Museus'}, {id:'food',name:'Gastronomia'}, {id:'event',name:'Eventos'},
];
const bounds:[number,number]=[-21.1358,-44.2615];
const eventDate=(date:string)=>new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',timeZone:'America/Sao_Paulo'}).format(new Date(date));
function kindOf(category:string,name:string):PublicMapKind{
 const str=(category+' '+name).toLocaleLowerCase('pt-BR');
 if(/igreja|catedral|capela|basílica|pilar/.test(str))return 'church';
 if(/museu|memorial|cultural/.test(str))return 'museum';
 if(/comer|gastronomia|restaurante|café|bar|lanchonete/.test(str))return 'food';
 return 'place';
}
export function DestinationMap({compact=false}:{compact?:boolean}){
 const element=useRef<HTMLDivElement|null>(null);
 const mapRef=useRef<L.Map|null>(null);
 const [selected,setSelected]=useState<Filter>('all');
 const [focus,setFocus]=useState<string>('');
 const [tileError,setTileError]=useState(false);
 const [mapError,setMapError]=useState(false);
 const places=usePlaces(),categories=useCategories(),events=useEvents();
 const location=useLocation();
 const data=useMemo(()=>{
   const byId=new Map<string,PublicMapPoint>(CURATED_MAP_POINTS.map(p=>[p.id,p]));
   for(const p of places.data??[]){
     const c=coordinates(p);
     if(!c)continue;
     const category=categories.data?.find(cat=>cat.id===p.category_id)?.slug??'';
     byId.set(p.slug,{
       id:p.slug,name:p.name,lat:c.lat,lng:c.lng,
       kind:kindOf(category,p.name),
       description:p.address??'Local cadastrado no guia turístico',
       href:'/lugares/'+encodeURIComponent(p.slug),
     });
   }
   for(const event of events.data??[]){
      if(Date.parse(event.ends_at)<Date.now())continue;
      const place=places.data?.find(p=>p.id===event.place_id);
      if(!place)continue;
      const pos=coordinates(place);
      if(!pos)continue;
      byId.set('event-'+event.id,{
        id:'event-'+event.id,name:event.name,kind:'event',lat:pos.lat,lng:pos.lng,
        description:place.name+' · Evento publicado no catálogo',
        href:'/eventos/'+encodeURIComponent(event.id),
        date:eventDate(event.starts_at),
      });
   }
   return [...byId.values()];
 },[places.data,categories.data,events.data]);
 const filtered=useMemo(()=>data.filter(p=>selected==='all'||p.kind===selected),[data,selected]);
 useEffect(()=>{
   let mounted=true;
   let mapInstance:L.Map|undefined;
   let observer:ResizeObserver|undefined;
   const pins:L.Marker[]=[];
   void import('leaflet').then(({default:lib})=>{
     if(!mounted||!element.current)return;
     try{
       const map=lib.map(element.current,{scrollWheelZoom:false,zoomControl:false}).setView(bounds,14.5);
       mapInstance=map;mapRef.current=map;
       lib.control.zoom({position:'bottomright'}).addTo(map);
       const layer=lib.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
         maxZoom:19,attribution:'© OpenStreetMap contributors',
       }).addTo(map);
       layer.on('tileerror',()=>{if(mounted)setTileError(true)});
       const visibleCoords:L.LatLngExpression[]=[];
       for(const point of filtered){
         const icon=lib.divIcon({className:'destination-map-marker',
           html:'<span aria-hidden="true" class="pin-dot pin-'+point.kind+'"></span>',
           iconSize:[36,42],iconAnchor:[18,40],
         });
         const node=document.createElement('div');
         node.className='map-pin-popup';
         const category=document.createElement('span');
         category.textContent=point.kind==='event'?'Agenda cultural':point.kind==='church'?'Igrejas & patrimônio':point.kind==='museum'?'Museus & cultura':point.kind==='food'?'Onde comer':'Pontos da cidade';
         const title=document.createElement('strong'); title.textContent=point.name;
         const detail=document.createElement('p'); detail.textContent=point.description;
         const link=document.createElement('a');link.href=point.href;link.textContent='Conhecer o lugar →';
         node.append(category,title,detail,link);
         if(point.date){const date=document.createElement('span');date.textContent=point.date;node.append(date)}
         const marker=lib.marker([point.lat,point.lng],{title:point.name,keyboard:true,icon}).bindPopup(node,{maxWidth:280}).addTo(map);
         marker.on('click',()=>{if(mounted)setFocus(point.id)});
         if(focus===point.id)marker.openPopup();
         pins.push(marker);
         visibleCoords.push([point.lat,point.lng]);
       }
       if(visibleCoords.length>1)map.fitBounds(lib.latLngBounds(visibleCoords),{padding:[40,40],maxZoom:15});
       else if(visibleCoords.length===1)map.setView(visibleCoords[0],15);
       if(location.position){
         lib.circleMarker([location.position.lat,location.position.lng],{
           radius:9,weight:3,color:'#fff',fillColor:'#247d70',fillOpacity:1,
         }).bindTooltip('Sua localização').addTo(map);
       }
       if(typeof ResizeObserver!=='undefined'){
         observer=new ResizeObserver(()=>map.invalidateSize());
         observer.observe(element.current);
       }
       // Deferred invalidate ensures tiles fit the card and mobile width.
       requestAnimationFrame(()=>map.invalidateSize());
       setMapError(false);
     }catch{if(mounted)setMapError(true)}
   }).catch(()=>{if(mounted)setMapError(true)});
   return ()=>{mounted=false;observer?.disconnect();pins.forEach(pin=>pin.remove());mapInstance?.remove();mapRef.current=null};
 // No dependency on "focus": selecting a pin should not destroy/recreate the map.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[filtered,location.position]);
 function choosePoint(p:PublicMapPoint){
   setFocus(p.id);
   mapRef.current?.flyTo([p.lat,p.lng],16,{duration:.65});
 }
 const sourceUrl='https://www.openstreetmap.org/#map=15/-21.136/-44.261';
 return <section className={'destination-map-experience '+(compact?'is-compact':'is-full')} aria-label="Mapa turístico interativo">
  <div className="destination-map-tools">
    <div className="destination-map-filters" role="group" aria-label="Filtrar pontos no mapa">
      {filterOptions.map(item=><button type="button" className={selected===item.id?'is-active':''} aria-pressed={selected===item.id} onClick={()=>{setSelected(item.id);setFocus('')}} key={item.id}>{item.name}</button>)}
    </div>
    <button className="destination-map-geolocate" type="button" onClick={location.locate} disabled={location.state==='loading'}>
       <LocateFixed size={17}/><span>{location.state==='loading'?'Localizando...':'Minha localização'}</span>
    </button>
  </div>
  <div className="destination-map-layout">
    <div className="destination-map-view">
      <div ref={element} className="destination-map-canvas" role="region" aria-label="Mapa de São João del-Rei com pontos turísticos"/>
      {(tileError||mapError)&&<div role="status" className="destination-map-recovery">
        A base cartográfica está indisponível neste momento. <a href={sourceUrl} target="_blank" rel="noopener noreferrer">Abrir no OpenStreetMap <ExternalLink size={14}/></a>
      </div>}
      <div className="destination-map-maplabel"><MapPin size={15}/> Centro histórico · São João del-Rei</div>
    </div>
    <div className="destination-map-discovery">
      <div className="destination-map-discovery-top"><p>EXPLORAR NO MAPA</p><h3>{selected==='event'?'Festas & eventos':selected==='all'?'A cidade na palma da mão.':'Encontre seu próximo lugar.'}</h3>
      <span>Selecione um local para aproximar o mapa. Os marcadores são referências geográficas, não garantia de funcionamento.</span></div>
      <div className="destination-map-pointlist">
        {filtered.length?filtered.slice(0,compact?5:30).map(p=><button key={p.id} type="button" onClick={()=>choosePoint(p)} className={focus===p.id?'is-chosen':''}>
          <span className={'destination-map-point-icon kind-'+p.kind}>{p.kind==='event'?<Sparkles size={17}/>:<MapPin size={17}/>}</span>
          <span><strong>{p.name}</strong><small>{p.date?p.date+' · ':''}{p.description}</small></span>
          <ArrowUpRight size={16}/>
        </button>):<div className="destination-map-empty">{selected==='event'?'Ainda não há eventos futuros publicados com localização verificada. Consulte a agenda cultural para novidades.':'Nenhum local com coordenadas verificadas nesta categoria.'}</div>}
      </div>
      <div className="destination-map-bottom">
        {location.state==='error'&&<p role="status">A localização não foi autorizada. Você ainda pode explorar o mapa manualmente.</p>}
        <div className="destination-map-bottom-links">
          <Link to="/mapa-3d"><Compass size={15}/> Ver relevo 3D</Link>
          {compact?<Link to="/mapa">Abrir mapa completo <ArrowUpRight size={17}/></Link>:<Link to="/roteiros">Criar um roteiro <Navigation size={16}/></Link>}
        </div>
      </div>
    </div>
  </div>
  <p className="destination-map-source">Mapa: © OpenStreetMap. Coordenadas de referência: OpenStreetMap/Mapcarta e cadastro federal de museus. Eventos só aparecem com publicação e localização no catálogo.</p>
 </section>;
}
