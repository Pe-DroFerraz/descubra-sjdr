import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { readPublicConfig } from '../lib/config';
import * as model from './schema';
const { config } = readPublicConfig(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);
// The tourist catalog MUST remain anonymous even when an advertiser logs in elsewhere.
export const publicClient = config
  ? createClient(config.url, config.key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  : null;
export class CatalogUnavailable extends Error {
  constructor() {
    super('Catalog unavailable');
  }
}
function client() {
  if (!publicClient) throw new CatalogUnavailable();
  return publicClient;
}
const placeColumns =
  'id,category_id,slug,name,description,address,latitude,longitude,phone,whatsapp,website,instagram,price_description,verified_at,place_translations(locale,name,description),place_photos(storage_path,alt_text,position),place_hours(weekday,opens_at,closes_at,closed,verified_at)';
// Explicit projections and stable pagination: PostgREST commonly limits responses to 1,000 rows.
async function collect<T extends z.ZodTypeAny>(
  table: string,
  columns: string,
  schema: T,
  signal: AbortSignal,
  content = true,
): Promise<z.infer<T>[]> {
  const rows: z.infer<T>[] = [];
  for (let offset = 0; ; offset += 200) {
    let query = client()
      .from(table)
      .select(columns)
      .order('id')
      .range(offset, offset + 199)
      .abortSignal(signal);
    if (content) query = query.eq('status', 'published').eq('is_demo', false);
    else query = query.eq('published', true);
    const { data, error } = await query;
    if (error) throw new Error('Catalog request failed');
    const page = z.array(schema).parse(data);
    rows.push(...page);
    if (page.length < 200) return rows;
  }
}
export const catalog = {
  places: (signal: AbortSignal) =>
    collect('places', placeColumns, model.place, signal),
  categories: (signal: AbortSignal) =>
    collect('categories', 'id,slug,name', model.category, signal, false),
  routes: (signal: AbortSignal) =>
    collect(
      'routes',
      'id,slug,name,description,duration_minutes,weather,route_translations(locale,name,description),route_stops(place_id,position,duration_minutes)',
      model.route,
      signal,
    ),
  events: (signal: AbortSignal) =>
    collect(
      'events',
      'id,place_id,name,description,starts_at,ends_at,verified_at,image_path,event_translations(locale,name,description)',
      model.event,
      signal,
    ),
  tips: (signal: AbortSignal) =>
    collect(
      'tips',
      'id,title,description,category,latitude,longitude',
      model.tip,
      signal,
    ),
  benefits: async (signal: AbortSignal) => {
    const { data, error } = await client()
      .rpc('public_place_benefits')
      .abortSignal(signal);
    if (error) throw new Error('Benefits unavailable');
    return z.array(model.benefit).parse(data);
  },
  sponsors: async (routeId: string, signal: AbortSignal) => {
    const { data, error } = await client()
      .rpc('public_route_sponsors', { target_route: routeId })
      .abortSignal(signal);
    if (error) throw new Error('Sponsors unavailable');
    return z.array(model.sponsor).parse(data);
  },
  details: async (placeId: string, signal: AbortSignal) => {
    const now = new Date().toISOString();
    const db = client();
    const [coupons, reviews] = await Promise.all([
      db
        .from('coupons')
        .select('id,title,description,code,ends_at')
        .eq('place_id', placeId)
        .eq('status', 'published')
        .lte('starts_at', now)
        .gt('ends_at', now)
        .order('ends_at')
        .limit(50)
        .abortSignal(signal),
      db
        .from('reviews')
        .select('id,rating,comment,display_name,created_at')
        .eq('place_id', placeId)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(50)
        .abortSignal(signal),
    ]);
    if (coupons.error || reviews.error)
      throw new Error('Place details unavailable');
    return {
      coupons: z.array(model.coupon).parse(coupons.data),
      reviews: z.array(model.review).parse(reviews.data),
    };
  },
};
export function mediaUrl(
  bucket: 'place-photos' | 'event-images',
  path: string | undefined | null,
) {
  if (
    !publicClient ||
    !path ||
    path.startsWith('/') ||
    path.split('/').some((part) => part === '..' || part === '.')
  )
    return undefined;
  return publicClient.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
