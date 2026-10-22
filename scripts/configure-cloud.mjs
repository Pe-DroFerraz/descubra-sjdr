import process from 'node:process';
import {
  existsSync,
  readFileSync,
  writeFileSync,
  renameSync,
  chmodSync,
} from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { authorizedPublicKey, projectUrl } from './cloud/common.mjs';
const file = fileURLToPath(new URL('../.env.local', import.meta.url));
const key = process.env.VITE_SUPABASE_ANON_KEY;
if (!authorizedPublicKey(key)) {
  process.stderr.write(
    'BLOCKED: VITE_SUPABASE_ANON_KEY must be supplied securely as an authorized public key. No values were written.\n',
  );
  process.exit(2);
}
if (
  process.env.VITE_SUPABASE_URL &&
  process.env.VITE_SUPABASE_URL !== projectUrl
) {
  process.stderr.write(
    'BLOCKED: configured URL does not match the requested project.\n',
  );
  process.exit(2);
}
let source = existsSync(file) ? readFileSync(file, 'utf8') : '';
const oldUrl = source
  .match(/^VITE_SUPABASE_URL=(.*)$/m)?.[1]
  ?.replace(/^['"]|['"]$/g, '')
  .trim();
if (oldUrl && oldUrl !== projectUrl) {
  process.stderr.write(
    'BLOCKED: preserve existing project configuration; review the URL conflict.\n',
  );
  process.exit(2);
}
for (const [name, value] of Object.entries({
  VITE_SUPABASE_URL: projectUrl,
  VITE_SUPABASE_ANON_KEY: key,
})) {
  const line = `${name}=${value}`;
  const pattern = new RegExp(`^${name}=.*$`, 'm');
  source = pattern.test(source)
    ? source.replace(pattern, () => line)
    : source.trimEnd() + '\n' + line + '\n';
}
const temp = file + '.cloud-tmp';
writeFileSync(temp, source, { mode: 0o600, flag: 'wx' });
renameSync(temp, file);
chmodSync(file, 0o600);
process.stdout.write(
  'Public project configuration saved to ignored .env.local (0600). No key printed. Restart Vite.\n',
);
