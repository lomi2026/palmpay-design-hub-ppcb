import assert from 'node:assert/strict';
import test from 'node:test';

import {
  classifyCurrentUserFailure,
  currentUserRequestTimeoutMs,
} from '../src/lib/auth-failure.ts';

test('authentication statuses invalidate the current session', () => {
  for (const status of [401, 403, 404]) {
    assert.equal(classifyCurrentUserFailure({ status }), 'unauthenticated');
  }
});

test('transport, timeout, throttling and server errors remain recoverable', () => {
  for (const error of [
    { name: 'AbortError' },
    { name: 'TimeoutError' },
    new TypeError('fetch failed'),
    { status: 408 },
    { status: 429 },
    { status: 500 },
    { status: 503 },
  ]) {
    assert.equal(classifyCurrentUserFailure(error), 'unavailable');
  }
});

test('unexpected client and programming errors are not hidden', () => {
  assert.equal(classifyCurrentUserFailure({ status: 400 }), 'unexpected');
  assert.equal(classifyCurrentUserFailure(new Error('unexpected')), 'unexpected');
});

test('the external test environment allows for a sleeping API', () => {
  assert.equal(currentUserRequestTimeoutMs('test'), 70_000);
  assert.equal(currentUserRequestTimeoutMs('development'), 12_000);
  assert.equal(currentUserRequestTimeoutMs('oidc'), 12_000);
});
