import { createClient } from '@supabase/supabase-js';
const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
// Durante a Etapa 0 a home funciona sem chaves; chamadas de backend devem aguardar configuração.
export const supabase = url && anon ? createClient(url, anon) : null;
