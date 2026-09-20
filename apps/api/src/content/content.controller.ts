import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { OptionalAuthGuard } from '../auth/optional-auth.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import { ContentListQueryDto } from './content.dto';
import { ContentService } from './content.service';

@ApiTags('content catalog')
@ApiSecurity('development-user-email')
@UseGuards(OptionalAuthGuard)
@Controller('contents')
export class ContentController {
  constructor(private readonly contents: ContentService) {}

  @Get()
  list(@Query() query: ContentListQueryDto, @CurrentUser() user?: AuthenticatedUser) {
    return this.contents.list(query, user);
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string, @CurrentUser() user?: AuthenticatedUser) {
    return this.contents.getBySlug(slug, user);
  }
}
