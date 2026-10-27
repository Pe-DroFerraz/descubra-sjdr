import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { it, expect } from 'vitest';
it('pins all original and reviewed pending sources without authorizing remote execution', () => {
  const manifest = JSON.parse(
    readFileSync('supabase/deploy/manifest.json', 'utf8'),
  );
  expect(manifest.remote_execution_authorized).toBe(false);
  expect(manifest.original_migrations_replayed).toBe(false);
  expect(manifest.migrations).toHaveLength(6);
  const deployment = readFileSync(
    'supabase/deploy/reviewed-additions.sql',
    'utf8',
  );
  for (const [index, file] of manifest.migrations.entries()) {
    const source = readFileSync('supabase/migrations/' + file.file, 'utf8');
    expect(createHash('sha256').update(source).digest('hex')).toBe(file.sha256);
    if (index >= 3) expect(deployment).toContain(file.sha256);
  }
  expect(deployment).not.toContain('create table public.profiles');
  expect(deployment).toContain(
    'applied.statements is distinct from array[source_sql]',
  );
  expect(deployment).toContain('original migration mapping mismatch');
});
