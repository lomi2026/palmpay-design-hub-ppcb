import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import pg from 'pg';
import { PrismaClient } from '../dist/generated/prisma/client.js';
import { createDatabaseAdapter } from '../dist/database/connection.js';
import { initializePpcbRuntime } from '../dist/database/ppcb-runtime-initialization.js';
import { importPpcbPublishedContent } from '../dist/database/ppcb-published-content-import.js';

const connection = process.env.PPCB_INITIALIZATION_TEST_DATABASE_URL;
for (const schema of ['test_app_release_check', 'app_release_check']) {
  test(`startup preserves edited content and grants in ${schema}`, { skip: !connection }, async () => {
    const url = new URL(connection);
    assert.match(url.pathname, /^\/palmpay_ppcb_release_check_[a-z0-9_]+$/);
    assert.ok(['localhost', '127.0.0.1'].includes(url.hostname));
    const client = new pg.Client({ connectionString: connection });
    await client.connect();
    let prisma;
    const previous = { AUTH_MODE: process.env.AUTH_MODE, PPCB_DB_SCHEMA: process.env.PPCB_DB_SCHEMA };
    try {
      await client.query(`CREATE SCHEMA "${schema}"`);
      url.searchParams.set('options', `-c search_path=${schema}`);
      const migrated = spawnSync(process.execPath, ['dist/runtime-migrate.js'], { cwd: new URL('../', import.meta.url), env: { ...process.env, DATABASE_URL: url.toString() }, encoding: 'utf8' });
      assert.equal(migrated.status, 0, migrated.stderr);
      process.env.AUTH_MODE = 'ppcb'; process.env.PPCB_DB_SCHEMA = schema;
      prisma = new PrismaClient({ adapter: createDatabaseAdapter(connection) });
      // Simultaneous fresh startup must bootstrap once, with no historical content.
      const initial = await Promise.all([initializePpcbRuntime(prisma), initializePpcbRuntime(prisma)]);
      assert.equal(initial.filter(result => result.initialized).length, 1);
      assert.equal(await prisma.content.count(), 0);
      assert.equal(await prisma.role.count(), 3);
      // Seed a historical catalog only as a test fixture, then simulate real edits.
      await importPpcbPublishedContent(prisma);
      const content = await prisma.content.findFirstOrThrow();
      await prisma.content.update({ where: { id: content.id }, data: { title: 'Edited after migration', status: 'ARCHIVED', archivedAt: new Date('2026-09-20T00:00:00Z') } });
      await prisma.contentVersion.update({ where: { id: content.currentVersionId }, data: { body: { userEdited: true } } });
      const category = await prisma.category.findFirstOrThrow();
      await prisma.category.update({ where: { id: category.id }, data: { name: 'Custom category' } });
      const role = await prisma.role.findUniqueOrThrow({ where: { code: 'member' } });
      await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
      await client.query(`SET search_path TO "${schema}"`);
      const tables = (await client.query("SELECT tablename FROM pg_tables WHERE schemaname=$1 ORDER BY tablename", [schema])).rows;
      async function snapshot() {
        const data = {};
        for (const { tablename } of tables) {
          const quoted = '"' + tablename.replaceAll('"', '""') + '"';
          data[tablename] = (await client.query(`SELECT row_to_json(t)::text AS row FROM ${quoted} t ORDER BY row_to_json(t)::text`)).rows;
        }
        return data;
      }
      const before = await snapshot();
      // Execute the actual compiled startup entry twice, not just the helper.
      for (let i = 0; i < 2; i++) {
        const restarted = spawnSync(process.execPath, ['dist/runtime-seed.js'], { cwd: new URL('../', import.meta.url), env: { ...process.env, DATABASE_URL: url.toString(), PPCB_MESSAGE_SERVICE_TOKEN: 'not-used-by-normal-startup' }, encoding: 'utf8' });
        assert.equal(restarted.status, 0, restarted.stderr);
        assert.match(restarted.stdout, /"initialized":false/);
        assert.doesNotMatch(restarted.stdout + restarted.stderr, /published-content-import|published-file-import/);
      }
      assert.deepEqual(await snapshot(), before, 'Startup must not change any existing database rows');
    } finally {
      if (prisma) await prisma.$disconnect();
      await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      await client.end();
      for (const [key, value] of Object.entries(previous)) value === undefined ? delete process.env[key] : process.env[key] = value;
    }
  });
}
