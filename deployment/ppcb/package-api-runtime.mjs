import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { nodeFileTrace } = require('../../apps/web/node_modules/next/dist/compiled/@vercel/nft');
const root = fileURLToPath(new URL('../../', import.meta.url));
const outputRoot = resolve(process.argv[2] || '/out/ppcb-api-root');
const entries = [
  'apps/api/dist/main.js',
  'apps/api/dist/runtime-migrate.js',
  'apps/api/dist/runtime-seed.js',
];

const traced = await nodeFileTrace(entries.map((entry) => resolve(root, entry)), {
  base: root,
  processCwd: root,
  mixedModules: true,
});

const optionalDependencies = [
  '@nestjs/microservices',
  '@nestjs/websockets/socket-module',
  'class-transformer/storage',
  'cloudflare:sockets',
  'pg-native',
];
const unexpectedWarnings = [...traced.warnings].filter(
  (warning) => !optionalDependencies.some((dependency) => warning.message.includes(dependency)),
);
if (unexpectedWarnings.length) {
  throw new Error(unexpectedWarnings.map((warning) => warning.message).join('\n'));
}

rmSync(outputRoot, { force: true, recursive: true });
for (const file of traced.fileList) {
  const source = resolve(root, file);
  const destination = resolve(outputRoot, file);
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(source, destination, {
    dereference: false,
    recursive: true,
    verbatimSymlinks: true,
  });
}

cpSync(resolve(root, 'apps/api/prisma/migrations'), resolve(outputRoot, 'apps/api/prisma/migrations'), {
  recursive: true,
});
