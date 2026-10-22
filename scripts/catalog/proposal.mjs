import { z } from 'zod';
const uuid = z.string().uuid();
const source = z
  .object({
    id: z.string(),
    title: z.string(),
    url: z.string().url().startsWith('https://'),
    consulted: z.literal(true),
    kind: z.string(),
    note: z.string(),
  })
  .passthrough();
const editorial = z
  .object({
    review_required: z.literal(true),
    notes: z.array(z.string()).min(1),
  })
  .passthrough();
export const proposalSchema = z
  .object({
    version: z.literal(1),
    city: z.literal('São João del-Rei — MG'),
    remote_writes_authorized: z.literal(false),
    sources: z.array(source).min(1),
    categories: z
      .array(
        z.object({
          id: uuid,
          slug: z.string().regex(/^[a-z0-9-]+$/),
          name: z.string().min(1),
          published: z.literal(false),
        }),
      )
      .min(1),
    places: z
      .array(
        z.object({
          id: uuid,
          slug: z.string().regex(/^[a-z0-9-]+$/),
          category_id: uuid,
          name: z.string().min(1),
          description: z.string(),
          address: z.string().nullable(),
          latitude: z.null(),
          longitude: z.null(),
          status: z.literal('draft'),
          is_demo: z.literal(false),
          verified_at: z.null(),
          price_description: z.null(),
          phone: z.null(),
          whatsapp: z.null(),
          website: z.null(),
          instagram: z.null(),
          editorial: editorial.extend({
            source_ids: z.array(z.string()).min(1),
            primary_url: z.string().url().startsWith('https://'),
            address_state: z.enum([
              'not-confirmed',
              'secondary-evidence-needs-review',
            ]),
          }),
        }),
      )
      .min(20),
    routes: z
      .array(
        z.object({
          id: uuid,
          slug: z.string(),
          name: z.string(),
          description: z.string(),
          duration_minutes: z.null(),
          weather: z.enum(['any', 'rain', 'dry']),
          status: z.literal('draft'),
          is_demo: z.literal(false),
          editorial,
          stops: z
            .array(
              z.object({
                place_id: uuid,
                position: z.number().int().nonnegative(),
                duration_minutes: z.null(),
              }),
            )
            .min(1)
            .max(100),
        }),
      )
      .length(6),
    events: z.array(z.never()).length(0),
    tips: z.array(z.never()).length(0),
    photos: z.array(z.never()).length(0),
  })
  .passthrough()
  .superRefine((value, ctx) => {
    const check = (ok, message) => {
      if (!ok) ctx.addIssue({ code: 'custom', message });
    };
    for (const group of [value.categories, value.places, value.routes]) {
      check(
        new Set(group.map((row) => row.id)).size === group.length,
        'duplicate ids',
      );
      check(
        new Set(group.map((row) => row.slug)).size === group.length,
        'duplicate slugs',
      );
    }
    check(
      new Set(value.places.map((p) => p.name)).size === value.places.length,
      'duplicate attractions',
    );
    const categories = new Set(value.categories.map((c) => c.id)),
      places = new Set(value.places.map((p) => p.id)),
      sources = new Set(value.sources.map((s) => s.id));
    for (const place of value.places) {
      check(categories.has(place.category_id), 'missing category');
      for (const id of place.editorial.source_ids)
        check(sources.has(id), 'missing source');
      check(
        !place.address || place.editorial.address_state !== 'not-confirmed',
        'untracked address',
      );
    }
    for (const route of value.routes) {
      check(
        new Set(route.stops.map((s) => s.place_id)).size === route.stops.length,
        'duplicate stop',
      );
      route.stops.forEach((stop, i) => {
        check(places.has(stop.place_id), 'missing place');
        check(stop.position === i, 'unordered stops');
      });
    }
  });
export function proposalSql(input) {
  const data = proposalSchema.parse(input);
  const quote = (value) =>
    value === null
      ? 'null'
      : typeof value === 'boolean'
        ? String(value)
        : typeof value === 'number'
          ? String(value)
          : "'" + String(value).replaceAll("'", "''") + "'";
  const lines = [
    '-- EDITORIAL PROPOSAL ONLY. REVIEW ALL SOURCES/ADDRESSES BEFORE ANY REMOTE IMPORT.',
    '-- Not a migration, not the demonstration seed. No automatic remote execution.',
    '-- All records remain draft/unpublished. Existing IDs are preserved, never overwritten.',
    'begin;',
  ];
  function insert(table, columns, rows) {
    for (const row of rows)
      lines.push(
        `insert into public.${table}(${columns.join(',')}) values (${columns.map((c) => quote(row[c])).join(',')}) on conflict(id) do nothing;`,
      );
  }
  insert('categories', ['id', 'slug', 'name', 'published'], data.categories);
  insert(
    'places',
    [
      'id',
      'category_id',
      'slug',
      'name',
      'description',
      'address',
      'latitude',
      'longitude',
      'status',
      'is_demo',
      'verified_at',
    ],
    data.places,
  );
  const columns = [
    'id',
    'slug',
    'name',
    'description',
    'duration_minutes',
    'weather',
    'status',
    'is_demo',
  ];
  const stops = data.routes.flatMap((route) =>
    route.stops.map((stop) => ({ ...stop, route_id: route.id })),
  );
  // Only newly inserted routes receive initial stops. Re-running after human curation
  // must not resurrect a removed stop or modify an existing itinerary.
  lines.push(
    `with added as (insert into public.routes(${columns.join(',')}) values ${data.routes.map((row) => '(' + columns.map((c) => quote(row[c])).join(',') + ')').join(',')} on conflict(id) do nothing returning id)`,
  );
  lines.push(
    `insert into public.route_stops(route_id,place_id,position,duration_minutes) select s.route_id::uuid,s.place_id::uuid,s.position::integer,null from (values ${stops.map((stop) => '(' + [quote(stop.route_id), quote(stop.place_id), quote(stop.position)].join(',') + ')').join(',')}) s(route_id,place_id,position) join added on added.id=s.route_id::uuid;`,
  );
  lines.push('commit;');
  return lines.join('\n') + '\n';
}
