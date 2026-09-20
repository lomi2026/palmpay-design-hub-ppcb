import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { PpcbStorageClient, resolvePpcbRuntimeBaseUrl } from '../dist/files/ppcb-storage.client.js';
import { FileStorageService } from '../dist/files/file-storage.service.js';
import {
  importPpcbPublishedFiles,
  resolvePpcbPublishedFileRoot,
} from '../dist/database/ppcb-published-file-import.js';

test('bundled cover path is independent of the API working directory', () => {
  const originalDirectory = process.cwd();
  try {
    process.chdir(fileURLToPath(new URL('../', import.meta.url)));
    assert.equal(
      resolvePpcbPublishedFileRoot(),
      resolve(fileURLToPath(new URL('../../../deployment/ppcb/content-files/', import.meta.url))),
    );
  } finally {
    process.chdir(originalDirectory);
  }
});

test('PPCB storage client uses backend authorization and accepts the documented URL fields', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    if (String(url).endsWith('/files/uploads')) {
      return Response.json({
        fileId: 'managed-file-1',
        uploadUrl: 'https://upload.example.test/one',
        headers: { 'content-type': 'image/png', 'x-upload': 'one' },
      });
    }
    if (String(url).endsWith('/complete')) return Response.json({ completed: true });
    return Response.json({ downloadUrl: 'https://download.example.test/one' });
  };
  try {
    const client = new PpcbStorageClient((key) => ({
      PPCB_MESSAGE_API_URL: 'http://ppcb.test/api/runtime/v1',
      PPCB_MESSAGE_SERVICE_TOKEN: 'runtime-token',
    })[key]);
    const upload = await client.createUpload({ filename: 'cover.png', contentType: 'image/png', sizeBytes: 10 });
    await client.completeUpload(upload.storageKey, 'checksum');
    const download = await client.createDownloadUrl(upload.storageKey);
    assert.equal(upload.storageKey, 'managed-file-1');
    assert.deepEqual(upload.headers, { 'content-type': 'image/png', 'x-upload': 'one' });
    assert.equal(new Headers(upload.headers).get('content-type'), 'image/png');
    assert.equal(download.url, 'https://download.example.test/one');
    assert.equal(calls.length, 3);
    assert.equal(calls[0].init.headers.Authorization, 'Bearer runtime-token');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('PPCB storage client normalizes every documented runtime URL shape', () => {
  assert.equal(resolvePpcbRuntimeBaseUrl('http://ppcb.test'), 'http://ppcb.test/api/runtime/v1');
  assert.equal(resolvePpcbRuntimeBaseUrl('http://ppcb.test/api/runtime/v1/'), 'http://ppcb.test/api/runtime/v1');
  assert.equal(
    resolvePpcbRuntimeBaseUrl('http://ppcb.test/api/runtime/v1/dingtalk-messages'),
    'http://ppcb.test/api/runtime/v1',
  );
  assert.throws(() => resolvePpcbRuntimeBaseUrl('http://ppcb.test/unrelated'), /unsupported path/);
});

test('PPCB storage client appends the file route when the injected URL is the service origin', async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = '';
  globalThis.fetch = async (url) => {
    requestedUrl = String(url);
    return Response.json({ fileId: 'managed-file-2', uploadUrl: 'https://upload.example.test/two' });
  };
  try {
    const client = new PpcbStorageClient((key) => ({
      PPCB_MESSAGE_API_URL: 'http://ppcb.test',
      PPCB_MESSAGE_SERVICE_TOKEN: 'runtime-token',
    })[key]);
    await client.createUpload({ filename: 'cover.png', contentType: 'image/png', sizeBytes: 10 });
    assert.equal(requestedUrl, 'http://ppcb.test/api/runtime/v1/files/uploads');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('PPCB storage uses the generated ASCII object name while the application retains the original filename', async () => {
  let requestedUpload;
  const ppcb = {
    createUpload: async (input) => {
      requestedUpload = input;
      return { storageKey: 'managed-file', url: 'https://upload.example.test/file', headers: {}, expiresInSeconds: 600 };
    },
  };
  const service = new FileStorageService(
    { get: () => 'ppcb' },
    {},
    {},
    ppcb,
  );
  await service.createUploadUrl({
    storageKey: 'organizations/org/uploads/0ec94372-a6d9-4e8f-9e03-c1569fb44ba9.png',
    mimeType: 'image/png',
    originalName: '截屏 2026-09-20.png',
    sizeBytes: 208,
  });
  assert.deepEqual(requestedUpload, {
    filename: '0ec94372-a6d9-4e8f-9e03-c1569fb44ba9.png',
    contentType: 'image/png',
    sizeBytes: 208,
  });
});

test('published cover migration uploads once and is idempotent on restart', async () => {
  const originalFetch = globalThis.fetch;
  const files = new Map();
  const contents = new Map();
  const uploads = [];
  const completions = [];
  const prisma = {
    user: { findFirst: async () => ({ id: 'owner-1', organizationId: 'organization-1' }) },
    content: {
      findUnique: async ({ where }) => {
        if (!contents.has(where.slug)) contents.set(where.slug, { id: `content-${contents.size + 1}`, slug: where.slug, coverFileId: null });
        return contents.get(where.slug);
      },
      update: async ({ where, data }) => {
        const content = [...contents.values()].find((item) => item.id === where.id);
        content.coverFileId = data.coverFileId;
      },
    },
    fileAttachment: {
      findUnique: async ({ where }) => files.get(where.id) ?? null,
      upsert: async ({ where, create, update }) => {
        const value = files.has(where.id) ? { ...files.get(where.id), ...update } : create;
        files.set(where.id, value);
        return value;
      },
    },
  };
  prisma.$transaction = async (operation) => operation(prisma);
  const client = {
    createUpload: async (input) => {
      const storageKey = `managed-${uploads.length + 1}`;
      uploads.push(input);
      return { storageKey, url: `https://upload.example.test/${storageKey}`, headers: { 'Content-Type': input.contentType }, expiresInSeconds: 600 };
    },
    completeUpload: async (...input) => completions.push(input),
  };
  globalThis.fetch = async () => new Response(null, { status: 200 });
  try {
    const options = { client, root: fileURLToPath(new URL('../../../deployment/ppcb/content-files/', import.meta.url)) };
    const first = await importPpcbPublishedFiles(prisma, options);
    const second = await importPpcbPublishedFiles(prisma, options);
    assert.deepEqual(first, { imported: 5, skipped: 0 });
    assert.deepEqual(second, { imported: 0, skipped: 5 });
    assert.equal(uploads.length, 5);
    assert.deepEqual(uploads.map((upload) => upload.filename), [
      'e71508a0-0359-4a63-99ac-5497e5b88c8a.png',
      '6b0a8fb0-c17b-411f-81a4-2d4eb074fdd1.png',
      '44883abc-4128-4f4e-8fdb-0210bf0a377a.png',
      '78d7707b-cfc6-4f52-9894-913dc37c1566.png',
      '42b0e828-5092-4d5c-86c0-210c915afaf6.png',
    ]);
    assert.equal(completions.length, 5);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
