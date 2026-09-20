import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  write(input: {
    organizationId: string;
    actorId?: string;
    action: string;
    entityType: string;
    entityId: string;
    beforeData?: unknown;
    afterData?: unknown;
  }) {
    return this.prisma.auditLog.create({
      data: {
        ...input,
        beforeData: this.toJson(input.beforeData),
        afterData: this.toJson(input.afterData),
      },
    });
  }

  async list(organizationId: string, page = 1, pageSize = 50) {
    const where = { organizationId };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        include: { actor: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  private toJson(value: unknown): Prisma.InputJsonValue | undefined {
    if (value === undefined) return undefined;
    return JSON.parse(
      JSON.stringify(value, (_key, item: unknown) =>
        typeof item === 'bigint' ? item.toString() : item,
      ),
    ) as Prisma.InputJsonValue;
  }
}
