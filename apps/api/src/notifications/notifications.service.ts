import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: AuthenticatedUser) {
    const [items, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { receiverId: user.id, NOT: { type: { startsWith: 'review_' } } },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.prisma.notification.count({ where: { receiverId: user.id, NOT: { type: { startsWith: 'review_' } }, readAt: null } }),
    ]);
    return { items, unreadCount };
  }

  async unreadCount(user: AuthenticatedUser) {
    return {
      unreadCount: await this.prisma.notification.count({
        where: { receiverId: user.id, NOT: { type: { startsWith: 'review_' } }, readAt: null },
      }),
    };
  }

  async markRead(user: AuthenticatedUser, id: string) {
    const updated = await this.prisma.notification.updateMany({ where: { id, receiverId: user.id, NOT: { type: { startsWith: 'review_' } }, readAt: null }, data: { readAt: new Date() } });
    if (updated.count) return { id, read: true };
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundException('Notification was not found.');
    if (notification.receiverId !== user.id) throw new ForbiddenException('You cannot read this notification.');
    return { id, read: true };
  }

  async markAllRead(user: AuthenticatedUser) {
    await this.prisma.notification.updateMany({ where: { receiverId: user.id, NOT: { type: { startsWith: 'review_' } }, readAt: null }, data: { readAt: new Date() } });
    return { read: true };
  }
}
