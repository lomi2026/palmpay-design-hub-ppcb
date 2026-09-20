import assert from 'node:assert/strict';
import test from 'node:test';
import { IdentityService } from '../dist/identity/identity.service.js';

function serviceFixture({ existingStatus = 'ACTIVE', ownedContent = [], replacementOwner = null } = {}) {
  const calls = { updates: [], ownershipUpdates: [], audits: [] };
  const existing = {
    id: 'user-1',
    organizationId: 'organization-1',
    name: 'Content owner',
    status: existingStatus,
  };
  const prisma = {
    user: {
      findFirst: async ({ where } = {}) => where?.id === 'replacement-1' ? replacementOwner : existing,
      update: async ({ data }) => {
        calls.updates.push(data);
        return { ...existing, ...data };
      },
    },
    content: {
      findMany: async () => ownedContent,
      updateMany: async ({ data }) => {
        calls.ownershipUpdates.push(data);
        return { count: ownedContent.length };
      },
    },
    auditLog: {
      create: async ({ data }) => {
        calls.audits.push(data);
        return data;
      },
    },
  };
  prisma.$transaction = async (operation) => operation(prisma);
  const audit = {
    write: async (entry) => {
      calls.audits.push(entry);
    },
  };
  return { service: new IdentityService(prisma, audit), calls };
}

test('disabling a content owner is blocked until ownership is transferred', async () => {
  const ownedContent = [
    { id: 'content-1', title: 'Owned asset', slug: 'owned-asset', status: 'PUBLISHED' },
  ];
  const { service, calls } = serviceFixture({ ownedContent });

  await assert.rejects(
    service.updateUserStatus(
      'organization-1',
      'user-1',
      { status: 'DISABLED' },
      'admin-1',
    ),
    (error) => {
      assert.equal(error.getStatus(), 409);
      assert.deepEqual(error.getResponse(), {
        code: 'CONTENT_OWNERSHIP_TRANSFER_REQUIRED',
        message: 'Select an active replacement owner before disabling this user.',
        ownedContentCount: 1,
        ownedContent,
      });
      return true;
    },
  );
  assert.deepEqual(calls.updates, []);
  assert.deepEqual(calls.ownershipUpdates, []);
  assert.deepEqual(calls.audits, []);
});

test('disabling a content owner transfers ownership in the same transaction', async () => {
  const ownedContent = [
    { id: 'content-1', title: 'Owned asset', slug: 'owned-asset', status: 'PUBLISHED' },
  ];
  const { service, calls } = serviceFixture({
    ownedContent,
    replacementOwner: {
      id: 'replacement-1',
      primaryTeamId: 'team-1',
      userRoles: [
        {
          scopeType: 'ORGANIZATION',
          scopeId: 'organization-1',
          role: {
            rolePermissions: [{ permission: { code: 'content.edit_own' } }],
          },
        },
      ],
    },
  });

  const updated = await service.updateUserStatus(
    'organization-1',
    'user-1',
    { status: 'DISABLED', replacementOwnerId: 'replacement-1' },
    'admin-1',
  );

  assert.equal(updated.status, 'DISABLED');
  assert.deepEqual(calls.ownershipUpdates, [{ ownerId: 'replacement-1' }]);
  assert.equal(calls.audits[0].action, 'content.owner.transfer');
  assert.equal(calls.audits[1].action, 'user.disable');
});

test('disabling a user without owned content writes the required audit event', async () => {
  const { service, calls } = serviceFixture();

  const updated = await service.updateUserStatus(
    'organization-1',
    'user-1',
    { status: 'DISABLED' },
    'admin-1',
  );

  assert.equal(updated.status, 'DISABLED');
  assert.deepEqual(calls.updates, [{ status: 'DISABLED' }]);
  assert.equal(calls.audits.length, 1);
  assert.equal(calls.audits[0].action, 'user.disable');
  assert.equal(calls.audits[0].entityId, 'user-1');
});

test('changing a non-disable status does not require ownership transfer', async () => {
  const { service, calls } = serviceFixture({
    existingStatus: 'INVITED',
    ownedContent: [{ id: 'content-1' }],
  });

  const updated = await service.updateUserStatus(
    'organization-1',
    'user-1',
    { status: 'ACTIVE' },
    'admin-1',
  );

  assert.equal(updated.status, 'ACTIVE');
  assert.equal(calls.audits[0].action, 'user.status.update');
});

test('combined save updates trimmed name and status together', async () => {
  const { service, calls } = serviceFixture();
  const updated = await service.updateUser('organization-1', 'user-1', { name: ' New name ', status: 'INVITED' }, 'admin-1');
  assert.equal(updated.name, 'New name');
  assert.deepEqual(calls.updates, [{ name: 'New name', status: 'INVITED' }]);
  assert.equal(calls.audits[0].action, 'user.update');
});

test('combined save cannot change name when disabling fails ownership validation', async () => {
  const { service, calls } = serviceFixture({ ownedContent: [{ id: 'content-1' }] });
  await assert.rejects(service.updateUser('organization-1', 'user-1', { name: 'New name', status: 'DISABLED' }, 'admin-1'), error => error.getStatus() === 409);
  assert.deepEqual(calls.updates, []);
  assert.deepEqual(calls.audits, []);
});

test('combined save rejects whitespace-only names before any write', async () => {
  const { service, calls } = serviceFixture();
  await assert.rejects(service.updateUser('organization-1', 'user-1', { name: '  ', status: 'ACTIVE' }, 'admin-1'), error => error.getStatus() === 400);
  assert.deepEqual(calls.updates, []);
});

test('profile edits normalize email, validate team scope and audit both changes atomically', async () => {
  const existing = { id: 'u', organizationId: 'org', email: 'old@example.com', primaryTeamId: 'old-team', status: 'ACTIVE' };
  const writes = [], audits = [];
  let duplicate = false, validTeam = true;
  const tx = {
    user: { findFirst: async ({where}) => where.id === 'u' ? existing : duplicate ? {id:'other'} : null, update: async ({data}) => { writes.push(data); return {...existing,...data}; } },
    team: { findFirst: async ({where}) => { assert.equal(where.organizationId,'org'); assert.equal(where.status,'ACTIVE'); return validTeam ? {id:'new-team'} : null; } },
    auditLog: {create:async ({data})=>audits.push(data)},
  };
  const service = new IdentityService({$transaction:async fn=>fn(tx)}, {});
  const input = {name:'Updated',status:'ACTIVE',email:' NEW@EXAMPLE.COM ',teamId:'new-team'};
  const result = await service.updateUser('org','u',input,'admin');
  assert.equal(result.email,'new@example.com'); assert.equal(result.primaryTeamId,'new-team');
  assert.equal(audits[0].afterData.email,'new@example.com'); assert.equal(audits[0].beforeData.email,'old@example.com');
  duplicate=true; await assert.rejects(service.updateUser('org','u',input,'admin'),error=>error.getStatus()===409);
  duplicate=false;validTeam=false;await assert.rejects(service.updateUser('org','u',input,'admin'),error=>error.getStatus()===400);
  assert.equal(writes.length,1);
});
