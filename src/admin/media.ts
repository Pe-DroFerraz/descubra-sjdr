import { z } from 'zod';
import { adminClient, AdminError, fail } from './api';
import type { Row } from './schema';
export const maxImageBytes = 5 * 1024 * 1024;
export const rightsSchema = z
  .object({
    license: z.enum(['own-authorized', 'cc0', 'public-domain']),
    author: z.string().trim().min(1).max(200),
    source: z
      .string()
      .trim()
      .max(2000)
      .refine((v) => {
        if (!v) return true;
        try {
          const u = new URL(v);
          return u.protocol === 'https:' && !u.username && !u.password;
        } catch {
          return false;
        }
      }, 'httpsOnly'),
    confirmed: z.literal(true),
  })
  .refine(
    (v) => v.license === 'own-authorized' || !!v.source,
    'sourceRequired',
  );
export type Rights = z.infer<typeof rightsSchema>;
export function imageType(bytes: Uint8Array) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return 'image/jpeg';
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v))
    return 'image/png';
  const text = new TextDecoder().decode(bytes);
  if (text.slice(0, 4) === 'RIFF' && text.slice(8, 12) === 'WEBP')
    return 'image/webp';
  if (
    text.slice(4, 8) === 'ftyp' &&
    ['avif', 'avis'].includes(text.slice(8, 12))
  )
    return 'image/avif';
  throw new AdminError('imageType');
}
export async function prepareImage(file: File) {
  if (file.size === 0 || file.size > maxImageBytes)
    throw new AdminError('imageSize');
  const mime = imageType(new Uint8Array(await file.slice(0, 32).arrayBuffer()));
  if (file.type && file.type !== mime) throw new AdminError('imageType');
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new AdminError('imageDecode');
  }
  try {
    if (bitmap.width * bitmap.height > 40_000_000)
      throw new AdminError('imageDimensions');
    const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new AdminError('imageDecode');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', 0.85),
    );
    if (!blob || blob.size > maxImageBytes || blob.type !== 'image/webp')
      throw new AdminError('imageDecode');
    return blob; // Re-encoding removes embedded EXIF/location metadata and normalizes actual MIME.
  } finally {
    bitmap.close();
  }
}
const photoSchema = z.object({
  id: z.string().uuid(),
  updated_at: z.string(),
  place_id: z.string().uuid(),
  storage_path: z.string(),
  alt_text: z.string(),
  position: z.number().int(),
});
export type PhotoRow = z.infer<typeof photoSchema>;
export async function listPhotos(placeId: string) {
  const db = await adminClient();
  const all: PhotoRow[] = [];
  for (let from = 0; from < 100000; from += 250) {
    const { data, error } = await db
      .from('place_photos')
      .select('id,updated_at,place_id,storage_path,alt_text,position')
      .eq('place_id', placeId)
      .order('position')
      .order('id')
      .range(from, from + 249);
    fail(error);
    const page = z.array(photoSchema).parse(data);
    all.push(...page);
    if (page.length < 250) return all;
  }
  throw new AdminError('tooMany');
}
export async function photoDetails(photo: PhotoRow) {
  const db = await adminClient();
  const { data, error } = await db.storage
    .from('place-photos')
    .info(photo.storage_path);
  if (error) throw new AdminError('mediaMetadata');
  return z
    .object({ license: z.string(), author: z.string(), source: z.string() })
    .safeParse(data.metadata);
}
export async function updatePhoto(
  photo: PhotoRow,
  alt: string,
  position: number,
) {
  const payload = z
    .object({
      alt_text: z.string().trim().min(1).max(1000),
      position: z.number().int().min(0).max(10000),
    })
    .parse({ alt_text: alt, position });
  const db = await adminClient();
  const { data, error } = await db
    .from('place_photos')
    .update(payload)
    .eq('id', photo.id)
    .eq('updated_at', photo.updated_at)
    .select('id');
  fail(error);
  if (data?.length !== 1) throw new AdminError('conflict');
}
export async function uploadMedia(
  target: Row,
  bucket: 'place-photos' | 'event-images',
  file: File,
  rights: Rights,
  alt: string,
  position: number,
) {
  const metadata = rightsSchema.parse(rights);
  const caption = z.string().trim().min(1).max(1000).parse(alt);
  z.number().int().min(0).max(10000).parse(position);
  z.string().uuid().parse(target.id);
  const blob = await prepareImage(file);
  const db = await adminClient();
  const path = `${target.id}/${crypto.randomUUID()}.webp`;
  const asset = db.storage.from(bucket);
  const { error } = await asset.upload(path, blob, {
    contentType: 'image/webp',
    cacheControl: '3600',
    upsert: false,
    metadata: {
      license: metadata.license,
      author: metadata.author,
      source: metadata.source,
      rights_confirmed: true,
      alt_text: caption,
    },
  });
  if (error) throw new AdminError('uploadError', path);
  try {
    const query =
      bucket === 'place-photos'
        ? db.from('place_photos').insert({
            place_id: target.id,
            storage_path: path,
            alt_text: caption,
            position,
          })
        : db
            .from('events')
            .update({ image_path: path })
            .eq('id', target.id)
            .eq('updated_at', target.updated_at);
    const saved = await query.select('id');
    if (saved.error && !saved.error.code)
      throw new AdminError('uncertainUpload', path);
    fail(saved.error);
    if (saved.data?.length !== 1) throw new AdminError('conflict');
  } catch (error) {
    // A lost response may follow a committed write. Never delete a potentially linked
    // object automatically when the database outcome is unknown.
    if (!(error instanceof AdminError) || error.key === 'uncertainUpload')
      throw new AdminError('uncertainUpload', path);
    try {
      const cleanup = await asset.remove([path]);
      if (cleanup.error) throw new Error();
    } catch {
      throw new AdminError('orphanUpload', path);
    }
    throw error;
  }
  if (bucket === 'event-images' && target.image_path) {
    try {
      const cleanup = await asset.remove([String(target.image_path)]);
      if (cleanup.error) throw new Error();
    } catch {
      return { warning: 'orphanDelete', path: String(target.image_path) };
    }
  }
  return null;
}
export async function deleteMedia(
  target: PhotoRow | Row,
  bucket: 'place-photos' | 'event-images',
) {
  const db = await adminClient();
  const path = String(
    bucket === 'place-photos'
      ? target.storage_path
      : (('image_path' in target ? target.image_path : '') ?? ''),
  );
  if (
    !path ||
    !path.startsWith(
      `${bucket === 'place-photos' ? target.place_id : target.id}/`,
    )
  )
    throw new AdminError('invalid');
  const query =
    bucket === 'place-photos'
      ? db.from('place_photos').delete()
      : db.from('events').update({ image_path: null });
  const { data, error } = await query
    .eq('id', target.id)
    .eq('updated_at', target.updated_at)
    .select('id');
  fail(error);
  if (data?.length !== 1) throw new AdminError('conflict');
  try {
    const removed = await db.storage.from(bucket).remove([path]);
    if (removed.error) throw new Error();
  } catch {
    return { warning: 'orphanDelete', path };
  }
  return null;
}
