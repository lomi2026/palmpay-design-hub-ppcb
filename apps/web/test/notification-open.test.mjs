import assert from 'node:assert/strict';
import test from 'node:test';

import { safeNotificationTarget } from '../src/app/workspace/notifications/notification-open.ts';

test('notification opening accepts only local workspace destinations', () => {
  assert.equal(safeNotificationTarget('/workspace/reviews'), '/workspace/reviews');
  assert.equal(
    safeNotificationTarget('/workspace/submit/content-1?source=notification'),
    '/workspace/submit/content-1?source=notification',
  );
});

test('notification opening rejects external and malformed destinations', () => {
  for (const target of [null, '', 'https://example.com', '//example.com', '/login']) {
    assert.equal(safeNotificationTarget(target), '/workspace/notifications');
  }
});
