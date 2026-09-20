import { createHash, randomUUID } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Client } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) throw new Error('DATABASE_URL is required to apply PPCB migrations.');

const migrationsRoot = resolve(__dirname, '../prisma/migrations');
const migrationLock = 645345321024;
const client = new Client({ connectionString });

async function main() {
  await client.connect();
  await client.query('SELECT pg_advisory_lock($1)', [migrationLock]);

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        "id" VARCHAR(36) PRIMARY KEY NOT NULL,
        "checksum" VARCHAR(64) NOT NULL,
        "finished_at" TIMESTAMPTZ,
        "migration_name" VARCHAR(255) NOT NULL,
        "logs" TEXT,
        "rolled_back_at" TIMESTAMPTZ,
        "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "applied_steps_count" INTEGER NOT NULL DEFAULT 0
      )
    `);

    const entries = await readdir(migrationsRoot, { withFileTypes: true });
    const migrationNames = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    for (const migrationName of migrationNames) {
      const sql = await readFile(resolve(migrationsRoot, migrationName, 'migration.sql'), 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const existing = await client.query<{
        checksum: string;
        finished_at: Date | null;
        rolled_back_at: Date | null;
      }>(
        'SELECT checksum, finished_at, rolled_back_at FROM "_prisma_migrations" WHERE migration_name = $1 ORDER BY started_at DESC LIMIT 1',
        [migrationName],
      );

      const record = existing.rows[0];
      if (record) {
        if (!record.finished_at || record.rolled_back_at) {
          throw new Error(`Migration ${migrationName} is not in a completed state.`);
        }
        if (record.checksum !== checksum) {
          throw new Error(`Migration ${migrationName} differs from the applied migration.`);
        }
        continue;
      }

      await client.query('BEGIN');
      try {
        const id = randomUUID();
        await client.query(
          'INSERT INTO "_prisma_migrations" (id, checksum, migration_name) VALUES ($1, $2, $3)',
          [id, checksum, migrationName],
        );
        await client.query(sql);
        await client.query(
          'UPDATE "_prisma_migrations" SET finished_at = now(), applied_steps_count = 1 WHERE id = $1',
          [id],
        );
        await client.query('COMMIT');
        console.log(`Applied migration ${migrationName}.`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [migrationLock]);
    await client.end();
  }
}

void main();
