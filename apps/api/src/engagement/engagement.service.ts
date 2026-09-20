import { searchTerms, containsPattern } from './search-terms';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { ContentStatus, ContentType, ContentVisibility } from '../generated/prisma/enums';
import type { AuthenticatedUser } from '../auth/auth.types';
import { PrismaService } from '../database/prisma.service';
import type {
  CreateContentRelationDto,
  CreateUsageConfirmationDto,
  SearchQueryDto,
} from './engagement.dto';

const cardInclude = {
  category: { select: { id: true, name: true, code: true } },
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
  assetDetail: { select: { platforms: true, scenarios: true } },
  currentVersion: { select: { versionLabel: true } },
  coverFile: true,
  tags: { include: { tag: true } },
} as const;

@Injectable()
export class EngagementService {
  constructor(private readonly prisma: PrismaService) {}

  async search(user: AuthenticatedUser, input: SearchQueryDto) {
    const keyword = input.q.trim();
    if (!keyword)
      return { items: [], page: input.page, pageSize: input.pageSize, total: 0, searchLogId: null };
    const normalizedKeyword = keyword.toLocaleLowerCase('zh-CN');
    const filters = Object.fromEntries(
      Object.entries({ type: input.type, categoryId: input.categoryId, tag: input.tag }).filter(
        ([, value]) => value !== undefined,
      ),
    ) as Prisma.InputJsonObject;
    const ids = await this.searchIds(user, keyword, input);
    const total = ids.length;
    const pageIds = ids.slice((input.page - 1) * input.pageSize, input.page * input.pageSize);
    const [records, searchLog] = await Promise.all([
      pageIds.length ? this.prisma.content.findMany({ where: { id: { in: pageIds } }, include: cardInclude }) : Promise.resolve([]),
      this.prisma.searchLog.create({
        data: { organizationId: user.organizationId, userId: user.id, keyword, normalizedKeyword, filters, resultCount: total },
        select: { id: true },
      }),
      this.recordEvent(user, 'search_submit', undefined, { keyword, resultCount: total }),
      total === 0 ? this.recordEvent(user, 'search_no_result', undefined, { keyword }) : Promise.resolve(),
    ]);
    const byId = new Map(records.map((record) => [record.id, record]));
    return {
      items: pageIds.map((id) => this.serializeCard(byId.get(id)!)),
      page: input.page,
      pageSize: input.pageSize,
      total,
      searchLogId: searchLog.id,
    };
  }

  async recordSearchClick(user: AuthenticatedUser, searchLogId: string, contentId: string) {
    const [log, content] = await Promise.all([
      this.prisma.searchLog.findFirst({
        where: { id: searchLogId, organizationId: user.organizationId, userId: user.id },
      }),
      this.findAccessibleContent(user, contentId),
    ]);
    if (!log) throw new NotFoundException('Search log not found.');
    await this.prisma.searchLog.update({
      where: { id: log.id },
      data: { clickedContentId: content.id },
    });
    await this.recordEvent(user, 'search_result_click', content.id, { searchLogId });
    return { recorded: true };
  }

  async listFavorites(user: AuthenticatedUser) {
    const items = await this.prisma.favorite.findMany({
      where: { userId: user.id, content: this.publishedAccessWhere(user) },
      include: { content: { include: cardInclude } },
      orderBy: { createdAt: 'desc' },
    });
    return {
      items: items.map(({ createdAt, content }) => ({
        createdAt,
        content: this.serializeCard(content),
      })),
    };
  }

  async addFavorite(user: AuthenticatedUser, contentId: string) {
    await this.findAccessibleContent(user, contentId);
    const favorite = await this.prisma.favorite.upsert({
      where: { userId_contentId: { userId: user.id, contentId } },
      create: { userId: user.id, contentId },
      update: {},
    });
    await this.recordEvent(user, 'favorite_add', contentId);
    return favorite;
  }

