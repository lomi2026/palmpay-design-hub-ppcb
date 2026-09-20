import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { RoleScopeType, UserStatus } from '../generated/prisma/enums';
import type { AuthenticatedUser, ExternalIdentity } from './auth.types';

const userWithAccess = {
  userRoles: {
    include: {
      role: {
        include: {
          rolePermissions: { include: { permission: true } },
        },
      },
    },
  },
} as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async resolveUser(identity: ExternalIdentity): Promise<AuthenticatedUser> {
    const organizationCode =
      identity.organizationCode ??
      this.config.get('DEFAULT_ORGANIZATION_CODE') ??
      'palmpay-experience-design';
    const organization = await this.prisma.organization.findUnique({
      where: { code: organizationCode },
    });

    if (!organization || organization.status !== 'ACTIVE') {
      throw new UnauthorizedException('Organization is unavailable.');
    }

    let user = await this.prisma.user.findUnique({
      where: identity.ppcb
        ? { employeeId: identity.employeeId }
        : { organizationId_email: { organizationId: organization.id, email: identity.email } },
      include: userWithAccess,
    });

    if (!user && identity.ppcb?.owner) {
      user = await this.prisma.user.findUnique({
        where: { organizationId_email: { organizationId: organization.id, email: identity.email } },
        include: userWithAccess,
      });
    }

    if (!user && (identity.ppcb || this.config.get('AUTH_AUTO_PROVISION') === 'true')) {
      user = await this.provisionMember(organization.id, identity);
    }

    if (!user || user.deletedAt) {
      throw new NotFoundException('User is not provisioned.');
    }

    if (user.organizationId !== organization.id || (identity.ppcb && user.employeeId && user.employeeId !== identity.employeeId)) {
      throw new ForbiddenException('Employee account mapping does not match.');
    }

    if (user.status === UserStatus.DISABLED) {
      throw new ForbiddenException('User is disabled.');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('User is not active.');
    }

    if (identity.ppcb && !user.employeeId) {
      user = await this.prisma.user.update({ where: { id: user.id }, data: { employeeId: identity.employeeId }, include: userWithAccess });
    }

    const applicableRoles = user.userRoles.filter(
      ({ scopeType, scopeId }) =>
        (scopeType === RoleScopeType.ORGANIZATION && scopeId === user.organizationId) ||
        (scopeType === RoleScopeType.TEAM && scopeId === user.primaryTeamId),
    );
    const databasePermissionScopes = applicableRoles.flatMap(({ role, scopeType, scopeId }) =>
      role.rolePermissions.map(({ permission }) => ({
        code: permission.code,
        scopeType,
        scopeId,
      })),
    );

    const permissionScopes = identity.ppcb
      ? databasePermissionScopes.filter(({ code }) => identity.ppcb!.permissions.includes(code))
      : databasePermissionScopes;

    return {
      id: user.id,
      organizationId: user.organizationId,
      primaryTeamId: user.primaryTeamId,
      employeeId: user.employeeId,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      status: user.status,
      locale: user.locale,
      roles: applicableRoles.map(({ role, scopeType, scopeId }) => ({
        code: role.code,
        scopeType,
        scopeId,
      })),
      permissions: [...new Set(permissionScopes.map(({ code }) => code))].sort(),
      permissionScopes,
    };
  }

  private async provisionMember(organizationId: string, identity: ExternalIdentity) {
    const memberRole = await this.prisma.role.findUnique({ where: { code: identity.ppcb?.owner ? 'admin' : 'member' } });

    if (!memberRole) {
      throw new Error('System member role is missing. Run the database seed.');
    }

    const team = identity.ppcb ? await this.prisma.team.findUnique({ where: { organizationId_code: { organizationId, code: 'palmpay-experience-design' } } }) : null;

    return this.prisma.user.upsert({
      where: { organizationId_email: { organizationId, email: identity.email } },
      update: {},
      create: {
        organizationId,
        primaryTeamId: team?.id,
        email: identity.email,
        name: identity.name || identity.email.split('@')[0] || identity.email,
        employeeId: identity.employeeId,
        status: UserStatus.ACTIVE,
        userRoles: {
          create: {
            roleId: memberRole.id,
            scopeType: RoleScopeType.ORGANIZATION,
            scopeId: organizationId,
          },
        },
      },
      include: userWithAccess,
    });
  }
}
