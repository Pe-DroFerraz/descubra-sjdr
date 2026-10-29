import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Compass, Layers3, MapPinned, RotateCcw, RefreshCw } from 'lucide-react';
import { usePlaces } from '../data/queries';
import { coordinates } from '../lib/tourism';
import { CURATED_MAP_POINTS } from '../data/map-landmarks';
import { Page } from '../components/tourism/common';

type MapError = { error?: Error };
type MapInstance = {
  on: (name: string, callback: (event: MapError) => void) => void;
  setTerrain: (options: { source: string; exaggeration: number } | null) => void;
  easeTo: (options: { pitch?: number; bearing?: number; zoom?: number; duration?: number }) => void;
  addControl: (control: unknown, position?: string) => void;
  remove: () => void;
  resize: () => void;
};
type Popup = { setDOMContent: (element: HTMLElement) => Popup };
type Marker = {
  setLngLat: (coordinates: [number, number]) => Marker;
  setPopup: (popup: Popup) => Marker;
  addTo: (map: MapInstance) => Marker;
  remove: () => void;
};
type MapLibre = {
  supported: () => boolean;
  Map: new (options: Record<string, unknown>) => MapInstance;
  NavigationControl: new (options: Record<string, unknown>) => unknown;
  Marker: new (options: Record<string, unknown>) => Marker;
  Popup: new (options: Record<string, unknown>) => Popup;
};

// Self-hosted by Vite: no external script or CDN is required to start WebGL.
let enginePromise: Promise<MapLibre> | undefined;
async function importEngine(): Promise<MapLibre> {
  const module = await import('maplibre-gl');
  return module as unknown as MapLibre;
}
function getEngine() {
  enginePromise ??= importEngine().catch(error => {
    enginePromise = undefined;
    throw error;
  });
  return enginePromise;
}
type Point = { key:string; name:string;lat:number;lng:number;url:string };
const CENTER: [number, number] = [-44.266, -21.144];
const BASEMAP = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const HEIGHTS = 'https://tiles.mapterhorn.com/{z}/{x}/{y}.webp';

