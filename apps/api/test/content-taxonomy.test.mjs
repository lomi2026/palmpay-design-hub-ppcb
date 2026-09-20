import assert from 'node:assert/strict';
import test from 'node:test';
import { taxonomySnapshot, validateTaxonomy, withTaxonomy } from '../dist/content/content-taxonomy.js';

const category = { id: 'category', status: 'ACTIVE', contentTypes: ['DESIGN_ASSET'] };
const tag = { id: 'tag', status: 'ACTIVE' };
const empty = { categoryId: null, tagIds: [] };
function database(categoryValue = category, tagValue = tag) {
  return {
    category: { findFirst: async ({ where }) => where.organizationId === 'org' ? categoryValue : null },
    tag: { findMany: async ({ where }) => where.organizationId === 'org' && tagValue ? [tagValue] : [] },
  };
}

test('legacy snapshots fall back to relations; explicit clearing is preserved', () => {
  const content = { categoryId: 'category', tags: [{ tagId: 'tag' }] };
  assert.deepEqual(taxonomySnapshot({}, content), { categoryId: 'category', tagIds: ['tag'] });
  assert.deepEqual(taxonomySnapshot({ taxonomy: empty }, content), empty);
});

test('client body cannot smuggle taxonomy past the dedicated validated fields', () => {
  assert.deepEqual(withTaxonomy({ title: 'body', taxonomy: { categoryId: 'forged', tagIds: ['forged'] } }, empty), { title: 'body', taxonomy: empty });
});

test('new selection validates status, content type and organization', async () => {
  const selected = { categoryId: 'category', tagIds: ['tag'] };
  await validateTaxonomy(database(), 'org', 'DESIGN_ASSET', selected);
  await assert.rejects(validateTaxonomy(database(), 'other-org', 'DESIGN_ASSET', selected), /分类/);
  await assert.rejects(validateTaxonomy(database(), 'org', 'AI_SKILL', selected), /分类/);
  await assert.rejects(validateTaxonomy(database({ ...category, status: 'DISABLED' }), 'org', 'DESIGN_ASSET', selected), /分类/);
  await assert.rejects(validateTaxonomy(database(category, { ...tag, status: 'DISABLED' }), 'org', 'DESIGN_ASSET', selected), /标签/);
  await assert.rejects(validateTaxonomy(database(category, null), 'org', 'DESIGN_ASSET', selected), /标签/);
});

test('existing disabled relations can be retained or removed, not newly added', async () => {
  const selected = { categoryId: 'category', tagIds: ['tag'] };
  const tx = database({ ...category, status: 'DISABLED' }, { ...tag, status: 'DISABLED' });
  await validateTaxonomy(tx, 'org', 'DESIGN_ASSET', selected, selected);
  await validateTaxonomy(tx, 'org', 'DESIGN_ASSET', empty, selected);
  await assert.rejects(validateTaxonomy(tx, 'other-org', 'DESIGN_ASSET', selected, selected), /分类/);
  await assert.rejects(validateTaxonomy(tx, 'org', 'DESIGN_ASSET', selected, empty), /分类/);
});

test('tag page scope rejects new cross-type links but preserves historical links', async () => {
  const selection = { categoryId: null, tagIds: ['tag'] };
  const tx = database(category, { ...tag, contentTypes: ['AI_SKILL'] });
  await validateTaxonomy(tx, 'org', 'AI_SKILL', selection);
  await assert.rejects(validateTaxonomy(tx, 'org', 'AI_CASE', selection), /不适用于此内容类型/);
  await validateTaxonomy(tx, 'org', 'AI_CASE', selection, selection);
  await validateTaxonomy(database(category, { ...tag, contentTypes: [] }), 'org', 'AI_CASE', selection);
  await assert.rejects(validateTaxonomy(tx, 'other-org', 'AI_SKILL', selection), /标签/);
});
