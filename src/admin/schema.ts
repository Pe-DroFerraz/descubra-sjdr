import { z } from 'zod';
const text = (max = 200) => z.string().trim().min(1).max(max);
const optionalText = (max = 4000) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .transform((v) => v || null);
const number = (min: number, max: number, integer = false) =>
  z.union([z.string(), z.number(), z.null()]).transform((v, ctx) => {
    if (v === '' || v === null || (typeof v === 'string' && !v.trim()))
      return null;
    const n = Number(v);
    if (
      !Number.isFinite(n) ||
      n < min ||
      n > max ||
      (integer && !Number.isInteger(n))
    ) {
      ctx.addIssue({ code: 'custom', message: 'invalidNumber' });
      return z.NEVER;
    }
    return n;
  });
const id = z.string().uuid();
const slug = text(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const status = z.enum(['draft', 'pending', 'published', 'suspended']);
const instant = z.string().datetime({ offset: true });
const verified = z
  .union([instant, z.literal(''), z.null()])
  .transform((v) => v || null)
  .refine((v) => !v || Date.parse(v) <= Date.now(), 'futureVerification');
const website = optionalText(2000).refine((v) => {
  if (!v) return true;
  try {
    const u = new URL(v);
    return u.protocol === 'https:' && !u.username && !u.password;
  } catch {
    return false;
  }
}, 'httpsOnly');
// Public provenance only: never enter credentials, personal data or private notes.
const sourceUrl = z
  .string()
  .trim()
  .max(2000)
  .url()
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && !url.username && !url.password;
    } catch {
      return false;
    }
  }, 'httpsOnly');
const provenance = {
  source_urls: z.array(sourceUrl).max(20).default([]),
  pending_fields: z.array(text(160)).max(30).default([]),
};
function publicationReady(value: {
  source_urls: string[];
  pending_fields: string[];
  status?: string;
  published?: boolean;
  description?: string;
  address?: string | null;
}) {
  if (value.status !== 'published' && !value.published) return true;
  return (
    value.source_urls.length > 0 &&
    value.pending_fields.length === 0 &&
    (value.description === undefined || value.description.trim().length > 0) &&
    (value.address === undefined || !!value.address?.trim())
  );
}
const point = { latitude: number(-90, 90), longitude: number(-180, 180) };
const paired = (v: { latitude: number | null; longitude: number | null }) =>
  (v.latitude === null) === (v.longitude === null);
