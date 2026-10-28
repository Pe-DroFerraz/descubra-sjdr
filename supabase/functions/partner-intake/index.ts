// Public interest intake. No messages or payments are initiated here.
import { createClient } from 'jsr:@supabase/supabase-js@2.57.0';

const allowedOrigins = new Set([
  'https://descubra-sjdr.vercel.app',
  'https://descubra-sjdr-pedroeferraz-1272s-projects.vercel.app',
]);
const json = (data: unknown, status=200, origin?:string) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Vary': 'Origin',
    ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}),
  },
});
function originAllowed(origin: string) {
  if (allowedOrigins.has(origin)) return true;
  try {
    const u = new URL(origin);
    return u.protocol === 'https:' && /^descubra-sjdr-[a-z0-9]+-pedroeferraz-1272s-projects\.vercel\.app$/.test(u.hostname);
  } catch { return false; }
}
const text = (v: unknown, limit: number) => typeof v === 'string' && v.trim().length <= limit ? v.trim() : null;
Deno.serve(async (req) => {
  const origin = req.headers.get('origin') ?? '';
  if (!originAllowed(origin)) return json({ error: 'origin_not_allowed' }, 403);
  const headers = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '3600',
    'Vary': 'Origin',
  };
  if (req.method === 'OPTIONS') return new Response(null, { status:204, headers });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, origin);
  const length = Number(req.headers.get('content-length') ?? '0');
  if (length > 4000) return json({ error: 'payload_too_large' }, 413, origin);
  let body: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (raw.length > 4000) return json({ error:'payload_too_large' }, 413, origin);
    body = JSON.parse(raw);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('bad request');
  } catch { return json({ error:'invalid_request' }, 400, origin); }
  const contact = text(body.contact_name, 120);
  const business = text(body.business_name, 160);
  const email = text(body.email, 254)?.toLowerCase();
  const phone = text(body.phone, 30);
  const message = text(body.message, 1000);
  const plan = text(body.plan_slug, 100);
  const trap = text(body.website, 200);
  if (trap || body.consent !== true || !contact || contact.length < 2 || !business || business.length < 2 ||
      !email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ||
      phone === null || message === null || plan === null) return json({ error:'invalid_request' }, 400, origin);
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return json({ error:'service_unavailable' }, 503, origin);
  const db = createClient(url, key, { auth: { persistSession:false, autoRefreshToken:false } });
  // Prevent bursts from the same email within 24h. This is a basic measure, not an IP-based rate limit.
  const stamp = new Date(Date.now()-86_400_000).toISOString();
  const { count, error:checkErr } = await db.from('leads')
    .select('id', { count:'exact', head:true }).eq('contact', email).gte('created_at', stamp);
  if (checkErr) return json({ error:'service_unavailable' }, 503, origin);
  if ((count ?? 0) >= 2) return json({ error:'rate_limited' }, 429, origin);
  const { error } = await db.from('leads').insert({
    name: business,
    contact: email,
    stage: 'prospect',
  });
  if (error) return json({ error:'service_unavailable' }, 503, origin);
  // Store optional context as an audit record only if a future opt-in schema is designed.
  // The current CRM leads schema cannot store the message/phone/consent details safely.
  return json({ received:true }, 202, origin);
});
