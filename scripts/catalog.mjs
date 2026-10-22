import process from 'node:process';
import { readFileSync, writeFileSync } from 'node:fs';
import { proposalSchema, proposalSql } from './catalog/proposal.mjs';
try {
  const data = proposalSchema.parse(
    JSON.parse(readFileSync('content/catalogo-inicial.json', 'utf8')),
  );
  if (process.argv.includes('--sql')) {
    writeFileSync('content/catalogo-inicial.sql', proposalSql(data));
    console.log(
      'Review-only SQL generated. No database connection or remote writes.',
    );
  }
  const confirmed = data.places.filter(
    (p) => p.editorial.address_state === 'external-official-reference',
  ).length;
  const provisional = data.places.filter(
    (p) =>
      p.address && p.editorial.address_state !== 'external-official-reference',
  ).length;
  const missing = data.places.filter((p) => !p.address).length;
  console.log(
    `${data.places.length} draft candidates, ${confirmed} externally confirmed address, ${provisional} provisional addresses, ${missing} missing addresses, ${data.routes.length} draft routes. All require editorial review. No verified operating information or licensed photos imported.`,
  );
} catch {
  console.error(
    'Editorial proposal invalid. No data written or input contents printed.',
  );
  process.exitCode = 1;
}
