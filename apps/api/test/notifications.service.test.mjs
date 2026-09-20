import assert from 'node:assert/strict';
import test from 'node:test';
import { NotificationsService } from '../dist/notifications/notifications.service.js';
const user = { id: 'user-1', organizationId: 'org-1' };
const active = { receiverId: user.id, NOT: { type: { startsWith: 'review_' } } };
test('list and unread badge both exclude retired reviews and remain receiver-scoped', async () => {
  const service = new NotificationsService({ notification: {
    findMany: async ({ where }) => { assert.deepEqual(where, active); return [{ id: 'notice', type: 'system' }]; },
    count: async ({ where }) => { assert.deepEqual(where, { ...active, readAt: null }); return 5; },
  } });
  const result = await service.list(user);
  assert.equal(result.items.length, 1);
  assert.equal(result.unreadCount, 5);
  assert.deepEqual(await service.unreadCount(user), { unreadCount: 5 });
});
