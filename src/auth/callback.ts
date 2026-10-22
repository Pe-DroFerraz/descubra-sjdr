import { supabase } from '../lib/supabase';
const exchanges = new Map<string, Promise<{ recovery: boolean }>>();
export function exchangeCodeOnce(code: string) {
  const existing = exchanges.get(code);
  if (existing) return existing;
  const task = (async () => {
    if (!supabase) throw new Error('Authentication unavailable');
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.session) throw new Error('Callback rejected');
    // redirectType comes from the SDK's PKCE verifier, never from a URL parameter or user metadata.
    return {
      recovery: 'redirectType' in data && data.redirectType === 'recovery',
    };
  })();
  exchanges.set(code, task);
  void task.finally(() => exchanges.delete(code)).catch(() => undefined);
  return task;
}
