import { readPublicConfig } from './config';
export const publicSupabaseConfig = readPublicConfig(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);
