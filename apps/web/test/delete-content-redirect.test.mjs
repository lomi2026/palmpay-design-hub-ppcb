import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

function loadAction() {
  const source = readFileSync(new URL('../src/app/workspace/delete-content-action.ts', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const requests = [];
  const redirects = [];
  const revalidations = [];
  const actionModule = { exports: {} };
  const imports = {
    'next/navigation': {
      redirect(path) {
        redirects.push(path);
        throw new Error(`NEXT_REDIRECT:${path}`);
      },
    },
    'next/cache': {
      revalidatePath(path, type) { revalidations.push({ path, type }); },
    },
    '@/lib/auth': { authenticatedApiHeaders: async () => ({ Authorization: 'Bearer test-session' }) },
    '@/lib/api': {
      serverApiFetch: async (path, init) => {
        requests.push({ path, init });
        return {};
      },
    },
    '@/lib/user-error': { userError: () => '删除未完成，请刷新后重试。' },
  };
  runInNewContext(code, { module: actionModule, exports: actionModule.exports, AbortSignal, require: (name) => {
    assert.ok(name in imports, `unexpected import ${name}`);
    return imports[name];
  } });
  return { action: actionModule.exports.deleteContentAction, requests, redirects, revalidations };
}

function deletion(returnTo) {
  const form = new FormData();
  form.set('contentId', 'design-asset-a4');
  if (returnTo) form.set('returnTo', returnTo);
  return form;
}

test('detail deletion redirects server-side to the trusted design asset catalog', async () => {
  const { action, requests, redirects, revalidations } = loadAction();
  await assert.rejects(
    action({}, deletion('/workspace/design-assets')),
    /NEXT_REDIRECT:\/workspace\/design-assets/,
  );
  assert.equal(requests.length, 1);
  assert.equal(requests[0].path, '/api/content-drafts/design-asset-a4');
  assert.equal(requests[0].init.method, 'DELETE');
  assert.equal(redirects[0], '/workspace/design-assets');
  assert.equal(revalidations[0].path, '/workspace');
  assert.equal(revalidations[0].type, 'layout');
});

test('content deletion never redirects to an untrusted return address', async () => {
  const { action, redirects } = loadAction();
  const result = await action({}, deletion('https://example.com/phishing'));
  assert.equal(result.deleted, true);
  assert.equal(redirects.length, 0);
});

test('delete button submits every provided catalog return route', () => {
  const component = readFileSync(new URL('../src/components/workspace/delete-content-button.tsx', import.meta.url), 'utf8');
  assert.match(component, /redirectTo \? <input type="hidden" name="returnTo" value=\{redirectTo\}/);
  assert.doesNotMatch(component, /redirectTo === ["']\/workspace\/contributions["']/);
});
