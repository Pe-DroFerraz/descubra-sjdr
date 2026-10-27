import { it, expect } from 'vitest';
import { compareSecurityMetadata } from './security-metadata.mjs';
const snapshot = () => ({
  functions: [
    {
      signature: 'public.place_daily_metrics(uuid,date,date)',
      anon_execute: true,
      authenticated_execute: true,
      service_role_execute: true,
    },
    {
      signature: 'public.rls_auto_enable()',
      owner: 'postgres',
      returns: 'event_trigger',
      search_path: 'search_path=pg_catalog',
      anon_execute: true,
    },
  ],
  event_triggers: [
    { name: 'ensure_rls', function: 'public.rls_auto_enable()', enabled: 'O' },
  ],
});
it('finds client grants on private metrics and on the platform event handler', () => {
  const result = compareSecurityMetadata(snapshot());
  expect(result.findings).toContainEqual({
    kind: 'function_grant_mismatch',
    signature: 'public.place_daily_metrics(uuid,date,date)',
    role: 'anon',
    expected: false,
  });
  expect(result.findings).toContainEqual({
    kind: 'platform_handler_client_execute',
  });
  expect(
    result.findings.some((f) => f.kind === 'platform_handler_contract_review'),
  ).toBe(false);
});
it('does not treat old or incomplete snapshots as a complete structural comparison', () => {
  const result = compareSecurityMetadata(snapshot(), snapshot());
  expect(
    result.pending.some((p) => p.kind === 'extended_metadata_not_observed'),
  ).toBe(true);
  expect(
    result.pending.some((p) => p.kind === 'triggers_comparison_not_run'),
  ).toBe(true);
  expect(
    result.findings.some(
      (p) =>
        p.kind === 'required_function_missing' &&
        p.signature === 'public.redeem_coupon(uuid,uuid,uuid)',
    ),
  ).toBe(true);
});
it('reports trigger drift and a missing/disabled platform binding', () => {
  const before = {
    ...snapshot(),
    coverage: { application_definers: true },
    triggers: [
      { name: 'set_updated_at', function: 'public.touch_updated_at()' },
    ],
    table_grants: [],
  };
  const after = {
    ...before,
    event_triggers: [],
    triggers: [
      { name: 'set_updated_at', function: 'private.touch_route_updated_at()' },
    ],
  };
  const result = compareSecurityMetadata(after, before);
  expect(result.pending).toContainEqual({ kind: 'triggers_diff_review' });
  expect(result.findings).toContainEqual({
    kind: 'platform_handler_contract_review',
  });
});