export default function Map3D() {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<MapInstance | null>(null);
  const engine = useRef<MapLibre | null>(null);
  const markerRefs = useRef<Marker[]>([]);
  const [requested, setRequested] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'3d'|'2d'>('3d');
  const [error, setError] = useState('');
  const places = usePlaces();
  const points = useMemo<Point[]>(() => {
    const items = new Map<string,Point>(CURATED_MAP_POINTS.map(p=>[
      p.id,{key:p.id,name:p.name,lat:p.lat,lng:p.lng,url:p.href},
    ]));
    for (const place of places.data ?? []) {
      const pos = coordinates(place);
      if (!pos) continue;
      items.set(place.slug,{
        key:place.slug,name:place.name,lat:pos.lat,lng:pos.lng,
        url:'/lugares/' + encodeURIComponent(place.slug),
      });
    }
    return [...items.values()];
  }, [places.data]);

  useEffect(() => {
    if (!requested || !element.current) return;
    let alive = true;
    let didLoad = false;
    let localMap: MapInstance | null = null;
    let watchdog: ReturnType<typeof setTimeout> | undefined;
    setReady(false);
    setLoading(true);
    setError('');
    const fail=(message:string)=>{
      if (!alive) return;
      setLoading(false);
      setReady(false);
      setError(message);
    };
    void getEngine().then(lib => {
      if (!alive || !element.current) return;
      if (!lib.supported()) {
        fail('Este navegador não disponibiliza WebGL, necessário para o relevo 3D. O mapa plano continua disponível.');
        return;
      }
      engine.current = lib;
      const instance = new lib.Map({
        container: element.current,
        center: CENTER,
        zoom: 12.5,
        pitch: 70,
        bearing: -20,
        maxPitch: 80,
        maxZoom: 18,
        antialias: true,
        attributionControl: true,
        style: {
          version: 8,
          sources: {
            basemap: {
              type: 'raster', tiles: [BASEMAP], tileSize: 256, maxzoom: 19,
              attribution: '© OpenStreetMap contributors',
            },
            terrain: {
              type: 'raster-dem', tiles: [HEIGHTS], tileSize: 512,
              encoding: 'terrarium', maxzoom: 12,
              attribution: '© Mapterhorn — consulte mapterhorn.com/attribution',
            },
          },
          layers: [
            { id: 'streets', type: 'raster', source: 'basemap' },
            { id: 'shadows', type: 'hillshade', source: 'terrain',
              paint: { 'hillshade-exaggeration': 0.65 } },
          ],
        },
      });
      localMap = instance;
      map.current = instance;
      instance.addControl(new lib.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: true,
      }), 'top-right');
      let terrainErrors = 0;
      instance.on('error', event => {
        const message = String(event.error?.message ?? '');
        if (/terrain|dem|mapterhorn|webgl|webp/i.test(message) && ++terrainErrors > 2) {
          fail('Não foi possível carregar os dados de elevação. O mapa plano está disponível; tente novamente.');
        }
      });
      instance.on('load', () => {
        if (!alive) return;
        try {
          instance.setTerrain({ source: 'terrain', exaggeration: 1.15 });
          didLoad = true;
        } catch {
          fail('O navegador não conseguiu ativar o terreno 3D. O mapa plano continua disponível.');
        }
      });
      instance.on('idle', () => {
        if (!alive || !didLoad || terrainErrors > 2) return;
        if (watchdog) clearTimeout(watchdog);
        setReady(true);
        setLoading(false);
        setError('');
      });
      watchdog = setTimeout(() => {
        if (alive && !didLoad) fail('O relevo demorou mais que o esperado. Tente novamente ou utilize o mapa plano.');
      }, 20000);
      instance.resize();
    }).catch(err => {
      fail(err instanceof Error ? 'Falha ao iniciar o MapLibre: ' + err.message : 'Ocorreu uma falha ao iniciar o modo 3D.');
    });
    return () => {
      alive=false;
      if(watchdog) clearTimeout(watchdog);
      markerRefs.current.forEach(marker=>marker.remove());
      markerRefs.current=[];
      localMap?.remove();
      if(map.current===localMap)map.current=null;
      engine.current=null;
    };
  }, [requested,attempt]);

  useEffect(() => {
    if (!ready || !map.current || !engine.current) return;
    const lib=engine.current,instance=map.current;
    markerRefs.current.forEach(marker=>marker.remove());
    markerRefs.current=[];
    for (const p of points) {
      const node=document.createElement('div');
      node.className='map3d-pin';
      node.textContent='●';
      node.title=p.name;
      const content=document.createElement('div');
      const name=document.createElement('strong');
      name.textContent=p.name;
      const link=document.createElement('a');
      link.href=p.url;
      link.textContent='Ver detalhes do lugar →';
      content.append(name,document.createElement('br'),link);
      const marker=new lib.Marker({element:node,anchor:'bottom'})
        .setLngLat([p.lng,p.lat])
        .setPopup(new lib.Popup({offset:20}).setDOMContent(content))
        .addTo(instance);
      markerRefs.current.push(marker);
    }
  },[points,ready]);

  function switchMode() {
    if (!requested || error) {
      setAttempt(n=>n+1);
      setRequested(true);
      setMode('3d');
      return;
    }
    if (!ready || !map.current) return;
    const next = mode === '3d' ? '2d' : '3d';
    setMode(next);
    try {
      map.current.setTerrain(next==='3d'?{source:'terrain',exaggeration:1.15}:null);
      map.current.easeTo({pitch:next==='3d'?70:0,bearing:next==='3d'?-20:0,duration:800});
    } catch {
      setError('O modo 3D não pôde ser ativado. Tente novamente.');
    }
  }
  function restart() {
    setAttempt(n=>n+1);
    setMode('3d');
    setRequested(true);
  }
  const showCanvas=requested && ready && !error;
  return (
    <Page title="Explore São João em 3D" eyebrow="MAPA E RELEVO"
      description="Explore as ruas, gire a câmera e visualize a Serra de São José em relevo. O modo 3D mostra o terreno real, não réplicas tridimensionais das construções.">
      <section className="map3d-shell" aria-label="Exploração do território em 3D">
        <div className="map3d-toolbar">
          <span className="inline-flex items-center gap-2 text-sm font-semibold">
            <MapPinned size={18}/> São João del-Rei e região
          </span>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="map3d-control" onClick={switchMode}
              disabled={loading} aria-pressed={showCanvas && mode==='3d'}>
              <Layers3 size={17}/>
              {loading?'Carregando 3D…':!showCanvas?'Ativar 3D':mode==='3d'?'Ver plano':'Ver 3D'}
            </button>
            <button type="button" className="map3d-control" disabled={!showCanvas}
              onClick={()=>map.current?.easeTo({zoom:12.5,pitch:mode==='3d'?70:0,bearing:mode==='3d'?-20:0,duration:700})}>
              <RotateCcw size={16}/> Recentrar
            </button>
          </div>
        </div>
        <div className="visual-map-fallback map3d-stage">
          <iframe title="Mapa de São João del-Rei" loading="eager" referrerPolicy="no-referrer"
            src="https://www.openstreetmap.org/export/embed.html?bbox=-44.30%2C-21.16%2C-44.22%2C-21.11&layer=mapnik&marker=-21.135%2C-44.262"/>
          {requested && <div ref={element} className="map3d-canvas map3d-overlay"
            style={{visibility:showCanvas?'visible':'hidden'}} role="region" aria-label="Mapa 3D interativo de São João del-Rei"/>}
          {loading && <p className="map3d-status" role="status">Preparando relevo tridimensional e controles de câmera…</p>}
          {error && <div className="map3d-status map3d-status-error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={restart}><RefreshCw size={15}/> Tentar novamente</button>
          </div>}
          {!requested && <p className="visual-map-caption">O mapa plano já está disponível. Ative o 3D para explorar o relevo da região com inclinação e rotação.</p>}
        </div>
        <p className="map3d-credit">Mapa © OpenStreetMap. Elevação © Mapterhorn (Terrarium, WebP). Requer WebGL, conexão e suporte do navegador. Os pontos turísticos são referências geográficas.</p>
      </section>
      <div className="my-10 grid gap-4 md:grid-cols-2">
        <Link className="feature-link" to="/mapa"><ArrowLeft size={18}/> Mapa interativo com filtros</Link>
        <Link className="feature-link" to="/lugares"><Compass size={18}/> Atrativos e patrimônios</Link>
      </div>
    </Page>
  );
}
