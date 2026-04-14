/**
 * Regression – core analytics endpoints after graph analytics changes.
 * Run: npx tsx --test test/regression/graph-analytics-regression.test.ts
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import type { TestContext } from 'node:test';

const API = process.env.API_URL || 'http://localhost:3080';

const A = (path: string) => `${API}/api/v1/analytics${path}`;

let adminToken = '';
let skipLive: string | null = null;

test.describe('GRAPH-REG: Analytics regression (post graph extension)', () => {
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
      skipLive = `login failed (${res.status}): configure JWT_SECRET and ADMIN_EMAILS`;
      return;
    }
    const body = (await res.json()) as { token: string };
    if (!body.token) {
      skipLive = 'login response missing token';
      return;
    }
    adminToken = body.token;
  });

  function authHeaders(): HeadersInit {
    return { Authorization: `Bearer ${adminToken}` };
  }

  function beginLive(t: TestContext): boolean {
    if (skipLive) {
      t.skip(skipLive);
      return false;
    }
    return true;
  }

  test.it('GET /risk-scores → 200', async (t) => {
    if (!beginLive(t)) return;
    const res = await fetch(A('/risk-scores'), { headers: authHeaders() });
    assert.equal(res.status, 200);
  });

  test.it('GET /competition → 200', async (t) => {
    if (!beginLive(t)) return;
    const res = await fetch(A('/competition'), { headers: authHeaders() });
    assert.equal(res.status, 200);
  });

  test.it('GET /market → 200', async (t) => {
    if (!beginLive(t)) return;
    const res = await fetch(A('/market'), { headers: authHeaders() });
    assert.equal(res.status, 200);
  });

  test.it('GET /pac-vs-executed → 200 (PAC analytics)', async (t) => {
    if (!beginLive(t)) return;
    const res = await fetch(`${A('/pac-vs-executed')}?year=2024`, { headers: authHeaders() });
    assert.equal(res.status, 200);
  });

  test.it('GET /api/v1/pac → 200 (PAC module, year param)', async (t) => {
    if (!beginLive(t)) return;
    const res = await fetch(`${API}/api/v1/pac?year=2024`, { headers: authHeaders() });
    assert.equal(res.status, 200);
  });

  test.it('GET /alerts → 200', async (t) => {
    if (!beginLive(t)) return;
    const res = await fetch(A('/alerts'), { headers: authHeaders() });
    assert.equal(res.status, 200);
  });

  test.it('GET /provider-network → 200', async (t) => {
    if (!beginLive(t)) return;
    const res = await fetch(A('/provider-network'), { headers: authHeaders() });
    assert.equal(res.status, 200);
  });

  test.it('GET /provider-scores → 200', async (t) => {
    if (!beginLive(t)) return;
    const res = await fetch(A('/provider-scores'), { headers: authHeaders() });
    assert.equal(res.status, 200);
  });

  test.it('GET /price-index → 200', async (t) => {
    if (!beginLive(t)) return;
    const res = await fetch(A('/price-index'), { headers: authHeaders() });
    assert.equal(res.status, 200);
  });

  test.it('GET /api/v1/contracts → 200', async (t) => {
    if (!beginLive(t)) return;
    const res = await fetch(`${API}/api/v1/contracts`, { headers: authHeaders() });
    assert.equal(res.status, 200);
  });

  test.it('GET /fragmentation-alerts → 200 (fragmentation)', async (t) => {
    if (!beginLive(t)) return;
    const res = await fetch(A('/fragmentation-alerts'), { headers: authHeaders() });
    assert.equal(res.status, 200);
  });

  test.it('GET /geo → 200', async (t) => {
    if (!beginLive(t)) return;
    const res = await fetch(A('/geo'), { headers: authHeaders() });
    assert.equal(res.status, 200);
  });

  test.it('Risk scores list items include totalScore, riskLevel, flags', async (t) => {
    if (!beginLive(t)) return;
    const res = await fetch(A('/risk-scores?limit=5'), { headers: authHeaders() });
    assert.equal(res.status, 200);
    const body = (await res.json()) as { data?: Array<Record<string, unknown>> };
    assert.ok(Array.isArray(body.data), 'expected { data: [] }');
    if (body.data!.length === 0) return;
    const row = body.data![0];
    assert.ok('totalScore' in row && typeof row.totalScore === 'number');
    assert.ok('riskLevel' in row && typeof row.riskLevel === 'string');
    assert.ok('flags' in row && Array.isArray(row.flags));
  });

  test.it('Dashboard keeps legacy fields; graph metrics optional', async (t) => {
    if (!beginLive(t)) return;
    const res = await fetch(A('/dashboard'), { headers: authHeaders() });
    assert.equal(res.status, 200);
    const body = (await res.json()) as Record<string, unknown>;
    for (const key of [
      'totalTenders',
      'totalContracts',
      'totalProviders',
      'totalEntities',
      'totalContractAmount',
      'avgBidders',
      'riskDistribution',
      'openAlerts',
    ]) {
      assert.ok(key in body, `missing legacy field: ${key}`);
    }
    if ('graphOverview' in body || 'graph' in body) {
      assert.ok(typeof body.graphOverview === 'object' || typeof body.graph === 'object');
    }
  });

  // --- Visual network does NOT break existing overview/collusion/centrality/provider-network ---

  test.it('Regression: /overview still has topCommunities after visual-network addition', async (t) => {
    if (!beginLive(t)) return;
    const res = await fetch(A('/graph-analytics/overview'), { headers: authHeaders() });
    assert.equal(res.status, 200);
    const body = (await res.json()) as { topCommunities: unknown[]; riskSummary: unknown };
    assert.ok(Array.isArray(body.topCommunities));
    assert.ok(body.riskSummary != null);
  });

  test.it('Regression: /collusion response shape unchanged', async (t) => {
    if (!beginLive(t)) return;
    const res = await fetch(A('/graph-analytics/collusion'), { headers: authHeaders() });
    assert.equal(res.status, 200);
    const body = (await res.json()) as { data: unknown[]; total: number };
    assert.ok(Array.isArray(body.data));
    assert.ok(typeof body.total === 'number');
  });

  test.it('Regression: /centrality response shape unchanged', async (t) => {
    if (!beginLive(t)) return;
    const res = await fetch(A('/graph-analytics/centrality?limit=3'), { headers: authHeaders() });
    assert.equal(res.status, 200);
    const body = (await res.json()) as { data: Array<{ providerId: string; degree: number; pageRank: number }> };
    assert.ok(Array.isArray(body.data));
    if (body.data.length > 0) {
      assert.ok(typeof body.data[0].providerId === 'string');
      assert.ok(typeof body.data[0].degree === 'number');
      assert.ok(typeof body.data[0].pageRank === 'number');
    }
  });

  test.it('Regression: /provider/:id/network response shape unchanged', async (t) => {
    if (!beginLive(t)) return;
    const provRes = await fetch(`${BASE}/api/v1/providers`, { headers: authHeaders() });
    if (!provRes.ok) { t.skip('cannot list providers'); return; }
    const provBody = (await provRes.json()) as { data?: Array<{ id: string }> };
    const pid = provBody.data?.[0]?.id;
    if (!pid) { t.skip('no providers'); return; }
    const res = await fetch(A(`/graph-analytics/provider/${pid}/network`), { headers: authHeaders() });
    assert.equal(res.status, 200);
    const body = (await res.json()) as { center: unknown; nodes: unknown[]; edges: unknown[] };
    assert.ok(body.center != null);
    assert.ok(Array.isArray(body.nodes));
    assert.ok(Array.isArray(body.edges));
  });
});
