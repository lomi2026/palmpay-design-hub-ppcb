import test from 'node:test';
import assert from 'node:assert/strict';
import { ContentService } from '../dist/content/content.service.js';

test('catalog sums real views only for returned content and defaults unviewed items to zero', async () => {
  let scope;
  const service = new ContentService({
    content: { findMany: () => [{ id: 'a', coverFile: null }, { id: 'b', coverFile: null }], count: () => 2 },
    $transaction: async values => values,
    recentView: { groupBy: async query => { scope = query; return [{ contentId: 'a', _sum: { viewCount: 7 } }]; } },
  }, {});
  const result = await service.list({ page: 1, pageSize: 20 });
  assert.deepEqual(scope.where, { contentId: { in: ['a', 'b'] } });
  assert.deepEqual(scope._sum, { viewCount: true });
  assert.deepEqual(result.items.map(item => item.viewCount), [7, 0]);
});
