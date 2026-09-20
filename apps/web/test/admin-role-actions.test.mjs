import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function loadActions(respond = async () => ({})) {
  const source = readFileSync(new URL('../src/app/workspace/admin/actions.ts', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const requests = [];
  const actionModule = { exports: {} };
  const imports = {
    'next/cache': {
      refresh() { throw new Error('Role acknowledgement must not wait for page refresh'); },
      revalidatePath() { throw new Error('Role acknowledgement must not wait for page revalidation'); },
    },
    '@/lib/auth': { authenticatedApiHeaders: async () => ({ Authorization: 'Bearer test-session' }) },
    '@/lib/api': {
      ApiError,
      serverApiFetch: async (path, init) => {
        requests.push({ path, init });
        return respond(path, init);
      },
    },
  };
  runInNewContext(code, { module: actionModule, exports: actionModule.exports, AbortSignal, require: (name) => {
    assert.ok(name in imports, `unexpected import ${name}`);
    return imports[name];
  } });
  return { actions: actionModule.exports, requests };
}

function fields(extra = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ organizationId: 'org-test', userId: 'user-test', ...extra })) form.set(key, value);
  return form;
}

test('role grant returns a success notice after the authenticated API acknowledgement, without route reads', async () => {
  const { actions, requests } = loadActions();
  const result = await actions.assignRoleAction(fields({ roleId: 'role-test' }));
  assert.equal(result.status, 'success');
  assert.equal(result.message, '角色授予成功');
  assert.equal(requests.length, 1);
  assert.equal(requests[0].path, '/api/organizations/org-test/users/user-test/roles');
  assert.equal(requests[0].init.method, 'POST');
  assert.equal(requests[0].init.headers.Authorization, 'Bearer test-session');
  assert.ok(requests[0].init.signal instanceof AbortSignal);
  assert.deepEqual(JSON.parse(requests[0].init.body), { roleId: 'role-test', scopeType: 'ORGANIZATION', scopeId: 'org-test' });
});

test('taxonomy creation returns success immediately and preserves submitted values', async () => {
  const { actions, requests } = loadActions();
  const category = new FormData();
  category.set('name', 'Figma 插件');
  category.set('contentType', 'AI_TOOL');
  const tag = new FormData();
  tag.set('name', '设计效率');

  const categoryResult = await actions.createCategoryAction(category);
  const tagResult = await actions.createTagAction(tag);
  assert.equal(categoryResult.status, 'success');
  assert.equal(categoryResult.message, '新增分类成功');
  assert.equal(tagResult.status, 'success');
  assert.equal(tagResult.message, '新增标签成功');
  assert.equal(requests.length, 2);
  assert.equal(requests[0].path, '/api/admin/categories');
  assert.equal(requests[0].init.method, 'POST');
  assert.deepEqual(JSON.parse(requests[0].init.body), {
    name: 'Figma 插件',
    contentTypes: ['AI_TOOL'],
  });
  assert.equal(requests[1].path, '/api/admin/tags');
  assert.equal(requests[1].init.method, 'POST');
  assert.deepEqual(JSON.parse(requests[1].init.body), { name: '设计效率', contentTypes: [] });
});

test('role removal returns its own notice and targets only the selected assignment', async () => {
  const { actions, requests } = loadActions();
  const result = await actions.removeUserRoleAction(fields({ userRoleId: 'assignment-test' }));
  assert.equal(result.status, 'success');
  assert.equal(result.message, '角色移除成功');
  assert.equal(requests.length, 1);
  assert.equal(requests[0].path, '/api/organizations/org-test/users/user-test/roles/assignment-test');
  assert.equal(requests[0].init.method, 'DELETE');
});

test('empty role selection never submits a grant', async () => {
  const { actions, requests } = loadActions();
  const result = await actions.assignRoleAction(fields());
  assert.equal(result.status, 'error');
  assert.equal(result.message, '请先选择要授予的角色');
  assert.equal(requests.length, 0);
});

test('denied role grants are errors, not successful notifications', async () => {
  const { actions } = loadActions(async () => { throw new ApiError(403, 'Permission denied'); });
  const result = await actions.assignRoleAction(fields({ roleId: 'role-test' }));
  assert.equal(result.status, 'error');
  assert.match(result.message, /角色授予失败/);
});

test('interrupted role grants remain unconfirmed and are not automatically retried', async () => {
  const { actions, requests } = loadActions(async () => { throw new Error('connection interrupted'); });
  const result = await actions.assignRoleAction(fields({ roleId: 'role-test' }));
  assert.equal(result.status, 'error');
  assert.match(result.message, /角色授予结果暂未确认/);
  assert.equal(requests.length, 1);
});
