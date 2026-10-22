import { describe, expect, it } from 'vitest';
import {
  decodeItinerary,
  encodeItinerary,
  parseItinerary,
} from './local-state';
const id = '10000000-0000-4000-8000-000000000001';
describe('local and shared itinerary payloads', () => {
  it('round trips a shared itinerary', () => {
    const items = [{ id, day: 2 }];
    expect(decodeItinerary(decodeURIComponent(encodeItinerary(items)))).toEqual(
      items,
    );
  });
  it.each([
    'invalid',
    '{}',
    '[{"id":"bad","day":1}]',
    JSON.stringify([{ id, day: 0 }]),
    JSON.stringify([{ id, day: 31 }]),
    JSON.stringify([
      { id, day: 1 },
      { id, day: 2 },
    ]),
  ])('rejects malformed or duplicate trip %s', (value) =>
    expect(parseItinerary(value)).toEqual([]),
  );
  it('does not execute HTML passed in a shared link', () =>
    expect(decodeItinerary('<script>alert(1)</script>')).toEqual([]));
});
