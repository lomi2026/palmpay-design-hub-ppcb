import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { extname } from 'node:path';
import type { AuthenticatedUser } from '../auth/auth.types';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { AttachmentEntityType, ContentStatus, ContentVisibility, FileAccessLevel, UploadStatus } from '../generated/prisma/enums';
import type { CreateUploadIntentDto } from './files.dto';
import { FileStorageService } from './file-storage.service';
import { AuditService } from '../governance/audit.service';

const allowedMimeTypes = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/csv',
  'text/plain',
]);

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: FileStorageService,
    private readonly audit: AuditService,
  ) {}

  async createUploadIntent(user: AuthenticatedUser, input: CreateUploadIntentDto) {
    if (!allowedMimeTypes.has(input.mimeType)) {
      throw new BadRequestException('Unsupported file type.');
    }

    const extension = this.safeExtension(input.originalName);
    let storageKey = `organizations/${user.organizationId}/uploads/${randomUUID()}${extension ? `.${extension}` : ''}`;
    const preparedUpload = this.storage.isLocal()
      ? undefined
      : await this.storage.createUploadUrl({
          storageKey,
          mimeType: input.mimeType,
          originalName: input.originalName,
          sizeBytes: input.sizeBytes,
        });
    if (preparedUpload && 'storageKey' in preparedUpload && typeof preparedUpload.storageKey === 'string') {
      storageKey = preparedUpload.storageKey;
    }
    const file = await this.prisma.fileAttachment.create({
      data: {
        organizationId: user.organizationId,
        originalName: input.originalName,
        storageKey,
        mimeType: input.mimeType,
        extension: extension || null,
        sizeBytes: BigInt(input.sizeBytes),
        checksum: `sha256:${input.checksumSha256}`,
        accessLevel: FileAccessLevel.RESTRICTED,
        uploadStatus: UploadStatus.UPLOADING,
        uploadedById: user.id,
      },
    });
    const upload =
      preparedUpload ??
      (await this.storage.createUploadUrl({
        fileId: file.id,
        storageKey,
        mimeType: input.mimeType,
        originalName: input.originalName,
        sizeBytes: input.sizeBytes,
      }));

    return {
      file: this.serialize(file),
      upload: {
        url: upload.url,
        method: 'PUT' as const,
        headers: 'headers' in upload ? upload.headers : { 'Content-Type': input.mimeType },
        expiresAt: new Date(Date.now() + upload.expiresInSeconds * 1000).toISOString(),
      },
    };
  }

  async completeUpload(user: AuthenticatedUser, fileId: string) {
    const file = await this.findManageableFile(user, fileId);
    if (file.deletedAt) throw new NotFoundException('File not found.');
    // A retry after a successful verification must not force another binary upload.
    if (file.uploadStatus === UploadStatus.READY) return { file: this.serialize(file) };
    if (file.uploadStatus !== UploadStatus.UPLOADING) {
      throw new ConflictException('Only an uploading file can be completed.');
    }

    const expectedChecksum = file.checksum.replace(/^sha256:/, '');
    let object;
    try {
      if (this.storage.isPpcb()) {
        await this.storage.completeUpload(file.storageKey, expectedChecksum);
        object = { sizeBytes: Number(file.sizeBytes), checksumSha256: expectedChecksum, mimeType: file.mimeType };
      } else {
        object = await this.storage.readObjectMetadata(file.storageKey, file.mimeType);
      }
    } catch {
      throw new BadRequestException('The uploaded object was not found in configured file storage.');
    }

    if (
      object.sizeBytes !== Number(file.sizeBytes) ||
      object.checksumSha256 !== expectedChecksum ||
      object.mimeType !== file.mimeType
    ) {
      await this.prisma.fileAttachment.update({
        where: { id: file.id },
        data: { uploadStatus: UploadStatus.FAILED },
      });
      throw new BadRequestException('The stored object does not match the declared file metadata.');
    }

    const completed = await this.prisma.fileAttachment.update({
      where: { id: file.id },
      data: { uploadStatus: UploadStatus.READY },
    });
    return { file: this.serialize(completed) };
  }

  async createImageUrl(user: AuthenticatedUser, fileId: string) {
    const file = await this.findDownloadableFile(user, fileId);
    if (file.deletedAt || file.uploadStatus !== 'READY' || !['image/png', 'image/jpeg', 'image/webp'].includes(file.mimeType)) throw new NotFoundException('Image was not found.');
    return this.storage.createDownloadUrl({ fileId: file.id, storageKey: file.storageKey });
  }

  async createDownloadUrl(user: AuthenticatedUser, fileId: string) {
    const file = await this.findDownloadableFile(user, fileId);
    if (file.uploadStatus !== UploadStatus.READY || file.deletedAt) {
      throw new ConflictException('This file is not ready to download.');
    }
    const download = await this.storage.createDownloadUrl({ fileId: file.id, storageKey: file.storageKey });
    await this.prisma.usageEvent.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        eventType: 'file_download',
        metadata: {
          fileId: file.id,
          originalName: file.originalName,
          accessLevel: file.accessLevel,
        },
      },
    });
    if (file.accessLevel === FileAccessLevel.RESTRICTED) {
      await this.audit.write({
        organizationId: user.organizationId,
        actorId: user.id,
        action: 'file.download',
        entityType: 'file_attachment',
        entityId: file.id,
        afterData: { accessLevel: file.accessLevel, expiresInSeconds: download.expiresInSeconds },
      });
    }
    return {
      url: download.url,
      expiresAt: new Date(Date.now() + download.expiresInSeconds * 1000).toISOString(),
    };
  }

  async deleteFile(user: AuthenticatedUser, fileId: string) {
    const file = await this.findManageableFile(user, fileId);
    if (file.deletedAt) return { deleted: true };
    const deletedAt = new Date();
    await this.prisma.$transaction(
      async (tx) => {
        const [relation, coverContent, caseEvidence] = await Promise.all([
          tx.attachmentRelation.findFirst({
            where: { fileId: file.id },
            select: { id: true },
          }),
          tx.content.findFirst({
            where: { coverFileId: file.id, deletedAt: null },
            select: { id: true },
          }),
          tx.caseEvidence.findFirst({
            where: { attachmentId: file.id },
            select: { id: true },
          }),
        ]);
        if (relation || coverContent || caseEvidence) {
          throw new ConflictException(
            'Detach this file from every content version, cover or evidence record before deleting it.',
          );
        }
        const deleted = await tx.fileAttachment.updateMany({
          where: { id: file.id, organizationId: user.organizationId, deletedAt: null },
          data: { uploadStatus: UploadStatus.DELETED, deletedAt },
        });
        if (deleted.count !== 1) {
          throw new ConflictException('This file changed before it could be deleted.');
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    try {
      await this.storage.deleteObject(file.storageKey);
    } catch (error: unknown) {
      await this.prisma.fileAttachment.updateMany({
        where: { id: file.id, uploadStatus: UploadStatus.DELETED, deletedAt },
        data: { uploadStatus: file.uploadStatus, deletedAt: null },
      });
      throw error;
    }
    return { deleted: true };
  }

  async uploadLocalObject(fileId: string, token: string, body: IncomingMessage) {
    const file = await this.prisma.fileAttachment.findUnique({ where: { id: fileId } });
    if (!file || file.deletedAt || file.uploadStatus !== UploadStatus.UPLOADING) {
      throw new NotFoundException("An uploading file was not found.");
    }
    const mimeType = Array.isArray(body.headers["content-type"])
      ? body.headers["content-type"][0]
      : body.headers["content-type"];
    if (mimeType !== file.mimeType) {
      throw new BadRequestException("The uploaded file type does not match the upload intent.");
    }
    await this.storage.writeLocalObject({
      fileId,
      storageKey: file.storageKey,
      token,
      mimeType: file.mimeType,
      expectedSizeBytes: Number(file.sizeBytes),
      body,
    });
  }

  async readLocalObject(fileId: string, token: string) {
    const file = await this.prisma.fileAttachment.findUnique({ where: { id: fileId } });
    if (!file || file.deletedAt || file.uploadStatus !== UploadStatus.READY) {
      throw new NotFoundException("A ready file was not found.");
    }
    const bytes = await this.storage.readLocalObject({ fileId, storageKey: file.storageKey, token });
    return { bytes, mimeType: file.mimeType, originalName: file.originalName };
  }

  private async findManageableFile(user: AuthenticatedUser, fileId: string) {
    const file = await this.prisma.fileAttachment.findFirst({
      where: { id: fileId, organizationId: user.organizationId },
    });
    if (!file) throw new NotFoundException('File not found.');
    const canManageAll = user.permissions.includes('content.edit_all');
    if (file.uploadedById !== user.id && !canManageAll) {
      throw new ForbiddenException('You cannot access this file.');
    }
    return file;
  }

  private async findDownloadableFile(user: AuthenticatedUser, fileId: string) {
    const file = await this.prisma.fileAttachment.findFirst({
      where: { id: fileId, organizationId: user.organizationId },
    });
    if (!file) throw new NotFoundException('File not found.');
    if (file.uploadedById === user.id || user.permissions.includes('content.edit_all')) return file;

    const relations = await this.prisma.attachmentRelation.findMany({
      where: {
        fileId,
        entityType: { in: [AttachmentEntityType.VERSION, AttachmentEntityType.CONTENT] },
      },
      select: { entityType: true, entityId: true },
    });
    const versionIds = relations
      .filter((relation) => relation.entityType === AttachmentEntityType.VERSION)
      .map((relation) => relation.entityId);
    const contentIds = relations
      .filter((relation) => relation.entityType === AttachmentEntityType.CONTENT)
      .map((relation) => relation.entityId);
    if (!versionIds.length && !contentIds.length)
      throw new ForbiddenException('You cannot access this file.');
    const readableContent = await this.prisma.content.findFirst({
      where: {
        organizationId: user.organizationId,
        status: ContentStatus.PUBLISHED,
        deletedAt: null,
        OR: [
          ...(versionIds.length ? [{ currentVersionId: { in: versionIds } }] : []),
          ...(contentIds.length ? [{ id: { in: contentIds } }] : []),
        ],
        AND: [{
          OR: [
          { visibility: ContentVisibility.PUBLIC },
          { visibility: ContentVisibility.ORGANIZATION },
          ...(user.primaryTeamId
            ? [{ visibility: ContentVisibility.TEAM, teamId: user.primaryTeamId }]
            : []),
          { visibility: ContentVisibility.RESTRICTED, ownerId: user.id },
          ],
        }],
      },
      select: { id: true },
    });
    if (!readableContent) throw new ForbiddenException('You cannot access this file.');
    return file;
  }

  private safeExtension(originalName: string) {
    const value = extname(originalName).replace('.', '').toLowerCase();
    return /^[a-z0-9]{1,12}$/.test(value) ? value : '';
  }

  private serialize<T extends { sizeBytes: bigint }>(file: T) {
    return { ...file, sizeBytes: file.sizeBytes.toString() };
  }
}
