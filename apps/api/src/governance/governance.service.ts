import { randomUUID } from 'node:crypto';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types';
import { PrismaService } from '../database/prisma.service';
import { TagStatus } from '../generated/prisma/enums';
import { AuditService } from './audit.service';
import type {
  AdminContentQueryDto,
  CreateCategoryDto,
  CreateTagDto,
  UpdateCategoryDto,
  UpdateTagDto,
} from './governance.dto';

@Injectable()
export class GovernanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listContent(user: AuthenticatedUser, query: AdminContentQueryDto) {
    const where = {
      organizationId: user.organizationId,
      deletedAt: null,
      contentType: query.type,
      status: query.status,
      categoryId: query.categoryId,
      ...(query.tagId ? { tags: { some: { tagId: query.tagId } } } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' as const } },
              { summary: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.content.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          category: { select: { id: true, name: true } },
          currentVersion: { select: { versionLabel: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.content.count({ where }),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async listCategories(user: AuthenticatedUser) {
    const categories = await this.prisma.category.findMany({
      where: { organizationId: user.organizationId, deletedAt: null },
      include: { _count: { select: { contents: { where: { organizationId: user.organizationId, deletedAt: null } } } } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return categories.map(({ _count, ...category }) => ({ ...category, usageCount: _count.contents }));
  }

  async createCategory(user: AuthenticatedUser, input: CreateCategoryDto) {
    try {
      const created = await this.prisma.category.create({
        data: {
          organizationId: user.organizationId,
          name: input.name,
          code: input.code?.trim().toLowerCase() || `category-${randomUUID()}`,
          contentTypes: input.contentTypes,
          sortOrder: input.sortOrder ?? 0,
          parentId: input.parentId,
        },
      });
      await this.audit.write({
        organizationId: user.organizationId,
        actorId: user.id,
        action: 'taxonomy.category.create',
        entityType: 'category',
        entityId: created.id,
        afterData: created,
      });
      return created;
    } catch (error: unknown) {
      if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002')
        throw new ConflictException('Category code already exists.');
      throw error;
    }
  }

  async updateCategory(user: AuthenticatedUser, categoryId: string, input: UpdateCategoryDto) {
    const existing = await this.prisma.category.findFirst({
      where: { id: categoryId, organizationId: user.organizationId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Category not found.');
    const updated = await this.prisma.category.update({ where: { id: categoryId }, data: input });
    await this.audit.write({
      organizationId: user.organizationId,
      actorId: user.id,
      action: 'taxonomy.category.update',
      entityType: 'category',
      entityId: categoryId,
      beforeData: existing,
      afterData: updated,
    });
    return updated;
  }

  async listTags(user: AuthenticatedUser) {
    const tags = await this.prisma.tag.findMany({
      where: { organizationId: user.organizationId, deletedAt: null },
      include: { _count: { select: { contents: { where: { content: { organizationId: user.organizationId, deletedAt: null } } } } } },
      orderBy: { name: 'asc' },
    });
    return tags.map(({ _count, ...tag }) => ({ ...tag, usageCount: _count.contents }));
  }

  async createTag(user: AuthenticatedUser, input: CreateTagDto) {
    const name = input.name.trim();
    const normalizedName = name.toLocaleLowerCase('zh-CN');
    const contentTypes = [...new Set(input.contentTypes ?? [])];
    const existing = await this.prisma.tag.findFirst({
      where: { organizationId: user.organizationId, normalizedName },
    });

    if (existing) {
      if (!existing.deletedAt) throw new ConflictException('Tag already exists.');
      const restored = await this.prisma.tag.update({
        where: { id: existing.id },
        data: {
          name,
          normalizedName,
          contentTypes,
          status: TagStatus.ACTIVE,
          mergedToId: null,
          deletedAt: null,
        },
      });
      await this.audit.write({
        organizationId: user.organizationId,
        actorId: user.id,
        action: 'taxonomy.tag.restore',
        entityType: 'tag',
        entityId: restored.id,
        beforeData: existing,
        afterData: restored,
      });
      return restored;
    }

    try {
      const created = await this.prisma.tag.create({
        data: {
          organizationId: user.organizationId,
          name,
          normalizedName,
          contentTypes,
          status: TagStatus.ACTIVE,
        },
      });
      await this.audit.write({
        organizationId: user.organizationId,
        actorId: user.id,
        action: 'taxonomy.tag.create',
        entityType: 'tag',
        entityId: created.id,
        afterData: created,
      });
      return created;
    } catch (error: unknown) {
      if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002')
        throw new ConflictException('Tag already exists.');
      throw error;
    }
  }

  async updateTag(user: AuthenticatedUser, tagId: string, input: UpdateTagDto) {
    const existing = await this.prisma.tag.findFirst({
      where: { id: tagId, organizationId: user.organizationId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Tag not found.');
    const updated = await this.prisma.tag.update({
      where: { id: tagId },
      data: {
        name: input.name?.trim(),
        contentTypes: input.contentTypes ? [...new Set(input.contentTypes)] : undefined,
        normalizedName: input.name?.trim().toLocaleLowerCase('zh-CN'),
        status: input.status,
      },
    });
    await this.audit.write({
      organizationId: user.organizationId,
      actorId: user.id,
      action: 'taxonomy.tag.update',
      entityType: 'tag',
      entityId: tagId,
      beforeData: existing,
      afterData: updated,
    });
    return updated;
  }

  async deleteCategory(user: AuthenticatedUser, categoryId: string) {
    const existing = await this.prisma.category.findFirst({ where: { id: categoryId, organizationId: user.organizationId, deletedAt: null } });
    if (!existing) throw new NotFoundException('分类不存在或已删除。');
    const children = await this.prisma.category.count({ where: { parentId: categoryId, organizationId: user.organizationId, deletedAt: null } });
    if (children) throw new ConflictException('请先删除或移走子分类。');
    const updated = await this.prisma.category.update({ where: { id: categoryId }, data: { status: 'DISABLED', deletedAt: new Date() } });
    await this.audit.write({ organizationId: user.organizationId, actorId: user.id, action: 'taxonomy.category.delete', entityType: 'category', entityId: categoryId, beforeData: existing, afterData: updated });
    return { id: categoryId, deleted: true };
  }

  async deleteTag(user: AuthenticatedUser, tagId: string) {
    const existing = await this.prisma.tag.findFirst({ where: { id: tagId, organizationId: user.organizationId, deletedAt: null } });
    if (!existing) throw new NotFoundException('标签不存在或已删除。');
    const updated = await this.prisma.tag.update({ where: { id: tagId }, data: { status: 'DISABLED', deletedAt: new Date() } });
    await this.audit.write({ organizationId: user.organizationId, actorId: user.id, action: 'taxonomy.tag.delete', entityType: 'tag', entityId: tagId, beforeData: existing, afterData: updated });
    return { id: tagId, deleted: true };
  }

}
