import { createClient } from '@supabase/supabase-js';
import { readPublicConfig } from './config';
const { config, error } = readPublicConfig(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);
export const supabaseConfigError = error;
// Stage 0 runs without backend credentials. No requests until configured.
export const supabase = config ? createClient(config.url, config.key) : null;