  async removeFavorite(user: AuthenticatedUser, contentId: string) {
    const deleted = await this.prisma.favorite.deleteMany({
      where: { userId: user.id, contentId },
    });
    if (deleted.count) await this.recordEvent(user, 'favorite_remove', contentId);
    return { deleted: Boolean(deleted.count) };
  }

  async listRecentViews(user: AuthenticatedUser) {
    const items = await this.prisma.recentView.findMany({
      where: { userId: user.id, content: this.publishedAccessWhere(user) },
      include: { content: { include: cardInclude } },
      orderBy: { lastViewedAt: 'desc' },
      take: 50,
    });
    return {
      items: items.map(({ content, ...view }) => ({
        ...view,
        content: this.serializeCard(content),
      })),
    };
  }

  async recordContentView(user: AuthenticatedUser, contentId: string) {
    await this.prisma.recentView.upsert({
      where: { userId_contentId: { userId: user.id, contentId } },
      create: { userId: user.id, contentId },
      update: { viewCount: { increment: 1 }, lastViewedAt: new Date() },
    });
    await this.recordEvent(user, 'content_view', contentId);
  }

  async confirmUsage(
    user: AuthenticatedUser,
    contentId: string,
    input: CreateUsageConfirmationDto,
  ) {
    const manualName = input.projectName?.trim();
    if (!input.projectContentId && !manualName) throw new BadRequestException('请选择项目或手动填写项目名称。');
    if (input.projectContentId && manualName) throw new BadRequestException('请选择一种项目关联方式。');
    const [content, project] = await Promise.all([
      this.findAccessibleContent(user, contentId),
      input.projectContentId ? this.prisma.content.findFirst({
        where: {
          id: input.projectContentId,
          contentType: ContentType.AI_PROJECT,
          ...this.publishedAccessWhere(user),
        },
        select: { id: true, title: true, projectDetail: { select: { projectCode: true } } },
      }) : Promise.resolve(null),
    ]);
    if (input.projectContentId && !project) throw new NotFoundException('The referenced AI project is not available.');
    const reference = project ? (project.projectDetail?.projectCode ?? project.id) : manualName!;
    const metadata = {
      ...(project ? { projectContentId: project.id } : {}),
      projectTitle: project?.title ?? manualName!,
      projectSource: project ? 'catalog' : 'manual',
      ...(input.note ? { note: input.note } : {}),
    };
    await this.prisma.$transaction([
      this.prisma.usageEvent.create({
        data: {
          organizationId: user.organizationId,
          userId: user.id,
          contentId: content.id,
          eventType: 'usage_confirmed',
          projectReference: reference,
          ...(input.sourcePage ? { sourcePage: input.sourcePage } : {}),
          metadata,
        },
      }),
      ...(project ? [this.prisma.usageEvent.create({
        data: {
          organizationId: user.organizationId,
          userId: user.id,
          contentId: project.id,
          eventType: 'project_referenced',
          projectReference: reference,
          ...(input.sourcePage ? { sourcePage: input.sourcePage } : {}),
          metadata: { contentId: content.id, contentTitle: content.title },
        },
      })] : []),
    ]);
    return {
      confirmed: true,
      project: {
        id: project?.id ?? null,
        title: project?.title ?? manualName,
        projectCode: project?.projectDetail?.projectCode ?? null,
      },
    };
  }

  async usageSummary(user: AuthenticatedUser, contentId: string) {
    const [usageCount, projectReferences, favoriteCount] = await Promise.all([
      this.prisma.usageEvent.count({
        where: { organizationId: user.organizationId, contentId, eventType: 'usage_confirmed' },
      }),
      this.prisma.usageEvent.count({
        where: { organizationId: user.organizationId, contentId, eventType: 'project_referenced' },
      }),
      this.prisma.favorite.count({ where: { contentId } }),
    ]);
    return { usageCount, projectReferences, favoriteCount };
  }

