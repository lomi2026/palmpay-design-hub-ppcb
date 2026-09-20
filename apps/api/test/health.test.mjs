import assert from 'node:assert/strict';
import test from 'node:test';
import { HealthController } from '../dist/health/health.controller.js';

test('health is ready only when the database responds', async () => {
  const controller = new HealthController({ $queryRaw: async () => [{ value: 1 }] });
  assert.deepEqual(await controller.getHealth(), { status: 'ok' });
});
test('health reports 503 when the database is unavailable', async () => {
  const controller = new HealthController({ $queryRaw: async () => { throw new Error('offline'); } });
  await assert.rejects(() => controller.getHealth(), (error) => error.status === 503);
});
