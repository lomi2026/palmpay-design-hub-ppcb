import { cpSync, mkdirSync, rmSync, symlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const outputRoot = resolve(process.argv[2] || '/out/ppcb-web');

rmSync(outputRoot, { force: true, recursive: true });
mkdirSync(outputRoot, { recursive: true });

for (const environment of ['production', 'testing']) {
  const distName = `.next-ppcb-${environment}`;
  const buildRoot = resolve(root, 'apps/web', distName);
  const destination = resolve(outputRoot, `web-${environment}`);

  cpSync(resolve(buildRoot, 'standalone'), destination, {
    dereference: false,
    recursive: true,
    verbatimSymlinks: true,
  });
  cpSync(resolve(buildRoot, 'static'), resolve(destination, 'apps/web', distName, 'static'), {
    recursive: true,
  });
  cpSync(resolve(root, 'apps/web/public'), resolve(destination, 'apps/web/public'), {
    recursive: true,
  });
}

// Both builds use the same lockfile. Share the traced runtime dependencies instead
// of storing a second identical 53 MB copy in the image.
const testingModules = resolve(outputRoot, 'web-testing/node_modules');
rmSync(testingModules, { force: true, recursive: true });
symlinkSync('../web-production/node_modules', testingModules, 'dir');
