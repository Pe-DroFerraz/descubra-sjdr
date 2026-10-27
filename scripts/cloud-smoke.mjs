// Real remote integration: reads only. No signup, emails, seed, DDL, INSERT/UPDATE/DELETE or arbitrary RPC.
import process from 'node:process';
import { URL } from 'node:url';
import { z } from 'zod';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import {
  cloudClient,
  projectUrl,
  projectRef,
  publicAuthSettings,
} from './cloud/common.mjs';
const projections = JSON.parse(
  readFileSync(
    new URL('../src/data/projections.json', import.meta.url),
    'utf8',
  ),
);
const results = [];
let failed = 0;
async function check(name, task) {
  try {
    await task();
    results.push({ name, status: 'passed' });
    console.log('PASS', name);
  } catch {
    failed++;
    results.push({ name, status: 'failed' });
    console.error(
      'FAIL',
      name,
      '(details suppressed; no tokens or response bodies logged)',
    );
  }
}
function ok(value) {
  if (!value) throw new Error('Assertion failed');
}
let db;
try {
  db = cloudClient();
} catch (error) {
  console.error(error.message);
  process.exit(2);
}
// Do not repeat an unavailable/unauthorized gateway call for every table.
let settings;
try {
  const response = await fetch(projectUrl + '/auth/v1/settings', {
    headers: { apikey: process.env.VITE_SUPABASE_ANON_KEY },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    console.error(
      `BLOCKED: public Auth gateway returned HTTP ${response.status}. Check network/project binding before retrying.`,
    );
    process.exit(2);
  }
  settings = await response.json();
} catch {
  console.error(
    'BLOCKED: Supabase gateway unreachable. No remote assertions executed.',
  );
  process.exit(2);
}

for (const table of ['places', 'routes', 'events', 'tips'])
  await check(`anonymous published ${table}`, async () => {
    const { data, error } = await db
      .from(table)
      .select('status,is_demo,' + projections[table])
      .eq('status', 'published')
      .eq('is_demo', false)
      .limit(5);
    ok(
      !error &&
        Array.isArray(data) &&
        data.every(
          (row) => row.status === 'published' && row.is_demo === false,
        ),
    );
  });
for (const table of ['categories', 'plans'])
  await check(`anonymous published ${table}`, async () => {
    const { data, error } = await db
      .from(table)
      .select('id,published')
      .eq('published', true)
      .limit(5);
    ok(!error && Array.isArray(data) && data.every((row) => row.published));
  });
for (const table of [
  'profiles',
  'user_roles',
  'advertisers',
  'subscriptions',
  'payments',
  'leads',
  'lead_notes',
  'ai_sessions',
  'audit_logs',
  'qr_scans',
  'place_views',
  'click_events',
  'coupon_redemptions',
])
  await check(`anonymous private boundary ${table}`, async () => {
    const { count, error } = await db
      .from(table)
      .select('id', { head: true, count: 'exact' })
      .limit(1);
    ok(!error && count === 0);
  });
await check('anonymous has_role(admin) false', async () => {
  const { data, error } = await db.rpc('has_role', { requested: 'admin' });
  ok(!error && data === false);
});
await check('public benefits safe projection', async () => {
  const { data, error } = await db.rpc('public_place_benefits');
  ok(
    !error &&
      z
        .array(
          z
            .object({
              place_id: z.string().uuid(),
              valid_until: z.string().datetime({ offset: true }),
              features: z.record(z.unknown()),
            })
            .strict(),
        )
        .safeParse(data).success,
  );
});
await check('public sponsors safe projection', async () => {
  const { data, error } = await db.rpc('public_route_sponsors', {
    target_route: null,
  });
  ok(
    !error &&
      z
        .array(z.object({ name: z.string(), place_slug: z.string() }).strict())
        .safeParse(data).success,
  );
});
await check('public Auth settings readable', async () => {
  ok(typeof settings === 'object' && settings !== null);
});
await check('anonymous private metrics denied', async () => {
  const { error } = await db.rpc('place_daily_metrics', {
    target_place: null,
    from_date: '2026-10-27',
    to_date: '2026-10-27',
  });
  ok(error?.code === '42501');
});
// Non-mutating SELECT ... LIMIT 0: absence of new columns is a deployment prerequisite,
// not a claim that the missing migration has already passed Cloud homologation.
const editorialColumns = [];
for (const table of ['categories', 'places', 'routes', 'events', 'tips']) {
  const columns = [];
  for (const column of ['source_urls', 'pending_fields']) {
    try {
      const { error } = await db.from(table).select(column).limit(0);
      columns.push({
        column,
        status: !error
          ? 'available'
          : ['42703', 'PGRST204'].includes(error.code)
            ? 'pending_migration'
            : 'unverified',
      });
    } catch {
      columns.push({ column, status: 'unverified' });
    }
  }
  editorialColumns.push({ table, columns });
}
for (const role of ['advertiser', 'admin']) {
  const token = process.env[`CLOUD_${role.toUpperCase()}_ACCESS_TOKEN`];
  if (!token) {
    results.push({
      name: `authenticated ${role}`,
      status: 'not_run',
      reason: 'existing test-user token not supplied',
    });
    continue;
  }
  await check(`authenticated ${role} existing identity`, async () => {
    const client = cloudClient(token);
    const {
      data: { user },
      error,
    } = await client.auth.getUser(token);
    ok(!error && user);
    const admin = await client.rpc('has_role', { requested: 'admin' });
    ok(!admin.error && admin.data === (role === 'admin'));
    if (role === 'advertiser') {
      const own = await client
        .from('advertisers')
        .select('id', { head: true, count: 'exact' })
        .eq('owner_id', user.id)
        .eq('status', 'approved');
      ok(!own.error && own.count > 0);
      const others = await client
        .from('advertisers')
        .select('id', { head: true, count: 'exact' })
        .neq('owner_id', user.id);
      ok(!others.error && others.count === 0);
    }
  });
}
mkdirSync('.audit', { recursive: true });
writeFileSync(
  '.audit/cloud-smoke.json',
  JSON.stringify(
    {
      project_ref: projectRef,
      source: 'real_cloud_readonly_http',
      observed_at: new Date().toISOString(),
      auth_public_settings: publicAuthSettings(settings),
      editorial_columns: editorialColumns,
      results,
    },
    null,
    2,
  ),
  { mode: 0o600 },
);
console.log(
  'Report: .audit/cloud-smoke.json. Buckets, mutation policies, migration history and official advisors require the privileged read-only audit.',
);
process.exitCode = failed ? 1 : 0;
