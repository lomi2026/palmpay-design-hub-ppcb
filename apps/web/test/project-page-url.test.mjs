import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

const target = { exports: {} };
const source = readFileSync(new URL('../src/lib/ai-projects.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
runInNewContext(compiled, { exports: target.exports, module: target, URL });
const { getProjectPageUrl } = target.exports;
const oldRoot = 'https://lomi2026.github.io/palmpay-design-intelligence/projects/project-detail.html';
const newRoot = 'https://lomi2026.github.io/palmpay-design-hub-ppcb/projects/project-detail.html';

test('all 33 persisted legacy links resolve to deployed project pages without database changes', () => {
  const snapshotSource = readFileSync(new URL('../../api/src/database/ppcb-data/published-content-snapshot.ts', import.meta.url), 'utf8');
  const urls = [...snapshotSource.matchAll(/"legacyProjectUrl"\s*:\s*"([^"]+)"/g)].map(match => match[1]);
  assert.equal(urls.length, 33);
  for (const url of urls) assert.equal(getProjectPageUrl(url), url.replace(oldRoot, newRoot));
});

test('existing new links, unrelated projects and unknown IDs are preserved', () => {
  for (const url of [undefined, 'invalid', newRoot + '?id=P01', oldRoot + '?id=P27', oldRoot + '?id=S08', oldRoot, 'https://example.com/projects?id=P01', oldRoot.replace('lomi2026.github.io', 'lomi2026.github.io.example.com') + '?id=P01']) {
    assert.equal(getProjectPageUrl(url), url);
  }
  assert.equal(getProjectPageUrl(''), undefined);
  assert.equal(getProjectPageUrl(oldRoot + '?id=P01&from=hub#chapter-1'), newRoot + '?id=P01&from=hub#chapter-1');
});
