import { createServer, request as httpRequest } from 'node:http';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
const config = JSON.parse(readFileSync(new URL('./config.json', import.meta.url)));
const schema = process.env.PPCB_DB_SCHEMA || process.env.PPCB_DATABASE_SCHEMA;
const expectedSchema = config.applicationId.replaceAll('-', '_');
if (![ `app_${expectedSchema}`, `test_app_${expectedSchema}` ].includes(schema)) throw new Error('Unexpected PPCB database schema.');
const environment = schema.startsWith('test_') ? 'testing' : 'production';
const basePath = `/apps/${config.applicationId}${environment === 'testing' ? '-test' : ''}`;
if (!process.env.DATABASE_URL) throw new Error('Managed database is required.');
const database = new URL(process.env.DATABASE_URL);
database.searchParams.set('schema', schema);
database.searchParams.set('sslmode', 'disable');
database.searchParams.set('options', `-c search_path=${schema}`);
const internalSecret = randomBytes(32).toString('hex');
const env = {
  ...process.env,
  NODE_ENV: 'production', AUTH_MODE: 'ppcb', AUTH_AUTO_PROVISION: 'false',
  DATABASE_URL: database.toString(), DATABASE_SSL: 'false',
  PPCB_APPLICATION_ID: config.applicationId, PPCB_PORTAL_ORIGIN: config.portalOrigin,
  PPCB_OWNER_USER_ID: config.ownerUserId, PPCB_OWNER_EMAIL: config.ownerEmail,
  PPCB_INTERNAL_SECRET: internalSecret,
  DEFAULT_ORGANIZATION_CODE: 'palmpay-experience-design',
  FILE_STORAGE_DRIVER: 'ppcb',
  API_BASE_URL: 'http://127.0.0.1:3001',
  WEB_ORIGIN: config.portalOrigin,
  NEXT_PUBLIC_APP_BASE_PATH: basePath,
  NEXT_DIST_DIR: `.next-ppcb-${environment}`,
  NEXT_TELEMETRY_DISABLED: '1',
};
const children = [];
let stopping = false;
function stop(code) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill('SIGTERM');
  setTimeout(() => process.exit(code), 1500).unref();
}
process.on('SIGTERM', () => stop(0));
process.on('SIGINT', () => stop(0));
async function run(command, args, cwd, childEnv = env) {
  const child = spawn(command, args, { cwd, env: childEnv, stdio: 'inherit' });
  children.push(child);
  return new Promise((done, fail) => {
    child.once('error', fail);
    child.once('exit', (code) => code === 0 ? done() : fail(new Error(`Startup command failed (${code}).`)));
  });
}
// Both schemas run the same committed migrations. No production data is copied to testing.
await run('node', ['dist/runtime-migrate.js'], resolve(root, 'apps/api'));
// Both environments need the idempotent organization, role and permission baseline
// before PPCB can resolve the gateway identity.
// The bundled catalog and its referenced covers are imported idempotently into
// each environment, so the same immutable image can be verified before promotion.
await run('node', ['dist/runtime-seed.js'], resolve(root, 'apps/api'));
for (const [name, command, args, cwd, port] of [
  ['api', 'node', ['dist/main.js'], 'apps/api', '3001'],
  ['web', 'node', ['server.js'], `web-${environment}/apps/web`, '3000'],
]) {
  const child = spawn(command, args, {
    cwd: resolve(root, cwd),
    env: { ...env, HOSTNAME: '127.0.0.1', PORT: port },
    stdio: 'inherit',
  });
  children.push(child);
  child.once('error', () => stop(1));
  child.once('exit', () => { if (!stopping) { console.error(`${name} process exited.`); stop(1); } });
}
const server = createServer(async (req, res) => {
  const requestPath = req.url || '/';
  const path = requestPath === basePath ? '/' : requestPath.startsWith(`${basePath}/`) ? requestPath.slice(basePath.length) : requestPath;
  const pathname = path.split('?')[0];
  if (pathname === '/healthz') {
    try {
      const [db, web] = await Promise.all([
        fetch('http://127.0.0.1:3001/api/health', { signal: AbortSignal.timeout(4000) }),
        fetch(`http://127.0.0.1:3000${basePath}/login`, { signal: AbortSignal.timeout(4000) }),
      ]);
      if (!db.ok || !web.ok) throw new Error('Not ready.');
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', environment }));
    } catch {
      res.writeHead(503, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ status: 'unavailable' }));
    }
    return;
  }
  // Only the PPCB gateway publishes this listener. The API and Next.js bind loopback.
  const headers = { ...req.headers };
  delete headers['x-dev-user-email'];
  delete headers['authorization'];
  delete headers['x-hub-internal-secret'];
  headers['x-hub-internal-secret'] = internalSecret;
  headers['x-forwarded-host'] = new URL(config.portalOrigin).host;
  headers['x-forwarded-proto'] = 'https';
  headers.host = new URL(config.portalOrigin).host;
  const isWebApi = pathname === '/api/workspace-notification-count' || pathname?.startsWith('/api/content-images/');
  const isApi = pathname?.startsWith('/api/') && !isWebApi;
  // Browser writes must come from this Portal origin; platform-hosted requests have no Origin.
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method || 'GET') && req.headers.origin && req.headers.origin !== config.portalOrigin) {
    res.writeHead(403); res.end('Invalid origin.'); return;
  }
  const upstream = httpRequest({ hostname: '127.0.0.1', port: isApi ? 3001 : 3000, path: isApi ? path : `${basePath}${pathname === '/' ? path.slice(1) : path}`, method: req.method, headers }, (response) => {
    res.writeHead(response.statusCode || 502, response.headers);
    response.pipe(res);
  });
  upstream.on('error', () => { if (!res.headersSent) res.writeHead(503); res.end('Service unavailable.'); });
  req.on('aborted', () => upstream.destroy());
  req.pipe(upstream);
});
server.listen(Number(process.env.PORT || 8080), '0.0.0.0');
