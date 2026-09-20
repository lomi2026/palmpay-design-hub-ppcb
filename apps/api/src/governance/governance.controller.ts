import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequirePermissions } from '../auth/permissions.decorator';
import { RbacGuard } from '../auth/rbac.guard';
import { EngagementService } from '../engagement/engagement.service';
import { AnalyticsService } from './analytics.service';
import { AuditService } from './audit.service';
import {
  AdminContentQueryDto,
  CreateCategoryDto,
  CreateTagDto,
  PaginationDto,
  RecordEventDto,
  UpdateCategoryDto,
  UpdateTagDto,
} from './governance.dto';
import { GovernanceService } from './governance.service';

@ApiTags('analytics')
@ApiSecurity('development-user-email')
@UseGuards(AuthGuard, RbacGuard)
@Controller()
export class AnalyticsController {
  constructor(
    private readonly analytics: AnalyticsService,
    private readonly engagement: EngagementService,
  ) {}

  @Get('analytics/overview')
  @RequirePermissions('analytics.read')
  overview(@CurrentUser() user: AuthenticatedUser) {
    return this.analytics.overview(user);
  }

  @Get('analytics/insights')
  @RequirePermissions('analytics.read')
  insights(@CurrentUser() user: AuthenticatedUser) {
    return this.analytics.insights(user);
  }

  @Post('events')
  @RequirePermissions('content.read')
  record(@CurrentUser() user: AuthenticatedUser, @Body() body: RecordEventDto) {
    return this.engagement.recordEvent(
      user,
      body.eventType,
      body.contentId,
      body.sourcePage ? { sourcePage: body.sourcePage } : undefined,
      Boolean(body.contentId),
    );
  }
}

@ApiTags('administration')
@ApiSecurity('development-user-email')
@UseGuards(AuthGuard, RbacGuard)
@Controller('admin')
export class GovernanceController {
  constructor(
    private readonly governance: GovernanceService,
    private readonly audit: AuditService,
  ) {}

  @Get('contents')
  @RequirePermissions('content.edit_all')
  contents(@CurrentUser() user: AuthenticatedUser, @Query() query: AdminContentQueryDto) {
    return this.governance.listContent(user, query);
  }

  @Get('categories')
  @RequirePermissions('taxonomy.manage')
  categories(@CurrentUser() user: AuthenticatedUser) {
    return this.governance.listCategories(user);
  }

  @Post('categories')
  @RequirePermissions('taxonomy.manage')
  createCategory(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateCategoryDto) {
    return this.governance.createCategory(user, body);
  }

  @Patch('categories/:categoryId')
  @RequirePermissions('taxonomy.manage')
  updateCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('categoryId') categoryId: string,
    @Body() body: UpdateCategoryDto,
  ) {
    return this.governance.updateCategory(user, categoryId, body);
  }

  @Get('tags')
  @RequirePermissions('taxonomy.manage')
  tags(@CurrentUser() user: AuthenticatedUser) {
    return this.governance.listTags(user);
  }

  @Post('tags')
  @RequirePermissions('taxonomy.manage')
  createTag(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateTagDto) {
    return this.governance.createTag(user, body);
  }

  @Patch('tags/:tagId')
  @RequirePermissions('taxonomy.manage')
  updateTag(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tagId') tagId: string,
    @Body() body: UpdateTagDto,
  ) {
    return this.governance.updateTag(user, tagId, body);
  }

  @Delete('categories/:categoryId')
  @RequirePermissions('taxonomy.manage')
  deleteCategory(@CurrentUser() user: AuthenticatedUser, @Param('categoryId') categoryId: string) {
    return this.governance.deleteCategory(user, categoryId);
  }

  @Delete('tags/:tagId')
  @RequirePermissions('taxonomy.manage')
  deleteTag(@CurrentUser() user: AuthenticatedUser, @Param('tagId') tagId: string) {
    return this.governance.deleteTag(user, tagId);
  }

  @Get('audit-logs')
  @RequirePermissions('audit.read')
  auditLogs(@CurrentUser() user: AuthenticatedUser, @Query() query: PaginationDto) {
    return this.audit.list(user.organizationId, query.page, query.pageSize);
  }
}
