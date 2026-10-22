import { describe, expect, it } from 'vitest';
import { readPublicConfig } from './config';
const jwt = (role: string) => `header.${btoa(JSON.stringify({ role }))}.signature`;
describe('public Supabase configuration', () => {
  it('allows the scaffold without a backend', () => expect(readPublicConfig()).toEqual({ config: null, error: null }));
  it.each(['https://example.supabase.co', 'http://127.0.0.1:54321'])('accepts anon key with %s', (url) => {
    expect(readPublicConfig(url, jwt('anon')).config?.url).toBe(url);
  });
  it('accepts a publishable key', () => expect(readPublicConfig('https://example.supabase.co', 'sb_publishable_example_public_key').error).toBeNull());
  it.each(['service_role', 'authenticated'])('rejects %s JWTs without exposing them', (role) => {
    const key = jwt(role);
    const result = readPublicConfig('https://example.supabase.co', key);
    expect(result.config).toBeNull();
    expect(result.error).toBeTruthy();
    expect(result.error).not.toContain(key);
  });
  it.each(['sb_secret_example', 'invalid'])('rejects nonpublic keys', (key) => expect(readPublicConfig('https://example.supabase.co', key).config).toBeNull());
  it.each(['http://remote.example.com', 'javascript:alert(1)', 'bad-url'])('rejects insecure URL %s', (url) => expect(readPublicConfig(url, jwt('anon')).config).toBeNull());
  it('rejects partial configuration', () => expect(readPublicConfig('https://example.supabase.co').error).toBeTruthy());
});
