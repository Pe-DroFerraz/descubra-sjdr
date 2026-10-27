#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
container="sjdr-test-${RANDOM}-$$"
trap 'docker rm -f "$container" >/dev/null 2>&1 || true' EXIT
# No host port and no network. Trust is confined to this disposable test container.
docker run --name "$container" --network none --tmpfs /var/lib/postgresql/data -e POSTGRES_HOST_AUTH_METHOD=trust -d postgres:17 >/dev/null
ready=0
for _ in {1..30}; do
  if docker exec "$container" pg_isready -U postgres >/dev/null 2>&1; then ready=1; break; fi
  sleep 1
done
if [[ "$ready" != 1 ]]; then docker logs "$container"; exit 1; fi
psql_run() { docker exec -i "$container" psql -X -U postgres -v ON_ERROR_STOP=1 -q; }
psql_run < supabase/tests/bootstrap.sql
for migration in supabase/migrations/20261022000*.sql; do
  psql_run < "$migration"
  migration_id=$(basename "$migration" .sql)
  migration_version=${migration_id%%_*}
  migration_name=${migration_id#*_}
  [[ "$migration_version" =~ ^[0-9]+$ && "$migration_name" =~ ^[a-z_]+$ ]]
  printf "insert into supabase_migrations.schema_migrations(version,name) values ('%s','%s');\n" "$migration_version" "$migration_name" | psql_run
  if [[ "$migration_version" == 202610220003 ]]; then
    psql_run < supabase/tests/route-version-baseline.sql
    psql_run < supabase/tests/platform-event-fixture.sql
    psql_run < supabase/audit/editorial-preflight.sql
    psql_run < supabase/audit/infra-preflight.sql
    mkdir -p .audit
    docker exec -i "$container" psql -X -U postgres -v ON_ERROR_STOP=1 -qAt < supabase/audit/cloud-readonly.sql > .audit/local-baseline.json
  fi
done
node scripts/prepare-reviewed-deployment.mjs --check
# Clone the isolated baseline, deliberately break a precondition, verify atomic failure.
docker exec "$container" createdb -U postgres -T postgres infra_guard
docker exec -i "$container" psql -X -U postgres -d infra_guard -v ON_ERROR_STOP=1 -q < supabase/tests/deploy-guard-setup.sql
if docker exec -i "$container" psql -X -U postgres -d infra_guard -v ON_ERROR_STOP=1 -q < supabase/deploy/reviewed-additions.sql > .audit/deploy-guard.log 2>&1; then
  echo 'Mismatched platform handler was unexpectedly accepted' >&2
  exit 1
fi
rg -q 'platform RLS handler differs' .audit/deploy-guard.log
docker exec -i "$container" psql -X -U postgres -d infra_guard -v ON_ERROR_STOP=1 -q < supabase/tests/deploy-guard-assert.sql

docker exec -i "$container" psql -X -U postgres -d infra_guard -v ON_ERROR_STOP=1 -q < supabase/tests/deploy-ledger-setup.sql
if docker exec -i "$container" psql -X -U postgres -d infra_guard -v ON_ERROR_STOP=1 -q < supabase/deploy/reviewed-additions.sql > .audit/deploy-ledger.log 2>&1; then
  echo 'Recorded source drift was unexpectedly accepted' >&2
  exit 1
fi
rg -q 'recorded migration differs' .audit/deploy-ledger.log
docker exec -i "$container" psql -X -U postgres -d infra_guard -v ON_ERROR_STOP=1 -q < supabase/tests/deploy-ledger-assert.sql
# Manual envelopes are exercised locally: exact replay skips DDL and keeps ledger unchanged.
psql_run < supabase/deploy/reviewed-additions.sql
psql_run < supabase/deploy/reviewed-additions.sql
psql_run < supabase/audit/infra-postflight.sql
psql_run < supabase/tests/event-trigger.sql
psql_run < supabase/tests/route-versions.sql
psql_run < supabase/seed.sql
psql_run < supabase/seed.sql
psql_run < supabase/tests/security.sql
psql_run < supabase/tests/tourist.sql
psql_run < supabase/tests/hardening.sql
psql_run < supabase/tests/admin-content.sql
psql_run < supabase/tests/editorial.sql
docker exec -i "$container" psql -X -U postgres -v ON_ERROR_STOP=1 -qAt < supabase/audit/cloud-readonly.sql > .audit/local-hardened.json
psql_run < supabase/tests/route-concurrency-fixture.sql
psql_run < supabase/tests/route-writer-a.sql > .audit/route-writer-a.log 2>&1 &
route_writer_pid=$!
barrier_ready=0
for _ in {1..100}; do
  barrier_ready=$(docker exec "$container" psql -X -U postgres -Atc "select count(*) from pg_locks where locktype='advisory' and classid=0 and objid=920001 and granted")
  if [[ "$barrier_ready" == 1 ]]; then break; fi
  sleep 0.01
done
[[ "$barrier_ready" == 1 ]]
if psql_run < supabase/tests/route-writer-b.sql > .audit/route-writer-b.log 2>&1; then
  echo 'Concurrent stale route write was unexpectedly accepted' >&2
  exit 1
fi
wait "$route_writer_pid"
rg -q '40001' .audit/route-writer-b.log
psql_run < supabase/tests/route-concurrency-assert.sql
psql_run < supabase/tests/concurrency-fixture.sql
psql_run < supabase/tests/concurrent-redeem.sql &
first_pid=$!
psql_run < supabase/tests/concurrent-redeem.sql &
second_pid=$!
wait "$first_pid"
wait "$second_pid"
psql_run < supabase/tests/concurrency-assert.sql
psql_run < supabase/tests/catalog-empty-fixture.sql
# Proposal is separate from migrations/seed, imported only into this isolated fixture DB.
node scripts/catalog.mjs >/dev/null
node --input-type=module -e "import fs from 'node:fs';import {proposalSql} from './scripts/catalog/proposal.mjs';if(fs.readFileSync('content/catalogo-inicial.sql','utf8')!==proposalSql(JSON.parse(fs.readFileSync('content/catalogo-inicial.json','utf8'))))process.exit(1);"
psql_run < content/catalogo-inicial.sql
psql_run < content/catalogo-inicial.sql
psql_run < supabase/tests/catalog.sql
psql_run < supabase/tests/catalog-local-edit.sql
psql_run < content/catalogo-inicial.sql
psql_run < supabase/tests/catalog-preserve.sql
printf 'PostgreSQL migrations, repeatable seed and security checks passed.\n'
