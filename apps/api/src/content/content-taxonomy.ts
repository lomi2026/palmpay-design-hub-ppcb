import { BadRequestException } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client';
import type { ContentType } from '../generated/prisma/enums';

export type TaxonomySelection = { categoryId: string | null; tagIds: string[] };
type ExistingContent = { categoryId: string | null; tags: { tagId: string }[] };

export function taxonomySnapshot(body: unknown, content: ExistingContent): TaxonomySelection {
  const value = body && typeof body === 'object' && !Array.isArray(body)
    ? (body as Record<string, unknown>).taxonomy : undefined;
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const snapshot = value as Record<string, unknown>;
    return {
      categoryId: typeof snapshot.categoryId === 'string' ? snapshot.categoryId : null,
      tagIds: Array.isArray(snapshot.tagIds) ? snapshot.tagIds.filter((id): id is string => typeof id === 'string') : [],
    };
  }
  // Legacy immutable versions predate taxonomy snapshots; use their current relations.
  return { categoryId: content.categoryId, tagIds: content.tags.map(({ tagId }) => tagId) };
}

export function withTaxonomy(body: unknown, taxonomy: TaxonomySelection): Prisma.InputJsonObject {
  return {
    ...(body && typeof body === 'object' && !Array.isArray(body) ? body as Prisma.InputJsonObject : {}),
    taxonomy: { categoryId: taxonomy.categoryId, tagIds: taxonomy.tagIds },
  };
}

export async function validateTaxonomy(
  tx: Prisma.TransactionClient,
  organizationId: string,
  contentType: ContentType,
  selection: TaxonomySelection,
  previous: TaxonomySelection = { categoryId: null, tagIds: [] },
) {
  if (selection.categoryId) {
    const category = await tx.category.findFirst({ where: { id: selection.categoryId, organizationId } });
    if (!category || (category.id !== previous.categoryId &&
      (category.deletedAt || category.status !== 'ACTIVE' || !category.contentTypes.includes(contentType)))) {
      throw new BadRequestException('所选分类已停用、不适用于此内容类型，或不属于当前组织。请重新选择。');
    }
  }
  if (selection.tagIds.length) {
    const tags = await tx.tag.findMany({ where: { id: { in: selection.tagIds }, organizationId } });
    if (tags.length !== selection.tagIds.length || tags.some((tag) => (tag.deletedAt || tag.status !== 'ACTIVE' || (tag.contentTypes?.length && !tag.contentTypes.includes(contentType))) && !previous.tagIds.includes(tag.id))) {
      throw new BadRequestException('所选标签已停用、不适用于此内容类型，或不属于当前组织。请重新选择。');
    }
  }
}

export async function projectTaxonomy(tx: Prisma.TransactionClient, contentId: string, actorId: string, selection: TaxonomySelection) {
  await tx.content.update({ where: { id: contentId }, data: { categoryId: selection.categoryId } });
  await tx.contentTag.deleteMany({ where: { contentId, tagId: { notIn: selection.tagIds } } });
  if (selection.tagIds.length) await tx.contentTag.createMany({
    data: selection.tagIds.map((tagId) => ({ contentId, tagId, createdById: actorId })),
    skipDuplicates: true,
  });
}
