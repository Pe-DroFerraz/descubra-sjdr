import { describe, expect, it } from 'vitest';
import { compareHistory } from './history.mjs';
import mapping from '../../supabase/audit/remote-history.json';
const local = mapping.migrations.map((item) => ({
  version: item.local_version,
  name: item.name,
  file: `${item.local_version}_${item.name}.sql`,
}));
const remote = mapping.migrations.map((item) => ({
  version: item.remote_version,
  name: item.name,
}));
describe('authorized remote history mapping', () => {
  it('records external timestamps without claiming SQL equivalence', () => {
    const result = compareHistory(local, remote, mapping);
    expect(result.findings).toEqual([]);
    expect(result.pending.map((item) => item.kind)).toEqual(
      Array(3).fill('mapped_version_definition_review'),
    );
    expect(mapping.definition_equivalence_verified).toBe(false);
  });
  it('accepts the exact isolated local baseline without a Cloud claim', () => {
    expect(compareHistory(local, local, mapping)).toEqual({
      findings: [],
      pending: [],
    });
  });
  it('rejects missing migrations and a mapped version occupied by another name', () => {
    const changed = [{ ...remote[0], name: 'unexpected' }, remote[2]];
    const result = compareHistory(local, changed, mapping);
    expect(
      result.findings.some(
        (item) => item.kind === 'migration_version_collision',
      ),
    ).toBe(true);
    expect(
      result.findings.filter(
        (item) => item.kind === 'migration_history_mismatch',
      ),
    ).toHaveLength(2);
  });
  it('rejects replayed versions of the same migration', () => {
    const result = compareHistory(local, [...remote, local[0]], mapping);
    expect(
      result.findings.some((item) => item.kind === 'duplicate_migration_name'),
    ).toBe(true);
  });
  it('rejects an additional migration older than verified remote history', () => {
    const result = compareHistory(
      [
        ...local,
        { version: '202610220004', name: 'hardening', file: 'old.sql' },
      ],
      remote,
      mapping,
    );
    expect(
      result.findings.some(
        (item) => item.kind === 'additional_migration_out_of_order',
      ),
    ).toBe(true);
    const next = compareHistory(
      [
        ...local,
        { version: '20261022150000', name: 'hardening', file: 'new.sql' },
      ],
      remote,
      mapping,
    );
    expect(next.findings).toEqual([]);
    expect(next.pending.at(-1).kind).toBe('additional_migration_pending');
  });
});
