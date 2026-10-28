import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Compass, Layers3, MapPinned, RotateCcw } from 'lucide-react';
import { usePlaces } from '../data/queries';
import { coordinates } from '../lib/tourism';
import { Page } from '../components/tourism/common';

type MapInstance = {
  on: (type: string, callback: () => void) => void;
  setTerrain: (terrain: { source: string; exaggeration: number } | null) => void;
  easeTo: (options: { pitch?: number; bearing?: number; zoom?: number }) => void;
  addControl: (control: unknown, position?: string) => void;
  remove: () => void;
};
type Popup = { setDOMContent: (element: HTMLElement) => Popup };
type Marker = {
  setLngLat: (coords: [number, number]) => Marker;
  setPopup: (popup: Popup) => Marker;
  addTo: (map: MapInstance) => Marker;
};
type MapLibre = {
  Map: new (options: Record<string, unknown>) => MapInstance;
  NavigationControl: new (options: Record<string, unknown>) => unknown;
  Marker: new (options: Record<string, unknown>) => Marker;
  Popup: new (options: Record<string, unknown>) => Popup;
};
declare global {
  interface Window { maplibregl?: MapLibre }
}
const JS = 'https://unpkg.com/maplibre-gl@6.16.0/dist/maplibre-gl.js';
const CSS = 'https://unpkg.com/maplibre-gl@6.16.0/dist/maplibre-gl.css';
function loadEngine(): Promise<MapLibre> {
  if (window.maplibregl) return Promise.resolve(window.maplibregl);
  return new Promise((resolve, reject) => {
    let script = document.querySelector<HTMLScriptElement>('script[data-sjdr-maplibre]');
    const done = () => window.maplibregl ? resolve(window.maplibregl) : reject(new Error('engine unavailable'));
    if (script) {
      script.addEventListener('load', done, { once: true });
      script.addEventListener('error', () => reject(new Error('engine unavailable')), { once: true });
      return;
    }
    if (!document.querySelector('link[data-sjdr-maplibre]')) {
      const stylesheet = document.createElement('link');
      stylesheet.rel = 'stylesheet';
      stylesheet.href = CSS;
      stylesheet.dataset.sjdrMaplibre = 'true';
      document.head.appendChild(stylesheet);
    }
    script = document.createElement('script');
    script.src = JS;
    script.async = true;
    script.dataset.sjdrMaplibre = 'true';
    script.addEventListener('load', done, { once: true });
    script.addEventListener('error', () => reject(new Error('engine unavailable')), { once: true });
    document.head.appendChild(script);
  });
}
export default function Map3D() {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const [mode, setMode] = useState<'3d' | '2d'>('3d');
  const [failure, setFailure] = useState(false);
  const [show3d, setShow3d] = useState(false);
  const [ready, setReady] = useState(false);
  const places = usePlaces();
  useEffect(() => {
    if (!ref.current || !show3d) return;
    let alive = true;
    let instance: MapInstance | null = null;
    void loadEngine().then((libre) => {
      if (!alive || !ref.current) return;
      instance = new libre.Map({
        container: ref.current,
        center: [-44.262, -21.135],
        zoom: 13.1,
        pitch: 62,
        bearing: -14,
        maxPitch: 80,
        maxZoom: 18,
        attributionControl: true,
        style: {
          version: 8,
          sources: {
            basemap: {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              maxzoom: 19,
              attribution: '© OpenStreetMap contributors',
            },
            terrain: {
              type: 'raster-dem',
              url: 'https://tiles.mapterhorn.com/tilejson.json',
              encoding: 'terrarium',
              attribution: 'Elevation © Mapterhorn',
            },
          },
          layers: [
            { id: 'base', type: 'raster', source: 'basemap' },
            { id: 'relief', type: 'hillshade', source: 'terrain', paint: { 'hillshade-exaggeration': 0.35 } },
          ],
        },
      });
      mapRef.current = instance;
      instance.addControl(new libre.NavigationControl({ visualizePitch: true, showCompass: true }), 'top-right');
      instance.on('load', () => {
        if (!alive || !instance) return;
        instance.setTerrain({ source: 'terrain', exaggeration: 1 });
        setReady(true);
      });
      for (const place of places.data ?? []) {
        const point = coordinates(place);
        if (!point) continue;
        const node = document.createElement('div');
        node.className = 'map3d-pin';
        node.textContent = '◆';
        node.title = place.name;
        const popupNode = document.createElement('a');
        popupNode.textContent = place.name;
        popupNode.href = '/lugares/' + encodeURIComponent(place.slug);
        new libre.Marker({ element: node, anchor: 'bottom' })
          .setLngLat([point.lng, point.lat])
          .setPopup(new libre.Popup({ offset: 20 }).setDOMContent(popupNode))
          .addTo(instance);
      }
    }).catch(() => { if (alive) setFailure(true); });
    return () => {
      alive = false;
      instance?.remove();
      if (mapRef.current === instance) mapRef.current = null;
    };
    // The published attractions are loaded once for this map instance.
  }, [places.data, show3d]);
  function toggleMode() {
    const next = mode === '3d' ? '2d' : '3d';
    setMode(next);
    if (!mapRef.current) return;
    mapRef.current.setTerrain(next === '3d' ? { source: 'terrain', exaggeration: 1 } : null);
    mapRef.current.easeTo({ pitch: next === '3d' ? 62 : 0, bearing: next === '3d' ? -14 : 0 });
  }
  return (
    <Page title="Explore São João em 3D" eyebrow="EXPLORAR O TERRITÓRIO"
      description="Veja o relevo da região, gire o mapa e descubra os pontos turísticos que já foram publicados e verificados.">
      <section className="map3d-shell" aria-label="Mapa interativo com relevo tridimensional">
        <div className="map3d-toolbar">
          <span className="inline-flex items-center gap-2 text-sm font-semibold"><MapPinned size={17} /> São João del-Rei · MG</span>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => { if (!show3d) { setShow3d(true); setFailure(false); } else toggleMode(); }}
              className="map3d-control"><Layers3 size={17}/>{!show3d ? 'Ativar 3D' : mode === '3d' ? 'Ver plano' : 'Ativar 3D'}</button>
            <button type="button" onClick={() => mapRef.current?.easeTo({ pitch: mode === '3d' ? 62 : 0, bearing: mode === '3d' ? -14 : 0, zoom: 13.1 })}
              className="map3d-control" disabled={!ready}><RotateCcw size={16}/> Recentrar</button>
          </div>
        </div>
        <div className="visual-map-fallback">
          <iframe title="Mapa de São João del-Rei" loading="eager" referrerPolicy="no-referrer"
            src="https://www.openstreetmap.org/export/embed.html?bbox=-44.30%2C-21.16%2C-44.22%2C-21.11&layer=mapnik&marker=-21.135%2C-44.262" />
          {show3d && !failure && <div ref={ref} className="map3d-canvas" style={{position:'absolute',inset:0,height:'100%'}} role="region" aria-label="Mapa 3D de São João del-Rei" />}
          {failure && <div role="alert" className="visual-map-caption">A visualização 3D não está disponível neste aparelho. O mapa plano continua ativo.</div>}
          {!show3d && <div className="visual-map-caption">Mapa visível imediatamente. Toque em “Ativar 3D” para carregar o relevo inclinado.</div>}
        </div>
        <p className="map3d-credit">Relevo real com dados de elevação; não é uma reconstrução 3D dos edifícios. Mapas © OpenStreetMap; elevação Mapterhorn. Informações de lugares dependem de publicação editorial.</p>
      </section>
      <div className="my-10 grid gap-4 md:grid-cols-2">
        <Link className="feature-link" to="/mapa"><ArrowLeft size={18}/> Voltar ao mapa com filtros</Link>
        <Link className="feature-link" to="/lugares"><Compass size={18}/> Descobrir atrações verificadas</Link>
      </div>
    </Page>
  );
}
