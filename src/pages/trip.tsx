import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUp, Heart, Share2, X } from 'lucide-react';
import { usePlaces } from '../data/queries';
import { useTrip } from '../trip-context';
import { decodeItinerary, encodeItinerary } from '../hooks/local-state';
import { useShare } from '../hooks/share';
import { translated } from '../lib/tourism';
import { Button } from '../components/ui/button';
import { Notice, Page, State } from '../components/tourism/common';
export default function Trip() {
  const { t, i18n } = useTranslation();
  const trip = useTrip();
  const places = usePlaces();
  const [params, setParams] = useSearchParams();
  const shared = params.get('trip');
  const imported = shared ? decodeItinerary(shared) : [];
  const sharing = useShare();
  const [dragged, setDragged] = useState<string | null>(null);
  function move(id: string, index: number, day?: number) {
    const next = [...trip.items];
    const old = next.findIndex((i) => i.id === id);
    if (old < 0) return;
    const [item] = next.splice(old, 1);
    next.splice(Math.max(0, Math.min(index, next.length)), 0, { ...item, day: day ?? item.day });
    trip.save(next);
  }
  return (
    <Page
      title={t('tripTitle')}
      eyebrow={t('favorites')}
      description={t('tripText')}
    >
      <p className="mb-5 text-sm text-colonial/75">{t('tripOffline')}</p>
      {trip.storageError && <Notice>{t('storageError')}</Notice>}
      {shared !== null && (
        <div className="mb-6">
          <Notice>
            {imported.length ? (
              <>
                {t('importNote')}{' '}
                <Button
                  className="ml-3 mt-2"
                  onClick={() => {
                    trip.save(imported);
                    setParams({});
                  }}
                >
                  {t('importTrip')}
                </Button>
              </>
            ) : (
              t('invalidTrip')
            )}
          </Notice>
        </div>
      )}
      {!trip.items.length ? (
        <div className="state-panel">
          <Heart className="mx-auto mb-5 text-clay" size={38} strokeWidth={1} />
          <h2 className="section-title">{t('tripEmpty')}</h2>
          <p>{t('tripEmptyText')}</p>
          <Button asChild className="mt-6">
            <Link to="/lugares">{t('places')}</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap justify-between gap-4">
            <p className="text-sm text-colonial/75">{t('drag')}</p>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() =>
                void sharing.share(
                  `${window.location.origin}/favoritos?trip=${encodeItinerary(trip.items)}`,
                  t('tripTitle'),
                )
              }
            >
              <Share2 size={16} />
              {t('share')}
            </Button>
          </div>
          {sharing.message && <Notice>{t(sharing.message)}</Notice>}
          <State
            pending={places.isPending}
            error={places.error}
            retry={() => void places.refetch()}
          />
          {Array.from(new Set(trip.items.map((i) => i.day)))
            .sort((a, b) => a - b)
            .map((day) => (
              <section className="mb-9" key={day}>
                <h2 className="section-title mb-5">
                  {t('day')} {day}
                </h2>
                <ol className="space-y-3">
                  {trip.items
                    .filter((i) => i.day === day)
                    .map((item) => {
                      const p = places.data?.find((p) => p.id === item.id);
                      const index = trip.items.findIndex(
                        (i) => i.id === item.id,
                      );
                      const sameDay = trip.items.filter((i) => i.day === day);
                      const dayIndex = sameDay.findIndex(
                        (i) => i.id === item.id,
                      );
                      return (
                        <li
                          key={item.id}
                          className="trip-row"
                          draggable
                          onDragStart={() => setDragged(item.id)}
                          onDragEnd={() => setDragged(null)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (dragged) move(dragged, index, day);
                            setDragged(null);
                          }}
                        >
                          <Heart className="shrink-0 text-clay" size={18} />
                          <div className="min-w-0 flex-1">
                            {p ? (
                              <Link
                                className="font-display text-xl hover:text-clay"
                                to={`/lugares/${encodeURIComponent(p.slug)}`}
                              >
                                {
                                  translated(
                                    p,
                                    p.place_translations,
                                    i18n.language,
                                  ).name
                                }
                              </Link>
                            ) : (
                              <p className="text-sm">
                                {places.isSuccess
                                  ? t('unpublishedSaved')
                                  : t('savedPlace')}
                              </p>
                            )}
                          </div>
                          <label className="filter-label">
                            {t('day')}
                            <select
                              value={item.day}
                              onChange={(e) =>
                                trip.save(
                                  trip.items.map((i) =>
                                    i.id === item.id
                                      ? { ...i, day: Number(e.target.value) }
                                      : i,
                                  ),
                                )
                              }
                            >
                              {Array.from({ length: 30 }, (_, i) => (
                                <option value={i + 1} key={i}>
                                  {i + 1}
                                </option>
                              ))}
                            </select>
                          </label>
                          <div className="flex items-center gap-1">
                            <button
                              className="icon-button"
                              aria-label={t('moveUp')}
                              disabled={dayIndex === 0}
                              onClick={() =>
                                move(
                                  item.id,
                                  trip.items.findIndex(
                                    (i) => i.id === sameDay[dayIndex - 1].id,
                                  ),
                                )
                              }
                            >
                              <ArrowUp size={17} />
                            </button>
                            <button
                              className="icon-button"
                              aria-label={t('moveDown')}
                              disabled={dayIndex === sameDay.length - 1}
                              onClick={() =>
                                move(
                                  item.id,
                                  trip.items.findIndex(
                                    (i) => i.id === sameDay[dayIndex + 1].id,
                                  ),
                                )
                              }
                            >
                              <ArrowDown size={17} />
                            </button>
                            <button
                              className="icon-button"
                              aria-label={t('remove')}
                              onClick={() => trip.toggle(item.id)}
                            >
                              <X size={17} />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                </ol>
              </section>
            ))}
        </>
      )}
    </Page>
  );
}
