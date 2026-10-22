import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEvents, usePlaces } from '../data/queries';
import { monthBounds, translated } from '../lib/tourism';
import { Notice, Page, Photo, State } from '../components/tourism/common';
import { Button } from '../components/ui/button';
export function cityDate(value: string) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}
export default function Events() {
  const { t, i18n } = useTranslation();
  const events = useEvents();
  const [params, setParams] = useSearchParams();
  const defaultMonth = cityDate(new Date().toISOString()).slice(0, 7);
  const requested = params.get('mes') ?? defaultMonth;
  const month =
    /^\d{4}-(0[1-9]|1[0-2])$/.test(requested) &&
    Number(requested.slice(0, 4)) >= 1900 &&
    Number(requested.slice(0, 4)) <= 2200
      ? requested
      : defaultMonth;
  const [day, setDay] = useState<string | null>(null);
  const bounds = monthBounds(month),
    year = Number(month.slice(0, 4)),
    monthNum = Number(month.slice(5));
  const days = new Date(Date.UTC(year, monthNum, 0)).getUTCDate();
  const offset =
    (new Date(Date.UTC(year, monthNum - 1, 1)).getUTCDay() + 6) % 7;
  const visible = (events.data ?? [])
    .filter(
      (e) =>
        Date.parse(e.starts_at) < bounds.end.getTime() &&
        Date.parse(e.ends_at) >= bounds.start.getTime(),
    )
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const matching = day
    ? visible.filter(
        (e) => cityDate(e.starts_at) <= day && cityDate(e.ends_at) >= day,
      )
    : visible;
  function selectMonth(value: string) {
    setParams({ mes: value });
    setDay(null);
  }
  function shift(delta: number) {
    const d = new Date(Date.UTC(year, monthNum - 1 + delta, 1));
    selectMonth(
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`,
    );
  }
  return (
    <Page
      title={t('agenda')}
      eyebrow={t('events')}
      description={t('footerNote')}
    >
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-end gap-3">
          <button
            className="icon-button"
            aria-label={t('previousMonth')}
            onClick={() => shift(-1)}
          >
            <ChevronLeft size={20} />
          </button>
          <label className="filter-label">
            {t('month')}
            <input
              type="month"
              min="1900-01"
              max="2200-12"
              value={month}
              onChange={(e) => {
                if (e.target.value) selectMonth(e.target.value);
              }}
            />
          </label>
          <button
            className="icon-button"
            aria-label={t('nextMonth')}
            onClick={() => shift(1)}
          >
            <ChevronRight size={20} />
          </button>
        </div>
        {day && (
          <Button variant="outline" onClick={() => setDay(null)}>
            {t('clear')}
          </Button>
        )}
      </div>
      <State
        pending={events.isPending}
        error={events.error}
        retry={() => void events.refetch()}
      >
        <div className="calendar" role="group" aria-label={t('calendar')}>
          <div className="grid grid-cols-7">
            {Array.from({ length: 7 }, (_, i) => (
              <div className="calendar-weekday" key={i}>
                {new Intl.DateTimeFormat(i18n.language, {
                  weekday: 'short',
                  timeZone: 'UTC',
                }).format(new Date(Date.UTC(2024, 0, 8 + i)))}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: offset }, (_, i) => (
              <div className="calendar-blank" key={`blank${i}`} />
            ))}
            {Array.from({ length: days }, (_, i) => {
              const date = `${month}-${String(i + 1).padStart(2, '0')}`,
                count = visible.filter(
                  (e) =>
                    cityDate(e.starts_at) <= date &&
                    cityDate(e.ends_at) >= date,
                ).length;
              return (
                <button
                  key={date}
                  className={`calendar-day ${day === date ? 'calendar-selected' : ''}`}
                  onClick={() => setDay(day === date ? null : date)}
                  aria-pressed={day === date}
                  aria-label={`${date}: ${count} ${t('events')}`}
                >
                  <span>{i + 1}</span>
                  {count > 0 && <span className="calendar-dot">{count}</span>}
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-8">
          <State empty={!matching.length}>
            <div className="card-grid">
              {matching.map((event) => {
                const content = translated(
                  event,
                  event.event_translations,
                  i18n.language,
                );
                return (
                  <article key={event.id} className="place-card">
                    <div className="h-44">
                      <Photo
                        bucket="event-images"
                        path={event.image_path}
                        alt={content.name}
                      />
                    </div>
                    <div className="p-5">
                      <p className="eyebrow flex items-center gap-2">
                        <CalendarDays size={14} />
                        {new Intl.DateTimeFormat(i18n.language, {
                          timeZone: 'America/Sao_Paulo',
                          day: 'numeric',
                          month: 'long',
                        }).format(new Date(event.starts_at))}
                      </p>
                      <h2 className="mt-3 font-display text-2xl">
                        <Link to={`/eventos/${event.id}`}>{content.name}</Link>
                      </h2>
                      <p className="mt-3 line-clamp-3 text-sm text-colonial/80">
                        {content.description}
                      </p>
                      {!event.verified_at && (
                        <p className="mt-3 text-sm text-clay">
                          {t('unverifiedEvent')}
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </State>
        </div>
      </State>
    </Page>
  );
}
export function EventDetail() {
  const { id } = useParams();
  const events = useEvents(),
    places = usePlaces();
  const { t, i18n } = useTranslation();
  const event = events.data?.find((e) => e.id === id);
  if (events.isPending || events.error)
    return (
      <Page title={t('events')}>
        <State
          pending={events.isPending}
          error={events.error}
          retry={() => void events.refetch()}
        />
      </Page>
    );
  if (!event)
    return (
      <Page title={t('notFound')}>
        <Link to="/eventos">{t('back')}</Link>
      </Page>
    );
  const content = translated(event, event.event_translations, i18n.language),
    place = places.data?.find((p) => p.id === event.place_id);
  const date = new Intl.DateTimeFormat(i18n.language, {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'long',
    timeStyle: 'short',
  });
  return (
    <Page title={content.name} eyebrow={t('eventDetails')}>
      <div className="gallery-main mb-8">
        <Photo
          bucket="event-images"
          path={event.image_path}
          alt={content.name}
        />
      </div>
      {!event.verified_at && <Notice>{t('unverifiedEvent')}</Notice>}
      <p className="my-6 flex items-start gap-3">
        <CalendarDays size={20} />
        <span>
          <time dateTime={event.starts_at}>
            {date.format(new Date(event.starts_at))}
          </time>
          <br />
          <time dateTime={event.ends_at}>
            {date.format(new Date(event.ends_at))}
          </time>
        </span>
      </p>
      <p className="max-w-3xl whitespace-pre-line leading-relaxed text-colonial/80">
        {content.description}
      </p>
      {place && (
        <Link
          to={`/lugares/${encodeURIComponent(place.slug)}`}
          className="text-link mt-7 inline-flex"
        >
          {translated(place, place.place_translations, i18n.language).name}
        </Link>
      )}
      <p className="mt-6 text-sm text-colonial/75">{t('footerNote')}</p>
    </Page>
  );
}
