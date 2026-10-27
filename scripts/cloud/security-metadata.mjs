// Metadata-only comparison, no automatic repair or remote execution.
const permissions = {
  'public.has_role(public.app_role)': [true, true, true],
  'public.public_place_benefits()': [true, true, true],
  'public.public_route_sponsors(uuid)': [true, true, true],
  'public.place_daily_metrics(uuid,date,date)': [false, true, true],
  'public.redeem_coupon(uuid,uuid,uuid)': [false, false, true],
  'public.touch_updated_at()': [false, false, false],
  'private.owns_advertiser(uuid)': [false, true, true],
  'private.can_edit_place(uuid)': [false, true, true],
  'private.owns_place(uuid)': [true, true, true],
  'private.published_place(uuid)': [true, true, true],
  'private.path_place_id(text)': [true, true, true],
};
export function compareSecurityMetadata(report, baseline) {
  const findings = [],
    pending = [];
  for (const [signature, allowed] of Object.entries(permissions)) {
    const fn = report.functions.find((item) => item.signature === signature);
    if (!fn) {
      findings.push({ kind: 'required_function_missing', signature });
      continue;
    }
    for (const [index, role] of [
      'anon',
      'authenticated',
      'service_role',
    ].entries()) {
      const value = fn[role + '_execute'];
      if (typeof value !== 'boolean')
        pending.push({ kind: 'function_grant_not_observed', signature, role });
      else if (value !== allowed[index])
        findings.push({
          kind: 'function_grant_mismatch',
          signature,
          role,
          expected: allowed[index],
        });
    }
  }
  if (
    !report.coverage?.application_definers ||
    !Array.isArray(report.triggers) ||
    !Array.isArray(report.table_grants)
  )
    pending.push({
      kind: 'extended_metadata_not_observed',
      action:
        'Export the current read-only audit; old/partial reports cannot prove ACL/trigger equivalence.',
    });
  if (baseline) {
    for (const property of ['triggers', 'table_grants']) {
      if (
        !Array.isArray(baseline[property]) ||
        !Array.isArray(report[property])
      ) {
        pending.push({ kind: property + '_comparison_not_run' });
      } else if (
        JSON.stringify(baseline[property]) !== JSON.stringify(report[property])
      ) {
        pending.push({ kind: property + '_diff_review' });
      }
    }
    for (const before of baseline.functions ?? []) {
      const current = report.functions.find(
        (fn) => fn.signature === before.signature,
      );
      if (
        current &&
        JSON.stringify(current.execute_grantees) !==
          JSON.stringify(before.execute_grantees)
      )
        pending.push({
          kind: 'function_acl_diff_review',
          signature: before.signature,
        });
      if (!report.functions.some((fn) => fn.signature === before.signature))
        pending.push({
          kind: 'function_removed_review',
          signature: before.signature,
        });
    }
  }
  const platform = report.functions.find(
    (fn) => fn.signature === 'public.rls_auto_enable()',
  );
  if (platform) {
    if (
      ['anon', 'authenticated', 'service_role'].some(
        (role) => platform[role + '_execute'] === true,
      )
    )
      findings.push({ kind: 'platform_handler_client_execute' });
    if (
      platform.owner !== 'postgres' ||
      platform.returns !== 'event_trigger' ||
      platform.search_path !== 'search_path=pg_catalog' ||
      !report.event_triggers?.some(
        (evt) =>
          evt.name === 'ensure_rls' &&
          ['O', 'A'].includes(evt.enabled) &&
          evt.function === platform.signature,
      )
    )
      findings.push({ kind: 'platform_handler_contract_review' });
  }
  return { findings, pending };
}