  async listRelations(user: AuthenticatedUser, contentId: string) {
    await this.findAccessibleContent(user, contentId);
    const [outgoing, incoming] = await Promise.all([
      this.prisma.contentRelation.findMany({
        where: { sourceContentId: contentId, targetContent: this.publishedAccessWhere(user) },
        include: {
          targetContent: { select: { id: true, slug: true, title: true, contentType: true } },
        },
      }),
      this.prisma.contentRelation.findMany({
        where: { targetContentId: contentId, sourceContent: this.publishedAccessWhere(user) },
        include: {
          sourceContent: { select: { id: true, slug: true, title: true, contentType: true } },
        },
      }),
    ]);
    return { outgoing, incoming };
  }

  async createRelation(
    user: AuthenticatedUser,
    contentId: string,
    input: CreateContentRelationDto,
  ) {
    const source = await this.findAccessibleContent(user, contentId);
    if (!this.canEditContent(user, source.ownerId)) {
      throw new ForbiddenException('Only the content owner can manage its relations.');
    }
    if (contentId === input.targetContentId)
      throw new ConflictException('A content item cannot reference itself.');
    await this.findAccessibleContent(user, input.targetContentId);
    try {
      return await this.prisma.contentRelation.create({
        data: {
          sourceContentId: contentId,
          targetContentId: input.targetContentId,
          relationType: input.relationType,
          createdById: user.id,
        },
      });
    } catch (error: unknown) {
      if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') {
        throw new ConflictException('This content relation already exists.');
      }
      throw error;
    }
  }

  async removeRelation(user: AuthenticatedUser, contentId: string, relationId: string) {
    const relation = await this.prisma.contentRelation.findFirst({
      where: { id: relationId, sourceContentId: contentId },
    });
    if (!relation) throw new NotFoundException('Content relation not found.');
    const source = await this.findAccessibleContent(user, contentId);
    if (!this.canEditContent(user, source.ownerId)) {
      throw new ForbiddenException('Only the content owner can manage its relations.');
    }
    await this.prisma.contentRelation.delete({ where: { id: relation.id } });
    return { deleted: true };
  }

  async recordEvent(
    user: AuthenticatedUser,
    eventType: string,
    contentId?: string,
    metadata?: Prisma.InputJsonValue,
    verifyContentAccess = false,
  ) {
    if (contentId && verifyContentAccess) await this.findAccessibleContent(user, contentId);
    return this.prisma.usageEvent.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        eventType,
        ...(contentId ? { contentId } : {}),
        ...(metadata === undefined ? {} : { metadata }),
      },
    });
  }

  private async findAccessibleContent(user: AuthenticatedUser, contentId: string) {
    const content = await this.prisma.content.findFirst({
      where: { id: contentId, ...this.publishedAccessWhere(user) },
      select: { id: true, title: true, ownerId: true },
    });
    if (!content) throw new NotFoundException('Content not found.');
    return content;
  }

  private canEditContent(user: AuthenticatedUser, ownerId: string) {
    return (
      user.permissions.includes('content.edit_all') ||
      (ownerId === user.id && user.permissions.includes('content.edit_own'))
    );
  }

  private publishedAccessWhere(user: AuthenticatedUser): Prisma.ContentWhereInput {
    const access: Prisma.ContentWhereInput[] = [
      { visibility: ContentVisibility.PUBLIC },
      { organizationId: user.organizationId, visibility: ContentVisibility.ORGANIZATION },
    ];
    if (user.primaryTeamId)
      access.push({
        organizationId: user.organizationId,
        teamId: user.primaryTeamId,
        visibility: ContentVisibility.TEAM,
      });
    access.push({ ownerId: user.id, visibility: ContentVisibility.RESTRICTED });
    if (user.permissions.includes('content.edit_all'))
      access.push({
        organizationId: user.organizationId,
        visibility: ContentVisibility.RESTRICTED,
      });
    return { status: ContentStatus.PUBLISHED, deletedAt: null, AND: [{ OR: access }] };
  }

  private async searchIds(user: AuthenticatedUser, keyword: string, input: SearchQueryDto) {
    const accessClauses: Prisma.Sql[] = [
      Prisma.sql`c.visibility = 'public'::"ContentVisibility"`,
      Prisma.sql`(c.organization_id = ${user.organizationId}::uuid AND c.visibility = 'organization'::"ContentVisibility")`,
    ];
    if (user.primaryTeamId)
      accessClauses.push(
        Prisma.sql`(c.organization_id = ${user.organizationId}::uuid AND c.team_id = ${user.primaryTeamId}::uuid AND c.visibility = 'team'::"ContentVisibility")`,
      );
    accessClauses.push(
      Prisma.sql`(c.owner_id = ${user.id}::uuid AND c.visibility = 'restricted'::"ContentVisibility")`,
    );
    if (user.permissions.includes('content.edit_all'))
      accessClauses.push(
        Prisma.sql`(c.organization_id = ${user.organizationId}::uuid AND c.visibility = 'restricted'::"ContentVisibility")`,
      );
    const typeFilter = input.type
      ? Prisma.sql`AND c.content_type = ${input.type}::"ContentType"`
      : Prisma.empty;
    const categoryFilter = input.categoryId
      ? Prisma.sql`AND c.category_id = ${input.categoryId}::uuid`
      : Prisma.empty;
    const tagFilter = input.tag
      ? Prisma.sql`AND EXISTS (SELECT 1 FROM "content_tags" ct2 JOIN "tags" t2 ON t2.id = ct2.tag_id WHERE ct2.content_id = c.id AND t2.normalized_name = ${input.tag.trim().toLowerCase()})`
      : Prisma.empty;
    const terms = searchTerms(keyword);
    const fragments = terms.length ? Prisma.join(terms.map(term => Prisma.sql`plain_text ILIKE ${containsPattern(term)}`), ' AND ') : Prisma.sql`FALSE`;
    const rows = await this.prisma.$queryRaw<Array<{ id: string; score: number }>>(Prisma.sql`
      WITH searchable AS (
        SELECT c.id,
          setweight(to_tsvector('simple', coalesce(c.title, '')), 'A') ||
          setweight(to_tsvector('simple', coalesce(apd.project_code, '')), 'A') ||
          setweight(to_tsvector('simple', coalesce(string_agg(t.name, ' '), '')), 'B') ||
          setweight(to_tsvector('simple', coalesce(c.summary, '')), 'C') ||
          setweight(to_tsvector('simple', coalesce(cv.body::text, '')), 'D') AS document,
          concat_ws(' ', c.title, apd.project_code, c.summary, string_agg(t.name, ' '), cv.body::text) AS plain_text
        FROM "contents" c
        LEFT JOIN "content_versions" cv ON cv.id = c.current_version_id
        LEFT JOIN "ai_project_details" apd ON apd.content_id = c.id
        LEFT JOIN "content_tags" ct ON ct.content_id = c.id
        LEFT JOIN "tags" t ON t.id = ct.tag_id
        WHERE c.status = 'PUBLISHED'::"ContentStatus" AND c.deleted_at IS NULL
          AND (${Prisma.join(accessClauses, ' OR ')})
          ${typeFilter} ${categoryFilter} ${tagFilter}
        GROUP BY c.id, c.title, c.summary, apd.project_code, cv.body
      )
      SELECT id, ts_rank(document, plainto_tsquery('simple', ${keyword}))::float AS score
      FROM searchable
      WHERE document @@ plainto_tsquery('simple', ${keyword}) OR plain_text ILIKE ${containsPattern(keyword)} OR (${fragments})
      ORDER BY score DESC, id ASC
    `);
    return rows.map((row) => row.id);
  }

  private serializeCard<T extends { coverFile: { sizeBytes: bigint } | null }>(content: T) {
    return {
      ...content,
      coverFile: content.coverFile
        ? { ...content.coverFile, sizeBytes: content.coverFile.sizeBytes.toString() }
        : null,
    };
  }
}
