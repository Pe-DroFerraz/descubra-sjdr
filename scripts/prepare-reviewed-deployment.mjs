// Generates review artifacts only. No connection, CLI invocation, credentials or deployment.
import process from 'node:process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const root = 'supabase/migrations/';
const originals = [
  '202610220001_core.sql',
  '202610220002_storage.sql',
  '202610220003_tourist_catalog.sql',
];
const additions = [
  '20261022150000_security_hardening.sql',
  '20261022170000_admin_route_stops.sql',
  '20261022180000_editorial_provenance.sql',
];
const mapping = JSON.parse(
  readFileSync('supabase/audit/remote-history.json', 'utf8'),
);
const literal = (value) => "'" + value.replaceAll("'", "''") + "'";
const files = [...originals, ...additions].map((file) => {
  const sql = readFileSync(root + file, 'utf8');
  return {
    file,
    sql,
    version: file.split('_')[0],
    name: file.replace(/^[0-9]+_/, '').replace(/\.sql$/, ''),
    sha256: createHash('sha256').update(sql).digest('hex'),
  };
});
const stages = files.slice(3).map((file, index) => {
  const required = index ? files[index + 2] : null;
  const body = file.sql
    .replace(/^begin;\s*$/m, '')
    .replace(/^commit;\s*$/m, '');
  for (const tag of ['$review_stage$', '$review_source$', '$review_body$'])
    if (file.sql.includes(tag))
      throw new Error('Reserved SQL delimiter in source');
  return `-- REVIEW ONLY: ${file.file}; SHA256 ${file.sha256}
-- No original migration DDL. History and this stage commit together, or neither does.
begin;
set local lock_timeout='5s';
set local statement_timeout='120s';
set local search_path=pg_catalog;
select pg_advisory_xact_lock(73492027150000);
do $review_stage$
declare applied record; source_sql constant text:=$review_source$${file.sql}$review_source$;
begin
  if exists(select 1 from supabase_migrations.schema_migrations where name not in ('core','storage','tourist_catalog','security_hardening','admin_route_stops','editorial_provenance') or name is null) then
    raise exception 'unreviewed migration history: stop, do not repair automatically';
  end if;
${mapping.migrations
  .map(
    (
      m,
    ) => `  if (select count(*) from supabase_migrations.schema_migrations where name=${literal(m.name)})<>1
    or not exists(select 1 from supabase_migrations.schema_migrations where name=${literal(m.name)} and version in (${literal(m.local_version)},${literal(m.remote_version)})) then
    raise exception 'original migration mapping mismatch: ${m.name}';
  end if;`,
  )
  .join('\n')}
  select name,statements into applied from supabase_migrations.schema_migrations where version=${literal(file.version)};
  if found then
    if applied.name is distinct from ${literal(file.name)} or applied.statements is distinct from array[source_sql] then
      raise exception 'recorded migration differs from reviewed source: ${file.version}';
    end if;
    return; -- Exact replay: no DDL or second history write.
  end if;
  if exists(select 1 from supabase_migrations.schema_migrations where name=${literal(file.name)}) then
    raise exception 'additional migration name/version collision';
  end if;
${required ? `  if not exists(select 1 from supabase_migrations.schema_migrations where version=${literal(required.version)} and name=${literal(required.name)}) then raise exception 'previous reviewed stage missing';end if;` : ''}
  execute $review_body$${body}$review_body$;
  insert into supabase_migrations.schema_migrations(version,name,statements)
    values (${literal(file.version)},${literal(file.name)},array[source_sql]);
end $review_stage$;
commit;
`;
});
const artifacts = {
  'supabase/deploy/reviewed-additions.sql':
    '-- NOT AUTHORIZED FOR REMOTE EXECUTION. Reconcile definitions, review effects and obtain approval first.\n-- Run with ON_ERROR_STOP; never use alongside migration up/db push.\n' +
    stages.join('\n'),
  'supabase/deploy/manifest.json':
    JSON.stringify(
      {
        generated_from_source: true,
        remote_execution_authorized: false,
        original_migrations_replayed: false,
        migrations: files.map((file) => ({
          file: file.file,
          version: file.version,
          name: file.name,
          sha256: file.sha256,
        })),
      },
      null,
      2,
    ) + '\n',
};
for (const [path, content] of Object.entries(artifacts)) {
  if (process.argv.includes('--check')) {
    if (readFileSync(path, 'utf8') !== content)
      throw new Error('Review artifact differs from its generator: ' + path);
  } else writeFileSync(path, content);
}
console.log(
  'Review-only deployment artifacts ' +
    (process.argv.includes('--check') ? 'verified' : 'generated') +
    '. No database connection or execution.',
);
