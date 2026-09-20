import assert from 'node:assert/strict';
import test from 'node:test';

import {
  filterWorkspaceWarmRoutes,
  shouldPrefetchWorkspaceRoute,
} from '../src/components/workspace/workspace-route-policy.ts';

test('all data-backed workspace destinations bypass prefetch', () => {
  assert.equal(shouldPrefetchWorkspaceRoute('/workspace/recent'), false);
  assert.equal(shouldPrefetchWorkspaceRoute('/workspace/recent?source=nav'), false);
  assert.equal(shouldPrefetchWorkspaceRoute('/workspace/favorites?tab=recent'), false);
  assert.equal(shouldPrefetchWorkspaceRoute('/workspace/favorites?source=nav&tab=recent'), false);
  assert.equal(shouldPrefetchWorkspaceRoute('/workspace/favorites'), false);
  assert.equal(shouldPrefetchWorkspaceRoute('/workspace/favorites?tab=favorites'), false);
  assert.equal(shouldPrefetchWorkspaceRoute('/workspace/ai-skills'), false);
});

test('background route warming excludes all workspace data', () => {
  assert.deepEqual(
    filterWorkspaceWarmRoutes([
      '/workspace',
      '/workspace/recent',
      '/workspace/favorites?tab=recent',
      '/workspace/favorites',
      '/workspace/notifications',
    ]),
    [],
  );
});
