import { createDatabaseAdapter } from './database/connection';
import { initializePpcbRuntime } from './database/ppcb-runtime-initialization';
import { PrismaClient } from './generated/prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required to initialize PPCB defaults.');
const prisma = new PrismaClient({ adapter: createDatabaseAdapter(connectionString) });

async function main() {
  try {
    const result = await initializePpcbRuntime(prisma);
    console.log(JSON.stringify({ event: 'ppcb-runtime-initialization', ...result }));
  } finally {
    await prisma.$disconnect();
  }
}

void main();
