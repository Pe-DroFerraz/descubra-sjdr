// Official Supabase Management API, read-only GET. Existing authorization only, never printed.
import process from 'node:process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { projectRef } from './cloud/common.mjs';
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error(
    'BLOCKED: no authorized Supabase Management API binding in this session. Official Security Advisors were not executed.',
  );
  process.exit(2);
}
try {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/advisors/security`,
    {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(20_000),
    },
  );
  if (!response.ok) {
    console.error(
      `Security Advisors GET: HTTP ${response.status}. Response body suppressed.`,
    );
    process.exit(1);
  }
  const data = await response.json();
  if (!Array.isArray(data.lints)) throw new Error('Unexpected advisor schema');
  const findings = data.lints.map((lint) => ({
    name: lint.name,
    level: lint.level,
    title: lint.title,
    remediation: lint.remediation,
  }));
  mkdirSync('.audit', { recursive: true });
  writeFileSync(
    '.audit/security-advisors.json',
    JSON.stringify(
      {
        source: 'supabase_official_security_advisor',
        project_ref: projectRef,
        findings,
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  console.log(
    'Official Security Advisors executed. Sanitized findings:',
    findings.length,
    'Report: .audit/security-advisors.json',
  );
} catch {
  console.error(
    'Security Advisors unavailable (network/authentication/response). No credentials logged.',
  );
  process.exitCode = 1;
}
