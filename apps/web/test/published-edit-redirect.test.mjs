import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

function loadAction({ fail = false } = {}) {
  const source = readFileSync(new URL('../src/app/workspace/submit/actions.ts', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const requests = [];
  const redirects = [];
  const actionModule = { exports: {} };
  const imports = {
    '@/lib/auth': { authenticatedApiHeaders: async () => ({ Authorization: 'test-session' }) },
    '@/lib/api': {
      serverApiFetch: async (path, init) => {
        requests.push({ path, init });
        if (fail) throw new Error('API unavailable');
        return { id: 'draft/with space' };
      },
    },
    '@/lib/user-error': { userError: () => '无法创建编辑草稿。' },
    '@/app/workspace/submit/attachment-actions': { uploadDraftAttachmentAction: async () => ({}) },
    './attachment-actions': { uploadDraftAttachmentAction: async () => ({}) },
    'next/cache': { revalidatePath: () => {} },
    'next/navigation': {
      redirect(path) {
        redirects.push(path);
        throw new Error(`NEXT_REDIRECT:${path}`);
      },
    },
  };
  runInNewContext(code, {
    File,
    FormData,
    module: actionModule,
    exports: actionModule.exports,
    require(name) {
      assert.ok(name in imports, `unexpected import ${name}`);
      return imports[name];
    },
  });
  return { action: actionModule.exports.createPublishedEditDraftAction, redirects, requests };
}

function editForm() {
  const form = new FormData();
  form.set('id', 'design-asset-a4');
  return form;
}

test('published content edit redirects server-side after creating the draft', async () => {
  const { action, redirects, requests } = loadAction();
  await assert.rejects(
    action({}, editForm()),
    /NEXT_REDIRECT:\/workspace\/submit\/draft%2Fwith%20space/,
  );
  assert.equal(requests.length, 1);
  assert.equal(requests[0].path, '/api/content-drafts/design-asset-a4/from-published');
  assert.equal(requests[0].init.method, 'POST');
  assert.equal(redirects[0], '/workspace/submit/draft%2Fwith%20space');
});

test('published content edit keeps the current page and shows an API error', async () => {
  const { action, redirects } = loadAction({ fail: true });
  const result = await action({}, editForm());
  assert.equal(result.error, '无法创建编辑草稿。');
  assert.equal(redirects.length, 0);
});

test('managed published edit returns a confirmed draft for feedback before navigation', async () => {
  const { action, redirects, requests } = loadAction();
  const form = editForm(); form.set('__managedCache', 'true');
  const result = await action({}, form);
  assert.equal(result.id, 'draft/with space');
  assert.equal(redirects.length, 0);
  assert.equal(requests.length, 1);
});
