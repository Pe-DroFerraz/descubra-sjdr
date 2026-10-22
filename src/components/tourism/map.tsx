import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useTranslation } from 'react-i18next';
import type { Place } from '../../data/schema';
import { coordinates, translated } from '../../lib/tourism';
export default function TouristMap({
  places,
  position,
  featured = [],
  route = false,
}: {
  places: Place[];
  position?: { lat: number; lng: number } | null;
  featured?: string[];
  route?: boolean;
}) {
  const element = useRef<HTMLDivElement>(null);
  const { t, i18n } = useTranslation();
  const [tileError, setTileError] = useState(false);
  const featuredKey = featured.join(',');
  useEffect(() => {
    if (!element.current) return;
    setTileError(false);
    const map = L.map(element.current, { scrollWheelZoom: false }).setView(
      [-21.135, -44.262],
      14,
    );
    const tiles = L.tileLayer(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      },
    ).addTo(map);
    tiles.on('tileerror', () => setTileError(true));
    const cluster = L.markerClusterGroup({ showCoverageOnHover: false });
    const points: L.LatLngExpression[] = [];
    for (const place of places) {
      const point = coordinates(place);
      if (!point) continue;
      points.push([point.lat, point.lng]);
      const content = translated(
        place,
        place.place_translations,
        i18n.language,
      );
      const node = document.createElement('div');
      const link = document.createElement('a');
      link.textContent = content.name;
      link.href = `/lugares/${encodeURIComponent(place.slug)}`;
      node.append(link);
      const active = featuredKey.split(',').includes(place.id);
      const icon = L.divIcon({
        className: `sjdr-pin ${active ? 'sjdr-pin-featured' : ''}`,
        html: '<span aria-hidden="true">◆</span>',
        iconSize: [32, 38],
        iconAnchor: [16, 38],
      });
      cluster.addLayer(
        L.marker([point.lat, point.lng], {
          title: content.name,
          icon,
          keyboard: true,
        }).bindPopup(node),
      );
    }
    map.addLayer(cluster);
    if (route && points.length > 1)
      L.polyline(points, {
        color: '#b66851',
        dashArray: '8 7',
        weight: 3,
      }).addTo(map);
    if (position) {
      L.circleMarker([position.lat, position.lng], {
        color: '#173c58',
        fillColor: '#c69847',
        fillOpacity: 1,
        radius: 8,
      }).addTo(map);
      points.push([position.lat, position.lng]);
    }
    if (points.length)
      map.fitBounds(L.latLngBounds(points), { padding: [35, 35], maxZoom: 16 });
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(element.current);
    return () => {
      observer.disconnect();
      map.remove();
    };
  }, [places, position, i18n.language, featuredKey, route]);
  return (
    <div className="map-wrapper">
      {tileError && (
        <p role="status" className="bg-ochre/20 p-3 text-sm">
          {t('mapTileError')}
        </p>
      )}
      <div
        ref={element}
        className="tourist-map"
        role="region"
        aria-label={t('map')}
      />
    </div>
  );
}
