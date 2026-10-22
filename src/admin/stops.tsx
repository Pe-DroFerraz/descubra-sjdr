import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { useAuth } from '../auth/context';
import { State } from '../components/tourism/common';
import { Button } from '../components/ui/button';
import { readStops, saveStops } from './api';
import type { Row } from './schema';
import { title, useContent, useAction } from './hooks';
export function StopsManager({
  onDirty,
}: {
  onDirty: (dirty: boolean) => void;
}) {
  const { t } = useTranslation();
  const routes = useContent('routes'),
    places = useContent('places');
  const [id, setId] = useState('');
  const [dirty, setDirty] = useState(false);
  const route = routes.data?.find((row) => row.id === id);
  return (
    <div className="mt-7">
      <h2 className="section-title mb-5">{t('admin.stops')}</h2>
      <label className="filter-label">
        {t('admin.selectRoute')}
        <select
          value={id}
          onChange={(e) => {
            if (dirty && !window.confirm(t('admin.discard'))) return;
            setId(e.target.value);
            setDirty(false);
            onDirty(false);
          }}
        >
          <option value="">{t('admin.select')}</option>
          {routes.data?.map((row) => (
            <option key={row.id} value={row.id}>
              {title(row)}
            </option>
          ))}
        </select>
      </label>
      <State
        pending={routes.isPending || places.isPending}
        error={routes.error ?? places.error}
        retry={() => {
          void routes.refetch();
          void places.refetch();
        }}
      >
        {route && (
          <StopEditor
            key={`${route.id}-${route.updated_at}`}
            route={route}
            places={places.data ?? []}
            onDirty={(value) => {
              setDirty(value);
              onDirty(value);
            }}
          />
        )}
      </State>
    </div>
  );
}
function StopEditor({
  route,
  places,
  onDirty,
}: {
  route: Row;
  places: Row[];
  onDirty: (dirty: boolean) => void;
}) {
  const { t } = useTranslation(),
    auth = useAuth();
  const query = useQuery({
    queryKey: ['admin', auth.user?.id, 'stops', route.id],
    queryFn: () => readStops(route.id),
    retry: false,
  });
  const action = useAction();
  const [stops, setStops] = useState<
      Array<{ place_id: string; duration_minutes: string }>
    >([]),
    [adding, setAdding] = useState(''),
    [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (query.data && !dirty)
      setStops(
        query.data.map((stop) => ({
          place_id: stop.place_id,
          duration_minutes: String(stop.duration_minutes ?? ''),
        })),
      );
  }, [query.data, dirty]);
  function change(value: typeof stops) {
    setStops(value);
    setDirty(true);
    onDirty(true);
  }
  function move(index: number, delta: number) {
    const next = [...stops];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    change(next);
  }
  return (
    <div className="admin-editor mt-6">
      <p className="mb-5 text-sm leading-relaxed">{t('admin.stopsIntro')}</p>
      <State
        pending={query.isPending}
        error={query.error}
        retry={() => void query.refetch()}
      >
        <ol className="space-y-4">
          {stops.map((stop, index) => (
            <li key={stop.place_id} className="admin-stop">
              <span className="stop-number">{index + 1}</span>
              <div className="min-w-0 grow">
                <p className="font-display text-xl break-words">
                  {title(
                    places.find((p) => p.id === stop.place_id) ?? {
                      id: stop.place_id,
                      updated_at: '',
                      name: stop.place_id,
                    },
                  )}
                </p>
                <label className="filter-label mt-3">
                  {t('admin.duration')}
                  <input
                    type="number"
                    min={1}
                    max={10080}
                    value={stop.duration_minutes}
                    onChange={(e) =>
                      change(
                        stops.map((s, i) =>
                          i === index
                            ? { ...s, duration_minutes: e.target.value }
                            : s,
                        ),
                      )
                    }
                  />
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="icon-button"
                  disabled={index === 0 || action.busy}
                  aria-label={`${t('admin.up')}: ${index + 1}`}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  type="button"
                  className="icon-button"
                  disabled={index === stops.length - 1 || action.busy}
                  aria-label={`${t('admin.down')}: ${index + 1}`}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown size={16} />
                </button>
                <button
                  type="button"
                  className="icon-button text-clay"
                  disabled={action.busy}
                  aria-label={`${t('admin.remove')}: ${index + 1}`}
                  onClick={() => change(stops.filter((_, i) => i !== index))}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ol>
        <div className="my-6 flex flex-wrap items-end gap-3">
          <label className="filter-label grow">
            {t('admin.addStop')}
            <select value={adding} onChange={(e) => setAdding(e.target.value)}>
              <option value="">{t('admin.select')}</option>
              {places
                .filter((p) => !stops.some((s) => s.place_id === p.id))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {title(p)}
                  </option>
                ))}
            </select>
          </label>
          <Button
            variant="outline"
            disabled={!adding || action.busy}
            onClick={() => {
              change([...stops, { place_id: adding, duration_minutes: '' }]);
              setAdding('');
            }}
          >
            {t('admin.addStop')}
          </Button>
        </div>
        {action.feedback}
        <Button
          disabled={action.busy || !dirty}
          onClick={() =>
            void action
              .run(() => saveStops(route, stops))
              .then((result) => {
                if (result) {
                  setDirty(false);
                  onDirty(false);
                }
              })
          }
        >
          {t('admin.saveStops')}
        </Button>
      </State>
    </div>
  );
}
