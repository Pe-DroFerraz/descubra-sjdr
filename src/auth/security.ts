import { z } from 'zod';
export const emailSchema = z.string().trim().email().max(254);
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});
export const passwordSchema = z
  .string()
  .min(12)
  .max(128)
  .regex(/[a-z]/)
  .regex(/[A-Z]/)
  .regex(/[0-9]/);
// Auth callbacks only redirect to destinations owned by this application.
export function safeAuthNext(value: string | null) {
  return value === '/favoritos' || value === '/conta' ? value : '/conta';
}
export function authCallbackUrl(origin: string, next = '/conta') {
  const url = new URL('/auth/confirmar', origin);
  if (
    url.protocol !== 'https:' &&
    !(
      url.protocol === 'http:' &&
      ['localhost', '127.0.0.1'].includes(url.hostname)
    )
  )
    throw new Error('Invalid callback origin');
  if (url.username || url.password) throw new Error('Invalid callback origin');
  url.searchParams.set('next', safeAuthNext(next));
  return url.toString();
}
// Unknown email and successful email requests intentionally have the same public response.
export function emailRequestState(
  error: { status?: number } | null,
): 'sent' | 'requestError' | 'rateLimit' {
  if (!error || (error.status && error.status >= 400 && error.status < 429))
    return 'sent';
  return error.status === 429 ? 'rateLimit' : 'requestError';
}
