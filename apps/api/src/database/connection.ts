import { PrismaPg } from '@prisma/adapter-pg';

export function createDatabaseAdapter(connectionString: string) {
  const schema = process.env.PPCB_DB_SCHEMA || process.env.PPCB_DATABASE_SCHEMA;
  if (!schema) {
    if (process.env.AUTH_MODE === 'ppcb') throw new Error('PPCB database schema is required.');
    return new PrismaPg({ connectionString });
  }
  if (!/^(test_)?app_[a-z0-9_]+$/.test(schema)) throw new Error('Invalid PPCB database schema.');
  const url = new URL(connectionString);
  url.searchParams.delete('sslmode');
  url.searchParams.delete('ssl');
  url.searchParams.delete('options');
  return new PrismaPg({ connectionString: url.toString(), ssl: false, options: `-c search_path=${schema}` }, { schema });
}
