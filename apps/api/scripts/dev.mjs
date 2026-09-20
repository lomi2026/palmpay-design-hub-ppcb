import { spawn, spawnSync } from 'node:child_process';

const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(pnpm, ['exec', 'prisma', 'generate']);
run(pnpm, ['exec', 'tsc', '-p', 'tsconfig.build.json']);

const compiler = spawn(pnpm, ['exec', 'tsc', '-p', 'tsconfig.build.json', '--watch', '--preserveWatchOutput'], {
  stdio: 'inherit',
});
const server = spawn(process.execPath, ['--watch', 'dist/main.js'], { stdio: 'inherit' });

function stop(exitCode = 0) {
  compiler.kill('SIGTERM');
  server.kill('SIGTERM');
  process.exit(exitCode);
}

process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
compiler.once('exit', (code) => stop(code ?? 1));
server.once('exit', (code) => stop(code ?? 1));
