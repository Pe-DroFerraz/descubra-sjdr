import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Clock, MapPin, Share2, Star } from 'lucide-react';
import {
  useBenefits,
  useCategories,
  useDetails,
  usePlaces,
} from '../data/queries';
import {
  coordinates,
  directions,
  distanceKm,
  openingState,
  phoneNumber,
  safeExternalUrl,
  translated,
} from '../lib/tourism';
import {
  ExternalLink,
  Notice,
  Page,
  Photo,
  PlaceCard,
  SaveButton,
  Section,
  State,
} from '../components/tourism/common';
import { Button } from '../components/ui/button';
import { MapPanel } from '../components/tourism/map-panel';
import { useClock } from '../hooks/clock';
import { useShare } from '../hooks/share';
export default function PlaceDetail() {
  const now = useClock();
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const places = usePlaces(),
    categories = useCategories(),
    benefits = useBenefits();
  const [selected, setSelected] = useState(0);
  const sharing = useShare();
  const place = places.data?.find((p) => p.slug === slug);
  const details = useDetails(place?.id);
  if (places.isPending || places.error)
    return (
      <Page title={t('places')}>
        <State
          resource="places"
          pending={places.isPending}
          error={places.error}
          retry={() => void places.refetch()}
        />
      </Page>
    );
  if (!place)
    return (
      <Page title={t('notFound')}>
        <Link className="text-link" to="/lugares">
          {t('back')}
        </Link>
      </Page>
    );
  const content = translated(place, place.place_translations, i18n.language),
    photos = [...place.place_photos].sort((a, b) => a.position - b.position),
    category = categories.data?.find((c) => c.id === place.category_id),
    flags = benefits.isError
      ? undefined
      : benefits.data?.find(
          (b) =>
            b.place_id === place.id &&
            Date.parse(b.valid_until) > now.getTime(),
        )?.features;
  const currentPhoto = photos[Math.min(selected, photos.length - 1)],
    point = coordinates(place);
  const nearby = point
    ? (places.data ?? [])
        .filter((p) => p.id !== place.id && coordinates(p))
        .map((p) => ({
          place: p,
          distance: distanceKm(point, coordinates(p)!),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3)
    : [];
  return (
    <div className="page-shell py-10">
      <Link to="/lugares" className="text-link">
        <ArrowLeft size={15} />
        {t('places')}
      </Link>
      <div className="detail-heading">
        <div>
          <p className="eyebrow">
            {category
              ? t(category.slug, { defaultValue: category.name })
              : t('discover')}
          </p>
          <h1>{content.name}</h1>
          <p className="mt-3 flex items-center gap-2 text-sm text-colonial/80">
            <MapPin size={16} />
            {place.address ?? t('notInformed')}
          </p>
          {flags?.badge === true && (
            <span className="pill mt-4 inline-block bg-ochre/30">
              {t('partner')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <SaveButton id={place.id} />
          <Button
            variant="outline"
            className="gap-2"
            onClick={() =>
              void sharing.share(window.location.href, content.name)
            }
          >
            <Share2 size={16} />
            {t('share')}
          </Button>
        </div>
      </div>
      {sharing.message && <Notice>{t(sharing.message)}</Notice>}
      <div className="gallery-main">
        <Photo
          path={currentPhoto?.storage_path}
          alt={currentPhoto?.alt_text ?? content.name}
        />
      </div>
      {photos.length > 1 && (
        <div
          className="mt-4 flex gap-3 overflow-x-auto pb-3"
          role="group"
          aria-label={t('gallery')}
        >
          {photos.map((photo, index) => (
            <button
              key={photo.storage_path}
              className={`h-20 w-28 shrink-0 overflow-hidden rounded-xl border-2 ${index === selected ? 'border-clay' : 'border-transparent'}`}
              aria-label={photo.alt_text}
              aria-pressed={index === selected}
              onClick={() => setSelected(index)}
            >
              <Photo path={photo.storage_path} alt={photo.alt_text} />
            </button>
          ))}
        </div>
      )}
      <div className="detail-grid">
        <div>
          <Section title={t('details')}>
            <p className="whitespace-pre-line leading-relaxed text-colonial/80">
              {content.description || t('notInformed')}
            </p>
            {i18n.language !== 'pt' &&
              !place.place_translations.some(
                (v) => v.locale === i18n.language,
              ) && (
                <p className="mt-4 text-xs text-colonial/75">
                  {t('contentLanguage')}
                </p>
              )}
            {place.verified_at && (
              <p className="mt-5 text-xs text-colonial/75">
                {t('verified')}{' '}
                {new Date(place.verified_at).toLocaleDateString(i18n.language)}
              </p>
            )}
          </Section>
          <Section title={t('hours')}>
            <p className="mb-4 flex items-center gap-2 text-sm">
              <Clock size={17} />
              {t(openingState(place, now))}
            </p>
            {place.place_hours.length ? (
              <dl className="hours-list">
                {[...place.place_hours]
                  .sort(
                    (a, b) =>
                      a.weekday - b.weekday ||
                      (a.opens_at ?? '').localeCompare(b.opens_at ?? ''),
                  )
                  .map((row, index) => (
                    <div key={index}>
                      <dt>
                        {new Intl.DateTimeFormat(i18n.language, {
                          weekday: 'long',
                          timeZone: 'UTC',
                        }).format(new Date(Date.UTC(2024, 0, 7 + row.weekday)))}
                      </dt>
                      <dd>
                        {!row.verified_at
                          ? t('unknown')
                          : row.closed
                            ? t('closed')
                            : `${row.opens_at?.slice(0, 5)} – ${row.closes_at?.slice(0, 5)}`}
                      </dd>
                    </div>
                  ))}
              </dl>
            ) : (
              <p>{t('notInformed')}</p>
            )}
            <p className="mt-4 text-xs text-colonial/75">{t('scheduleNote')}</p>
          </Section>
          <Section title={t('price')}>
            <p>{place.price_description ?? t('notInformed')}</p>
          </Section>
        </div>
        <aside className="contact-panel">
          <h2 className="font-display text-2xl">{t('contact')}</h2>
          <p className="my-5 text-sm leading-relaxed text-colonial/80">
            {place.address ?? t('notInformed')}
          </p>
          <div className="flex flex-col gap-3">
            <ExternalLink href={directions(place)}>
              {t('directions')} · Google Maps
            </ExternalLink>
            <ExternalLink href={directions(place, 'waze')}>Waze</ExternalLink>
            <ExternalLink
              href={
                place.whatsapp && phoneNumber(place.whatsapp)
                  ? `https://wa.me/${phoneNumber(place.whatsapp)?.replace(/\D/g, '')}`
                  : undefined
              }
            >
              WhatsApp
            </ExternalLink>
            <ExternalLink href={safeExternalUrl(place.website)}>
              {t('website')}
            </ExternalLink>
            <ExternalLink href={safeExternalUrl(place.instagram)}>
              Instagram
            </ExternalLink>
            {phoneNumber(place.phone) && (
              <a
                className="external-link"
                href={`tel:${phoneNumber(place.phone)}`}
              >
                {t('phone')} · {place.phone}
              </a>
            )}
          </div>
          {point && (
            <div className="mt-6">
              <MapPanel places={[place]} />
            </div>
          )}
        </aside>
      </div>
      <Section title={t('coupons')}>
        <State
          resource="places"
          pending={details.isPending}
          error={details.error}
          retry={() => void details.refetch()}
        >
          {details.data?.coupons.length ? (
            <>
              <Notice>{t('couponNote')}</Notice>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {details.data.coupons.map((c) => (
                  <article key={c.id} className="event-teaser">
                    <h3 className="font-display text-xl">{c.title}</h3>
                    <p className="my-3 text-sm">{c.description}</p>
                    <code>{c.code}</code>
                    <p className="mt-3 text-xs">
                      {new Date(c.ends_at).toLocaleDateString(i18n.language)}
                    </p>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <p className="text-colonial/75">{t('noCoupons')}</p>
          )}
        </State>
      </Section>
      <Section title={t('reviews')}>
        <State
          resource="places"
          pending={details.isPending}
          error={details.error}
          retry={() => void details.refetch()}
        >
          {details.data?.reviews.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {details.data.reviews.map((r) => (
                <article key={r.id} className="event-teaser">
                  <p className="flex items-center gap-2">
                    <Star size={16} className="text-clay" />
                    {r.rating}/5 · {r.display_name}
                  </p>
                  <p className="my-3 leading-relaxed">{r.comment}</p>
                  <time
                    className="text-xs text-colonial/75"
                    dateTime={r.created_at}
                  >
                    {new Date(r.created_at).toLocaleDateString(i18n.language)}
                  </time>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-colonial/75">{t('noReviews')}</p>
          )}
        </State>
      </Section>
      {!!nearby.length && (
        <Section title={t('nearby')}>
          <div className="card-grid">
            {nearby.map((p) => (
              <PlaceCard
                key={p.place.id}
                place={p.place}
                distance={p.distance}
              />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
