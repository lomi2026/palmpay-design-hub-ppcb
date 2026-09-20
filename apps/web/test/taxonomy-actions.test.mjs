import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

function actions() {
  const source = readFileSync(new URL('../src/app/workspace/submit/actions.ts', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const requests = [];
  const revalidated = [];
  const actionModule = { exports: {} };
  const imports = {
    '@/lib/auth': { authenticatedApiHeaders: async () => ({ Authorization: 'test' }) },
    '@/lib/api': { serverApiFetch: async (path, init) => { requests.push({ path, ...init }); return path.endsWith('/publish') ? { contentType: 'AI_SKILL' } : { id: 'draft' }; } },
    'next/cache': { revalidatePath: (path) => revalidated.push(path) },
    'next/navigation': { redirect: () => {} },
  };
  runInNewContext(code, { File, FormData, module: actionModule, exports: actionModule.exports, require: (name) => imports[name] });
  return { actions: actionModule.exports, requests, revalidated };
}

test('create, autosave and preview all submit the category and multiple tag IDs', async () => {
  const f = new FormData();
  f.set('id', 'draft'); f.set('contentType', 'AI_SKILL'); f.set('title', 'test'); f.set('categoryId', 'category');
  f.append('tagIds', 'tag-1'); f.append('tagIds', 'tag-2');
  f.set('teamId', '11111111-1111-4111-8111-111111111111');
  const a = actions();
  await a.actions.createDraftAction({}, f);
  await a.actions.autosaveDraftAction({}, f);
  await a.actions.saveAndPreviewDraftAction(f);
  assert.equal(a.requests.length, 3);
  assert.deepEqual(a.revalidated, ['/workspace/submit/draft']);
  for (const request of a.requests) {
    const body = JSON.parse(request.body);
    assert.equal(body.categoryId, 'category');
    assert.deepEqual(body.tagIds, ['tag-1', 'tag-2']);
    assert.equal(request.headers.Authorization, 'test');
  }
});

test('cleared category and tags are sent explicitly, not omitted on save', async () => {
  const f = new FormData(); f.set('id', 'draft'); f.set('contentType', 'AI_SKILL'); f.set('title', 'test');
  const a = actions(); await a.actions.autosaveDraftAction({}, f);
  const body = JSON.parse(a.requests[0].body);
  assert.equal(body.categoryId, null);
  assert.deepEqual(body.tagIds, []);
});

test('publish saves the latest form snapshot and publishes it in one API request', async () => {
  const f = new FormData();
  f.set('id', 'draft'); f.set('contentType', 'AI_SKILL'); f.set('title', 'Latest title');
  f.set('promptTemplate', 'Latest prompt'); f.append('tagIds', 'tag-1');
  const a = actions();
  const result = await a.actions.publishDraftAction({}, f);
  assert.equal(a.requests.length, 1);
  assert.equal(a.requests[0].path, '/api/content-drafts/draft/publish');
  assert.equal(a.requests[0].method, 'POST');
  assert.equal(a.requests[0].headers['Content-Type'], 'application/json');
  const body = JSON.parse(a.requests[0].body);
  assert.equal(body.title, 'Latest title');
  assert.equal(body.body.promptTemplate, 'Latest prompt');
  assert.deepEqual(body.tagIds, ['tag-1']);
  assert.equal(result.publishedHref, '/workspace/ai-skills');
  assert.deepEqual(a.revalidated, ['/workspace']);
});

test('published acknowledgement ends before the catalog navigation and prevents repeat publishing', () => {
  const editor = readFileSync(new URL('../src/app/workspace/submit/draft-editor.tsx', import.meta.url), 'utf8');
  assert.match(editor, /router\.replace\(publishState\.publishedHref\)/);
  assert.doesNotMatch(editor, /router\.refresh\(\)/);
  assert.match(editor, /inert=\{publishing \|\| published \|\| previewing\}/);
  assert.match(editor, /发布成功，正在打开…/);
});

test('catalog options exclude disabled records while draft controls preserve selected historical values', () => {
  const filters = readFileSync(new URL('../src/components/workspace/catalog-filter-controls.tsx', import.meta.url), 'utf8');
  const fields = readFileSync(new URL('../src/components/workspace/taxonomy-fields.tsx', import.meta.url), 'utf8');
  const editor = readFileSync(new URL('../src/app/workspace/submit/draft-editor.tsx', import.meta.url), 'utf8');
  assert.match(filters, /category\?\.status === 'ACTIVE'/);
  assert.match(filters, /tag.status === 'ACTIVE'/);
  assert.match(fields, /contentTypes.includes\(contentType\)/);
  assert.match(fields, /tag\.contentTypes\.includes\(contentType\).*\|\| tagIds.includes\(tag.id\)/);
  assert.match(fields, /已停用/);
  assert.match(editor, /onResetCapture/);
  assert.match(editor, /onChange=\{scheduleAutosave\}/);
});


test('AI tool creation, autosave and preview preserve dedicated tool fields', async () => {
  const f = new FormData();
  for (const [key, value] of Object.entries({ id: 'draft', contentType: 'AI_TOOL', title: 'Tool', websiteUrl: 'https://example.test', vendor: 'Team', platforms: 'Web\nMobile', scenarios: 'Design', usageGuide: 'Steps', limitations: 'Limits', pricingModel: 'Free' })) f.set(key, value);
  f.set('teamId', '11111111-1111-4111-8111-111111111111');
  const a = actions();
  await a.actions.createDraftAction({}, f);
  await a.actions.autosaveDraftAction({}, f);
  await a.actions.saveAndPreviewDraftAction(f);
  assert.equal(a.requests.length, 3);
  assert.deepEqual(a.revalidated, ['/workspace/submit/draft']);
  for (const request of a.requests) {
    const body = JSON.parse(request.body).body;
    assert.equal(body.websiteUrl, 'https://example.test');
    assert.equal(body.vendor, 'Team');
    assert.deepEqual(body.platforms, ['Web', 'Mobile']);
    assert.equal(body.usageGuide, 'Steps');
    assert.equal(body.limitations, 'Limits');
    assert.equal(body.pricingModel, 'Free');
    assert.equal(body.projectCode, undefined);
  }
});
