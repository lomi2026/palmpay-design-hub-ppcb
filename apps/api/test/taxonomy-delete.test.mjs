import assert from 'node:assert/strict';
import test from 'node:test';
import { GovernanceService } from '../dist/governance/governance.service.js';

const user = { id: 'admin', organizationId: 'org' };
for (const kind of ['category', 'tag']) {
  test(`${kind} deletion is scoped, soft and audited without removing content associations`, async () => {
    const writes = []; const audits = [];
    const delegate = {
      findFirst: async ({ where }) => { assert.deepEqual(where, { id: 'item', organizationId: 'org', deletedAt: null }); return { id: 'item', status: 'ACTIVE' }; },
      count: async () => 0,
      update: async (input) => { writes.push(input); return { id: 'item', ...input.data }; },
    };
    const service = new GovernanceService({ [kind]: delegate }, { write: async (input) => audits.push(input) });
    await service[kind === 'category' ? 'deleteCategory' : 'deleteTag'](user, 'item');
    assert.equal(writes.length, 1);
    assert.equal(writes[0].data.status, 'DISABLED');
    assert.ok(writes[0].data.deletedAt instanceof Date);
    assert.equal(audits[0].action, `taxonomy.${kind}.delete`);
    assert.equal(audits[0].organizationId, 'org');
  });
  test(`${kind} deletion rejects missing, deleted or other-organization records`, async () => {
    const service = new GovernanceService({ [kind]: { findFirst: async () => null } }, {});
    await assert.rejects(service[kind === 'category' ? 'deleteCategory' : 'deleteTag'](user, 'item'), (error) => error.getStatus() === 404);
  });
}
test('category deletion protects remaining child categories', async () => {
  const service = new GovernanceService({ category: { findFirst: async () => ({ id: 'item' }), count: async () => 1 } }, {});
  await assert.rejects(service.deleteCategory(user, 'item'), (error) => error.getStatus() === 409);
});
