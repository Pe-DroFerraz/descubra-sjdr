import { z } from 'zod';
const id = z.string().uuid();
const text = z.string();
const instant = z.string().datetime({ offset: true });
export const translation = z.object({
  locale: z.enum(['pt', 'en', 'es']),
  name: text,
  description: text,
});
export const photo = z.object({
  storage_path: text,
  alt_text: text,
  position: z.number(),
});
export const hours = z.object({
  weekday: z.number().int().min(0).max(6),
  opens_at: text.nullable(),
  closes_at: text.nullable(),
  closed: z.boolean(),
  verified_at: instant.nullable(),
});
export const category = z.object({ id, slug: text, name: text });
export const place = z.object({
  id,
  category_id: id,
  slug: text,
  name: text,
  description: text,
  address: text.nullable(),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  phone: text.nullable(),
  whatsapp: text.nullable(),
  website: text.nullable(),
  instagram: text.nullable(),
  price_description: text.nullable(),
  verified_at: instant.nullable(),
  place_translations: z.array(translation),
  place_photos: z.array(photo),
  place_hours: z.array(hours),
});
export const route = z.object({
  id,
  slug: text,
  name: text,
  description: text,
  duration_minutes: z.number().nullable(),
  weather: z.enum(['any', 'rain', 'dry']).default('any'),
  route_translations: z.array(translation),
  route_stops: z.array(
    z.object({
      place_id: id,
      position: z.number(),
      duration_minutes: z.number().nullable(),
    }),
  ),
});
export const event = z.object({
  id,
  place_id: id.nullable(),
  name: text,
  description: text,
  starts_at: instant,
  ends_at: instant,
  verified_at: instant.nullable(),
  image_path: text.nullable(),
  event_translations: z.array(translation),
});
export const tip = z.object({
  id,
  title: text,
  description: text,
  category: text,
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
});
export const benefit = z.object({
  place_id: id,
  valid_until: z.string().datetime({ offset: true }),
  features: z.record(z.unknown()),
});
export const sponsor = z.object({ name: text, place_slug: text });
export const coupon = z.object({
  id,
  title: text,
  description: text,
  code: text,
  ends_at: instant,
});
export const review = z.object({
  id,
  rating: z.number(),
  comment: text,
  display_name: text,
  created_at: instant,
});
export type Place = z.infer<typeof place>;
export type Route = z.infer<typeof route>;
export type Event = z.infer<typeof event>;
export type Tip = z.infer<typeof tip>;
export type Category = z.infer<typeof category>;
