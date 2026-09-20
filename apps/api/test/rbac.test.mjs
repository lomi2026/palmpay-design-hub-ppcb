import assert from 'node:assert/strict';
import test from 'node:test';
import { hasEveryPermission } from '../dist/auth/rbac.guard.js';

test('permission checks require every declared permission', () => {
  assert.equal(hasEveryPermission(['content.read', 'user.manage'], ['user.manage']), true);
  assert.equal(hasEveryPermission(['content.read'], ['content.read', 'user.manage']), false);
  assert.equal(hasEveryPermission([], []), true);
});
