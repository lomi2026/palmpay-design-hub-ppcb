import assert from 'node:assert/strict';
import test from 'node:test';
import { DraftsService } from '../dist/content/drafts.service.js';
const user = { id: 'owner', organizationId: 'org', permissions: ['content.edit_own'] };
const draft = { id: 'v1', versionStatus: 'DRAFT', versionNumber: 1, title: 'A tool', summary: 'Summary', body: { websiteUrl: 'https://example.com', vendor: 'Vendor', platforms: ['Web'], limitations: 'Check output', pricingModel: 'Free', scenarios: ['Design'], usageGuide: 'Open the tool' } };
const content = { id: 'c1', organizationId: 'org', ownerId: 'owner', contentType: 'AI_TOOL', status: 'DRAFT', draftVersion: draft, tags: [], categoryId: null };
function service(item = content, tx) {
  return new DraftsService({ content: { findFirst: async ({ where }) => { assert.equal(where.organizationId, 'org'); assert.equal(where.deletedAt, null); return item; } }, $transaction: tx }, { write: async () => {} }, {});
}
test('publication rejects other owners and read-only owners without separate publication permissions', async () => {
  for (const actor of [{ ...user, id: 'other' }, { ...user, permissions: ['content.read'] }]) {
    await assert.rejects(service().publish(actor, 'c1'), (error) => error.getStatus() === 403);
  }
});
test('foreign organization or deleted content is not exposed', async () => {
  await assert.rejects(service(null).publish(user, 'c1'), (error) => error.getStatus() === 404);
});
test('already published content rejects a second publication', async () => {
  await assert.rejects(service({ ...content, draftVersion: null }).publish(user, 'c1'), (error) => error.getStatus() === 409);
});
test('incomplete content is rejected before the publication transaction', async () => {
  await assert.rejects(service({ ...content, draftVersion: { ...draft, body: {} } }, () => assert.fail('Must not publish')).publish(user, 'c1'), (error) => error.getStatus() === 400);
});
test('a changed draft snapshot rejects publication instead of publishing stale fields', async () => {
  await assert.rejects(service(content, async (run) => run({ contentVersion: { updateMany: async ({ where }) => {
    assert.equal(where.versionStatus, 'DRAFT');
    assert.deepEqual(where.body.equals, draft.body);
    return { count: 0 };
  } } })).publish(user, 'c1'), (error) => error.getStatus() === 409);
});
