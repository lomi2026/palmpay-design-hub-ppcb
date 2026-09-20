import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
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
  AssignUserRoleDto,
  UpdateTeamDto,
  CreateTeamDto,
  CreateUserDto,
  UpdateUserStatusDto,
  UpdateUserDto,
  UpdateUserNameDto,
  UserListQueryDto,
} from './identity.dto';
import { IdentityService } from './identity.service';

@ApiTags('identity')
@ApiSecurity('development-user-email')
@UseGuards(AuthGuard, RbacGuard)
@Controller('organizations/:organizationId')
export class IdentityController {
  constructor(private readonly identity: IdentityService) {}

  @Get()
  getOrganization(
    @Param('organizationId', new ParseUUIDPipe()) organizationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.assertOrganization(user, organizationId);
    return this.identity.getOrganization(organizationId);
  }

  @Get('teams')
  @RequirePermissions('user.manage')
  listTeams(
    @Param('organizationId', new ParseUUIDPipe()) organizationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.assertOrganization(user, organizationId);
    return this.identity.listTeams(organizationId);
  }

  @Post('teams')
  @RequirePermissions('user.manage')
  createTeam(@Param('organizationId', new ParseUUIDPipe()) organizationId: string, @Body() input: CreateTeamDto, @CurrentUser() user: AuthenticatedUser) {
    this.assertOrganization(user, organizationId);
    return this.identity.createTeam(organizationId, input, user.id);
  }

  @Delete('teams/:teamId')
  @RequirePermissions('user.manage')
  deleteTeam(@Param('organizationId', new ParseUUIDPipe()) organizationId: string, @Param('teamId', new ParseUUIDPipe()) teamId: string, @CurrentUser() user: AuthenticatedUser) {
    this.assertOrganization(user, organizationId);
    return this.identity.deleteTeam(organizationId, teamId, user.id);
  }

  @Patch('teams/:teamId')
  @RequirePermissions('user.manage')
  updateTeam(
    @Param('organizationId', new ParseUUIDPipe()) organizationId: string,
    @Param('teamId', new ParseUUIDPipe()) teamId: string,
    @Body() input: UpdateTeamDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.assertOrganization(user, organizationId);
    return this.identity.updateTeam(organizationId, teamId, input, user.id);
  }

  @Post('users')
  @RequirePermissions('user.manage')
  createUser(@Param('organizationId', new ParseUUIDPipe()) organizationId: string, @Body() input: CreateUserDto, @CurrentUser() user: AuthenticatedUser) {
    this.assertOrganization(user, organizationId);
    return this.identity.createUser(organizationId, input, user.id);
  }

  @Delete('users/:userId')
  @RequirePermissions('user.manage')
  deleteUser(@Param('organizationId', new ParseUUIDPipe()) organizationId: string, @Param('userId', new ParseUUIDPipe()) userId: string, @CurrentUser() user: AuthenticatedUser) {
    this.assertOrganization(user, organizationId);
    return this.identity.deleteUser(organizationId, userId, user.id);
  }

  @Get('users')
  @RequirePermissions('user.manage')
  listUsers(
    @Param('organizationId', new ParseUUIDPipe()) organizationId: string,
    @Query() query: UserListQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.assertOrganization(user, organizationId);
    return this.identity.listUsers(organizationId, query);
  }

  @Get('users/:userId')
  @RequirePermissions('user.manage')
  getUser(
    @Param('organizationId', new ParseUUIDPipe()) organizationId: string,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.assertOrganization(user, organizationId);
    return this.identity.getUser(organizationId, userId);
  }

  @Patch('users/:userId')
  @RequirePermissions('user.manage')
  updateUser(
    @Param('organizationId', new ParseUUIDPipe()) organizationId: string,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() input: UpdateUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.assertOrganization(user, organizationId);
    return this.identity.updateUser(organizationId, userId, input, user.id);
  }

  @Patch('users/:userId/name')
  @RequirePermissions('user.manage')
  updateUserName(
    @Param('organizationId', new ParseUUIDPipe()) organizationId: string,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() input: UpdateUserNameDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.assertOrganization(user, organizationId);
    return this.identity.updateUserName(organizationId, userId, input, user.id);
  }

  @Patch('users/:userId/status')
  @RequirePermissions('user.manage')
  updateUserStatus(
    @Param('organizationId', new ParseUUIDPipe()) organizationId: string,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() input: UpdateUserStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.assertOrganization(user, organizationId);
    return this.identity.updateUserStatus(organizationId, userId, input, user.id);
  }

  @Get('roles')
  @RequirePermissions('user.manage')
  listRoles(
    @Param('organizationId', new ParseUUIDPipe()) organizationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.assertOrganization(user, organizationId);
    return this.identity.listRoles(organizationId);
  }

  @Post('users/:userId/roles')
  @RequirePermissions('user.manage')
  assignUserRole(
    @Param('organizationId', new ParseUUIDPipe()) organizationId: string,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() input: AssignUserRoleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.assertOrganization(user, organizationId);
    return this.identity.assignUserRole(organizationId, userId, input, user.id);
  }

  @Delete('users/:userId/roles/:userRoleId')
  @RequirePermissions('user.manage')
  removeUserRole(
    @Param('organizationId', new ParseUUIDPipe()) organizationId: string,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Param('userRoleId', new ParseUUIDPipe()) userRoleId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.assertOrganization(user, organizationId);
    return this.identity.removeUserRole(organizationId, userId, userRoleId, user.id);
  }

  private assertOrganization(user: AuthenticatedUser, organizationId: string) {
    if (user.organizationId !== organizationId)
      throw new ForbiddenException('Cross-organization access is denied.');
  }
}

@ApiTags('identity')
@ApiSecurity('development-user-email')
@UseGuards(AuthGuard, RbacGuard)
@Controller('permissions')
export class PermissionController {
  constructor(private readonly identity: IdentityService) {}

  @Get()
  @RequirePermissions('user.manage')
  listPermissions() {
    return this.identity.listPermissions();
  }
}
