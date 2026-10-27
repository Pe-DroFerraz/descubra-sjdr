import process from 'node:process';
import { Buffer } from 'node:buffer';
import { createClient } from '@supabase/supabase-js';
export const projectRef = 'itegpsgjtuclbsatcdxr';
export const projectUrl = `https://${projectRef}.supabase.co`;
export function authorizedPublicKey(key) {
  if (typeof key !== 'string') return false;
  if (/^sb_publishable_[A-Za-z0-9_-]{10,}$/.test(key)) return true;
  if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_+/-]+={0,2}\.[A-Za-z0-9_-]+$/.test(key))
    return false;
  try {
    return (
      JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString())
        .role === 'anon'
    );
  } catch {
    return false;
  }
}
export function cloudClient(token) {
  if (
    process.env.VITE_SUPABASE_URL !== projectUrl ||
    !authorizedPublicKey(process.env.VITE_SUPABASE_ANON_KEY)
  )
    throw new Error(
      'BLOCKED: configure the project VITE_SUPABASE_URL and authorized anon/publishable key securely.',
    );
  return createClient(projectUrl, process.env.VITE_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (input, init) =>
        fetch(input, { ...init, signal: AbortSignal.timeout(15_000) }),
      ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
    },
  });
}

// Public flags only; absence remains unknown. Never serialize arbitrary settings.
export function publicAuthSettings(settings) {
  const boolean = (value) => (typeof value === 'boolean' ? value : null);
  return {
    email_enabled: boolean(settings?.external?.email),
    signup_enabled:
      typeof settings?.disable_signup === 'boolean'
        ? !settings.disable_signup
        : null,
    email_autoconfirm: boolean(settings?.mailer_autoconfirm),
    smtp_callbacks_pkce_mfa_verified: false,
  };
}
