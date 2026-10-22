import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { publicSupabaseConfig } from '../lib/supabase-config';
import * as model from './schema';
import projections from './projections.json';
const { config } = publicSupabaseConfig;
// The tourist catalog MUST remain anonymous even when an advertiser logs in elsewhere.
export const publicClient = config
  ? createClient(config.url, config.key, {
      auth: {
        storageKey: 'sjdr-public-anonymous',
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
    collect('places', projections.places, model.place, signal),
  categories: (signal: AbortSignal) =>
    collect(
      'categories',
      projections.categories,
      model.category,
      signal,
      false,
    ),
  routes: (signal: AbortSignal) =>
    collect('routes', projections.routes, model.route, signal),
  events: (signal: AbortSignal) =>
    collect('events', projections.events, model.event, signal),
  tips: (signal: AbortSignal) =>
    collect('tips', projections.tips, model.tip, signal),
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
