import 'dotenv/config';
import { createDatabaseAdapter } from '../src/database/connection';
import { PrismaClient } from '../src/generated/prisma/client';
import { RoleScopeType, UserStatus } from '../src/generated/prisma/enums';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required to bootstrap the test environment.');
}

const adminEmail = process.env.TEST_BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
if (!adminEmail) {
  throw new Error('TEST_BOOTSTRAP_ADMIN_EMAIL is required to bootstrap the test environment.');
}

const organizationCode = process.env.DEFAULT_ORGANIZATION_CODE ?? 'palmpay-experience-design';
const adminName = process.env.TEST_BOOTSTRAP_ADMIN_NAME?.trim() || 'PalmPay Test Administrator';
const teamCode = 'palmpay-experience-design';
const teamName = 'PalmPay Experience Design';
const acceptanceUsers = [
  { email: adminEmail, name: adminName, roles: ['member', 'manager', 'admin'] },
  { email: 'lomi2025@126.com', name: 'PalmPay Test Contributor', roles: ['member'] },
  { email: 'lomi2024@126.com', name: 'PalmPay Test Member', roles: ['member'] },
] as const;

const prisma = new PrismaClient({ adapter: createDatabaseAdapter(connectionString) });

async function main() {
  const organization = await prisma.organization.findUnique({ where: { code: organizationCode } });
  if (!organization) {
    throw new Error(`Organization not found: ${organizationCode}. Run prisma:seed first.`);
  }

  const roles = await prisma.role.findMany({
    where: { code: { in: ['admin', 'manager', 'member'] } },
  });
  const rolesByCode = new Map(roles.map((role) => [role.code, role]));
  if (rolesByCode.size !== 4) {
    throw new Error('System roles are missing. Run prisma:seed first.');
  }

  const administrator = await prisma.user.upsert({
    where: { organizationId_email: { organizationId: organization.id, email: adminEmail } },
    create: {
      organizationId: organization.id,
      email: adminEmail,
      name: adminName,
      status: UserStatus.ACTIVE,
    },
    update: {
      status: UserStatus.ACTIVE,
      deletedAt: null,
    },
  });

  const team = await prisma.team.upsert({
    where: { organizationId_code: { organizationId: organization.id, code: teamCode } },
    create: {
      organizationId: organization.id,
      code: teamCode,
      name: teamName,
      ownerId: administrator.id,
    },
    update: { ownerId: administrator.id, status: 'ACTIVE' },
  });

  for (const acceptanceUser of acceptanceUsers) {
    const user = await prisma.user.upsert({
      where: {
        organizationId_email: {
          organizationId: organization.id,
          email: acceptanceUser.email,
        },
      },
      create: {
        organizationId: organization.id,
        primaryTeamId: team.id,
        email: acceptanceUser.email,
        name: acceptanceUser.name,
        status: UserStatus.ACTIVE,
      },
      update: {
        primaryTeamId: team.id,
        name: acceptanceUser.name,
        status: UserStatus.ACTIVE,
        deletedAt: null,
      },
    });

    await Promise.all(
      acceptanceUser.roles.map((roleCode) => {
        const role = rolesByCode.get(roleCode);
        if (!role) throw new Error(`Missing required role: ${roleCode}`);
        return prisma.userRole.upsert({
          where: {
            userId_roleId_scopeType_scopeId: {
              userId: user.id,
              roleId: role.id,
              scopeType: RoleScopeType.ORGANIZATION,
              scopeId: organization.id,
            },
          },
          create: {
            userId: user.id,
            roleId: role.id,
            scopeType: RoleScopeType.ORGANIZATION,
            scopeId: organization.id,
          },
          update: {},
        });
      }),
    );
  }

  console.log(
    JSON.stringify({
      organization: organization.code,
      team: team.code,
      users: acceptanceUsers.map(({ email, roles }) => ({ email, roles })),
    }),
  );
}

void main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    await prisma.$disconnect();
    throw error;
  });
