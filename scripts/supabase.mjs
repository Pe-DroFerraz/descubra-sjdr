// Use the official bundled Go CLI on restricted cloud homes. No credential handling.
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import process from 'node:process';
const require = createRequire(import.meta.url);
const platform = process.platform === 'win32' ? 'windows' : process.platform;
const ext = process.platform === 'win32' ? '.exe' : '';
const env = { ...process.env };
try {
  const pkg = require.resolve(`@supabase/cli-${platform}-${process.arch}/package.json`);
  const goBinary = join(dirname(pkg), 'bin', `supabase-go${ext}`);
  if (existsSync(goBinary)) env.SUPABASE_CLI_BINARY_OVERRIDE = goBinary;
} catch { /* Standard CLI resolves other supported native variants itself. */ }
// Official Docker Hub mirror avoids requiring a second registry in cloud egress.
env.SUPABASE_INTERNAL_IMAGE_REGISTRY ??= 'docker.io';
const cli = fileURLToPath(new URL('../node_modules/supabase/dist/supabase.js', import.meta.url));
const result = spawnSync(process.execPath, [cli, ...process.argv.slice(2)], { env, stdio: 'inherit' });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
