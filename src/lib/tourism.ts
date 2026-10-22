import type { Place } from '../data/schema';
export function translated<T extends { name: string; description: string }>(
  item: T,
  translations: Array<{ locale: string; name: string; description: string }>,
  locale: string,
) {
  return (
    translations.find((value) => value.locale === locale.slice(0, 2)) ?? item
  );
}
export const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const rad = (n: number) => (n * Math.PI) / 180;
  const dlat = rad(b.lat - a.lat),
    dlng = rad(b.lng - a.lng);
  const h =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dlng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
}
export function coordinates(
  place: Pick<Place, 'latitude' | 'longitude'>,
): { lat: number; lng: number } | null {
  return place.latitude != null && place.longitude != null
    ? { lat: place.latitude, lng: place.longitude }
    : null;
}
// A schedule is considered current for 30 days. No rows or stale rows means UNKNOWN, never closed.
export function openingState(
  place: Pick<Place, 'place_hours'>,
  now = new Date(),
): 'open' | 'closed' | 'unknown' {
  const local = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const part = (key: string) => local.find((p) => p.type === key)?.value ?? '';
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(
    part('weekday'),
  );
  const rows = place.place_hours.filter((row) => row.weekday === weekday);
  if (
    !rows.length ||
    rows.some(
      (row) =>
        !row.verified_at ||
        Date.parse(row.verified_at) > now.getTime() ||
        now.getTime() - Date.parse(row.verified_at) > 30 * 86400000,
    )
  )
    return 'unknown';
  const time = `${part('hour')}:${part('minute')}:00`;
  return rows.some(
    (row) =>
      !row.closed &&
      row.opens_at &&
      row.closes_at &&
      row.opens_at <= time &&
      time < row.closes_at,
  )
    ? 'open'
    : 'closed';
}
export function safeExternalUrl(value: string | null | undefined) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}
export function directions(
  place: Pick<Place, 'latitude' | 'longitude' | 'address'>,
  provider: 'google' | 'waze' = 'google',
) {
  const point = coordinates(place);
  if (provider === 'waze')
    return point
      ? `https://www.waze.com/ul?ll=${point.lat},${point.lng}&navigate=yes`
      : undefined;
  const destination = point ? `${point.lat},${point.lng}` : place.address;
  return destination
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`
    : undefined;
}
export function phoneNumber(value: string | null) {
  const number = value?.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
  return number && /^\+?\d{8,15}$/.test(number) ? number : undefined;
}
export function monthBounds(value: string) {
  const [year, month] = value.split('-').map(Number);
  // UTC boundaries corresponding to São Paulo midnight (no DST in current Brazilian calendar).
  return {
    start: new Date(Date.UTC(year, month - 1, 1, 3)),
    end: new Date(Date.UTC(year, month, 1, 3)),
  };
}
