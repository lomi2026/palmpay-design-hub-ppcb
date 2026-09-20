import assert from 'node:assert/strict';
import test from 'node:test';
import { FilesService } from '../dist/files/files.service.js';

const user = {
  id: 'user-1',
  organizationId: 'organization-1',
  permissions: [],
};

function fixture({ relation = null, coverContent = null, evidence = null } = {}) {
  const calls = { events: [], audits: [], storageDeletes: [] };
  const file = {
    id: 'file-1',
    organizationId: user.organizationId,
    originalName: 'research.pdf',
    storageKey: 'organizations/organization-1/uploads/file-1.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 100n,
    checksum: 'sha256:abc',
    accessLevel: 'RESTRICTED',
    uploadStatus: 'READY',
    uploadedById: user.id,
    deletedAt: null,
  };
  const prisma = {
    fileAttachment: {
      findFirst: async () => file,
      updateMany: async () => ({ count: 1 }),
    },
    attachmentRelation: {
      findFirst: async () => relation,
    },
    content: { findFirst: async () => coverContent },
    caseEvidence: { findFirst: async () => evidence },
    usageEvent: {
      create: async ({ data }) => {
        calls.events.push(data);
        return data;
      },
    },
  };
  prisma.$transaction = async (operation) => operation(prisma);
  const storage = {
    createDownloadUrl: async () => ({ url: 'https://download.example.test/file', expiresInSeconds: 60 }),
    deleteObject: async (storageKey) => calls.storageDeletes.push(storageKey),
  };
  const audit = {
    write: async (entry) => calls.audits.push(entry),
  };
  return { service: new FilesService(prisma, storage, audit), calls };
}

test('restricted file downloads create a usage event and sensitive-access audit', async () => {
  const { service, calls } = fixture();

  const result = await service.createDownloadUrl(user, 'file-1');

  assert.equal(result.url, 'https://download.example.test/file');
  assert.equal(calls.events.length, 1);
  assert.equal(calls.events[0].eventType, 'file_download');
  assert.equal(calls.events[0].metadata.fileId, 'file-1');
  assert.equal(calls.audits.length, 1);
  assert.equal(calls.audits[0].action, 'file.download');
});

test('a file bound to a version or workflow record cannot be deleted', async () => {
  const { service, calls } = fixture({ relation: { id: 'relation-1' } });

  await assert.rejects(
    service.deleteFile(user, 'file-1'),
    (error) => error.getStatus() === 409,
  );
  assert.deepEqual(calls.storageDeletes, []);
});

test('cover and case-evidence references also block physical file deletion', async () => {
  for (const reference of [{ coverContent: { id: 'content-1' } }, { evidence: { id: 'evidence-1' } }]) {
    const { service, calls } = fixture(reference);
    await assert.rejects(
      service.deleteFile(user, 'file-1'),
      (error) => error.getStatus() === 409,
    );
    assert.deepEqual(calls.storageDeletes, []);
  }
});

test('completion retry acknowledges an already verified manageable file without storage writes', async () => {
  const { service, calls } = fixture();
  const result = await service.completeUpload(user, 'file-1');
  assert.equal(result.file.id, 'file-1');
  assert.equal(result.file.uploadStatus, 'READY');
  assert.deepEqual(calls.storageDeletes, []);
});
