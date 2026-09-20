import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PpcbStorageClient } from '../files/ppcb-storage.client';
import { FileAccessLevel, UploadStatus } from '../generated/prisma/enums';
import { PrismaClient } from '../generated/prisma/client';
import { publishedFileManifest } from './ppcb-data/published-file-manifest';

type StorageClient = Pick<PpcbStorageClient, 'createUpload' | 'completeUpload'>;

const bundledFileRoot = resolve(__dirname, '../../../../deployment/ppcb/content-files');

export function resolvePpcbPublishedFileRoot(root?: string) {
  return root ? resolve(root) : bundledFileRoot;
}

export async function importPpcbPublishedFiles(
  prisma: PrismaClient,
  options: { client?: StorageClient; root?: string } = {},
) {
  if (!options.client && !process.env.PPCB_MESSAGE_SERVICE_TOKEN) {
    return { imported: 0, skipped: publishedFileManifest.length, reason: 'PPCB storage is not active.' };
  }
  const client = options.client ?? new PpcbStorageClient((key) => process.env[key]);
  const root = resolvePpcbPublishedFileRoot(options.root);
  const ownerEmail = process.env.PPCB_OWNER_EMAIL ?? 'lomi2026@126.com';
  const owner = await prisma.user.findFirst({ where: { email: ownerEmail, deletedAt: null } });
  if (!owner) throw new Error(`PPCB file import owner not found: ${ownerEmail}`);

  let imported = 0;
  let skipped = 0;
  for (const entry of publishedFileManifest) {
    const content = await prisma.content.findUnique({ where: { slug: entry.contentSlug } });
    if (!content) throw new Error(`PPCB file import content not found: ${entry.contentSlug}`);
    const existing = await prisma.fileAttachment.findUnique({ where: { id: entry.fileId } });
    if (
      existing?.uploadStatus === UploadStatus.READY &&
      existing.checksum === `sha256:${entry.checksumSha256}` &&
      content.coverFileId === existing.id
    ) {
      skipped += 1;
      continue;
    }

    const bytes = await readFile(resolve(root, entry.fileName));
    const actualChecksum = createHash('sha256').update(bytes).digest('base64');
    if (bytes.length !== entry.sizeBytes || actualChecksum !== entry.checksumSha256) {
      throw new Error(`PPCB bundled file verification failed: ${entry.fileName}`);
    }
    const upload = await client.createUpload({
      filename: entry.fileName,
      contentType: entry.contentType,
      sizeBytes: entry.sizeBytes,
    });
    const uploaded = await fetch(upload.url, {
      method: 'PUT',
      headers: upload.headers,
      body: bytes,
      signal: AbortSignal.timeout(120_000),
    });
    if (!uploaded.ok) throw new Error(`PPCB object upload failed with status ${uploaded.status}.`);
    await client.completeUpload(upload.storageKey, entry.checksumSha256);

    await prisma.$transaction(async (transaction) => {
      await transaction.fileAttachment.upsert({
        where: { id: entry.fileId },
        create: {
          id: entry.fileId,
          organizationId: owner.organizationId,
          originalName: entry.originalName,
          storageKey: upload.storageKey,
          mimeType: entry.contentType,
          extension: 'png',
          sizeBytes: BigInt(entry.sizeBytes),
          checksum: `sha256:${entry.checksumSha256}`,
          accessLevel: FileAccessLevel.RESTRICTED,
          uploadStatus: UploadStatus.READY,
          uploadedById: owner.id,
        },
        update: {
          storageKey: upload.storageKey,
          originalName: entry.originalName,
          mimeType: entry.contentType,
          sizeBytes: BigInt(entry.sizeBytes),
          checksum: `sha256:${entry.checksumSha256}`,
          uploadStatus: UploadStatus.READY,
          deletedAt: null,
        },
      });
      await transaction.content.update({ where: { id: content.id }, data: { coverFileId: entry.fileId } });
    });
    imported += 1;
  }
  return { imported, skipped };
}
