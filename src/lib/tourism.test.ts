import { describe, expect, it } from 'vitest';
import {
  coordinates,
  directions,
  distanceKm,
  monthBounds,
  normalize,
  openingState,
  safeExternalUrl,
  translated,
} from './tourism';
import type { Place } from '../data/schema';
const now = new Date('2026-10-22T15:00:00Z'); // Thursday noon in São Paulo.
const hours = (overrides: Partial<Place['place_hours'][number]> = {}) => ({
  weekday: 4,
  opens_at: '10:00:00',
  closes_at: '18:00:00',
  closed: false,
  verified_at: '2026-10-21T12:00:00Z',
  ...overrides,
});
describe('tourist data rules', () => {
  it('normalizes accents for name/address search', () =>
    expect(normalize(' São JOÃO  ')).toBe('sao joao'));
  it('uses translations and falls back to source content', () => {
    const original = { name: 'Igreja', description: 'História' };
    expect(
      translated(
        original,
        [{ locale: 'en', name: 'Church', description: 'History' }],
        'en-US',
      ).name,
    ).toBe('Church');
    expect(translated(original, [], 'es')).toEqual(original);
  });
  it('preserves zero coordinates and rejects incomplete ones', () => {
    expect(coordinates({ latitude: 0, longitude: 0 })).toEqual({
      lat: 0,
      lng: 0,
    });
    expect(coordinates({ latitude: null, longitude: 1 })).toBeNull();
  });
  it('calculates Haversine distances', () => {
    expect(distanceKm({ lat: 0, lng: 0 }, { lat: 0, lng: 0 })).toBe(0);
    expect(distanceKm({ lat: 0, lng: 0 }, { lat: 0, lng: 1 })).toBeCloseTo(
      111.195,
      2,
    );
  });
  it('uses the destination, never an invented GPS position', () => {
    expect(
      directions({ latitude: null, longitude: null, address: 'Rua A, 1' }),
    ).toContain('Rua%20A%2C%201');
    expect(
      directions({ latitude: null, longitude: null, address: null }, 'waze'),
    ).toBeUndefined();
  });
  it.each([
    'javascript:alert(1)',
    'http://unsafe.example',
    'https://name:secret@example.com',
  ])('rejects unsafe outbound URL %s', (url) =>
    expect(safeExternalUrl(url)).toBeUndefined(),
  );
  it('returns verified opening hours in the city timezone', () =>
    expect(openingState({ place_hours: [hours()] }, now)).toBe('open'));
  it('treats closing time as exclusive', () =>
    expect(
      openingState({ place_hours: [hours({ closes_at: '12:00:00' })] }, now),
    ).toBe('closed'));
  it.each([null, '2026-08-01T00:00:00Z', '2026-11-01T00:00:00Z'])(
    'does not claim hours verified at %s are current',
    (verified_at) =>
      expect(openingState({ place_hours: [hours({ verified_at })] }, now)).toBe(
        'unknown',
      ),
  );
  it('does not label missing hours as closed', () =>
    expect(openingState({ place_hours: [] }, now)).toBe('unknown'));
  it('calculates monthly São Paulo boundaries across year end', () =>
    expect(monthBounds('2026-12').end.toISOString()).toBe(
      '2027-01-01T03:00:00.000Z',
    ));
});
