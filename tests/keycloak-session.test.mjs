import assert from 'node:assert/strict';
import test from 'node:test';
import { keycloakLogoutUrl, isKeycloakSessionActive } from '../src/lib/keycloak-session.ts';

const env = {
  AUTH_URL: 'https://aio.example.test',
  AUTH_KEYCLOAK_ISSUER: 'https://identity.example.test/realms/test',
  AUTH_KEYCLOAK_ID: 'web',
  AUTH_KEYCLOAK_SECRET: 'test-secret',
};
const check = (request) => isKeycloakSessionActive('test-refresh-token', env.AUTH_KEYCLOAK_ISSUER, 'web', env, request);

test('local identity stack supports HTTP only on exact loopback hosts', () => {
  const local = {
    ...env,
    AUTH_URL: 'http://localhost:3000',
    AUTH_KEYCLOAK_ISSUER: 'http://localhost:8080/realms/eduhamuy',
  };
  const url = new URL(keycloakLogoutUrl(local));
  assert.equal(url.origin, 'http://localhost:8080');
  assert.equal(url.searchParams.get('post_logout_redirect_uri'), 'http://localhost:3000/');
  for (const host of ['localhost.example.test', '192.168.1.2', 'keycloak']) {
    assert.throws(() => keycloakLogoutUrl({ ...local, AUTH_KEYCLOAK_ISSUER: `http://${host}:8080/realms/test` }));
  }
});

test('logout uses only configured destinations and no tokens', () => {
  const url = new URL(keycloakLogoutUrl(env));
  assert.equal(url.origin, 'https://identity.example.test');
  assert.equal(url.pathname, '/realms/test/protocol/openid-connect/logout');
  assert.equal(url.searchParams.get('post_logout_redirect_uri'), 'https://aio.example.test/');
  assert.equal(url.searchParams.get('client_id'), 'web');
  assert.equal(url.searchParams.size, 2);
  assert.throws(() => keycloakLogoutUrl({ ...env, AUTH_KEYCLOAK_ISSUER: 'http://identity.example.test' }));
});

test('active session checked server-side without cache or redirect forwarding', async () => {
  assert.equal(
    await check(async (url, init) => {
      assert.equal(url, env.AUTH_KEYCLOAK_ISSUER + '/protocol/openid-connect/token/introspect');
      assert.equal(init.method, 'POST');
      assert.equal(init.cache, 'no-store');
      assert.equal(init.redirect, 'error');
      assert.equal(init.body.get('token_type_hint'), 'refresh_token');
      assert.equal(init.body.get('client_secret'), 'test-secret');
      assert.ok(init.signal);
      return Response.json({ active: true });
    }),
    true
  );
});

test('revoked, malformed, failed and unavailable sessions are denied', async () => {
  for (const response of [
    Response.json({ active: false }),
    Response.json({ active: 'true' }),
    Response.json(null),
    new Response('bad json'),
    new Response('', { status: 503 }),
  ]) {
    assert.equal(await check(async () => response), false);
  }
  assert.equal(
    await check(async () => {
      throw new Error('timeout');
    }),
    false
  );
});

test('old cookies and different issuer/client never send tokens', async () => {
  const never = async () => {
    assert.fail('must not send token');
  };
  assert.equal(await isKeycloakSessionActive(undefined, env.AUTH_KEYCLOAK_ISSUER, 'web', env, never), false);
  assert.equal(await isKeycloakSessionActive('token', 'https://other.example', 'web', env, never), false);
  assert.equal(await isKeycloakSessionActive('token', env.AUTH_KEYCLOAK_ISSUER, 'other', env, never), false);
});
