import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequirePermissions } from '../auth/permissions.decorator';
import { RbacGuard } from '../auth/rbac.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CreateUploadIntentDto } from './files.dto';
import { FilesService } from './files.service';

@ApiTags('files')
@ApiSecurity('development-user-email')
@UseGuards(AuthGuard, RbacGuard)
@Controller('files')
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Post('upload-intents')
  @RequirePermissions('content.create')
  createUploadIntent(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateUploadIntentDto) {
    return this.files.createUploadIntent(user, body);
  }

  @Post(':id/complete')
  @RequirePermissions('content.create')
  completeUpload(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.files.completeUpload(user, id);
  }

  @Get(':id/image')
  @RequirePermissions('content.read')
  image(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) { return this.files.createImageUrl(user, id); }

  @Get(':id/download')
  @RequirePermissions('content.read')
  createDownloadUrl(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.files.createDownloadUrl(user, id);
  }

  @Delete(':id')
  @RequirePermissions('content.create')
  deleteFile(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.files.deleteFile(user, id);
  }
}
