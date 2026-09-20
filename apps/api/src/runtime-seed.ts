import { createDatabaseAdapter } from './database/connection';
import { importPpcbPublishedContent } from './database/ppcb-published-content-import';
import { importPpcbPublishedFiles } from './database/ppcb-published-file-import';
import { seedDefaults } from './database/seed-defaults';
import { PrismaClient } from './generated/prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) throw new Error('DATABASE_URL is required to initialize PPCB defaults.');

const prisma = new PrismaClient({ adapter: createDatabaseAdapter(connectionString) });

async function main() {
  try {
    await prisma.$transaction(
      async (transaction) => {
        await transaction.$executeRawUnsafe('SELECT pg_advisory_xact_lock(645345321024)');
        await seedDefaults(transaction);
      },
      { timeout: 30_000 },
    );
    const result = await importPpcbPublishedContent(prisma);
    console.log(JSON.stringify({ event: 'ppcb-published-content-import', ...result }));
    try {
      const files = await importPpcbPublishedFiles(prisma);
      console.log(JSON.stringify({ event: 'ppcb-published-file-import', ...files }));
    } catch (error) {
      // Bundled covers are optional startup data. Keep the application available
      // when PPCB file storage is temporarily unavailable so catalog, login and
      // database behavior can still be verified in the isolated environment.
      console.error(
        JSON.stringify({
          event: 'ppcb-published-file-import-skipped',
          reason: error instanceof Error ? error.message : 'Unknown file import error.',
        }),
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

void main();
