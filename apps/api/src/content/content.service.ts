import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { AttachmentEntityType, ContentStatus, ContentVisibility } from '../generated/prisma/enums';
import type { ContentListQueryDto } from './content.dto';
import { EngagementService } from '../engagement/engagement.service';

const contentCardInclude = {
  category: { select: { id: true, name: true, code: true, status: true } },
  owner: { select: { id: true, name: true, avatarUrl: true } },
  team: { select: { id: true, name: true, code: true } },
  projectDetail: {
    select: {
      projectCode: true,
      domain: true,
      targetValue: true,
      projectStage: true,
      priority: true,
    },
  },
  skillDetail: { select: { applicableRoles: true } },
  caseDetail: { select: { metricName: true } },
  toolDetail: true,
  assetDetail: { select: { platforms: true, scenarios: true } },
  currentVersion: { select: { versionLabel: true, body: true } },
  coverFile: true,
  tags: { include: { tag: true } },
} as const;

const contentDetailInclude = {
  ...contentCardInclude,
  currentVersion: true,
  assetDetail: true,
  skillDetail: true,
  caseDetail: { include: { evidence: true } },
  projectDetail: {
    include: { suggestedOwnerTeam: { select: { id: true, name: true, code: true } } },
  },
  sourceRelations: {
    include: {
      targetContent: {
        select: { id: true, slug: true, title: true, contentType: true, status: true },
      },
    },
  },
} as const;

@Injectable()
export class ContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly engagement: EngagementService,
  ) {}

  async list(query: ContentListQueryDto, user?: AuthenticatedUser) {
    const where: Prisma.ContentWhereInput = {
      status: ContentStatus.PUBLISHED,
      deletedAt: null,
      contentType: query.type,
      categoryId: query.categoryId,
      verificationStatus: query.verificationStatus,
      tags: query.tag
        ? { some: { tag: { normalizedName: query.tag.trim().toLowerCase() } } }
        : undefined,
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { summary: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      AND: [this.visibilityWhere(user)],
    };
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.content.findMany({
        where,
        include: contentCardInclude,
        orderBy: [{ publishedAt: 'desc' }, { updatedAt: 'desc' }],
        skip,
        take: query.pageSize,
      }),
      this.prisma.content.count({ where }),
    ]);

    const views = await this.prisma.recentView.groupBy({
      by: ['contentId'],
      where: { contentId: { in: items.map(item => item.id) } },
      _sum: { viewCount: true },
    });
    const viewCounts = new Map(views.map(item => [item.contentId, item._sum.viewCount ?? 0]));
    return {
      items: items.map((item) => ({ ...this.serializeContentFiles(item), viewCount: viewCounts.get(item.id) ?? 0 })),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }

  async getBySlug(slug: string, user?: AuthenticatedUser) {
    const content = await this.prisma.content.findFirst({
      where: {
        slug,
        status: ContentStatus.PUBLISHED,
        deletedAt: null,
        AND: [this.visibilityWhere(user)],
      },
      include: contentDetailInclude,
    });
    if (!content) throw new NotFoundException('Content not found.');

    // Access is confirmed above; independent reads and the view record can run together.
    const [attachments] = await Promise.all([this.prisma.attachmentRelation.findMany({
      where: {
        OR: [
          { entityType: AttachmentEntityType.VERSION, entityId: content.currentVersionId! },
          // Compatibility for historical imports created before version-bound attachments.
          { entityType: AttachmentEntityType.CONTENT, entityId: content.id },
        ],
        usageType: { not: 'COVER' },
        file: { uploadStatus: 'READY', deletedAt: null },
      },
      include: { file: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    }), user ? this.engagement.recordContentView(user, content.id) : Promise.resolve()]);

    return {
      ...this.serializeContentFiles(content),
      attachments: attachments.map((relation) => ({
        ...relation,
        file: this.serializeFile(relation.file),
      })),
    };
  }

  private visibilityWhere(user?: AuthenticatedUser): Prisma.ContentWhereInput {
    const allowed: Prisma.ContentWhereInput[] = [{ visibility: ContentVisibility.PUBLIC }];

    if (user?.permissions.includes('content.read')) {
      allowed.push({
        organizationId: user.organizationId,
        visibility: ContentVisibility.ORGANIZATION,
      });
      if (user.primaryTeamId) {
        allowed.push({
          organizationId: user.organizationId,
          teamId: user.primaryTeamId,
          visibility: ContentVisibility.TEAM,
        });
      }
    }

    if (user) {
      allowed.push({ ownerId: user.id, visibility: ContentVisibility.RESTRICTED });
      if (user.permissions.includes('content.edit_all')) {
        allowed.push({
          organizationId: user.organizationId,
          visibility: ContentVisibility.RESTRICTED,
        });
      }
    }

    return { OR: allowed };
  }

  private serializeContentFiles<T extends { coverFile: { sizeBytes: bigint } | null }>(content: T) {
    return {
      ...content,
      coverFile: content.coverFile ? this.serializeFile(content.coverFile) : null,
    };
  }

  private serializeFile<T extends { sizeBytes: bigint }>(file: T) {
    return { ...file, sizeBytes: file.sizeBytes.toString() };
  }
}
