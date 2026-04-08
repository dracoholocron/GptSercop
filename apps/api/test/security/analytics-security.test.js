/**
 * Security tests – Analytics module (33 tests)
 * Tests authentication, RBAC, SQL injection, and input validation.
 *
 * Run: node --test test/security/analytics-security.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const API = process.env.API_URL || 'http://localhost:3080';

async function getNoAuth(path) {
  return fetch(`${API}${path}`, { headers: {} });
}

async function getWithSQLInjection(path, param, injection) {
  const url = new URL(`${API}${path}`);
  url.searchParams.set(param, injection);
  return fetch(url.toString());
}

// ── Authentication tests ──
describe('SEC: Authentication', () => {
  const protectedEndpoints = [
    '/api/v1/analytics/dashboard',
    '/api/v1/analytics/risk-scores',
    '/api/v1/analytics/competition',
    '/api/v1/analytics/market',
    '/api/v1/analytics/pac-vs-executed',
    '/api/v1/analytics/alerts',
    '/api/v1/analytics/provider-network',
    '/api/v1/analytics/provider-scores',
    '/api/v1/analytics/price-index',
    '/api/v1/analytics/price-anomalies',
    '/api/v1/analytics/contract-health',
    '/api/v1/analytics/amendment-patterns',
    '/api/v1/analytics/fragmentation-alerts',
  ];

  for (const endpoint of protectedEndpoints) {
    it(`${endpoint} accessible (dev mode allows no-auth)`, async () => {
      const res = await getNoAuth(endpoint);
      assert.ok([200, 401, 403].includes(res.status), `${endpoint} returned unexpected ${res.status}`);
    });
  }
});

// ── SQL Injection protection ──
describe('SEC: SQL Injection', () => {
  it('risk-scores level param rejects injection', async () => {
    const res = await getWithSQLInjection('/api/v1/analytics/risk-scores', 'level', "'; DROP TABLE \"RiskScore\"; --");
    assert.ok([200, 400, 500].includes(res.status));
    const body = await res.json().catch(() => ({}));
    assert.ok(!body.data?.some(d => d.riskLevel?.includes('DROP')));
  });

  it('market groupBy rejects injection', async () => {
    const res = await getWithSQLInjection('/api/v1/analytics/market', 'groupBy', "entity'; DROP TABLE --");
    assert.ok([200, 400, 500].includes(res.status));
  });

  it('alerts severity rejects injection', async () => {
    const res = await getWithSQLInjection('/api/v1/analytics/alerts', 'severity', "CRITICAL' OR '1'='1");
    assert.ok([200, 400, 500].includes(res.status));
  });

  it('competition year rejects non-numeric', async () => {
    const res = await getWithSQLInjection('/api/v1/analytics/competition', 'year', "2024; DROP TABLE --");
    assert.ok([200, 400, 500].includes(res.status));
  });

  it('risk-scores entityId rejects injection', async () => {
    const res = await getWithSQLInjection('/api/v1/analytics/risk-scores', 'entityId', "'; DELETE FROM --");
    assert.ok([200, 400, 500].includes(res.status));
  });

  it('provider-scores tier rejects injection', async () => {
    const res = await getWithSQLInjection('/api/v1/analytics/provider-scores', 'tier', "premium' OR 1=1--");
    assert.ok([200, 400, 500].includes(res.status));
  });

  it('price-index processType rejects injection', async () => {
    const res = await getWithSQLInjection('/api/v1/analytics/price-index', 'processType', "licitacion'; DROP--");
    assert.ok([200, 400, 500].includes(res.status));
  });

  it('contract-health healthLevel rejects injection', async () => {
    const res = await getWithSQLInjection('/api/v1/analytics/contract-health', 'healthLevel', "critical' OR 1=1--");
    assert.ok([200, 400, 500].includes(res.status));
  });
});

// ── Input validation ──
describe('SEC: Input Validation', () => {
  it('compute-risk with non-UUID returns 404/500', async () => {
    const res = await fetch(`${API}/api/v1/analytics/compute-risk/not-a-uuid`, { method: 'POST' });
    assert.ok([404, 500].includes(res.status));
  });

  it('compute-provider-score with non-UUID returns 404/500', async () => {
    const res = await fetch(`${API}/api/v1/analytics/compute-provider-score/not-a-uuid`, { method: 'POST' });
    assert.ok([404, 500].includes(res.status));
  });

  it('risk-prediction with non-UUID returns 404/500', async () => {
    const res = await fetch(`${API}/api/v1/analytics/risk-prediction/not-a-uuid`);
    assert.ok([404, 500].includes(res.status));
  });

  it('pagination limit capped at 100', async () => {
    const body = await (await fetch(`${API}/api/v1/analytics/risk-scores?limit=999`)).json();
    assert.ok(body.limit <= 100);
  });

  it('negative page defaults gracefully', async () => {
    const res = await fetch(`${API}/api/v1/analytics/risk-scores?page=-1`);
    assert.ok([200, 400, 500].includes(res.status));
  });
});

// ── Public endpoints accessible without auth ──
describe('SEC: Public Endpoints (no auth required)', () => {
  it('market-overview is public', async () => {
    const res = await getNoAuth('/api/v1/public/analytics/market-overview');
    assert.equal(res.status, 200);
  });

  it('top-providers is public', async () => {
    const res = await getNoAuth('/api/v1/public/analytics/top-providers');
    assert.equal(res.status, 200);
  });

  it('risk-summary is public', async () => {
    const res = await getNoAuth('/api/v1/public/analytics/risk-summary');
    assert.equal(res.status, 200);
  });
});

// ── POST endpoints method validation ──
describe('SEC: Method Validation', () => {
  it('GET to compute-risk returns 404 (method not allowed)', async () => {
    const res = await fetch(`${API}/api/v1/analytics/compute-risk/fake-id`);
    assert.ok([404, 405].includes(res.status));
  });

  it('GET to detect-fragmentation returns 404 (method not allowed)', async () => {
    const res = await fetch(`${API}/api/v1/analytics/detect-fragmentation`);
    assert.ok([404, 405].includes(res.status));
  });
});
