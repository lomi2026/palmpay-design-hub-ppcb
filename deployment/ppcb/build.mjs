import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const config = JSON.parse(readFileSync(new URL('./config.json', import.meta.url)));
for (const environment of ['testing', 'production']) {
  const slug = config.applicationId + (environment === 'testing' ? '-test' : '');
  const result = spawnSync('pnpm', ['--filter', '@palmpay/web', 'build', '--webpack'], {
    stdio: 'inherit',
    env: { ...process.env, AUTH_MODE: 'ppcb', API_BASE_URL: 'http://127.0.0.1:3001', NEXT_PUBLIC_APP_BASE_PATH: `/apps/${slug}`, NEXT_DIST_DIR: `.next-ppcb-${environment}`, NEXT_TELEMETRY_DISABLED: '1' },
  });
  if (result.status !== 0) process.exit(result.status || 1);
}
