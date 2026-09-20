import assert from 'node:assert/strict';
import test from 'node:test';
import { notificationTarget } from '../src/app/workspace/notifications/notification-target.ts';
test('retired review notifications never link to removed workflows', () => {
  for (const type of ['review_submitted', 'review_assigned', 'review_approved', 'review_changes_requested', 'unknown']) {
    assert.equal(notificationTarget({ type, relatedReview: { id: 'legacy' } }), null);
  }
});
