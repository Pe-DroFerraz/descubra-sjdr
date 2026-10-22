import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Clock } from 'lucide-react';
import { usePlaces, useRoutes, useSponsors } from '../data/queries';
import { translated } from '../lib/tourism';
import {
  Notice,
  Page,
  RouteCard,
  Section,
  State,
} from '../components/tourism/common';
import { MapPanel } from '../components/tourism/map-panel';
import { Button } from '../components/ui/button';
import { useTrip } from '../trip-context';
export default function RoutesPage() {
  const { t } = useTranslation();
  const routes = useRoutes();
  return (
    <Page
      title={t('curated')}
      eyebrow={t('routes')}
      description={t('routeIntro')}
    >
      <State
        resource="routes"
        pending={routes.isPending}
        error={routes.error}
        retry={() => void routes.refetch()}
        empty={!routes.data?.length}
      >
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {routes.data?.map((route) => (
            <RouteCard key={route.id} route={route} />
          ))}
        </div>
      </State>
    </Page>
  );
}
export function RouteDetail() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const routes = useRoutes(),
    places = usePlaces();
  const trip = useTrip();
  const [saved, setSaved] = useState(false);
  const route = routes.data?.find((r) => r.slug === slug);
  const sponsors = useSponsors(route?.id);
  if (routes.isPending || routes.error)
    return (
      <Page title={t('routes')}>
        <State
          resource="routes"
          pending={routes.isPending}
          error={routes.error}
          retry={() => void routes.refetch()}
        />
      </Page>
    );
  if (!route)
    return (
      <Page title={t('notFound')}>
        <Link to="/roteiros" className="text-link">
          {t('back')}
        </Link>
      </Page>
    );
  const content = translated(route, route.route_translations, i18n.language),
    stops = [...route.route_stops].sort((a, b) => a.position - b.position),
    visible = stops.flatMap((stop) => {
      const p = places.data?.find((p) => p.id === stop.place_id);
      return p ? [p] : [];
    });
  return (
    <Page
      title={content.name}
      eyebrow={t('routes')}
      description={content.description}
    >
      <Link className="text-link" to="/roteiros">
        <ArrowLeft size={15} />
        {t('routes')}
      </Link>
      <div className="my-7 flex flex-wrap items-center justify-between gap-4">
        <p className="flex items-center gap-2 text-sm">
          <Clock size={17} />
          {t('duration')}:{' '}
          {route.duration_minutes != null
            ? `${route.duration_minutes} ${t('minutes')}`
            : t('notInformed')}
        </p>
        <Button
          disabled={!visible.length}
          onClick={() => {
            trip.save([
              ...trip.items,
              ...visible
                .filter((p) => !trip.items.some((i) => i.id === p.id))
                .map((p) => ({ id: p.id, day: 1 })),
            ]);
            setSaved(true);
          }}
        >
          {t('addRoute')}
        </Button>
      </div>
      {saved && <Notice>{t('routeSaved')}</Notice>}
      <State
        resource="routes"
        pending={places.isPending}
        error={places.error}
        retry={() => void places.refetch()}
      >
        <div className="detail-grid">
          <section>
            <h2 className="section-title mb-6">{t('routeStops')}</h2>
            <State empty={!visible.length}>
              <ol className="stop-list">
                {stops.map((stop, index) => {
                  const p = places.data?.find((p) => p.id === stop.place_id);
                  return (
                    <li key={stop.place_id}>
                      <span className="stop-number">{index + 1}</span>
                      <div>
                        {p ? (
                          <>
                            <Link
                              className="font-display text-2xl hover:text-clay"
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
                            <p className="mt-2 text-sm text-colonial/75">
                              {stop.duration_minutes != null
                                ? `${stop.duration_minutes} ${t('minutes')}`
                                : t('notInformed')}
                            </p>
                          </>
                        ) : (
                          <p>{t('unpublishedSaved')}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </State>
          </section>
          <MapPanel places={visible} route />
        </div>
      </State>
      <Section title={t('sponsors')}>
        <State
          resource="routes"
          pending={sponsors.isPending}
          error={sponsors.error}
          retry={() => void sponsors.refetch()}
          empty={!sponsors.data?.length}
        >
          <div className="flex flex-wrap gap-4">
            {sponsors.data?.map((s) => (
              <Link
                className="external-link"
                key={s.place_slug}
                to={`/lugares/${encodeURIComponent(s.place_slug)}`}
              >
                {s.name}
              </Link>
            ))}
          </div>
        </State>
      </Section>
    </Page>
  );
}
