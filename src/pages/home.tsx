import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowDown,
  ArrowRight,
  BedDouble,
  CloudSun,
  Landmark,
  MapPin,
  Search,
  ShoppingBag,
  UtensilsCrossed,
  Compass,
  Layers3,
  FileText,
  Megaphone,
  ShieldCheck,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { Button } from '../components/ui/button';
import {
  Notice,
  PlaceCard,
  RouteCard,
  Section,
  State,
} from '../components/tourism/common';
import {
  useBenefits,
  useCategories,
  useEvents,
  usePlaces,
  useRoutes,
} from '../data/queries';
import {
  coordinates,
  distanceKm,
  monthBounds,
  translated,
} from '../lib/tourism';
import { useClock } from '../hooks/clock';
import { useLocation } from '../hooks/local-state';
const icons: Record<string, typeof Landmark> = {
  historia: Landmark,
  comer: UtensilsCrossed,
  hospedar: BedDouble,
  artesanato: ShoppingBag,
  passeios: Compass,
};
export default function Home() {
  const now = useClock();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const places = usePlaces(),
    categories = useCategories(),
    routes = useRoutes(),
    events = useEvents(),
    benefits = useBenefits();
  const location = useLocation();
  const [weatherEnabled, setWeatherEnabled] = useState(false);
  const weather = useQuery({
    queryKey: ['weather', 'sjdr'],
    enabled: weatherEnabled,
    staleTime: 600_000,
    retry: 1,
    queryFn: async ({ signal }) => {
      const response = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=-21.135&longitude=-44.262&current=temperature_2m,precipitation,weather_code&timezone=America%2FSao_Paulo',
        { signal },
      );
      if (!response.ok) throw new Error('Weather unavailable');
      return z
        .object({
          current: z.object({
            temperature_2m: z.number(),
            precipitation: z.number(),
            weather_code: z.number(),
          }),
        })
        .parse(await response.json()).current;
    },
  });
  const nearby = location.position
    ? [...(places.data ?? [])]
        .filter((p) => coordinates(p))
        .map((p) => ({
          place: p,
          distance: distanceKm(location.position!, coordinates(p)!),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3)
    : [];
  const currentMonth = monthBounds(
    new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
    }).format(new Date()),
  );
  const upcoming = (events.data ?? [])
    .filter(
      (e) =>
        Date.parse(e.ends_at) >= Date.now() &&
        Date.parse(e.starts_at) < currentMonth.end.getTime(),
    )
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    .slice(0, 3);
  const suggestedRoute = weather.data
    ? routes.data?.find(
        (r) =>
          r.weather ===
          (weather.data.precipitation > 0 || weather.data.weather_code >= 51
            ? 'rain'
            : 'dry'),
      )
    : undefined;
  const categoryName = (id: string) => {
    const c = categories.data?.find((c) => c.id === id);
    return c ? t(c.slug, { defaultValue: c.name }) : undefined;
  };
  const flags = (id: string) =>
    benefits.isError
      ? undefined
      : benefits.data?.find(
          (b) => b.place_id === id && Date.parse(b.valid_until) > now.getTime(),
        )?.features;
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow text-ochre">{t('eyebrow')}</p>
          <h1>
            {t('heroTitle')}
            <em>{t('heroAccent')}</em>
          </h1>
          <p className="hero-description">{t('heroText')}</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate(`/lugares?q=${encodeURIComponent(search)}`);
            }}
            className="hero-search"
          >
            <Search className="shrink-0 text-clay" size={20} />
            <label className="sr-only" htmlFor="hero-search">
              {t('searchLabel')}
            </label>
            <input
              id="hero-search"
              value={search}
              maxLength={120}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
            />
            <Button type="submit" className="shrink-0">
              {t('search')}
            </Button>
          </form>
          <div className="mt-8 flex flex-wrap gap-6 text-sm">
            <Link to="/mapa" className="inline-flex items-center gap-2">
              <MapPin size={17} />
              {t('map')} <ArrowRight size={15} />
            </Link>
            <Link to="/mapa-3d" className="inline-flex items-center gap-2"><Layers3 size={17} /> Mapa 3D <ArrowRight size={15} /></Link>
            <a href="#discover" className="inline-flex items-center gap-2">
              {t('discover')} <ArrowDown size={15} />
            </a>
          </div>
        </div>
        <div className="hero-art">
          <img
            src="/heritage.svg"
            alt={t('attribution')}
            {...{ fetchpriority: 'high' }}
          />
          <div className="hero-location">
            <Landmark size={20} />
            <div>
              <strong>São João del-Rei</strong>
              <span>21°08′ S · 44°15′ O</span>
            </div>
          </div>
          <div className="hero-stamp" aria-hidden="true">
            SJ
            <br />
            <span>DEL-REI</span>
          </div>
        </div>
      </section>
      <div className="page-shell" id="discover">
        <section className="experience-rail" aria-label="Explore as experiências disponíveis">
          <Link to="/mapa-3d" className="experience-tile"><Layers3 size={24}/><span><b>Explore em 3D</b><small>Relevo e vistas da região</small></span><ArrowRight size={18}/></Link>
          <Link to="/servicos-oficiais" className="experience-tile"><ShieldCheck size={24}/><span><b>Fontes oficiais</b><small>Informações com procedência</small></span><ArrowRight size={18}/></Link>
          <Link to="/editais" className="experience-tile"><FileText size={24}/><span><b>Editais públicos</b><small>Links para consultar na origem</small></span><ArrowRight size={18}/></Link>
          <Link to="/anuncie" className="experience-tile"><Megaphone size={24}/><span><b>Anuncie aqui</b><small>Apresente seu negócio</small></span><ArrowRight size={18}/></Link>
        </section>
        <Section title={t('discover')} eyebrow="SÃO JOÃO DEL-REI">
          <State
            pending={categories.isPending}
            error={categories.error}
            retry={() => void categories.refetch()}
            empty={!categories.data?.length}
          >
            <div className="category-grid">
              {categories.data?.map((c) => {
                const Icon = icons[c.slug] ?? Compass;
                return (
                  <Link
                    to={`/lugares?categoria=${encodeURIComponent(c.slug)}`}
                    key={c.id}
                    className="category-tile"
                  >
                    <Icon size={27} strokeWidth={1.4} />
                    <span>{t(c.slug, { defaultValue: c.name })}</span>
                    <ArrowRight size={16} />
                  </Link>
                );
              })}
            </div>
          </State>
        </Section>
        <Section title={t('explore')} to="/lugares">
          <State
            resource="places"
            pending={places.isPending}
            error={places.error}
            retry={() => void places.refetch()}
            empty={!places.data?.length}
          >
            <div className="card-grid">
              {[...(places.data ?? [])]
                .sort(
                  (a, b) =>
                    Number(flags(b.id)?.priority === true) -
                      Number(flags(a.id)?.priority === true) ||
                    a.name.localeCompare(b.name),
                )
                .slice(0, 3)
                .map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    category={categoryName(place.category_id)}
                    badge={flags(place.id)?.badge === true}
                    featured={flags(place.id)?.priority === true}
                  />
                ))}
            </div>
          </State>
        </Section>
      </div>
      <div className="bg-colonial/[.04]">
        <div className="page-shell">
          <Section title={t('curated')} eyebrow={t('routes')} to="/roteiros">
            <p className="mb-7 max-w-xl text-colonial/80">{t('routeIntro')}</p>
            <State
              resource="routes"
              pending={routes.isPending}
              error={routes.error}
              retry={() => void routes.refetch()}
              empty={!routes.data?.length}
            >
              <div className="route-carousel">
                {routes.data?.map((route) => (
                  <RouteCard key={route.id} route={route} />
                ))}
              </div>
            </State>
          </Section>
        </div>
      </div>
      <div className="page-shell">
        <Section title={t('nearby')}>
          <p className="mb-4 text-sm text-colonial/80">{t('gpsPrivacy')}</p>
          <Button
            variant="outline"
            onClick={location.locate}
            disabled={location.state === 'loading'}
            className="gap-2"
          >
            <MapPin size={16} />
            {t(location.state === 'loading' ? 'locating' : 'locate')}
          </Button>
          {location.state === 'error' && (
            <div className="mt-4">
              <Notice>{t('locationError')}</Notice>
            </div>
          )}
          {location.position && (
            <div className="mt-7">
              <State
                resource="places"
                pending={places.isPending}
                error={places.error}
                empty={!nearby.length}
              >
                <div className="card-grid">
                  {nearby.map(({ place, distance }) => (
                    <PlaceCard
                      key={place.id}
                      place={place}
                      category={categoryName(place.category_id)}
                      distance={distance}
                    />
                  ))}
                </div>
              </State>
            </div>
          )}
        </Section>
        <Section title={t('agenda')} eyebrow={t('events')} to="/eventos">
          <State
            resource="events"
            pending={events.isPending}
            error={events.error}
            retry={() => void events.refetch()}
            empty={!upcoming.length}
          >
            <div className="grid gap-4 md:grid-cols-3">
              {upcoming.map((event) => {
                const content = translated(
                  event,
                  event.event_translations,
                  i18n.language,
                );
                return (
                  <Link
                    key={event.id}
                    to={`/eventos/${event.id}`}
                    className="event-teaser"
                  >
                    <span className="eyebrow">
                      {new Intl.DateTimeFormat(i18n.language, {
                        timeZone: 'America/Sao_Paulo',
                        day: 'numeric',
                        month: 'short',
                      }).format(new Date(event.starts_at))}
                    </span>
                    <h3 className="mt-3 font-display text-2xl">
                      {content.name}
                    </h3>
                    <ArrowRight size={18} className="mt-6 text-clay" />
                  </Link>
                );
              })}
            </div>
          </State>
        </Section>
        <section className="weather-panel">
          <CloudSun size={44} strokeWidth={1} />
          <div className="flex-1">
            <p className="eyebrow">{t('weather')}</p>
            <h2 className="section-title">
              {weather.data
                ? `${Math.round(weather.data.temperature_2m)}°C · São João del-Rei`
                : t('fairWeather')}
            </h2>
            {weather.data && (
              <p className="mt-3">
                {t(
                  weather.data.precipitation > 0 ||
                    weather.data.weather_code >= 51
                    ? 'rain'
                    : 'fairWeather',
                )}
              </p>
            )}
            {weather.isError && <p role="status">{t('weatherError')}</p>}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setWeatherEnabled(true);
                if (weatherEnabled) void weather.refetch();
              }}
              disabled={weather.isFetching}
            >
              {t(weather.isFetching ? 'loading' : 'weatherCheck')}
            </Button>
            <Button asChild>
              <Link to="/roteiros">{t('routes')}</Link>
            </Button>
          </div>
        </section>
        {suggestedRoute && (
          <div className="mb-10 max-w-md">
            <RouteCard route={suggestedRoute} />
          </div>
        )}
      </div>
    </>
  );
}
