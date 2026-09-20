import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { AuthenticatedUser } from '../auth/auth.types';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '../generated/prisma/client';
import {
  AttachmentEntityType,
  AttachmentUsageType,
  ContentStatus,
  UploadStatus,
} from '../generated/prisma/enums';
import type { AutosaveDraftDto, CreateDraftDto } from './drafts.dto';
import { AuditService } from '../governance/audit.service';
import { EngagementService } from '../engagement/engagement.service';
import { assertContentComplete } from './content-completeness';
import { upsertPublishedContentDetail } from './content-detail-projection';
import { projectTaxonomy, taxonomySnapshot, validateTaxonomy, withTaxonomy, type TaxonomySelection } from './content-taxonomy';

@Injectable()
export class DraftsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly engagement: EngagementService,
  ) {}

  async listMine(user: AuthenticatedUser) {
    const items = await this.prisma.content.findMany({
      where: {
        organizationId: user.organizationId,
        ownerId: user.id,
        deletedAt: null,
      },
      select: {
        id: true,
        contentType: true,
        title: true,
        slug: true,
        summary: true,
        status: true,
        visibility: true,
        verificationStatus: true,
        updatedAt: true,
        publishedAt: true,
        category: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
        currentVersion: {
          select: { id: true, versionNumber: true, versionStatus: true, versionLabel: true },
        },
        draftVersion: {
          select: { id: true, versionNumber: true, versionStatus: true, versionLabel: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return { items, total: items.length };
  }

  async create(user: AuthenticatedUser, input: CreateDraftDto) {
    const teamId = input.teamId ?? user.primaryTeamId;
    if (!teamId) throw new BadRequestException('Select a team before creating content.');
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, organizationId: user.organizationId, status: 'ACTIVE' },
      select: { id: true },
    });
    if (!team)
      throw new BadRequestException('The selected team is not available in your organization.');
    const draft = await this.prisma.$transaction(async (tx) => {
      const taxonomy = { categoryId: input.categoryId ?? null, tagIds: input.tagIds ?? [] };
      await validateTaxonomy(tx, user.organizationId, input.contentType, taxonomy);
      const content = await tx.content.create({
        data: {
          organizationId: user.organizationId,
          contentType: input.contentType,
          title: input.title,
          summary: input.summary,
          slug: `draft-${randomUUID()}`,
          categoryId: input.categoryId,
          ownerId: user.id,
          teamId,
          status: ContentStatus.DRAFT,
          visibility: input.visibility,
          createdById: user.id,
        },
      });
      const version = await tx.contentVersion.create({
        data: {
          contentId: content.id,
          versionNumber: 1,
          versionLabel: input.versionLabel,
          versionStatus: ContentStatus.DRAFT,
          title: input.title,
          summary: input.summary,
          body: withTaxonomy(input.body, taxonomy),
          createdById: user.id,
        },
      });
      await projectTaxonomy(tx, content.id, user.id, taxonomy);
      return tx.content.update({
        where: { id: content.id },
        data: { draftVersionId: version.id },
        include: { draftVersion: true },
      });
    });
    await this.audit.write({
      organizationId: user.organizationId,
      actorId: user.id,
      action: 'content.create',
      entityType: 'content',
      entityId: draft.id,
      afterData: draft,
    });
    await this.engagement.recordEvent(user, 'content_create', draft.id);
    return this.serialize(draft);
  }

  async createFromPublished(user: AuthenticatedUser, contentId: string) {
    const content = await this.prisma.content.findFirst({
      where: { id: contentId, organizationId: user.organizationId, deletedAt: null },
      include: { currentVersion: true, draftVersion: true, tags: true },
    });
    if (!content) throw new NotFoundException('Content was not found.');
    if (!this.canEditContent(user, content.ownerId)) {
      throw new ForbiddenException('You cannot edit this content.');
    }
    if (!new Set<ContentStatus>([ContentStatus.PUBLISHED, ContentStatus.ARCHIVED, ContentStatus.UNPUBLISHED]).has(content.status) || !content.currentVersion) {
      throw new ConflictException(
        'Only published, archived or unpublished content with a current version can create an edit draft.',
      );
    }
    const publishedVersion = content.currentVersion;
    const publishedVersionId = content.currentVersionId;
    if (!publishedVersionId)
      throw new ConflictException('Published content is missing its current version reference.');
    if (content.draftVersion) {
      if (
        new Set<ContentStatus>([ContentStatus.DRAFT]).has(
          content.draftVersion.versionStatus,
        )
      ) {
        return this.serialize(content);
      }
      throw new ConflictException(
        'This content already has a draft version.',
      );
    }

    const draft = await this.prisma.$transaction(async (tx) => {
      const latestVersion = await tx.contentVersion.findFirst({
        where: { contentId: content.id },
        orderBy: { versionNumber: 'desc' },
        select: { versionNumber: true },
      });
      const version = await tx.contentVersion.create({
        data: {
          contentId: content.id,
          versionNumber: (latestVersion?.versionNumber ?? 0) + 1,
          versionStatus: ContentStatus.DRAFT,
          baseVersionId: publishedVersionId,
          title: publishedVersion.title,
          summary: publishedVersion.summary,
          body: withTaxonomy(publishedVersion.body, taxonomySnapshot(publishedVersion.body, content)),
          createdById: user.id,
        },
      });
      const attachments = await tx.attachmentRelation.findMany({
        where: { entityType: AttachmentEntityType.VERSION, entityId: publishedVersionId },
        select: { fileId: true, usageType: true, sortOrder: true },
      });
      if (attachments.length) {
        await tx.attachmentRelation.createMany({
          data: attachments.map((attachment) => ({
            ...attachment,
            entityType: AttachmentEntityType.VERSION,
            entityId: version.id,
          })),
        });
      }
      return tx.content.update({
        where: { id: content.id },
        data: { draftVersionId: version.id },
        include: { draftVersion: true },
      });
    });
    return this.serialize(draft);
  }

  async changeAttachment(user: AuthenticatedUser, contentId: string, fileId: string, attach: boolean) {
    const content = await this.findEditableDraft(user, contentId);
    return this.prisma.$transaction(async (tx) => {
      const locked = await tx.contentVersion.updateMany({ where: { id: content.draftVersion!.id, versionStatus: ContentStatus.DRAFT }, data: { versionStatus: ContentStatus.DRAFT } });
      if (!locked.count) throw new ConflictException('The draft changed. Reload before editing attachments.');
      const where = { entityType: AttachmentEntityType.VERSION, entityId: content.draftVersion!.id, usageType: AttachmentUsageType.ATTACHMENT, fileId };
      if (!attach) { await tx.attachmentRelation.deleteMany({ where }); return { saved: true }; }
      const file = await tx.fileAttachment.findFirst({ where: { id: fileId, organizationId: user.organizationId, uploadStatus: UploadStatus.READY, deletedAt: null } });
      if (!file || (file.uploadedById !== user.id && !user.permissions.includes('content.edit_all'))) throw new BadRequestException('The attachment must be a ready file you can manage.');
      if (!await tx.attachmentRelation.findFirst({ where })) await tx.attachmentRelation.create({ data: where });
      return { saved: true };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async setCover(user: AuthenticatedUser, contentId: string, fileId: string | null) {
    const content = await this.findEditableDraft(user, contentId);
    if (!['DESIGN_ASSET', 'AI_TOOL'].includes(content.contentType)) throw new BadRequestException('Only design assets and AI tools support a cover.');
    return this.prisma.$transaction(async (tx) => {
      // Lock the draft against concurrent publication before changing its cover.
      const editable = await tx.contentVersion.updateMany({ where: { id: content.draftVersion!.id, versionStatus: 'DRAFT' }, data: { versionStatus: 'DRAFT' } });
      if (editable.count !== 1) throw new ConflictException('Draft has already been published.');
      if (fileId) {
        const file = await tx.fileAttachment.findFirst({ where: { id: fileId, organizationId: user.organizationId, deletedAt: null, uploadStatus: 'READY' } });
        if (!file || !['image/png', 'image/jpeg', 'image/webp'].includes(file.mimeType) || file.sizeBytes > BigInt(5 * 1024 * 1024)) throw new BadRequestException('请选择不超过 5 MB 的 PNG、JPG 或 WebP 图片。');
        if (file.uploadedById !== user.id && !user.permissions.includes('content.edit_all')) throw new ForbiddenException('You cannot use this file.');
      }
      await tx.attachmentRelation.deleteMany({ where: { entityType: AttachmentEntityType.VERSION, entityId: content.draftVersion!.id, usageType: AttachmentUsageType.COVER } });
      if (fileId) await tx.attachmentRelation.create({ data: { entityType: AttachmentEntityType.VERSION, entityId: content.draftVersion!.id, usageType: AttachmentUsageType.COVER, fileId } });
      return { saved: true };
    });
  }

  async delete(user: AuthenticatedUser, contentId: string) {
    return this.prisma.$transaction(async (tx) => {
      const content = await tx.content.findFirst({
        where: { id: contentId, organizationId: user.organizationId, deletedAt: null },
      });
      if (!content) throw new NotFoundException('Content was not found.');
      if (!this.canEditContent(user, content.ownerId)) {
        throw new ForbiddenException('You cannot delete this content.');
      }
      const deletedAt = new Date();
      const result = await tx.content.updateMany({
        where: { id: content.id, organizationId: user.organizationId, ownerId: content.ownerId, deletedAt: null },
        data: { deletedAt },
      });
      if (result.count !== 1) throw new ConflictException('Content changed; refresh and try again.');
      await tx.contentRelation.deleteMany({ where: { OR: [{ sourceContentId: content.id }, { targetContentId: content.id }] } });
      await tx.favorite.deleteMany({ where: { contentId: content.id } });
      await tx.recentView.deleteMany({ where: { contentId: content.id } });
      await tx.contentTag.deleteMany({ where: { contentId: content.id } });
      await tx.usageEvent.deleteMany({ where: { organizationId: user.organizationId, OR: [{ contentId: content.id }, { metadata: { path: ['projectContentId'], equals: content.id } }] } });
      await tx.auditLog.create({ data: {
        organizationId: user.organizationId, actorId: user.id,
        action: 'content.delete', entityType: 'content', entityId: content.id,
        beforeData: { title: content.title, status: content.status },
        afterData: { deletedAt: deletedAt.toISOString() },
      } });
      return { id: content.id, deleted: true };
    });
  }

  async publish(user: AuthenticatedUser, contentId: string, input?: AutosaveDraftDto) {
    if (input && Object.keys(input).length) await this.autosave(user, contentId, input);
    const content = await this.prisma.content.findFirst({
      where: { id: contentId, organizationId: user.organizationId, deletedAt: null },
      include: { draftVersion: true, tags: true },
    });
    if (!content) throw new NotFoundException('Content was not found.');
    if (!content.draftVersion)
      throw new ConflictException('This content does not have a version awaiting publication.');
    if (!this.canEditContent(user, content.ownerId)) throw new ForbiddenException('You cannot publish this content.');
    if (content.draftVersion.versionStatus !== ContentStatus.DRAFT) {
      throw new ConflictException('Only a draft version can be published.');
    }
    if (
      !new Set<ContentStatus>([ContentStatus.DRAFT, ContentStatus.PUBLISHED, ContentStatus.ARCHIVED, ContentStatus.UNPUBLISHED]).has(content.status)
    ) {
      throw new ConflictException('This content cannot be published in its current state.');
    }
    assertContentComplete({
      contentType: content.contentType,
      title: content.draftVersion.title,
      summary: content.draftVersion.summary,
      ownerId: content.ownerId,
      versionNumber: content.draftVersion.versionNumber,
      body: content.draftVersion.body,
    });

    const now = new Date();
    const published = await this.prisma.$transaction(async (tx) => {
      const promoted = await tx.contentVersion.updateMany({
        where: {
          id: content.draftVersion!.id,
          contentId: content.id,
          versionStatus: ContentStatus.DRAFT,
          title: content.draftVersion!.title,
          summary: content.draftVersion!.summary,
          body: { equals: content.draftVersion!.body as Prisma.InputJsonValue },
        },
        data: { versionStatus: ContentStatus.PUBLISHED, publishedAt: now },
      });
      if (promoted.count !== 1)
        throw new ConflictException('This draft version is no longer awaiting publication.');

      await upsertPublishedContentDetail(
        tx,
        content.contentType,
        content.id,
        content.organizationId,
        content.draftVersion!.body,
      );

      // Promote the validated draft snapshot atomically with its catalog associations.
      const taxonomy = taxonomySnapshot(content.draftVersion!.body, content);
      await validateTaxonomy(tx, user.organizationId, content.contentType, taxonomy, taxonomy);
      await projectTaxonomy(tx, content.id, user.id, taxonomy);

      const cover = await tx.attachmentRelation.findFirst({ where: { entityType: AttachmentEntityType.VERSION, entityId: content.draftVersion!.id, usageType: AttachmentUsageType.COVER } });
      const published = await tx.content.updateMany({
        where: { id: content.id, draftVersionId: content.draftVersion!.id, deletedAt: null },
        data: {
          currentVersionId: content.draftVersion!.id,
          draftVersionId: null,
          status: ContentStatus.PUBLISHED,
          archivedAt: null,
          title: content.draftVersion!.title,
          summary: content.draftVersion!.summary,
          publishedAt: now,
          coverFileId: cover?.fileId ?? null,
        },
      });
      if (published.count !== 1)
        throw new ConflictException(
          'This content version was changed before it could be published.',
        );

      return tx.content.findUniqueOrThrow({
        where: { id: content.id },
        include: { currentVersion: true },
      });
    });
    await this.audit.write({
      organizationId: user.organizationId,
      actorId: user.id,
      action: 'content.publish',
      entityType: 'content',
      entityId: content.id,
      beforeData: { status: content.status, draftVersionId: content.draftVersion.id },
      afterData: published,
    });
    return published;
  }

  async unpublish(user: AuthenticatedUser, contentId: string) {
    const content = await this.findLifecycleContent(user, contentId);
    if (content.status !== ContentStatus.PUBLISHED) {
      throw new ConflictException('Only published content can be unpublished.');
    }
    const updated = await this.prisma.content.update({
      where: { id: content.id },
      data: { status: ContentStatus.UNPUBLISHED },
    });
    await this.audit.write({
      organizationId: user.organizationId,
      actorId: user.id,
      action: 'content.unpublish',
      entityType: 'content',
      entityId: content.id,
      beforeData: { status: content.status },
      afterData: updated,
    });
    return updated;
  }

  async archive(user: AuthenticatedUser, contentId: string) {
    const content = await this.findLifecycleContent(user, contentId, true);
    if (
      !new Set<ContentStatus>([ContentStatus.PUBLISHED, ContentStatus.UNPUBLISHED]).has(
        content.status,
      )
    ) {
      throw new ConflictException('Only published or unpublished content can be archived.');
    }
    const updated = await this.prisma.content.update({
      where: { id: content.id },
      data: { status: ContentStatus.ARCHIVED, archivedAt: new Date() },
    });
    await this.audit.write({
      organizationId: user.organizationId,
      actorId: user.id,
      action: 'content.archive',
      entityType: 'content',
      entityId: content.id,
      beforeData: { status: content.status },
      afterData: updated,
    });
    return updated;
  }

  async autosave(user: AuthenticatedUser, contentId: string, input: AutosaveDraftDto) {
    const content = await this.findEditableDraft(user, contentId);
    const draft = content.draftVersion;
    if (!draft)
      throw new ConflictException('This content does not have an editable draft version.');

    const [updatedContent, updatedVersion] = await this.prisma.$transaction(async (tx) => {
      const previous = taxonomySnapshot(draft.body, content);
      const taxonomy = {
        categoryId: input.categoryId === undefined ? previous.categoryId : input.categoryId,
        tagIds: input.tagIds ?? previous.tagIds,
      };
      await validateTaxonomy(tx, user.organizationId, content.contentType, taxonomy, previous);
      const changed = await tx.contentVersion.updateMany({
        where: { id: draft.id, versionStatus: { in: [ContentStatus.DRAFT] } },
        data: {
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.summary !== undefined ? { summary: input.summary } : {}),
          ...(input.versionLabel !== undefined ? { versionLabel: input.versionLabel } : {}),
          ...(input.changeSummary !== undefined ? { changeSummary: input.changeSummary } : {}),
          body: withTaxonomy(input.body ?? draft.body, taxonomy),
        },
      });
      if (changed.count !== 1) throw new ConflictException('此草稿已发布，请刷新后重试。');
      if (content.status !== ContentStatus.PUBLISHED) await projectTaxonomy(tx, content.id, user.id, taxonomy);
      const updatedContent = await tx.content.update({
        where: { id: content.id },
        data: {
          ...(content.status === ContentStatus.PUBLISHED
            ? {}
            : {
                ...(input.title !== undefined ? { title: input.title } : {}),
                ...(input.summary !== undefined ? { summary: input.summary } : {}),
                ...(input.visibility !== undefined ? { visibility: input.visibility } : {}),
              }),
        },
      });
      const updatedVersion = await tx.contentVersion.findUniqueOrThrow({ where: { id: draft.id } });
      return [updatedContent, updatedVersion] as const;
    });
    if (input.attachmentFileIds !== undefined) {
      const fileIds = [...new Set(input.attachmentFileIds)];
      await this.prisma.$transaction(
        async (tx) => {
          const files = await tx.fileAttachment.findMany({
            where: {
              id: { in: fileIds },
              organizationId: user.organizationId,
              uploadStatus: UploadStatus.READY,
              deletedAt: null,
            },
            select: { id: true, uploadedById: true },
          });
          const canManageAll = user.permissions.includes('content.edit_all');
          if (
            files.length !== fileIds.length ||
            files.some((file) => file.uploadedById !== user.id && !canManageAll)
          ) {
            throw new BadRequestException(
              'Each attachment must be a ready file that you can manage.',
            );
          }
          await tx.attachmentRelation.deleteMany({
            where: { entityType: AttachmentEntityType.VERSION, entityId: draft.id, usageType: AttachmentUsageType.ATTACHMENT },
          });
          if (fileIds.length) {
            await tx.attachmentRelation.createMany({
              data: fileIds.map((fileId, sortOrder) => ({
                fileId,
                entityType: AttachmentEntityType.VERSION,
                entityId: draft.id,
                usageType: AttachmentUsageType.ATTACHMENT,
                sortOrder,
              })),
            });
          }
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    }

    return { content: this.serialize(updatedContent), version: this.serialize(updatedVersion) };
  }

  async get(user: AuthenticatedUser, contentId: string) {
    const content = await this.findEditableDraft(user, contentId);
    const attachments = content.draftVersion
      ? await this.prisma.attachmentRelation.findMany({
          where: { entityType: AttachmentEntityType.VERSION, entityId: content.draftVersion.id },
          include: { file: true },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        })
      : [];
    return {
      ...this.serialize(content),
      taxonomy: taxonomySnapshot(content.draftVersion?.body, content),
      taxonomyOptions: await this.availableTaxonomy(user, taxonomySnapshot(content.draftVersion?.body, content)),
      coverFile: attachments.find((attachment) => attachment.usageType === AttachmentUsageType.COVER)?.file.id ?? null,
      attachments: attachments.filter((attachment) => attachment.usageType !== AttachmentUsageType.COVER).map((attachment) => ({
        ...attachment,
        file: { ...attachment.file, sizeBytes: attachment.file.sizeBytes.toString() },
      })),
    };
  }

  async versions(user: AuthenticatedUser, contentId: string) {
    await this.findEditableDraft(user, contentId);
    const versions = await this.prisma.contentVersion.findMany({
      where: { contentId },
      orderBy: { versionNumber: 'desc' },
    });
    return { items: versions.map((version) => this.serialize(version)) };
  }

  async availableTeams(user: AuthenticatedUser) {
    const items = await this.prisma.team.findMany({
      where: { organizationId: user.organizationId, status: 'ACTIVE' },
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    });
    return { items };
  }

  async availableTaxonomy(user: AuthenticatedUser, selected?: TaxonomySelection) {
    const [categories, tags] = await Promise.all([
      this.prisma.category.findMany({
        where: { organizationId: user.organizationId, OR: [{ status: 'ACTIVE', deletedAt: null }, ...(selected?.categoryId ? [{ id: selected.categoryId }] : [])] },
        select: { id: true, name: true, status: true, contentTypes: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.tag.findMany({
        where: { organizationId: user.organizationId, OR: [{ status: 'ACTIVE', deletedAt: null }, { id: { in: selected?.tagIds ?? [] } }] },
        select: { id: true, name: true, status: true, contentTypes: true },
        orderBy: { name: 'asc' },
      }),
    ]);
    return { categories, tags };
  }

  private async findEditableDraft(user: AuthenticatedUser, contentId: string) {
    const content = await this.prisma.content.findFirst({
      where: { id: contentId, organizationId: user.organizationId, deletedAt: null },
      include: { draftVersion: true, tags: true },
    });
    if (!content) throw new NotFoundException('Content was not found.');
    if (!this.canEditContent(user, content.ownerId)) {
      throw new ForbiddenException('You cannot edit this content.');
    }
    if (
      !content.draftVersion ||
      !new Set<ContentStatus>([ContentStatus.DRAFT]).has(
        content.draftVersion.versionStatus,
      )
    ) {
      throw new ConflictException('Only a draft version can be autosaved.');
    }
    if (
      !new Set<ContentStatus>([
        ContentStatus.DRAFT,
        ContentStatus.PUBLISHED,
        ContentStatus.ARCHIVED,
        ContentStatus.UNPUBLISHED,
      ]).has(content.status)
    ) {
      throw new ConflictException('This content cannot be edited in its current state.');
    }
    return content;
  }

  private async findLifecycleContent(user: AuthenticatedUser, contentId: string, allowDraft = false) {
    const content = await this.prisma.content.findFirst({
      where: { id: contentId, organizationId: user.organizationId, deletedAt: null },
      include: { draftVersion: true },
    });
    if (!content) throw new NotFoundException('Content was not found.');
    if (content.draftVersion && !allowDraft) {
      throw new ConflictException(
        'Content with an active draft cannot change lifecycle state.',
      );
    }
    return content;
  }

  private canEditContent(user: AuthenticatedUser, ownerId: string) {
    return (
      user.permissions.includes('content.edit_all') ||
      (ownerId === user.id && user.permissions.includes('content.edit_own'))
    );
  }

  private serialize<T>(value: T) {
    return value;
  }
}
