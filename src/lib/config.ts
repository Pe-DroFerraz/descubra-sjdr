import { z } from 'zod';
const publicKey = z.string().refine((key) => {
  if (/^sb_publishable_[A-Za-z0-9_-]{10,}$/.test(key)) return true;
  if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_+/-]+={0,2}\.[A-Za-z0-9_-]+$/.test(key))
    return false;
  try {
    const payload = JSON.parse(
      atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')),
    );
    return payload.role === 'anon';
  } catch {
    return false;
  }
}, 'Use apenas a chave anon ou publishable do Supabase.');
const schema = z.object({
  url: z
    .string()
    .url()
    .refine((url) => {
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        return false;
      }
      return (
        !parsed.username &&
        !parsed.password &&
        !parsed.search &&
        !parsed.hash &&
        parsed.pathname === '/' &&
        (parsed.protocol === 'https:' ||
          (parsed.protocol === 'http:' &&
            ['localhost', '127.0.0.1'].includes(parsed.hostname)))
      );
    }, 'Use HTTPS ou Supabase local.'),
  key: publicKey,
});
export function readPublicConfig(url?: string, key?: string) {
  if (!url && !key) return { config: null, error: null };
  const result = schema.safeParse({ url, key });
  // Never include the input or the credential in errors.
  return result.success
    ? { config: result.data, error: null }
    : {
        config: null,
        error:
          'Configuração pública do Supabase inválida. Verifique URL e chave anon/publishable.',
      };
}
