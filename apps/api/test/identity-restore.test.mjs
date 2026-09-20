import assert from 'node:assert/strict';
import { test } from 'node:test';
import { IdentityService } from '../dist/identity/identity.service.js';

function fixture(existing) {
  const events = [];
  const tx = {
    user: {
      findFirst: async () => existing,
      create: async ({ data }) => { events.push(['create', data]); return { id: 'new', ...data }; },
      update: async ({ where, data }) => { events.push(['restore', where, data]); return { id: where.id, ...data }; },
    },
    userRole: { deleteMany: async args => events.push(['clearRoles', args]) },
    team: { findFirst: async () => ({ id: 'team' }) },
    role: { findFirst: async () => ({ id: 'role' }) },
    auditLog: { create: async ({ data }) => events.push(['audit', data.action]) },
  };
  return { service: new IdentityService({ $transaction: fn => fn(tx) }, {}), events, tx };
}
const input = { name: ' New name ', email: 'USER@example.com', teamId: 'team', roleId: 'role' };
test('deleted email restores the same account with freshly selected access', async () => {
  const { service, events } = fixture({ id: 'old', deletedAt: new Date() });
  const result = await service.createUser('org', input, 'admin');
  assert.equal(result.id, 'old'); assert.equal(result.deletedAt, null);
  assert.equal(result.status, 'ACTIVE'); assert.equal(result.name, 'New name');
  assert.equal(result.email, 'user@example.com'); assert.equal(result.primaryTeamId, 'team');
  assert.deepEqual(result.userRoles.create, {roleId:'role',scopeType:'ORGANIZATION',scopeId:'org',createdBy:'admin'});
  assert.deepEqual(events.map(e => e[0]), ['clearRoles', 'restore', 'audit']);
  assert.equal(events[2][1], 'user.restore');
});
test('existing active email is still rejected without changes', async () => {
  const { service, events } = fixture({ id: 'old', deletedAt: null });
  await assert.rejects(service.createUser('org', input, 'admin'), /邮箱已存在/);
  assert.equal(events.length, 0);
});
test('invalid team cannot restore a deleted user', async () => {
  const { service, events, tx } = fixture({ id: 'old', deletedAt: new Date() });
  tx.team.findFirst = async () => null;
  await assert.rejects(service.createUser('org', input, 'admin'), /团队/);
  assert.equal(events.length, 0);
});
test('new email still creates a new user', async () => {
  const { service, events } = fixture(null);
  assert.equal((await service.createUser('org', input, 'admin')).id, 'new');
  assert.deepEqual(events.map(e => e[0]), ['create', 'audit']);
});
test('name edit changes only the name and records an audit entry', async () => {
  const {service,events}=fixture({id:'old',name:'Before'});
  await service.updateUserName('org','old',{name:' After '},'admin');
  assert.deepEqual(events[0],['restore',{id:'old'},{name:'After'}]);
  assert.deepEqual(events[1],['audit','user.update']);
});
test('blank names and deleted or unavailable accounts cannot be edited', async () => {
  const {service,events}=fixture(null);
  await assert.rejects(service.updateUserName('org','old',{name:'   '},'admin'),/姓名/);
  await assert.rejects(service.updateUserName('org','old',{name:'After'},'admin'),/不存在或已删除/);
  assert.equal(events.length,0);
});
