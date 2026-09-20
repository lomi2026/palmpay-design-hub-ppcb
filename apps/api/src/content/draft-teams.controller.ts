import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequirePermissions } from '../auth/permissions.decorator';
import { RbacGuard } from '../auth/rbac.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import { DraftsService } from './drafts.service';

@ApiTags('content drafts')
@ApiSecurity('development-user-email')
@UseGuards(AuthGuard, RbacGuard)
@Controller('content-draft-teams')
export class DraftTeamsController {
  constructor(private readonly drafts: DraftsService) {}

  @Get()
  @RequirePermissions('content.create')
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.drafts.availableTeams(user);
  }
}
