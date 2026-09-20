import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

function loadPage(relativePath, respond = async () => ({ items: [] })) {
  const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const pageModule = { exports: {} };
  const requests = [];
  const jsx = (type, props) => type === 'CachedWorkspacePage' ? props.children : ({ type, props });
  const imports = {
    '@/components/workspace/favorite-context': { FavoritePresence: 'FavoritePresence' },
    '@/components/workspace/navigation-cache': { CachedWorkspacePage: 'CachedWorkspacePage' },
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'Fragment' },
    '@/components/content-card': { ContentCard: 'ContentCard' },
    '@/components/workspace/engagement-controls': { FavoriteControl: 'FavoriteControl' },
    '@/components/workspace/workspace-page-hero': { WorkspacePageHero: 'Hero' },
    '@/components/workspace/workspace-empty-state': { WorkspaceEmptyState: 'EmptyState' },
    '../recent/refresh-on-entry': { RefreshRecentOnEntry: 'RefreshRecentOnEntry' },
    './personal-tabs': { PersonalTabs: 'PersonalTabs' },
    '@/lib/auth': { authenticatedApiHeaders: async () => ({ Authorization: 'Bearer scoped-session' }) },
    '@/lib/api': { serverApiFetch: async (path, init) => {
      requests.push({ path, init });
      return respond(path, init);
    } },
    'next/navigation': { redirect: (path) => { throw new Error(`redirect:${path}`); } },
  };
  runInNewContext(code, { module: pageModule, exports: pageModule.exports, require: (name) => {
    assert.ok(name in imports, `unexpected import ${name}`);
    return imports[name];
  } });
  return { page: pageModule.exports.default, requests };
}

const pagePath = '../src/app/workspace/favorites/page.tsx';

for (const tab of [undefined, 'favorites', 'unknown']) {
  test(`personal space defaults to authenticated favorites for tab=${tab}`, async () => {
    const { page, requests } = loadPage(pagePath);
    const result = await page({ searchParams: Promise.resolve({ tab }) });
    assert.equal(requests.length, 1);
    assert.equal(requests[0].path, '/api/me/favorites');
    assert.equal(requests[0].init.headers.Authorization, 'Bearer scoped-session');
    const tabs = result.props.children.find((child) => child?.type === 'PersonalTabs');
    assert.equal(tabs.props.activeTab, 'favorites');
  });
}

test('recent tab loads only permission-scoped recent views and keeps the re-entry refresh', async () => {
  const { page, requests } = loadPage(pagePath);
  const result = await page({ searchParams: Promise.resolve({ tab: 'recent' }) });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].path, '/api/me/recent-views');
  assert.equal(requests[0].init.headers.Authorization, 'Bearer scoped-session');
  assert.ok(result.props.children.some((child) => child?.type === 'RefreshRecentOnEntry'));
  const tabs = result.props.children.find((child) => child?.type === 'PersonalTabs');
  assert.equal(tabs.props.activeTab, 'recent');
});

test('selected-tab API failure is surfaced, never replaced with a false empty state', async () => {
  const denied = new Error('Forbidden');
  const { page, requests } = loadPage(pagePath, async () => { throw denied; });
  await assert.rejects(page({ searchParams: Promise.resolve({ tab: 'recent' }) }), (error) => error === denied);
  assert.equal(requests.length, 1);
});

test('old recent links redirect to the selected recent tab', () => {
  const { page } = loadPage('../src/app/workspace/recent/page.tsx');
  assert.throws(() => page(), { message: 'redirect:/workspace/favorites?tab=recent' });
});
