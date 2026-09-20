import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiSecurity('development-user-email')
@UseGuards(AuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) { return this.notifications.list(user); }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: AuthenticatedUser) { return this.notifications.unreadCount(user); }

  @Patch('read-all')
  readAll(@CurrentUser() user: AuthenticatedUser) { return this.notifications.markAllRead(user); }

  @Patch(':id/read')
  read(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) { return this.notifications.markRead(user, id); }
}
