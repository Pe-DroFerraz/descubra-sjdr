import { createClient } from '@supabase/supabase-js';
import { publicSupabaseConfig } from './supabase-config';
import { createAuthStorage } from '../auth/storage';
const { config, error } = publicSupabaseConfig;
export const supabaseConfigError = error;
export const supabase = config
  ? createClient(config.url, config.key, {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: `sjdr-auth-v1-${new URL(config.url).host}`,
        storage: createAuthStorage(),
      },
    })
  : null;
