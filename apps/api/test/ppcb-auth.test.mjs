import assert from 'node:assert/strict';
import test from 'node:test';
import { PpcbAuthAdapter, parsePpcbPermissions } from '../dist/auth/ppcb-auth.adapter.js';
import { AuthService } from '../dist/auth/auth.service.js';
const config = { AUTH_MODE: 'ppcb', PPCB_INTERNAL_SECRET: 'runtime-only-key', PPCB_APPLICATION_ID: 'hub', PPCB_OWNER_USER_ID: 'employee-owner', PPCB_OWNER_EMAIL: 'owner@example.test' };
const adapter = new PpcbAuthAdapter({ get: (key) => config[key] });
const headers = { 'x-hub-internal-secret': config.PPCB_INTERNAL_SECRET, 'x-ppcb-user-id': 'employee-owner', 'x-ppcb-corp-id': 'company', 'x-ppcb-application-id': 'hub', 'x-ppcb-user-name': encodeURIComponent('设计管理员'), 'x-ppcb-app-role': 'Owner', 'x-ppcb-app-permissions': 'content.read,user.manage' };
test('PPCB rejects unauthenticated and forged internal requests', () => {
  for (const changes of [{ 'x-hub-internal-secret': '' }, { 'x-hub-internal-secret': '界'.repeat(16) }, { 'x-ppcb-user-id': '' }, { 'x-ppcb-corp-id': '' }, { 'x-ppcb-application-id': 'another-app' }, { 'x-ppcb-app-role': 'PlatformAdmin' }]) {
    assert.throws(() => adapter.authenticate({ headers: { ...headers, ...changes } }), (error) => error.status === 401);
  }
});
test('PPCB decodes verified identity and only maps the configured owner account', () => {
  const identity = adapter.authenticate({ headers });
  assert.equal(identity.name, '设计管理员'); assert.equal(identity.email, 'owner@example.test');
  const other = adapter.authenticate({ headers: { ...headers, 'x-ppcb-user-id': 'another-employee' } });
  assert.match(other.email, /@identity.ppcb.invalid$/); assert.equal(other.ppcb.owner, false);
});
test('PPCB permission parser denies absent, malformed and non-string permissions', () => {
  assert.deepEqual(parsePpcbPermissions(''), []);
  assert.deepEqual(parsePpcbPermissions('["content.read", "content.read"]'), ['content.read']);
  for (const input of ['[', '[1]', 'content.read,*']) assert.throws(() => parsePpcbPermissions(input));
});
function serviceFor(status = 'ACTIVE', permissions = ['content.read', 'user.manage']) {
  const user = { id: 'user', employeeId: 'ppcb:employee', organizationId: 'org', primaryTeamId: 'team', name: 'Member', email: 'member@example.test', status, userRoles: [{ scopeType: 'ORGANIZATION', scopeId: 'org', role: { code: 'admin', rolePermissions: permissions.map((code) => ({ permission: { code } })) } }] };
  const prisma = { organization: { findUnique: async () => ({ id: 'org', status: 'ACTIVE' }) }, user: { findUnique: async () => user } };
  return new AuthService(prisma, { get: () => undefined });
}
const identity = { email: 'member@example.test', employeeId: 'ppcb:employee', ppcb: { owner: false, permissions: ['content.read'] } };
test('PPCB grants are intersected with stored scoped permissions', async () => {
  const user = await serviceFor().resolveUser(identity);
  assert.deepEqual(user.permissions, ['content.read']);
  assert.deepEqual(user.permissionScopes.map((x) => x.code), ['content.read']);
  assert.deepEqual((await serviceFor().resolveUser({ ...identity, ppcb: { owner: false, permissions: [] } })).permissions, []);
});
test('PPCB rejects disabled accounts and mismatched employee identities', async () => {
  await assert.rejects(() => serviceFor('DISABLED').resolveUser(identity), (error) => error.status === 403);
  await assert.rejects(() => serviceFor().resolveUser({ ...identity, employeeId: 'someone-else' }), (error) => error.status === 403);
});

import { createDatabaseAdapter } from '../dist/database/connection.js';
test('PPCB database adapter requires an isolated validated schema', () => {
  const saved = { ...process.env };
  try {
    process.env.AUTH_MODE = 'ppcb'; delete process.env.PPCB_DB_SCHEMA; delete process.env.PPCB_DATABASE_SCHEMA;
    assert.throws(() => createDatabaseAdapter('postgresql://example.test/db'), /schema is required/);
    process.env.PPCB_DB_SCHEMA = 'public';
    assert.throws(() => createDatabaseAdapter('postgresql://example.test/db'), /Invalid PPCB/);
    process.env.PPCB_DB_SCHEMA = 'test_app_hub';
    assert.doesNotThrow(() => createDatabaseAdapter('postgresql://example.test/db?sslmode=require'));
  } finally {
    for (const key of ['AUTH_MODE', 'PPCB_DB_SCHEMA', 'PPCB_DATABASE_SCHEMA']) {
      if (saved[key] === undefined) delete process.env[key]; else process.env[key] = saved[key];
    }
  }
});
