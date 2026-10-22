import { z } from 'zod';
const publicKey = z.string().refine((key) => {
  if (key.startsWith('sb_publishable_')) return key.length > 20;
  try {
    const payload = JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.role === 'anon';
  } catch { return false; }
}, 'Use apenas a chave anon ou publishable do Supabase.');
const schema = z.object({
  url: z.string().url().refine((url) => {
    let parsed: URL;
    try { parsed = new URL(url); } catch { return false; }
    return parsed.protocol === 'https:' || (parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname));
  }, 'Use HTTPS ou Supabase local.'),
  key: publicKey,
});
export function readPublicConfig(url?: string, key?: string) {
  if (!url && !key) return { config: null, error: null };
  const result = schema.safeParse({ url, key });
  // Never include the input or the credential in errors.
  return result.success
    ? { config: result.data, error: null }
    : { config: null, error: 'Configuração pública do Supabase inválida. Verifique URL e chave anon/publishable.' };
}
