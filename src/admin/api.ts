import { z } from 'zod';
import { supabase } from '../lib/supabase';
import {
  entities,
  schemas,
  stopsSchema,
  type Entity,
  type Row,
} from './schema';
export class AdminError extends Error {
  constructor(
    public key: string,
    public cleanupPath?: string,
  ) {
    super(key);
  }
}
export function fail(error: { code?: string } | null) {
  if (!error) return;
  throw new AdminError(
    error.code === '42501'
      ? 'forbidden'
      : error.code === '23503'
        ? 'referenced'
        : error.code === '23505'
          ? 'duplicate'
          : error.code === '40001'
            ? 'conflict'
            : error.code === 'PGRST202'
              ? 'migrationRequired'
              : 'requestError',
  );
}
// Revalidate with Auth and the role RPC on every operation. RLS makes the final
// authorization decision on the server, including if a role is revoked after this check.
export async function adminClient() {
  if (!supabase) throw new AdminError('unavailable');
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw new AdminError('forbidden');
    const role = await supabase.rpc('has_role', { requested: 'admin' });
    if (role.error || role.data !== true) throw new AdminError('forbidden');
    return supabase;
  } catch (error) {
    if (error instanceof AdminError) throw error;
    throw new AdminError('requestError');
  }
}
export const projections: Record<Entity, string> = {
  categories: 'id,updated_at,name,slug,published',
  places:
    'id,updated_at,name,slug,description,category_id,address,latitude,longitude,website,phone,whatsapp,instagram,price_description,verified_at,status,is_demo',
  routes:
    'id,updated_at,name,slug,description,duration_minutes,weather,status,is_demo',
  events:
    'id,updated_at,name,description,place_id,starts_at,ends_at,verified_at,status,image_path,is_demo',
  tips: 'id,updated_at,title,description,category,latitude,longitude,status,is_demo',
};
const rows = z.array(
  z
    .object({
      id: z.string().uuid(),
      updated_at: z.string().datetime({ offset: true }),
    })
    .passthrough(),
);
function entityName(entity: Entity) {
  if (!entities.includes(entity)) throw new AdminError('invalid');
  return entity;
}
export async function listContent(entity: Entity, signal?: AbortSignal) {
  const db = await adminClient();
  const result: Row[] = [];
  for (let from = 0; from < 100000; from += 250) {
    let query = db
      .from(entityName(entity))
      .select(projections[entity])
      .order('id')
      .range(from, from + 249);
    if (signal) query = query.abortSignal(signal);
    const { data, error } = await query;
    fail(error);
    const page = rows.parse(data);
    result.push(...page);
    if (page.length < 250) return result;
  }
  throw new AdminError('tooMany');
}
export async function saveContent(
  entity: Entity,
  values: unknown,
  original?: Row,
) {
  const payload: Record<string, unknown> = schemas[entity].parse(values);
  if (
    original?.is_demo === true &&
    'status' in payload &&
    payload.status === 'published'
  )
    throw new AdminError('demoPublication');
  const db = await adminClient();
  const query = original
    ? db
        .from(entityName(entity))
        .update(payload)
        .eq('id', original.id)
        .eq('updated_at', original.updated_at)
    : db.from(entityName(entity)).insert(payload);
  const { data, error } = await query.select(projections[entity]).maybeSingle();
  fail(error);
  if (!data) throw new AdminError('conflict');
  return rows.parse([data])[0];
}
export async function deleteContent(entity: Entity, row: Row) {
  const db = await adminClient();
  if (entity === 'places') {
    const photos = await db
      .from('place_photos')
      .select('id', { head: true, count: 'exact' })
      .eq('place_id', row.id);
    fail(photos.error);
    if (photos.count) throw new AdminError('removePhotosFirst');
  }
  if (entity === 'events' && row.image_path)
    throw new AdminError('removePhotosFirst');
  if (entity === 'routes') {
    const sponsors = await db
      .from('route_sponsors')
      .select('id', { head: true, count: 'exact' })
      .eq('route_id', row.id);
    fail(sponsors.error);
    if (sponsors.count) throw new AdminError('referenced');
  }
  const { data, error } = await db
    .from(entityName(entity))
    .delete()
    .eq('id', row.id)
    .eq('updated_at', row.updated_at)
    .select('id');
  fail(error);
  if (data?.length !== 1) throw new AdminError('conflict');
}
export async function readStops(routeId: string) {
  const db = await adminClient();
  const { data, error } = await db
    .from('route_stops')
    .select('id,place_id,position,duration_minutes')
    .eq('route_id', routeId)
    .order('position');
  fail(error);
  return z
    .array(
      z.object({
        id: z.string().uuid(),
        place_id: z.string().uuid(),
        position: z.number().int(),
        duration_minutes: z.number().int().nullable(),
      }),
    )
    .parse(data);
}
export async function saveStops(route: Row, value: unknown) {
  const stops = stopsSchema.parse(value);
  const db = await adminClient();
  const { error } = await db.rpc('admin_set_route_stops', {
    target_route: route.id,
    expected_updated_at: route.updated_at,
    stops,
  });
  fail(error);
}
