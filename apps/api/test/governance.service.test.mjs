import assert from 'node:assert/strict';
import test from 'node:test';

import { GovernanceService } from '../dist/governance/governance.service.js';

const user = { id: 'admin-1', organizationId: 'organization-1' };

function fixture(existingTag = null) {
  const calls = { creates: [], updates: [], audits: [] };
  const prisma = {
    tag: {
      create: async ({ data }) => {
        calls.creates.push(data);
        return { id: 'tag-1', usageCount: 0, ...data };
      },
      findFirst: async () => existingTag,
      update: async ({ data }) => {
        calls.updates.push(data);
        return { ...existingTag, ...data };
      },
    },
  };
  const audit = {
    write: async (entry) => {
      calls.audits.push(entry);
    },
  };
  return { service: new GovernanceService(prisma, audit), calls };
}

test('new tags start active and remain audited', async () => {
  const { service, calls } = fixture();

  const created = await service.createTag(user, { name: '  Regional market  ' });

  assert.equal(created.status, 'ACTIVE');
  assert.equal(created.name, 'Regional market');
  assert.equal(created.normalizedName, 'regional market');
  assert.equal(calls.audits[0].action, 'taxonomy.tag.create');
});

test('a deleted tag can be recreated by restoring its archived record', async () => {
  const deleted = {
    id: 'tag-archived',
    organizationId: user.organizationId,
    name: 'Regional market',
    normalizedName: 'regional market',
    contentTypes: ['DESIGN_ASSET'],
    status: 'DISABLED',
    deletedAt: new Date('2026-09-18T00:00:00.000Z'),
  };
  const { service, calls } = fixture(deleted);

  const restored = await service.createTag(user, {
    name: '  Regional market  ',
    contentTypes: ['AI_SKILL', 'AI_SKILL'],
  });

  assert.equal(restored.id, deleted.id);
  assert.equal(restored.deletedAt, null);
  assert.equal(restored.status, 'ACTIVE');
  assert.deepEqual(calls.updates[0], {
    name: 'Regional market',
    normalizedName: 'regional market',
    contentTypes: ['AI_SKILL'],
    status: 'ACTIVE',
    mergedToId: null,
    deletedAt: null,
  });
  assert.equal(calls.creates.length, 0);
  assert.equal(calls.audits[0].action, 'taxonomy.tag.restore');
  assert.deepEqual(calls.audits[0].beforeData, deleted);
});

test('an existing active tag still cannot be recreated', async () => {
  const { service } = fixture({
    id: 'tag-1',
    organizationId: user.organizationId,
    name: 'Regional market',
    normalizedName: 'regional market',
    deletedAt: null,
  });

  await assert.rejects(
    service.createTag(user, { name: 'regional market' }),
    (error) => error.getStatus() === 409,
  );
});

test('tag status updates persist the requested lifecycle state', async () => {
  const existing = {
    id: 'tag-1',
    organizationId: user.organizationId,
    name: 'Regional market',
    normalizedName: 'regional market',
    status: 'DISABLED',
  };
  const { service, calls } = fixture(existing);

  const updated = await service.updateTag(user, existing.id, { status: 'ACTIVE' });

  assert.equal(updated.status, 'ACTIVE');
  assert.equal(calls.updates[0].status, 'ACTIVE');
  assert.equal(calls.audits[0].action, 'taxonomy.tag.update');
});

test('tag page scopes are persisted and audited; legacy tags default to universal', async () => {
  const { service, calls } = fixture();
  const created = await service.createTag(user, { name: 'Skill', contentTypes: ['AI_SKILL', 'AI_SKILL', 'AI_CASE'] });
  assert.deepEqual(created.contentTypes, ['AI_SKILL', 'AI_CASE']);
  assert.deepEqual(calls.audits[0].afterData.contentTypes, ['AI_SKILL', 'AI_CASE']);
  assert.deepEqual((await service.createTag(user, { name: 'General' })).contentTypes, []);
});
