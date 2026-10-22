import { Component, lazy, Suspense, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { Place } from '../../data/schema';
const Map = lazy(() => import('./map'));
class MapBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
export function MapPanel(props: {
  places: Place[];
  position?: { lat: number; lng: number } | null;
  featured?: string[];
  route?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <MapBoundary
      fallback={
        <p role="alert" className="state-panel">
          {t('mapLoadError')}
        </p>
      }
    >
      <Suspense
        fallback={
          <p role="status" className="state-panel">
            {t('loading')}
          </p>
        }
      >
        <Map {...props} />
      </Suspense>
    </MapBoundary>
  );
}
