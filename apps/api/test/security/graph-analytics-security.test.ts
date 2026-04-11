/**
 * Security tests – Graph Analytics extension.
 * Run: npx tsx --test test/security/graph-analytics-security.test.ts
 * Requires: API up, JWT_SECRET set. If AUTH_DISABLED=true, unauthenticated tests expect 401 and will fail.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import type { TestContext } from 'node:test';

const API = process.env.API_URL || 'http://localhost:3080';

const GA = (path: string) => `${API}/api/v1/analytics/graph-analytics${path}`;

let adminToken = '';
let skipLive: string | null = null;

test.describe('GRAPH-SEC: Graph Analytics Security', () => {
  test.before(async () => {
    try {
      const health = await fetch(`${API}/health`);
      if (!health.ok) skipLive = `GET /health returned ${health.status}`;
    } catch (e) {
      skipLive = `API not reachable (${API}): ${(e as Error).message}`;
      return;
    }
    const email = process.env.TEST_ADMIN_EMAIL ?? 'sercop@sercop.gob.ec';
    try {
      const res = await fetch(`${API}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        const body = (await res.json()) as { token?: string };
        adminToken = body.token ?? '';
      }
    } catch {
      /* token optional for most cases */
    }
  });

  test.it('GET /graph-analytics/overview without token → 401', async (t) => {
    if (skipLive) {
      t.skip(skipLive);
      return;
    }
    const res = await fetch(GA('/overview'));
    assert.equal(res.status, 401);
  });

  test.it('GET /graph-analytics/collusion without token → 401', async (t) => {
    if (skipLive) {
      t.skip(skipLive);
      return;
    }
    const res = await fetch(GA('/collusion'));
    assert.equal(res.status, 401);
  });

  test.it('GET /graph-analytics/centrality without token → 401', async (t) => {
    if (skipLive) {
      t.skip(skipLive);
      return;
    }
    const res = await fetch(GA('/centrality'));
    assert.equal(res.status, 401);
  });

  test.it('GET /graph-analytics/provider/:id/network without token → 401', async (t) => {
    if (skipLive) {
      t.skip(skipLive);
      return;
    }
    const res = await fetch(GA('/provider/some-id/network'));
    assert.equal(res.status, 401);
  });

  test.it('GET /graph-analytics/risk-propagation without token → 401', async (t) => {
    if (skipLive) {
      t.skip(skipLive);
      return;
    }
    const res = await fetch(GA('/risk-propagation'));
    assert.equal(res.status, 401);
  });

  test.it('GET /graph-analytics/overview with invalid token → 401', async (t) => {
    if (skipLive) {
      t.skip(skipLive);
      return;
    }
    const res = await fetch(GA('/overview'), {
      headers: { Authorization: 'Bearer not-a-real.jwt.token' },
    });
    assert.equal(res.status, 401);
  });

  test.it('SQL injection in provider ID path → not 500', async (t) => {
    if (skipLive) {
      t.skip(skipLive);
      return;
    }
    const id = encodeURIComponent("'; DROP TABLE--");
    const res = await fetch(GA(`/provider/${id}/network`));
    assert.notEqual(res.status, 500, `unexpected 500: ${await res.text()}`);
  });

  test.it('Provider ID with HTML/XSS in path → not 500', async (t) => {
    if (skipLive) {
      t.skip(skipLive);
      return;
    }
    const id = encodeURIComponent('<script>alert(1)</script>');
    const res = await fetch(GA(`/provider/${id}/network`));
    assert.notEqual(res.status, 500, `unexpected 500: ${await res.text()}`);
  });

  test.it('Extremely long provider ID (1000 chars) → not 500 (400 or 404 or 401)', async (t) => {
    if (skipLive) {
      t.skip(skipLive);
      return;
    }
    const longId = 'a'.repeat(1000);
    const res = await fetch(GA(`/provider/${encodeURIComponent(longId)}/network`));
    assert.notEqual(res.status, 500, `unexpected 500: ${await res.text()}`);
    assert.ok([400, 401, 404].includes(res.status), `expected 400/401/404, got ${res.status}`);
  });

  test.it('Negative limit on centrality → not 500 (authenticated)', async (t: TestContext) => {
    if (skipLive) {
      t.skip(skipLive);
      return;
    }
    if (!adminToken) {
      t.skip('login failed; set JWT_SECRET and TEST_ADMIN_EMAIL in ADMIN_EMAILS');
      return;
    }
    const res = await fetch(`${GA('/centrality')}?limit=-1`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.notEqual(res.status, 500, `unexpected 500: ${await res.text()}`);
  });

  test.it('Huge limit on centrality → completes within 30s (authenticated)', async (t: TestContext) => {
    if (skipLive) {
      t.skip(skipLive);
      return;
    }
    if (!adminToken) {
      t.skip('login failed; set JWT_SECRET and TEST_ADMIN_EMAIL in ADMIN_EMAILS');
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);
    try {
      const res = await fetch(`${GA('/centrality')}?limit=999999`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        signal: controller.signal,
      });
      assert.ok(res.ok || res.status === 400 || res.status === 404, `status ${res.status}`);
      assert.notEqual(res.status, 500);
    } finally {
      clearTimeout(timer);
    }
  });

  test.it('Path traversal in provider ID → not 500', async (t) => {
    if (skipLive) {
      t.skip(skipLive);
      return;
    }
    const id = encodeURIComponent('../../etc/passwd');
    const res = await fetch(GA(`/provider/${id}/network`));
    assert.notEqual(res.status, 500, `unexpected 500: ${await res.text()}`);
  });

  test.it('Malformed maxHops on provider network → not 500 (authenticated)', async (t: TestContext) => {
    if (skipLive) {
      t.skip(skipLive);
      return;
    }
    if (!adminToken) {
      t.skip('login failed');
      return;
    }
    const res = await fetch(`${GA('/provider/any-id/network')}?maxHops=not-a-number`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.notEqual(res.status, 500, `unexpected 500: ${await res.text()}`);
  });
});
