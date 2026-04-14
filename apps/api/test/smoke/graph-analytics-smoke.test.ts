/**
 * Smoke – graph analytics endpoints latency and JSON health.
 * Run: npx tsx --test test/smoke/graph-analytics-smoke.test.ts
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import type { TestContext } from 'node:test';

const API = process.env.API_URL || 'http://localhost:3080';
const TIMEOUT_MS = 5000;

const GA = (path: string) => `${API}/api/v1/analytics/graph-analytics${path}`;

let adminToken = '';
let skipLive: string | null = null;

test.describe('GRAPH-SMOKE: Graph Analytics smoke', () => {
  test.before(async () => {
    try {
      const health = await fetch(`${API}/health`);
      if (!health.ok) {
        skipLive = `GET /health returned ${health.status}`;
        return;
      }
    } catch (e) {
      skipLive = `API not reachable (${API}): ${(e as Error).message}`;
      return;
    }
    const email = process.env.TEST_ADMIN_EMAIL ?? 'sercop@sercop.gob.ec';
    const res = await fetch(`${API}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      skipLive = `login failed (${res.status})`;
      return;
    }
    const body = (await res.json()) as { token: string };
    adminToken = body.token;
  });

  function authHeaders(): HeadersInit {
    return { Authorization: `Bearer ${adminToken}` };
  }

  /** @returns false when suite should skip (caller must `return`) */
  function beginLive(t: TestContext): boolean {
    if (skipLive) {
      t.skip(skipLive);
      return false;
    }
    return true;
  }

  async function timedJson(url: string): Promise<{ ms: number; status: number; json: unknown }> {
    const t0 = performance.now();
    const res = await fetch(url, { headers: authHeaders() });
    const ms = performance.now() - t0;
    let json: unknown;
    try {
      json = await res.json();
    } catch {
      json = null;
    }
    return { ms, status: res.status, json };
  }

  test.it('Overview responds within TIMEOUT_MS', async (t) => {
    if (!beginLive(t)) return;
    const { ms, status } = await timedJson(GA('/overview'));
    assert.ok(ms < TIMEOUT_MS, `overview took ${ms}ms`);
    assert.equal(status, 200);
  });

  test.it('Collusion responds within TIMEOUT_MS', async (t) => {
    if (!beginLive(t)) return;
    const { ms, status } = await timedJson(GA('/collusion'));
    assert.ok(ms < TIMEOUT_MS, `collusion took ${ms}ms`);
    assert.equal(status, 200);
  });

  test.it('Centrality responds within TIMEOUT_MS', async (t) => {
    if (!beginLive(t)) return;
    const { ms, status } = await timedJson(`${GA('/centrality')}?limit=50`);
    assert.ok(ms < TIMEOUT_MS, `centrality took ${ms}ms`);
    assert.equal(status, 200);
  });

  test.it('Risk propagation responds within TIMEOUT_MS', async (t) => {
    if (!beginLive(t)) return;
    const { ms, status } = await timedJson(`${GA('/risk-propagation')}?limit=50`);
    assert.ok(ms < TIMEOUT_MS, `risk-propagation took ${ms}ms`);
    assert.equal(status, 200);
  });

  test.it('Graph provider /network responds within TIMEOUT_MS (real id from overview)', async (t) => {
    if (!beginLive(t)) return;
    const ovRes = await fetch(GA('/overview'), { headers: authHeaders() });
    assert.equal(ovRes.status, 200);
    const overview = (await ovRes.json()) as {
      topCommunities?: Array<{ members?: Array<{ id: string }> }>;
    };
    let id = overview.topCommunities?.flatMap((c) => c.members ?? []).find((m) => m.id)?.id;
    if (!id) {
      const cRes = await fetch(`${GA('/centrality')}?limit=1`, { headers: authHeaders() });
      assert.equal(cRes.status, 200);
      const cBody = (await cRes.json()) as { data?: Array<{ providerId: string }> };
      id = cBody.data?.[0]?.providerId;
    }
    assert.ok(id, 'no provider id from overview or centrality; run seed:graph');
    const t0 = performance.now();
    const res = await fetch(GA(`/provider/${encodeURIComponent(id)}/network`), {
      headers: authHeaders(),
    });
    const ms = performance.now() - t0;
    assert.ok(ms < TIMEOUT_MS, `provider network took ${ms}ms`);
    assert.ok(res.status === 200 || res.status === 404, `status ${res.status}`);
  });

  test.it('Overview returns no 500', async (t) => {
    if (!beginLive(t)) return;
    const res = await fetch(GA('/overview'), { headers: authHeaders() });
    assert.notEqual(res.status, 500);
    assert.equal(res.status, 200);
  });

  test.it('Collusion returns no 500', async (t) => {
    if (!beginLive(t)) return;
    const res = await fetch(GA('/collusion'), { headers: authHeaders() });
    assert.notEqual(res.status, 500);
    assert.equal(res.status, 200);
  });

  test.it('Centrality returns no 500', async (t) => {
    if (!beginLive(t)) return;
    const res = await fetch(`${GA('/centrality')}?limit=20`, { headers: authHeaders() });
    assert.notEqual(res.status, 500);
    assert.equal(res.status, 200);
  });

  test.it('Overview JSON: seed data queryable (totalProviders defined)', async (t) => {
    if (!beginLive(t)) return;
    const { json } = await timedJson(GA('/overview'));
    assert.ok(json && typeof json === 'object');
    const o = json as { totalProviders?: number };
    assert.equal(typeof o.totalProviders, 'number');
    assert.ok(
      o.totalProviders! > 0,
      'totalProviders is 0; run prisma seed / npm run seed:graph for graph smoke data',
    );
  });

  test.it('All graph analytics GETs return JSON objects', async (t) => {
    if (!beginLive(t)) return;
    const urls = [
      GA('/overview'),
      GA('/collusion'),
      `${GA('/centrality')}?limit=10`,
      `${GA('/risk-propagation')}?limit=10`,
      `${GA('/visual-network')}?limit=20`,
    ];
    for (const url of urls) {
      const t0 = performance.now();
      const res = await fetch(url, { headers: authHeaders() });
      const ms = performance.now() - t0;
      assert.ok(ms < TIMEOUT_MS, `${url} took ${ms}ms`);
      const text = await res.text();
      assert.doesNotThrow(() => JSON.parse(text), `invalid JSON from ${url}`);
      const parsed = JSON.parse(text) as unknown;
      assert.ok(parsed !== null && typeof parsed === 'object');
    }
  });

  test.it('Visual-network responds 200 with nodes', async (t) => {
    if (!beginLive(t)) return;
    const res = await fetch(`${GA('/visual-network')}?limit=10`, { headers: authHeaders() });
    assert.equal(res.status, 200);
    const body = (await res.json()) as { nodes: unknown[]; links: unknown[] };
    assert.ok(Array.isArray(body.nodes));
    assert.ok(Array.isArray(body.links));
  });
});
