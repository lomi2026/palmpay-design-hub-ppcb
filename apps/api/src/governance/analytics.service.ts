import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types';
import { ContentStatus } from '../generated/prisma/enums';
import { PrismaService } from '../database/prisma.service';

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(user: AuthenticatedUser) {
    const since = daysAgo(30);
    const organizationId = user.organizationId;
    const [published, activeUsers, contributors, usageEvents, projects, publishedCaseRecords, favorites] =
      await Promise.all([
        this.prisma.content.groupBy({
          where: { organizationId, deletedAt: null, status: ContentStatus.PUBLISHED },
          by: ['contentType'],
          _count: { _all: true },
        }),
        this.prisma.usageEvent.groupBy({
          where: { organizationId, occurredAt: { gte: since }, userId: { not: null } },
          by: ['userId'],
        }),
        this.prisma.content.groupBy({
          where: { organizationId, deletedAt: null },
          by: ['createdById'],
        }),
        this.prisma.usageEvent.count({
          where: { organizationId, occurredAt: { gte: since }, eventType: 'usage_confirmed' },
        }),
        this.prisma.usageEvent.count({
          where: { organizationId, occurredAt: { gte: since }, eventType: 'project_referenced' },
        }),
        this.prisma.content.findMany({
          where: {
            organizationId,
            contentType: 'AI_CASE',
            status: ContentStatus.PUBLISHED,
            deletedAt: null,
          },
          select: { currentVersion: { select: { body: true } } },
        }),
        this.prisma.favorite.count({
          where: {
            user: { organizationId, deletedAt: null },
            content: { organizationId, deletedAt: null },
          },
        }),
      ]);
    const countFor = (type: string) =>
      published.find((item) => item.contentType === type)?._count._all ?? 0;
    const casesWithValidationRecords = publishedCaseRecords.filter(({ currentVersion }) => {
      const body = currentVersion?.body;
      if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
      return ['validationMethod', 'dataResult'].every(
        (field) => typeof body[field] === 'string' && body[field].trim().length > 0,
      );
    }).length;
    return {
      periodDays: 30,
      publishedAssets: countFor('DESIGN_ASSET'),
      publishedTools: countFor('AI_TOOL'),
      publishedProjects: countFor('AI_PROJECT'),
      publishedSkills: countFor('AI_SKILL'),
      publishedCases: publishedCaseRecords.length,
      effectiveUsage30d: usageEvents,
      projectReferences30d: projects,
      activeUsers30d: activeUsers.length,
      contributors: contributors.length,
      casesWithValidationRecords,
      favorites,
    };
  }

  async insights(user: AuthenticatedUser) {
    const organizationId = user.organizationId;
    const since = daysAgo(30);
    const [
      contentStatus,
      typeDistribution,
      searchLogs,
      noResult,
      eventCounts,
      staleContent,
    ] = await Promise.all([
      this.prisma.content.groupBy({
        where: { organizationId, deletedAt: null },
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.content.groupBy({
        where: { organizationId, deletedAt: null },
        by: ['contentType'],
        _count: { _all: true },
      }),
      this.prisma.searchLog.groupBy({
        where: { organizationId, searchedAt: { gte: since } },
        by: ['normalizedKeyword'],
        _count: { _all: true },
        orderBy: { _count: { normalizedKeyword: 'desc' } },
        take: 10,
      }),
      this.prisma.searchLog.groupBy({
        where: { organizationId, searchedAt: { gte: since }, resultCount: 0 },
        by: ['normalizedKeyword'],
        _count: { _all: true },
        orderBy: { _count: { normalizedKeyword: 'desc' } },
        take: 10,
      }),
      this.prisma.usageEvent.groupBy({
        where: { organizationId, occurredAt: { gte: since }, NOT: { eventType: { startsWith: 'review_' } } },
        by: ['eventType'],
        _count: { _all: true },
      }),
      this.prisma.content.findMany({
        where: {
          organizationId,
          deletedAt: null,
          status: ContentStatus.PUBLISHED,
          updatedAt: { lt: daysAgo(180) },
        },
        select: { id: true, title: true, slug: true, updatedAt: true, contentType: true },
        orderBy: { updatedAt: 'asc' },
        take: 20,
      }),
    ]);
    return {
      periodDays: 30,
      contentStatus: contentStatus.map((item) => ({
        status: item.status,
        _count: item._count._all,
      })),
      typeDistribution: typeDistribution.map((item) => ({
        contentType: item.contentType,
        _count: item._count._all,
      })),
      topSearches: searchLogs.map((item) => ({
        keyword: item.normalizedKeyword,
        count: item._count._all,
      })),
      noResultSearches: noResult.map((item) => ({
        keyword: item.normalizedKeyword,
        count: item._count._all,
      })),
      eventCounts: eventCounts.map((item) => ({
        eventType: item.eventType,
        count: item._count._all,
      })),
      staleContent,
    };
  }
}
