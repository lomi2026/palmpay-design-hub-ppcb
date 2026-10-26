import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { guanxuConfig, createGuanxuAssertion } from '../src/lib/guanxu-sso.ts';

const env = { AUTH_MODE: 'ppcb', GUANXU_SSO_ENABLED: 'true', GUANXU_SSO_SECRET: 'a'.repeat(64),
  GUANXU_ORIGIN: 'https://guanxu.example', PPCB_PORTAL_ORIGIN: 'https://hub.example', NEXT_PUBLIC_APP_BASE_PATH: '/apps/design-hub' };
const user = { employeeId: 'ppcb:' + 'b'.repeat(64), organizationId: 'org-one', name: '测试员工', status: 'ACTIVE', permissions: ['content.read'] };
test('SSO stays disabled outside explicitly configured PPCB; rejects unsafe configuration', () => {
  assert.equal(guanxuConfig({}), null);
  assert.equal(guanxuConfig({ ...env, AUTH_MODE: 'development' }), null);
  for (const patch of [{ GUANXU_SSO_SECRET: 'short' }, { GUANXU_ORIGIN: 'http://unsafe.example' }, { NEXT_PUBLIC_APP_BASE_PATH: '//evil.example' }]) {
    assert.throws(() => guanxuConfig({ ...env, ...patch }));
  }
});
test('assertion includes verified employee scope, browser state, audience and sixty-second expiry', () => {
  const config = guanxuConfig(env), state = 'x'.repeat(43);
  const token = createGuanxuAssertion(user, state, config, 1000);
  const [header, payload, signature] = token.split('.');
  const claims = JSON.parse(Buffer.from(payload, 'base64url'));
  assert.equal(signature, createHmac('sha256', config.secret).update(`${header}.${payload}`).digest('base64url'));
  assert.equal(claims.sub, user.employeeId); assert.equal(claims.org, 'org-one');
  assert.equal(claims.nonce, state); assert.equal(claims.exp, 1060);
  assert.equal(claims.iss, 'https://hub.example/apps/design-hub'); assert.equal(claims.aud, env.GUANXU_ORIGIN);
  assert.notEqual(createGuanxuAssertion(user, state, config, 1000), token);
});
test('disabled users, missing grants, fake employee IDs and invalid state cannot sign in', () => {
  for (const patch of [{ status: 'DISABLED' }, { permissions: [] }, { employeeId: 'name-only' }]) {
    assert.throws(() => createGuanxuAssertion({ ...user, ...patch }, 'x'.repeat(43), guanxuConfig(env)));
  }
  assert.throws(() => createGuanxuAssertion(user, 'bad', guanxuConfig(env)));
});