const base = {
  name: text(),
  description: z.string().trim().max(20000),
  status,
  ...provenance,
};
export const schemas = {
  categories: z
    .object({ name: text(), slug, published: z.boolean(), ...provenance })
    .strict()
    .refine(publicationReady, 'publicationIncomplete'),
  places: z
    .object({
      ...base,
      slug,
      category_id: id,
      address: optionalText(1000),
      ...point,
      website,
      phone: optionalText(80),
      whatsapp: optionalText(80),
      instagram: website,
      price_description: optionalText(2000),
      verified_at: verified,
    })
    .strict()
    .refine(paired, 'pairedCoordinates')
    .refine(publicationReady, 'publicationIncomplete'),
  routes: z
    .object({
      ...base,
      slug,
      duration_minutes: number(1, 10080, true),
      weather: z.enum(['any', 'rain', 'dry']),
    })
    .strict()
    .refine(publicationReady, 'publicationIncomplete'),
  events: z
    .object({
      ...base,
      place_id: z
        .union([id, z.literal(''), z.null()])
        .transform((v) => v || null),
      starts_at: instant,
      ends_at: instant,
      verified_at: verified,
    })
    .strict()
    .refine(
      (v) => Date.parse(v.ends_at) > Date.parse(v.starts_at),
      'eventOrder',
    )
    .refine(
      (v) => v.status !== 'published' || !!v.verified_at,
      'eventVerification',
    )
    .refine(publicationReady, 'publicationIncomplete'),
  tips: z
    .object({
      title: text(),
      description: text(20000),
      category: text(100),
      ...provenance,
      ...point,
      status,
    })
    .strict()
    .refine(paired, 'pairedCoordinates')
    .refine(publicationReady, 'publicationIncomplete'),
};
export type Entity = keyof typeof schemas;
export const entities = Object.keys(schemas) as Entity[];
export type Row = {
  id: string;
  updated_at: string;
  [key: string]: unknown;
};
export type Field = {
  key: string;
  type?:
    | 'textarea'
    | 'number'
    | 'select'
    | 'checkbox'
    | 'datetime-local'
    | 'url';
  options?: string[];
  relation?: 'categories' | 'places';
  required?: boolean;
};
const provenanceFields: Field[] = [
  { key: 'source_urls', type: 'textarea' },
  { key: 'pending_fields', type: 'textarea' },
];
const named: Field[] = [
  { key: 'name', required: true },
  { key: 'slug', required: true },
  { key: 'description', type: 'textarea' },
];
const state: Field = {
  key: 'status',
  type: 'select',
  options: ['draft', 'pending', 'published', 'suspended'],
};
const coordinates: Field[] = [
  { key: 'latitude', type: 'number' },
  { key: 'longitude', type: 'number' },
];
export const fields: Record<Entity, Field[]> = {
  categories: [
    { key: 'name', required: true },
    { key: 'slug', required: true },
    { key: 'published', type: 'checkbox' },
  ],
  places: [
    ...named,
    {
      key: 'category_id',
      type: 'select',
      relation: 'categories',
      required: true,
    },
    { key: 'address' },
    ...coordinates,
    { key: 'website', type: 'url' },
    { key: 'phone' },
    { key: 'whatsapp' },
    { key: 'instagram', type: 'url' },
    { key: 'price_description', type: 'textarea' },
    { key: 'verified_at', type: 'datetime-local' },
    state,
  ],
  routes: [
    ...named,
    { key: 'duration_minutes', type: 'number' },
    { key: 'weather', type: 'select', options: ['any', 'rain', 'dry'] },
    state,
  ],
  events: [
    { key: 'name', required: true },
    { key: 'description', type: 'textarea' },
    { key: 'place_id', type: 'select', relation: 'places' },
    { key: 'starts_at', type: 'datetime-local', required: true },
    { key: 'ends_at', type: 'datetime-local', required: true },
    { key: 'verified_at', type: 'datetime-local' },
    state,
  ],
  tips: [
    { key: 'title', required: true },
    { key: 'description', type: 'textarea', required: true },
    { key: 'category', required: true },
    ...coordinates,
    state,
  ],
};
for (const entity of entities) fields[entity].push(...provenanceFields);
export function cityInput(iso: string) {
  if (!iso) return '';
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso));
  return parts.replace(' ', 'T');
}
export function cityInstant(value: string) {
  if (!value) return '';
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))
    throw new Error('invalidDate');
  const wall = Date.parse(value + 'Z');
  if (!Number.isFinite(wall)) throw new Error('invalidDate');
  let timestamp = wall;
  for (let i = 0; i < 3; i++) {
    const displayed = cityInput(new Date(timestamp).toISOString());
    const delta = wall - Date.parse(displayed + 'Z');
    timestamp += delta;
    if (!delta) break;
  }
  const result = new Date(timestamp).toISOString();
  if (cityInput(result) !== value) throw new Error('invalidDate');
  return result;
}
export function formValues(entity: Entity, row?: Row) {
  return Object.fromEntries(
    fields[entity].map((f) => [
      f.key,
      f.key === 'source_urls' || f.key === 'pending_fields'
        ? (Array.isArray(row?.[f.key]) ? (row[f.key] as string[]) : []).join(
            '\n',
          )
        : f.type === 'checkbox'
          ? row?.[f.key] === true
          : f.type === 'datetime-local'
            ? cityInput(String(row?.[f.key] ?? ''))
            : String(
                row?.[f.key] ??
                  (f.key === 'status'
                    ? 'draft'
                    : f.key === 'weather'
                      ? 'any'
                      : ''),
              ),
    ]),
  );
}
export function parseForm(
  entity: Entity,
  values: Record<string, unknown>,
  original?: Row,
) {
  const data = Object.fromEntries(
    fields[entity].map((f) => [
      f.key,
      f.key === 'source_urls' || f.key === 'pending_fields'
        ? [
            ...new Set(
              String(values[f.key] ?? '')
                .split(/\r?\n/)
                .map((v) => v.trim())
                .filter(Boolean),
            ),
          ]
        : f.type === 'datetime-local'
          ? original &&
            String(values[f.key] ?? '') ===
              cityInput(String(original[f.key] ?? ''))
            ? (original[f.key] ?? '')
            : cityInstant(String(values[f.key] ?? ''))
          : values[f.key],
    ]),
  );
  return schemas[entity].parse(data);
}
export const stopSchema = z
  .object({ place_id: id, duration_minutes: number(1, 10080, true) })
  .strict();
export const stopsSchema = z
  .array(stopSchema)
  .max(100)
  .refine(
    (v) => new Set(v.map((s) => s.place_id)).size === v.length,
    'duplicateStops',
  );
