import assert from 'node:assert/strict';
import test from 'node:test';
import { appPath } from '../src/lib/app-path.ts';

test('native URLs stay in their build environment and do not double-prefix', () => {
  for (const base of ['/apps/hub-test', '/apps/hub', '']) {
    process.env.NEXT_PUBLIC_APP_BASE_PATH = base;
    assert.equal(appPath('/api/me'), `${base}/api/me`);
    assert.equal(appPath(`${base}/workspace`), `${base}/workspace`);
    assert.equal(appPath('https://example.test/file'), 'https://example.test/file');
  }
  delete process.env.NEXT_PUBLIC_APP_BASE_PATH;
});
