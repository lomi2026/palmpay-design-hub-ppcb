import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const source = readFileSync(new URL('../src/governance/analytics.service.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, experimentalDecorators: true } }).outputText;
const exports = {};
new Function('require', 'exports', compiled)((id) => id === '@nestjs/common' ? { Injectable: () => target => target } : id.includes('enums') ? { ContentStatus: { PUBLISHED: 'PUBLISHED' } } : {}, exports);
async function overview(records) {
  const service = new exports.AnalyticsService({
    content: {
      groupBy: async args => args.by[0] === 'createdById' ? [{ createdById: 'one' }, { createdById: 'two' }] : [],
      findMany: async args => {
        assert.deepEqual(args.where, { organizationId: 'org', contentType: 'AI_CASE', status: 'PUBLISHED', deletedAt: null });
        assert.deepEqual(args.select, { currentVersion: { select: { body: true } } });
        return records;
      },
    },
    usageEvent: { groupBy: async () => [], count: async () => 0 },
    favorite: { count: async () => 0 },
  });
  return service.overview({ organizationId: 'org' });
}
test('counts only formal snapshots with both validation fields, independently of contributor count', async () => {
  const bodies = [{ validationMethod: '样本对照', dataResult: '耗时减少20%' }, { validationMethod: '复核', dataResult: '  ' }, { dataResult: '20%' }, { validationMethod: {}, dataResult: '20%' }, null];
  const result = await overview(bodies.map(body => ({ currentVersion: { body } })));
  assert.equal(result.casesWithValidationRecords, 1);
  assert.equal(result.publishedCases, 5);
  assert.equal(result.contributors, 2);
});
test('no published cases yields zero numerator and denominator', async () => {
  const result = await overview([]);
  assert.equal(result.casesWithValidationRecords, 0);
  assert.equal(result.publishedCases, 0);
});
