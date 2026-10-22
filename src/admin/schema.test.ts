import { describe, expect, it } from 'vitest';
import {
  cityInput,
  cityInstant,
  formValues,
  parseForm,
  schemas,
  stopsSchema,
} from './schema';
const category = '10000000-0000-4000-8000-000000000001';
describe('editorial payloads', () => {
  it('keeps unknown data empty and drafts unpublished', () => {
    const values = {
      ...formValues('places'),
      name: 'Local de teste',
      slug: 'local-teste',
      category_id: category,
    };
    const place = parseForm('places', values);
    expect(place).toMatchObject({
      status: 'draft',
      address: null,
      latitude: null,
      longitude: null,
      verified_at: null,
      price_description: null,
    });
    expect(schemas.places.parse(place)).toEqual(place);
  });
  it('rejects unsafe URLs, partial coordinates and privilege fields', () => {
    const place = {
      ...formValues('places'),
      name: 'Teste',
      slug: 'teste',
      category_id: category,
    };
    expect(() =>
      parseForm('places', { ...place, website: 'javascript:alert(1)' }),
    ).toThrow();
    expect(() => parseForm('places', { ...place, latitude: '-21' })).toThrow();
    expect(() =>
      schemas.categories.parse({
        name: 'Teste',
        slug: 'teste',
        published: false,
        role: 'admin',
      }),
    ).toThrow();
  });
  it('requires a verified event and an ordered time range before publication', () => {
    const event = {
      ...formValues('events'),
      name: 'Fixture',
      description: 'Test only',
      starts_at: '2026-11-01T10:00',
      ends_at: '2026-11-01T11:00',
    };
    expect(parseForm('events', event)).toMatchObject({
      status: 'draft',
      place_id: null,
    });
    expect(() =>
      parseForm('events', { ...event, status: 'published' }),
    ).toThrow();
    expect(() =>
      parseForm('events', { ...event, ends_at: '2026-11-01T09:00' }),
    ).toThrow();
  });
  it('does not invent a verification date', () => {
    expect(formValues('places').verified_at).toBe('');
    expect(() =>
      parseForm('events', {
        ...formValues('events'),
        name: 'Test',
        starts_at: '2026-11-01T10:00',
        ends_at: '2026-11-01T11:00',
        verified_at: '2199-01-01T12:00',
      }),
    ).toThrow();
  });
  it('converts São Paulo wall times without depending on browser timezone', () => {
    expect(cityInstant('2026-10-22T09:30')).toBe('2026-10-22T12:30:00.000Z');
    expect(cityInput('2026-10-22T12:30:00Z')).toBe('2026-10-22T09:30');
    expect(() => cityInstant('2026-02-30T09:00')).toThrow();
    expect(() => cityInstant('not a date')).toThrow();
  });
  it('preserves the exact timestamp when an existing date input is unchanged', () => {
    const row = {
      id: category,
      updated_at: '2026-10-22T12:00:00Z',
      name: 'Fixture',
      description: 'Test',
      place_id: null,
      starts_at: '2026-11-01T13:00:32.123456Z',
      ends_at: '2026-11-01T14:00:32.123456Z',
      verified_at: null,
      status: 'draft',
    };
    expect(parseForm('events', formValues('events', row), row)).toMatchObject({
      starts_at: row.starts_at,
      ends_at: row.ends_at,
    });
  });
  it('rejects duplicate and invalid route stops', () => {
    expect(() =>
      stopsSchema.parse([
        { place_id: category, duration_minutes: null },
        { place_id: category, duration_minutes: null },
      ]),
    ).toThrow();
    expect(() =>
      stopsSchema.parse([{ place_id: category, duration_minutes: '-1' }]),
    ).toThrow();
    expect(
      stopsSchema.parse([{ place_id: category, duration_minutes: '' }]),
    ).toEqual([{ place_id: category, duration_minutes: null }]);
  });
});
