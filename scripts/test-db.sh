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
for migration in supabase/migrations/*.sql; do psql_run < "$migration"; done
psql_run < supabase/seed.sql
psql_run < supabase/seed.sql
psql_run < supabase/tests/security.sql
psql_run < supabase/tests/tourist.sql
psql_run < supabase/tests/concurrency-fixture.sql
psql_run < supabase/tests/concurrent-redeem.sql &
first_pid=$!
psql_run < supabase/tests/concurrent-redeem.sql &
second_pid=$!
wait "$first_pid"
wait "$second_pid"
psql_run < supabase/tests/concurrency-assert.sql
printf 'PostgreSQL migrations, repeatable seed and security checks passed.\n'
