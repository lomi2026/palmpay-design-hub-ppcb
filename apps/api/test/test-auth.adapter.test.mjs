import assert from 'node:assert/strict';
import test from 'node:test';
import { AuthController } from '../dist/auth/auth.controller.js';
import { DevelopmentAuthAdapter } from '../dist/auth/development-auth.adapter.js';
import { TestAuthAdapter } from '../dist/auth/test-auth.adapter.js';

const sessionSecret = 'test-session-secret-with-at-least-32-characters';

function adapterWith(values) {
  return new TestAuthAdapter({
    get(key) {
      return values[key];
    },
  });
}

test('test authentication signs a short-lived passwordless bearer session and rejects forged input', () => {
  const adapter = adapterWith({
    AUTH_MODE: 'test',
    TEST_AUTH_SESSION_SECRET: sessionSecret,
    TEST_AUTH_SESSION_TTL_SECONDS: '300',
  });

  const session = adapter.issueSession({ email: ' Test.User@Example.Test ' });
  const identity = adapter.authenticate({
    headers: { authorization: `Bearer ${session.accessToken}` },
  });

  assert.equal(identity.email, 'test.user@example.test');
  assert.throws(
    () => adapter.authenticate({ headers: { authorization: 'Bearer v1.forged.signature' } }),
    { message: 'The test session is invalid.' },
  );
  assert.throws(
    () => adapter.authenticate({ headers: { authorization: `Bearer ${session.accessToken}.extra` } }),
    { message: 'The test session is invalid.' },
  );
});

test('passwordless test sessions still require a resolvable active user', async () => {
  let issuedFor;
  const controller = new AuthController(
    {
      async resolveUser({ email }) {
        assert.equal(email, 'test.user@example.test');
        return { email };
      },
    },
    {
      isEnabled() {
        return true;
      },
      issueSession({ email }) {
        issuedFor = email;
        return { accessToken: 'signed-session', expiresAt: '2026-08-30T12:00:00.000Z' };
      },
    },
  );

  const session = await controller.createTestSession({ email: ' Test.User@Example.Test ' });
  assert.equal(issuedFor, 'test.user@example.test');
  assert.equal(session.accessToken, 'signed-session');
});

test('passwordless test sessions are not issued when user resolution fails', async () => {
  let issued = false;
  const controller = new AuthController(
    {
      async resolveUser() {
        throw new Error('User is not provisioned.');
      },
    },
    {
      isEnabled() {
        return true;
      },
      issueSession() {
        issued = true;
      },
    },
  );

  await assert.rejects(
    () => controller.createTestSession({ email: 'unknown@example.test' }),
    { message: 'User is not provisioned.' },
  );
  assert.equal(issued, false);
});

test('test mode can construct the unused development adapter in production without enabling it', () => {
  const adapter = new DevelopmentAuthAdapter({
    get(key) {
      return key === 'NODE_ENV' ? 'production' : undefined;
    },
  });

  assert.throws(
    () => adapter.authenticate({ headers: { 'x-dev-user-email': 'forged@example.test' } }),
    { message: 'The development authentication adapter cannot run in production. Configure an enterprise OIDC adapter.' },
  );
});
