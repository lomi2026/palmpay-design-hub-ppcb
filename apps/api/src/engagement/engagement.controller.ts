import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequirePermissions } from '../auth/permissions.decorator';
import { RbacGuard } from '../auth/rbac.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import {
  CreateContentRelationDto,
  CreateUsageConfirmationDto,
  SearchClickDto,
  SearchQueryDto,
} from './engagement.dto';
import { EngagementService } from './engagement.service';

@ApiTags('search and engagement')
@ApiSecurity('development-user-email')
@UseGuards(AuthGuard, RbacGuard)
@RequirePermissions('content.read')
@Controller()
export class EngagementController {
  constructor(private readonly engagement: EngagementService) {}

  @Get('search')
  search(@CurrentUser() user: AuthenticatedUser, @Query() query: SearchQueryDto) {
    return this.engagement.search(user, query);
  }

  @Patch('search/:searchLogId/click')
  click(
    @CurrentUser() user: AuthenticatedUser,
    @Param('searchLogId') searchLogId: string,
    @Body() body: SearchClickDto,
  ) {
    return this.engagement.recordSearchClick(user, searchLogId, body.contentId);
  }

  @Get('me/favorites')
  favorites(@CurrentUser() user: AuthenticatedUser) {
    return this.engagement.listFavorites(user);
  }

  @Get('me/recent-views')
  recentViews(@CurrentUser() user: AuthenticatedUser) {
    return this.engagement.listRecentViews(user);
  }

  @Post('contents/:contentId/favorite')
  addFavorite(@CurrentUser() user: AuthenticatedUser, @Param('contentId') contentId: string) {
    return this.engagement.addFavorite(user, contentId);
  }

  @Delete('contents/:contentId/favorite')
  removeFavorite(@CurrentUser() user: AuthenticatedUser, @Param('contentId') contentId: string) {
    return this.engagement.removeFavorite(user, contentId);
  }

  @Post('contents/:contentId/usage-confirmations')
  confirmUsage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('contentId') contentId: string,
    @Body() body: CreateUsageConfirmationDto,
  ) {
    return this.engagement.confirmUsage(user, contentId, body);
  }

  @Get('contents/:contentId/usage-summary')
  usageSummary(@CurrentUser() user: AuthenticatedUser, @Param('contentId') contentId: string) {
    return this.engagement.usageSummary(user, contentId);
  }

  @Get('contents/:contentId/relations')
  relations(@CurrentUser() user: AuthenticatedUser, @Param('contentId') contentId: string) {
    return this.engagement.listRelations(user, contentId);
  }

  @Post('contents/:contentId/relations')
  createRelation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('contentId') contentId: string,
    @Body() body: CreateContentRelationDto,
  ) {
    return this.engagement.createRelation(user, contentId, body);
  }

  @Delete('contents/:contentId/relations/:relationId')
  removeRelation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('contentId') contentId: string,
    @Param('relationId') relationId: string,
  ) {
    return this.engagement.removeRelation(user, contentId, relationId);
  }
}
