import { useState, type PropsWithChildren, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Heart,
  Landmark,
  MapPin,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Button } from '../ui/button';
import { CatalogUnavailable, mediaUrl } from '../../data/api';
import type { Place, Route } from '../../data/schema';
import { openingState, translated } from '../../lib/tourism';
import { useClock } from '../../hooks/clock';
import { useTrip } from '../../trip-context';
export function Page({
  title,
  eyebrow,
  description,
  children,
}: PropsWithChildren<{
  title: string;
  eyebrow?: string;
  description?: string;
}>) {
  return (
    <div className="page-shell">
      <header className="page-intro">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="lead">{description}</p>}
      </header>
      {children}
    </div>
  );
}
export function Section({
  title,
  eyebrow,
  to,
  children,
}: PropsWithChildren<{ title: string; eyebrow?: string; to?: string }>) {
  const { t } = useTranslation();
  return (
    <section className="section-space">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2 className="section-title">{title}</h2>
        </div>
        {to && (
          <Link className="text-link" to={to}>
            {t('viewAll')} <ArrowRight size={16} />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
export function State({
  pending,
  error,
  empty,
  retry,
  resource,
  filtered,
  children,
}: PropsWithChildren<{
  pending?: boolean;
  error?: Error | null;
  empty?: boolean;
  retry?: () => void;
  resource?: 'places' | 'routes' | 'events' | 'tips';
  filtered?: boolean;
}>) {
  const { t } = useTranslation();
  if (pending)
    return (
      <div role="status" className="state-panel">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-colonial/15 border-t-clay" />
        {t(resource ? `catalogState.${resource}.loading` : 'loading')}
      </div>
    );
  if (error)
    return (
      <div role="alert" className="state-panel">
        <Landmark className="mx-auto mb-4 text-clay" />
        <h3>
          {t(
            error instanceof CatalogUnavailable
              ? 'unavailable'
              : resource
                ? `catalogState.${resource}.error`
                : 'errorTitle',
          )}
        </h3>
        <p>
          {t(
            error instanceof CatalogUnavailable
              ? 'unavailableText'
              : resource
                ? 'catalogState.network'
                : 'errorText',
          )}
        </p>
        {retry && (
          <Button variant="outline" className="mt-5 gap-2" onClick={retry}>
            <RefreshCw size={15} />
            {t('retry')}
          </Button>
        )}
      </div>
    );
  if (empty)
    return (
      <div className="state-panel">
        <Search className="mx-auto mb-4 text-clay" />
        <h3>
          {t(
            filtered
              ? 'catalogState.filtered'
              : resource
                ? `catalogState.${resource}.empty`
                : 'empty',
          )}
        </h3>
        <p>
          {t(
            filtered
              ? 'catalogState.filteredText'
              : resource
                ? `catalogState.${resource}.text`
                : 'emptyText',
          )}
        </p>
      </div>
    );
  return children;
}
export function Photo({
  path,
  alt,
  className = '',
  bucket = 'place-photos',
}: {
  path?: string | null;
  alt: string;
  className?: string;
  bucket?: 'place-photos' | 'event-images';
}) {
  const { t } = useTranslation();
  const url = mediaUrl(bucket, path);
  const [failedUrl, setFailedUrl] = useState<string>();
  return url && failedUrl !== url ? (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={`h-full w-full object-cover ${className}`}
      onError={() => setFailedUrl(url)}
    />
  ) : (
    <div
      role="img"
      aria-label={t(
        failedUrl === url && url
          ? 'catalogState.photoUnavailable'
          : 'photoMissing',
      )}
      className={`photo-placeholder ${className}`}
    >
      <Landmark size={38} strokeWidth={1} />
      <span>
        {t(
          failedUrl === url && url
            ? 'catalogState.photoUnavailable'
            : 'photoMissing',
        )}
      </span>
    </div>
  );
}
export function SaveButton({ id }: { id: string }) {
  const { t } = useTranslation();
  const trip = useTrip();
  const saved = trip.items.some((item) => item.id === id);
  return (
    <button
      type="button"
      aria-label={t(saved ? 'saved' : 'save')}
      aria-pressed={saved}
      className={`save-button ${saved ? 'text-clay' : ''}`}
      onClick={() => trip.toggle(id)}
    >
      <Heart size={19} fill={saved ? 'currentColor' : 'none'} />
    </button>
  );
}
export function PlaceCard({
  place,
  category,
  featured = false,
  badge = false,
  distance,
}: {
  place: Place;
  category?: string;
  featured?: boolean;
  badge?: boolean;
  distance?: number;
}) {
  const { t, i18n } = useTranslation();
  const content = translated(place, place.place_translations, i18n.language);
  const photo = [...place.place_photos].sort(
    (a, b) => a.position - b.position,
  )[0];
  const state = openingState(place, useClock());
  return (
    <article className="place-card group">
      <div className="relative aspect-[4/3] overflow-hidden bg-colonial/5">
        <Link
          to={`/lugares/${encodeURIComponent(place.slug)}`}
          tabIndex={-1}
          aria-hidden="true"
        >
          <Photo
            path={photo?.storage_path}
            alt={photo?.alt_text ?? content.name}
            className="transition-transform duration-500 motion-safe:group-hover:scale-105"
          />
        </Link>
        <div className="absolute left-4 top-4 flex gap-2">
          {featured && (
            <span className="pill bg-ochre text-colonial">{t('featured')}</span>
          )}
          {badge && (
            <span className="pill bg-white text-colonial">{t('partner')}</span>
          )}
        </div>
        <div className="absolute right-4 top-4">
          <SaveButton id={place.id} />
        </div>
      </div>
      <div className="p-5">
        <p className="eyebrow mb-2">{category ?? t('places')}</p>
        <Link
          className="font-display text-2xl hover:text-clay"
          to={`/lugares/${encodeURIComponent(place.slug)}`}
        >
          {content.name}
        </Link>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-colonial/80">
          {content.description}
        </p>
        {place.address && (
          <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-colonial/80">
            <MapPin size={14} className="mt-0.5 shrink-0" />
            <span className="line-clamp-2">{place.address}</span>
          </p>
        )}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-colonial/10 pt-4 text-xs">
          <span
            className={
              state === 'open' ? 'text-emerald-800' : 'text-colonial/80'
            }
          >
            {t(state)}
          </span>
          {distance != null && (
            <span className="flex items-center gap-1">
              <MapPin size={12} />
              {distance.toFixed(1)} km
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
export function RouteCard({ route }: { route: Route }) {
  const { t, i18n } = useTranslation();
  const content = translated(route, route.route_translations, i18n.language);
  return (
    <Link
      to={`/roteiros/${encodeURIComponent(route.slug)}`}
      className="route-card group"
    >
      <Landmark className="mb-10 text-ochre" size={32} strokeWidth={1} />
      <p className="eyebrow text-ochre">
        {t('routes')} ·{' '}
        {route.duration_minutes != null
          ? `${route.duration_minutes} ${t('minutes')}`
          : t('notInformed')}
      </p>
      <h3 className="mt-3 font-display text-3xl">{content.name}</h3>
      <p className="mt-3 line-clamp-2 text-sm text-white/75">
        {content.description}
      </p>
      <span className="mt-8 inline-flex items-center gap-3 text-sm font-semibold">
        {t('viewRoute')} <ArrowRight size={17} />
      </span>
    </Link>
  );
}
export function ExternalLink({
  href,
  children,
}: PropsWithChildren<{ href?: string }>) {
  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="external-link"
    >
      {children} <ArrowRight size={14} />
    </a>
  ) : null;
}
export function Notice({ children }: { children: ReactNode }) {
  return (
    <p
      role="status"
      className="rounded-xl border border-ochre/30 bg-ochre/10 p-4 text-sm"
    >
      {children}
    </p>
  );
}
