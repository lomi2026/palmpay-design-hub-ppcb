import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { RoleScopeType, UserStatus } from '../generated/prisma/enums';
import type {
  AssignUserRoleDto,
  UpdateTeamDto,
  CreateTeamDto,
  CreateUserDto,
  UpdateUserStatusDto,
  UpdateUserDto,
  UpdateUserNameDto,
  UserListQueryDto,
} from './identity.dto';
import { AuditService } from '../governance/audit.service';

const userDetails = {
  primaryTeam: { select: { id: true, name: true, code: true } },
  userRoles: {
    include: {
      role: { include: { rolePermissions: { include: { permission: true } } } },
    },
  },
} as const;

@Injectable()
export class IdentityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getOrganization(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!organization) throw new NotFoundException('Organization not found.');
    return organization;
  }

  async listTeams(organizationId: string) {
    return this.prisma.team.findMany({
      where: { organizationId },
      include: {
        owner: { select: { id: true, name: true, email: true, status: true } },
        _count: { select: { members: true } },
      },
      orderBy: [{ name: 'asc' }],
    });
  }

  async deleteUser(organizationId: string, userId: string, actorId: string) {
    if (userId === actorId) throw new BadRequestException('不能删除当前登录的账号。');
    return this.prisma.$transaction(async tx => {
      const user = await tx.user.findFirst({ where: { id: userId, organizationId, deletedAt: null } });
      if (!user) throw new NotFoundException('用户不存在或已删除。');
      const [contents, teams] = await Promise.all([
        tx.content.count({ where: { organizationId, ownerId: userId, deletedAt: null } }),
        tx.team.count({ where: { organizationId, ownerId: userId } }),
      ]);
      if (contents) throw new ConflictException('该用户仍负责内容，请先在停用操作中选择接任人并完成内容转移，再删除账号。');
      if (teams) throw new ConflictException('该用户仍是团队负责人，请先在团队管理中更换负责人。');
      await tx.userRole.deleteMany({ where: { userId } });
      await tx.user.update({ where: { id: userId }, data: { deletedAt: new Date(), status: UserStatus.DISABLED, primaryTeamId: null } });
      await tx.auditLog.create({ data: { organizationId, actorId, action: 'user.delete', entityType: 'user', entityId: userId, beforeData: { name: user.name, email: user.email }, afterData: { deleted: true } } });
      return { deleted: true };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async createUser(organizationId: string, input: CreateUserDto, actorId: string) {
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    if (!name) throw new BadRequestException('请填写用户姓名。');
    try {
      return await this.prisma.$transaction(async tx => {
        const [existing, team, role] = await Promise.all([
          tx.user.findFirst({ where: { organizationId, email: { equals: email, mode: 'insensitive' } } }),
          tx.team.findFirst({ where: { id: input.teamId, organizationId, status: 'ACTIVE' } }),
          tx.role.findFirst({ where: { id: input.roleId, OR: [{ organizationId: null }, { organizationId }] } }),
        ]);
        if (existing && !existing.deletedAt) throw new ConflictException('该邮箱已存在，请在用户列表中管理现有账号。');
        if (!team) throw new BadRequestException('请选择当前组织内已启用的团队。');
        if (!role) throw new BadRequestException('请选择当前组织可用的角色。');
        if (existing) await tx.userRole.deleteMany({ where: { userId: existing.id } });
        const data = {
          organizationId, name, email, primaryTeamId: team.id, status: UserStatus.ACTIVE,
          userRoles: { create: { roleId: role.id, scopeType: RoleScopeType.ORGANIZATION, scopeId: organizationId, createdBy: actorId } },
        };
        const created = existing
          ? await tx.user.update({ where: { id: existing.id }, data: { ...data, deletedAt: null }, include: userDetails })
          : await tx.user.create({ data, include: userDetails });
        await tx.auditLog.create({ data: { organizationId, actorId, action: existing ? 'user.restore' : 'user.create', entityType: 'user', entityId: created.id, afterData: { name, email, primaryTeamId: team.id, roleId: role.id, scopeType: 'ORGANIZATION', status: 'ACTIVE' } } });
        return created;
      });
    } catch (error) {
      if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') throw new ConflictException('该邮箱已存在，请在用户列表中管理现有账号。');
      throw error;
    }
  }

  async createTeam(organizationId: string, input: CreateTeamDto, actorId: string) {
    const name = input.name.trim();
    if (!name) throw new BadRequestException('请填写团队名称。');
    if (input.ownerId && !await this.prisma.user.findFirst({ where: { id: input.ownerId, organizationId, deletedAt: null, status: 'ACTIVE' } })) throw new BadRequestException('请选择当前组织内的有效负责人。');
    const created = await this.prisma.team.create({ data: { organizationId, name, code: `team-${randomUUID()}`, ownerId: input.ownerId } });
    await this.audit.write({ organizationId, actorId, action: 'team.create', entityType: 'team', entityId: created.id, afterData: created });
    return created;
  }

  async deleteTeam(organizationId: string, teamId: string, actorId: string) {
    const deleted = await this.prisma.$transaction(async tx => {
      await tx.$queryRaw(Prisma.sql`SELECT id FROM teams WHERE id = ${teamId}::uuid AND organization_id = ${organizationId}::uuid FOR UPDATE`);
      const team = await tx.team.findFirst({ where: { id: teamId, organizationId }, include: { _count: { select: { members: true, contents: true, children: true, suggestedProjects: true } } } });
      if (!team) throw new NotFoundException('团队不存在或已删除。');
      if (Object.values(team._count).some(count => count > 0)) throw new ConflictException('该团队仍有关联成员、内容或项目，请先调整归属；暂不使用可选择停用。');
      await tx.team.delete({ where: { id: teamId } });
      return team;
    });
    await this.audit.write({ organizationId, actorId, action: 'team.delete', entityType: 'team', entityId: teamId, beforeData: deleted });
    return { deleted: true };
  }

  async updateTeam(organizationId: string, teamId: string, input: UpdateTeamDto, actorId: string) {
    if (input.name === undefined && input.ownerId === undefined && input.status === undefined) {
      throw new BadRequestException('At least one team field must be provided.');
    }

    if (input.name !== undefined && !input.name.trim()) throw new BadRequestException('请填写团队名称。');
    const team = await this.prisma.team.findFirst({ where: { id: teamId, organizationId } });
    if (!team) throw new NotFoundException('Team not found.');

    if (input.ownerId) {
      const owner = await this.prisma.user.findFirst({
        where: { id: input.ownerId, organizationId, deletedAt: null },
      });
      if (!owner) throw new BadRequestException('Team owner must belong to the same organization.');
    }

    const updated = await this.prisma.team.update({
      where: { id: teamId },
      data: { name: input.name, ownerId: input.ownerId, status: input.status },
    });
    await this.audit.write({
      organizationId,
      actorId,
      action: 'team.update',
      entityType: 'team',
      entityId: teamId,
      beforeData: team,
      afterData: updated,
    });
    return updated;
  }

  async listUsers(organizationId: string, query: UserListQueryDto) {
    const where = {
      organizationId,
      deletedAt: null,
      status: query.status,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' as const } },
              { email: { contains: query.search, mode: 'insensitive' as const } },
              { employeeId: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        include: userDetails,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip,
        take: query.pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, page: query.page, pageSize: query.pageSize, total };
  }

  async getUser(organizationId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, organizationId, deletedAt: null },
      include: userDetails,
    });
    if (!user) throw new NotFoundException('User not found.');
    return user;
  }

  async updateUserName(organizationId: string, userId: string, input: UpdateUserNameDto, actorId: string) {
    const name = input.name.trim();
    if (!name) throw new BadRequestException('请填写用户姓名。');
    return this.prisma.$transaction(async tx => {
      const existing = await tx.user.findFirst({ where: { id: userId, organizationId, deletedAt: null } });
      if (!existing) throw new NotFoundException('用户不存在或已删除。');
      const updated = await tx.user.update({ where: { id: userId }, data: { name }, include: userDetails });
      await tx.auditLog.create({ data: { organizationId, actorId, action: 'user.update', entityType: 'user', entityId: userId, beforeData: { name: existing.name }, afterData: { name } } });
      return updated;
    });
  }

  async updateUser(organizationId: string, userId: string, input: UpdateUserDto, actorId: string) {
    const name = input.name.trim();
    if (!name || name.length > 100) throw new BadRequestException('Invalid user name.');
    return this.saveUser(organizationId, userId, input, actorId, name);
  }

  async updateUserStatus(
    organizationId: string,
    userId: string,
    input: UpdateUserStatusDto,
    actorId: string,
  ) {
    return this.saveUser(organizationId, userId, input, actorId);
  }

  private async saveUser(
    organizationId: string,
    userId: string,
    input: UpdateUserStatusDto & { email?: string; teamId?: string | null },
    actorId: string,
    name?: string,
  ) {
    const result = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.user.findFirst({ where: { id: userId, organizationId, deletedAt: null }, include: userDetails });
      if (!existing) throw new NotFoundException('User not found.');
      const email = input.email?.trim().toLowerCase();
      if (email && email !== existing.email) {
        const duplicate = await tx.user.findFirst({ where: { organizationId, id: { not: userId }, email: { equals: email, mode: 'insensitive' } }, select: { id: true } });
        if (duplicate) throw new ConflictException('该邮箱已被使用，请更换邮箱。');
      }
      if (input.teamId && input.teamId !== existing.primaryTeamId) {
        const team = await tx.team.findFirst({ where: { id: input.teamId, organizationId, status: 'ACTIVE' }, select: { id: true } });
        if (!team) throw new BadRequestException('请选择当前组织内已启用的团队。');
      }
      const disabling = input.status === UserStatus.DISABLED && existing.status !== UserStatus.DISABLED;
      const ownedContent = disabling
        ? await tx.content.findMany({
            where: { organizationId, ownerId: userId, deletedAt: null },
            select: { id: true, title: true, slug: true, status: true },
            orderBy: { updatedAt: 'desc' },
          })
        : [];
      if (ownedContent.length > 0 && !input.replacementOwnerId) {
        throw new ConflictException({
          code: 'CONTENT_OWNERSHIP_TRANSFER_REQUIRED',
          message: 'Select an active replacement owner before disabling this user.',
          ownedContentCount: ownedContent.length,
          ownedContent: ownedContent.slice(0, 20),
        });
      }

      if (ownedContent.length > 0) {
        if (input.replacementOwnerId === userId) {
          throw new BadRequestException('The replacement owner must be a different user.');
        }
        const replacementOwner = await tx.user.findFirst({
          where: {
            id: input.replacementOwnerId,
            organizationId,
            status: UserStatus.ACTIVE,
            deletedAt: null,
          },
          select: {
            id: true,
            primaryTeamId: true,
            userRoles: {
              select: {
                scopeType: true,
                scopeId: true,
                role: {
                  select: {
                    rolePermissions: {
                      select: { permission: { select: { code: true } } },
                    },
                  },
                },
              },
            },
          },
        });
        if (!replacementOwner) {
          throw new BadRequestException(
            'The replacement owner must be an active user in the same organization.',
          );
        }
        const canOwnContent = replacementOwner.userRoles.some(
          ({ scopeType, scopeId, role }) =>
            ((scopeType === RoleScopeType.ORGANIZATION && scopeId === organizationId) ||
              (scopeType === RoleScopeType.TEAM && scopeId === replacementOwner.primaryTeamId)) &&
            role.rolePermissions.some(({ permission }) =>
              ['content.edit_own', 'content.edit_all'].includes(permission.code),
            ),
        );
        if (!canOwnContent) {
          throw new BadRequestException(
            'The replacement owner must have an applicable content editing permission.',
          );
        }
        const transferred = await tx.content.updateMany({
          where: { organizationId, ownerId: userId, deletedAt: null },
          data: { ownerId: replacementOwner.id },
        });
        if (transferred.count !== ownedContent.length) {
          throw new ConflictException('Content ownership changed during the disable operation.');
        }
        await tx.auditLog.create({
          data: {
            organizationId,
            actorId,
            action: 'content.owner.transfer',
            entityType: 'content_ownership',
            entityId: userId,
            beforeData: {
              ownerId: userId,
              contentIds: ownedContent.map((content) => content.id),
            },
            afterData: {
              ownerId: replacementOwner.id,
              contentIds: ownedContent.map((content) => content.id),
            },
          },
        });
      }

      const updated = await tx.user.update({
        where: { id: userId },
        data: { status: input.status, ...(name !== undefined ? { name } : {}), ...(email !== undefined ? { email } : {}), ...(input.teamId !== undefined ? { primaryTeamId: input.teamId } : {}) },
      });
      await tx.auditLog.create({
        data: {
          organizationId,
          actorId,
          action: input.status === UserStatus.DISABLED ? 'user.disable' : name !== undefined ? 'user.update' : 'user.status.update',
          entityType: 'user',
          entityId: userId,
          beforeData: JSON.parse(JSON.stringify(existing)) as Prisma.InputJsonValue,
          afterData: JSON.parse(JSON.stringify(updated)) as Prisma.InputJsonValue,
        },
      });
      return {
        updated,
        transferredContentIds: ownedContent.map((content) => content.id),
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return result.updated;
  }

  listPermissions() {
    return this.prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { code: 'asc' }] });
  }

  listRoles(organizationId: string) {
    return this.prisma.role.findMany({
      where: { OR: [{ organizationId: null }, { organizationId }] },
      include: { rolePermissions: { include: { permission: true } } },
      orderBy: [{ isSystem: 'desc' }, { code: 'asc' }],
    });
  }

  async assignUserRole(
    organizationId: string,
    userId: string,
    input: AssignUserRoleDto,
    actorId: string,
  ) {
    const [user, role] = await Promise.all([
      this.prisma.user.findFirst({ where: { id: userId, organizationId, deletedAt: null } }),
      this.prisma.role.findFirst({
        where: { id: input.roleId, OR: [{ organizationId: null }, { organizationId }] },
      }),
    ]);
    if (!user) throw new NotFoundException('User not found.');
    if (!role) throw new NotFoundException('Role not found.');

    await this.validateRoleScope(organizationId, input.scopeType, input.scopeId);

    try {
      const assignment = await this.prisma.userRole.create({
        data: {
          userId,
          roleId: input.roleId,
          scopeType: input.scopeType,
          scopeId: input.scopeId,
          createdBy: actorId,
        },
        include: { role: true },
      });
      await this.audit.write({
        organizationId,
        actorId,
        action: 'user.role.assign',
        entityType: 'user_role',
        entityId: assignment.id,
        afterData: assignment,
      });
      return assignment;
    } catch (error: unknown) {
      if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') {
        throw new ConflictException('User role assignment already exists.');
      }
      throw error;
    }
  }

  async removeUserRole(
    organizationId: string,
    userId: string,
    userRoleId: string,
    actorId: string,
  ) {
    const assignment = await this.prisma.userRole.findFirst({
      where: { id: userRoleId, userId, user: { organizationId, deletedAt: null } },
    });
    if (!assignment) throw new NotFoundException('User role assignment not found.');
    await this.prisma.userRole.delete({ where: { id: userRoleId } });
    await this.audit.write({
      organizationId,
      actorId,
      action: 'user.role.remove',
      entityType: 'user_role',
      entityId: userRoleId,
      beforeData: assignment,
    });
    return { deleted: true };
  }

  private async validateRoleScope(
    organizationId: string,
    scopeType: RoleScopeType,
    scopeId: string,
  ) {
    if (scopeType === RoleScopeType.ORGANIZATION) {
      if (scopeId !== organizationId)
        throw new BadRequestException('Organization role scope must match the user organization.');
      return;
    }

    const team = await this.prisma.team.findFirst({ where: { id: scopeId, organizationId } });
    if (!team)
      throw new BadRequestException('Team role scope must belong to the user organization.');
  }
}
