import { describe, expect, it } from 'vitest';
import {
  authCallbackUrl,
  emailRequestState,
  loginSchema,
  passwordSchema,
  safeAuthNext,
} from './security';
describe('authentication boundaries', () => {
  it.each([
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    '/admin/usuarios',
    '/conta?role=admin',
    'javascript:alert(1)',
  ])('rejects redirect %s', (value) =>
    expect(safeAuthNext(value)).toBe('/conta'),
  );
  it('allows the guarded admin landing page, never arbitrary admin paths', () =>
    expect(safeAuthNext('/admin')).toBe('/admin'));
  it('builds an exact same-origin callback', () =>
    expect(authCallbackUrl('https://preview.example', '/favoritos')).toBe(
      'https://preview.example/auth/confirmar?next=%2Ffavoritos',
    ));
  it.each([
    'http://remote.example',
    'https://name:secret@example.com',
    'javascript:alert(1)',
  ])('rejects insecure callback origin', (origin) =>
    expect(() => authCallbackUrl(origin)).toThrow(),
  );
  it('does not disclose account existence in email requests', () => {
    expect(emailRequestState(null)).toBe('sent');
    expect(emailRequestState({ status: 400 })).toBe('sent');
    expect(emailRequestState({ status: 403 })).toBe('sent');
  });
  it('distinguishes rate limits and network errors without raw messages', () => {
    expect(emailRequestState({ status: 429 })).toBe('rateLimit');
    expect(emailRequestState({})).toBe('requestError');
    expect(emailRequestState({ status: 503 })).toBe('requestError');
  });
  it('accepts old existing passwords for login without weakening new password validation', () => {
    expect(
      loginSchema.safeParse({
        email: 'fixture@example.invalid',
        password: 'old',
      }).success,
    ).toBe(true);
    expect(passwordSchema.safeParse('old').success).toBe(false);
    expect(passwordSchema.safeParse('FixtureSecure123').success).toBe(true);
  });
});
