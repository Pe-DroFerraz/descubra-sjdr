import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Search } from 'lucide-react';
import { useBenefits, useCategories, usePlaces } from '../data/queries';
import {
  coordinates,
  distanceKm,
  normalize,
  openingState,
  translated,
} from '../lib/tourism';
import { useClock } from '../hooks/clock';
import { useLocation } from '../hooks/local-state';
import { Notice, Page, PlaceCard, State } from '../components/tourism/common';
import { Button } from '../components/ui/button';
import { MapPanel } from '../components/tourism/map-panel';
export default function Places({ map = false }: { map?: boolean }) {
  const { t, i18n } = useTranslation();
  const places = usePlaces(),
    categories = useCategories(),
    benefits = useBenefits();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const now = useClock();
  const time = now.getTime();
  const search = params.get('q') ?? '',
    category = params.get('categoria') ?? '',
    open = params.get('aberto') === '1',
    sort = params.get('ordem') ?? 'name';
  function change(key: string, value: string) {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );
  }
  const filtered = useMemo(() => {
    const selectedCategory = categories.data?.find((c) => c.slug === category);
    return (places.data ?? [])
      .filter((p) => {
        const content = translated(p, p.place_translations, i18n.language);
        return (
          (!category || p.category_id === selectedCategory?.id) &&
          (!search ||
            normalize(
              `${content.name} ${content.description} ${p.name} ${p.address ?? ''}`,
            ).includes(normalize(search))) &&
          (!open || openingState(p, new Date(time)) === 'open')
        );
      })
      .sort((a, b) => {
        if (sort === 'distance' && location.position) {
          const ca = coordinates(a),
            cb = coordinates(b);
          return (
            (ca ? distanceKm(location.position, ca) : Infinity) -
            (cb ? distanceKm(location.position, cb) : Infinity)
          );
        }
        const priority = (id: string) =>
          !benefits.isError &&
          benefits.data?.find(
            (b) => b.place_id === id && Date.parse(b.valid_until) > time,
          )?.features.priority === true;
        return (
          Number(priority(b.id)) - Number(priority(a.id)) ||
          translated(a, a.place_translations, i18n.language).name.localeCompare(
            translated(b, b.place_translations, i18n.language).name,
            i18n.language,
          )
        );
      });
  }, [
    places.data,
    categories.data,
    benefits.data,
    category,
    search,
    open,
    sort,
    location.position,
    i18n.language,
    time,
    benefits.isError,
  ]);
  const featured = (benefits.isError ? [] : (benefits.data ?? []))
    .filter(
      (b) =>
        Date.parse(b.valid_until) > time && b.features.featured_pin === true,
    )
    .map((b) => b.place_id);
  return (
    <Page
      title={t(map ? 'map' : 'places')}
      eyebrow={t('discover')}
      description={t('heroText')}
    >
      <form className="filter-bar" onSubmit={(e) => e.preventDefault()}>
        <label className="search-field">
          <Search size={18} />
          <span className="sr-only">{t('searchLabel')}</span>
          <input
            value={search}
            onChange={(e) => change('q', e.target.value)}
            maxLength={120}
            placeholder={t('searchPlaceholder')}
          />
        </label>
        <label className="filter-label">
          {t('category')}
          <select
            value={category}
            onChange={(e) => change('categoria', e.target.value)}
          >
            <option value="">{t('all')}</option>
            {categories.data?.map((c) => (
              <option key={c.id} value={c.slug}>
                {t(c.slug, { defaultValue: c.name })}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-label">
          {t('sort')}
          <select
            value={sort}
            onChange={(e) => change('ordem', e.target.value)}
          >
            <option value="name">{t('name')}</option>
            <option value="distance" disabled={!location.position}>
              {t('distance')}
            </option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={open}
            onChange={(e) => change('aberto', e.target.checked ? '1' : '')}
          />
          {t('openNow')}
        </label>
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          disabled={location.state === 'loading'}
          onClick={location.locate}
        >
          <MapPin size={16} />
          {t(location.state === 'loading' ? 'locating' : 'locate')}
        </Button>
      </form>
      {categories.error && (
        <State
          error={categories.error}
          retry={() => void categories.refetch()}
        />
      )}
      {location.state === 'error' && <Notice>{t('locationError')}</Notice>}
      <p className="mb-5 text-sm text-colonial/80">{t('gpsPrivacy')}</p>
      <State
        pending={places.isPending}
        error={places.error}
        retry={() => void places.refetch()}
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <p aria-live="polite" className="text-sm">
            {t('resultCount', { count: filtered.length })}
          </p>
          <button className="text-link" onClick={() => setParams({})}>
            {t('clear')}
          </button>
        </div>
        {map && (
          <div className="mb-8">
            <MapPanel
              places={filtered}
              position={location.position}
              featured={featured}
            />
            {filtered.some((p) => !coordinates(p)) && (
              <p className="mt-3 text-sm text-colonial/80">
                {t('noCoordinates')}
              </p>
            )}
          </div>
        )}
        <State empty={!filtered.length}>
          <div className="card-grid">
            {filtered.map((place) => {
              const c = categories.data?.find(
                  (c) => c.id === place.category_id,
                ),
                flags = benefits.isError
                  ? undefined
                  : benefits.data?.find(
                      (b) =>
                        b.place_id === place.id &&
                        Date.parse(b.valid_until) > time,
                    )?.features;
              return (
                <PlaceCard
                  key={place.id}
                  place={place}
                  category={c ? t(c.slug, { defaultValue: c.name }) : undefined}
                  badge={flags?.badge === true}
                  featured={flags?.priority === true}
                  distance={
                    location.position && coordinates(place)
                      ? distanceKm(location.position, coordinates(place)!)
                      : undefined
                  }
                />
              );
            })}
          </div>
        </State>
      </State>
    </Page>
  );
}
