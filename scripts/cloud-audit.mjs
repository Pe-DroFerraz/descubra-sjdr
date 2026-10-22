import process from 'node:process';
import { compareHistory } from './cloud/history.mjs';
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
try {
  const source = process.argv[2];
  if (!source) {
    console.error(
      'Usage: npm run cloud:audit -- <authorized-readonly-report.json> [local-baseline.json]',
    );
    process.exit(2);
  }
  const report = JSON.parse(readFileSync(source, 'utf8'));
  const baseline = process.argv[3]
    ? JSON.parse(readFileSync(process.argv[3], 'utf8'))
    : null;
  const local = readdirSync('supabase/migrations')
    .filter((file) => file.endsWith('.sql'))
    .map((file) => ({
      file,
      version: file.split('_')[0],
      name: file.replace(/^[0-9]+_/, '').replace(/\.sql$/, ''),
      sha256: createHash('sha256')
        .update(readFileSync('supabase/migrations/' + file))
        .digest('hex'),
    }));
  const findings = [];
  const pending = [];
  if (
    report.source !== 'custom_readonly_sql' ||
    report.report_version !== 1 ||
    !Array.isArray(report.history) ||
    !Array.isArray(report.functions) ||
    !Array.isArray(report.tables) ||
    !Array.isArray(report.buckets)
  )
    throw new Error('Unsupported sanitized audit report');
  const mapping = JSON.parse(
    readFileSync('supabase/audit/remote-history.json', 'utf8'),
  );
  const historyReview = compareHistory(local, report.history, mapping);
  findings.push(...historyReview.findings);
  pending.push(...historyReview.pending);
  const appTables = readFileSync(
    'supabase/migrations/202610220001_core.sql',
    'utf8',
  ).matchAll(/create table public\.(\w+)/g);
  for (const [, name] of appTables)
    if (
      !report.tables.some((table) => table.name === name && table.rls === true)
    )
      findings.push({ kind: 'missing_table_or_rls', name });
  for (const id of ['place-photos', 'qr-codes', 'event-images'])
    if (
      !report.buckets.some(
        (bucket) => bucket.id === id && bucket.public === (id !== 'qr-codes'),
      )
    )
      findings.push({ kind: 'bucket_configuration', id });
  for (const privilege of [
    'anon_public',
    'authenticated_public',
    'anon_private',
    'authenticated_private',
  ]) {
    if (report.schema_create?.[privilege] !== false)
      findings.push({ kind: 'schema_create_permission_review', privilege });
  }
  for (const fn of report.functions) {
    if (
      fn.security_definer &&
      !['search_path=""', 'search_path=pg_catalog'].includes(fn.search_path)
    )
      findings.push({
        kind: 'definer_search_path_review',
        signature: fn.signature,
      });
    if (fn.public_execute)
      findings.push({
        kind: 'implicit_public_execute_review',
        signature: fn.signature,
      });
    const before = baseline?.functions?.find(
      (item) => item.signature === fn.signature,
    );
    if (before && before.definition_md5 !== fn.definition_md5)
      pending.push({ kind: 'definition_diff_review', signature: fn.signature });
  }
  for (const name of [
    'has_role',
    'public_place_benefits',
    'public_route_sponsors',
  ])
    if (
      !report.functions.some((fn) =>
        fn.signature.startsWith('public.' + name + '('),
      )
    )
      findings.push({ kind: 'required_function_missing', name });
  if (
    !report.functions.some((fn) => fn.signature === 'public.rls_auto_enable()')
  )
    pending.push({
      kind: 'rls_auto_enable_not_present_in_report',
      action:
        'Do not create it automatically. Inspect the platform configuration if it was reported by the advisor.',
    });
  if (
    report.functions.some((fn) => fn.signature === 'public.rls_auto_enable()')
  )
    pending.push({
      kind: 'rls_auto_enable_dependency_review',
      action:
        'Inspect full definition, ACL and event-trigger bindings; preserve the platform helper until reviewed.',
    });
  if (!baseline)
    pending.push({
      kind: 'definition_comparison_not_run',
      action:
        'Provide .audit/local-baseline.json; version names alone do not prove SQL equivalence.',
    });
  if (baseline) {
    if (JSON.stringify(baseline.buckets) !== JSON.stringify(report.buckets))
      pending.push({ kind: 'bucket_limits_or_types_diff_review' });
    for (const before of baseline.table_signatures ?? []) {
      const remote = report.table_signatures?.find(
        (table) => table.name === before.name,
      );
      if (!remote || JSON.stringify(remote) !== JSON.stringify(before))
        pending.push({
          kind: 'table_definition_diff_review',
          name: before.name,
        });
    }
    if (JSON.stringify(baseline.policies) !== JSON.stringify(report.policies))
      pending.push({ kind: 'policy_definition_diff_review' });
  }
  const result = {
    source: 'custom_audit_comparison',
    local_migrations: local,
    findings,
    pending,
    remote_data_modified: false,
  };
  mkdirSync('.audit', { recursive: true });
  writeFileSync('.audit/comparison.json', JSON.stringify(result, null, 2), {
    mode: 0o600,
  });
  console.log(
    'Read-only comparison:',
    findings.length,
    'findings,',
    pending.length,
    'items pending. No database changes. Report: .audit/comparison.json',
  );
  process.exitCode = findings.length ? 1 : 0;
} catch {
  console.error(
    'Audit input could not be parsed or compared. No input content printed.',
  );
  process.exitCode = 2;
}
