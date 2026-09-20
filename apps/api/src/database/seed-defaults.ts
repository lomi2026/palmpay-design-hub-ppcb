import type { Prisma, PrismaClient } from '../generated/prisma/client';

type SeedClient = PrismaClient | Prisma.TransactionClient;

const permissions = [
  ['content.read', 'content', '读取内容'],
  ['content.create', 'content', '创建内容'],
  ['content.edit_own', 'content', '编辑自己的内容'],
  ['content.edit_all', 'content', '编辑全部内容'],
  ['content.unpublish', 'content', '下架内容'],
  ['content.archive', 'content', '归档内容'],
  ['analytics.read', 'analytics', '查看数据洞察'],
  ['user.manage', 'user', '管理用户'],
  ['taxonomy.manage', 'taxonomy', '管理分类和标签'],
  ['audit.read', 'audit', '查看审计日志'],
  ['ai.execute', 'ai', '执行 AI Skill'],
  ['ai.manage', 'ai', '管理 AI 配置'],
] as const;

const roles = [
  ['member', '设计成员'],
  ['admin', '平台管理员'],
  ['manager', '设计管理者'],
] as const;

const rolePermissions: Record<(typeof roles)[number][0], readonly string[]> = {
  member: ['content.read', 'content.create', 'content.edit_own', 'ai.execute'],
  admin: permissions.map(([code]) => code),
  manager: ['content.read', 'analytics.read'],
};

export async function seedDefaults(prisma: SeedClient) {
  const organization = await prisma.organization.upsert({
    where: { code: 'palmpay-experience-design' },
    create: { code: 'palmpay-experience-design', name: 'PalmPay Experience Design' },
    update: {},
  });

  if (process.env.AUTH_MODE === 'ppcb') {
    await prisma.team.upsert({
      where: { organizationId_code: { organizationId: organization.id, code: 'palmpay-experience-design' } },
      create: { organizationId: organization.id, code: 'palmpay-experience-design', name: 'PalmPay Experience Design' },
      update: {},
    });
  }

  const seededPermissions = await Promise.all(
    permissions.map(([code, module, name]) =>
      prisma.permission.upsert({
        where: { code },
        create: { code, module, name },
        update: { module, name },
      }),
    ),
  );

  const seededRoles = await Promise.all(
    roles.map(([code, name]) =>
      prisma.role.upsert({
        where: { code },
        create: { code, name, isSystem: true },
        update: { name, isSystem: true },
      }),
    ),
  );

  const permissionIdByCode = new Map(
    seededPermissions.map((permission) => [permission.code, permission.id]),
  );
  await Promise.all(
    seededRoles.flatMap((role) =>
      rolePermissions[role.code as keyof typeof rolePermissions].map((permissionCode) =>
        prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permissionIdByCode.get(permissionCode)!,
            },
          },
          create: { roleId: role.id, permissionId: permissionIdByCode.get(permissionCode)! },
          update: {},
        }),
      ),
    ),
  );

  await Promise.all([
    prisma.category.upsert({
      where: { organizationId_code: { organizationId: organization.id, code: 'design-assets' } },
      create: {
        organizationId: organization.id,
        code: 'design-assets',
        name: '设计资产',
        contentTypes: ['DESIGN_ASSET'],
      },
      update: { name: '设计资产' },
    }),
    prisma.category.upsert({
      where: { organizationId_code: { organizationId: organization.id, code: 'ai-skills' } },
      create: {
        organizationId: organization.id,
        code: 'ai-skills',
        name: 'AI Skill',
        contentTypes: ['AI_SKILL'],
      },
      update: { name: 'AI Skill' },
    }),
    prisma.category.upsert({
      where: { organizationId_code: { organizationId: organization.id, code: 'ai-cases' } },
      create: {
        organizationId: organization.id,
        code: 'ai-cases',
        name: 'AI 案例',
        contentTypes: ['AI_CASE'],
      },
      update: { name: 'AI 案例' },
    }),
    prisma.category.upsert({
      where: { organizationId_code: { organizationId: organization.id, code: 'ai-projects' } },
      create: {
        organizationId: organization.id,
        code: 'ai-projects',
        name: 'AI 项目库',
        contentTypes: ['AI_PROJECT'],
      },
      update: { name: 'AI 项目库' },
    }),
  ]);
}
