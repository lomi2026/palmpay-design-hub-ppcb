import type { PrismaClient } from '../generated/prisma/client';
import { seedDefaults } from './seed-defaults';

/** Bootstrap a new environment only; existing business data and grants are never reseeded. */
export async function initializePpcbRuntime(prisma: PrismaClient) {
  return prisma.$transaction(async (transaction) => {
    await transaction.$executeRawUnsafe('SELECT pg_advisory_xact_lock(645345321024)');
    const organization = await transaction.organization.findUnique({
      where: { code: 'palmpay-experience-design' },
    });
    if (organization) return { initialized: false, reason: 'Existing organization preserved.' };
    await seedDefaults(transaction);
    return { initialized: true, reason: 'Created empty environment defaults.' };
  }, { timeout: 30_000 });
}
