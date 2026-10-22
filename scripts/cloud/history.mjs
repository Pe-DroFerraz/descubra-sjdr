// Metadata comparison only. This module never connects to or repairs a database.
export function compareHistory(local, history, mapping) {
  const findings = [];
  const pending = [];
  for (const remote of history) {
    if (history.filter((item) => item.version === remote.version).length > 1) {
      findings.push({
        kind: 'duplicate_remote_version',
        version: remote.version,
      });
    }
  }
  for (const expected of local) {
    const aliases = mapping.migrations.filter(
      (item) =>
        item.local_version === expected.version && item.name === expected.name,
    );
    const mapped = aliases.length === 1 ? aliases[0] : null;
    const acceptedVersions = [
      expected.version,
      ...(mapped ? [mapped.remote_version] : []),
    ];
    const matches = history.filter(
      (item) =>
        acceptedVersions.includes(item.version) && item.name === expected.name,
    );
    const collisions = history.filter(
      (item) =>
        acceptedVersions.includes(item.version) && item.name !== expected.name,
    );
    if (collisions.length)
      findings.push({
        kind: 'migration_version_collision',
        file: expected.file,
        action: 'Do not apply or repair automatically.',
      });
    const sameName = history.filter((item) => item.name === expected.name);
    if (matches.length > 1 || sameName.length > 1) {
      findings.push({ kind: 'duplicate_migration_name', file: expected.file });
    }
    if (mapped) {
      if (!matches.length)
        findings.push({
          kind: 'migration_history_mismatch',
          file: expected.file,
          action:
            'The authorized mapping does not match this snapshot. Do not replay or repair.',
        });
      if (matches.some((item) => item.version === mapped.remote_version)) {
        pending.push({
          kind: 'mapped_version_definition_review',
          file: expected.file,
          remote_version: mapped.remote_version,
          action:
            'Version/name mapping is known; compare SQL definitions and dependencies before any additional migration.',
        });
      }
    } else if (!matches.length) {
      pending.push({
        kind: 'additional_migration_pending',
        file: expected.file,
        action:
          'Review actual remote definitions and grants before applying this migration only.',
      });
      const latest = history
        .map((item) => item.version)
        .sort()
        .at(-1);
      if (latest && expected.version <= latest)
        findings.push({
          kind: 'additional_migration_out_of_order',
          file: expected.file,
          latest_remote_version: latest,
        });
    }
  }
  return { findings, pending };
}
