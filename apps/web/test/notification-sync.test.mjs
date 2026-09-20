import assert from 'node:assert/strict';
import test from 'node:test';

import {
  NOTIFICATION_SYNC_INITIAL_DELAY_MS,
  NOTIFICATION_SYNC_INTERVAL_MS,
  notificationRetryDelay,
} from '../src/components/workspace/notification-sync.ts';

test('notification polling remains low frequency during normal operation', () => {
  assert.equal(NOTIFICATION_SYNC_INITIAL_DELAY_MS, 5_000);
  assert.equal(NOTIFICATION_SYNC_INTERVAL_MS, 30_000);
});

test('notification polling retries transient failures with a bounded backoff', () => {
  assert.deepEqual(
    [1, 2, 3, 4, 5].map(notificationRetryDelay),
    [5_000, 15_000, 30_000, 60_000, 60_000],
  );
});
