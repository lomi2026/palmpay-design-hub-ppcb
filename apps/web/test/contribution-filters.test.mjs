import assert from 'node:assert/strict';
import test from 'node:test';
import { filterContributions } from '../src/app/workspace/contributions/filters.ts';
const items = [
  { title: 'Web 表单', summary: '输入规范', status: 'PUBLISHED', category: { id: 'forms' }, draftVersion: { versionStatus: 'DRAFT' } },
  { title: '表单草稿', summary: null, status: 'DRAFT', category: { id: 'forms' } },
  { title: 'AI 工具', summary: 'WEB research', status: 'ARCHIVED', category: null },
];
test('search is trimmed and case insensitive across title and summary', () => {
  assert.equal(filterContributions(items, { search: '  web ' }).length, 2);
});
test('category and publication filters compose with search', () => {
  assert.deepEqual(filterContributions(items, { categoryId: 'forms', status: 'PUBLISHED', search: '规范' }), [items[0]]);
  assert.deepEqual(filterContributions(items, { categoryId: 'uncategorized' }), [items[2]]);
});
test('published content with an editing draft stays in published results', () => {
  assert.deepEqual(filterContributions(items, { status: 'DRAFT' }), [items[1]]);
  assert.deepEqual(filterContributions(items, { status: 'PUBLISHED' }), [items[0]]);
});
test('empty filters retain all items and unmatched filters return no results', () => {
  assert.deepEqual(filterContributions(items, {}), items);
  assert.deepEqual(filterContributions(items, { search: 'missing' }), []);
});
