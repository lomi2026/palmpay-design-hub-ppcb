import assert from 'node:assert/strict';
import test from 'node:test';
import { R2StorageService } from '../dist/files/r2-storage.service.js';

test('R2 storage refuses signing requests without configured credentials', async () => {
  const storage = new R2StorageService({ get: () => undefined });

  await assert.rejects(
    storage.createDownloadUrl('organizations/example/uploads/example.pdf'),
    (error) => error?.getStatus?.() === 503,
  );
});
