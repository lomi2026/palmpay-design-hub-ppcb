import 'dotenv/config';
import { createDatabaseAdapter } from '../src/database/connection';
import { seedDefaults } from '../src/database/seed-defaults';
import { PrismaClient } from '../src/generated/prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required to seed the development database.');
}

const prisma = new PrismaClient({ adapter: createDatabaseAdapter(connectionString) });

void seedDefaults(prisma)
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    await prisma.$disconnect();
    throw error;
  });
