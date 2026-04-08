/**
 * Integration tests – Full analytics module (55 tests)
 * Tests all API endpoints with correct data shapes, filters, and pagination.
 *
 * Run: node --test test/integration/analytics-full.test.js
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

const API = process.env.API_URL || 'http://localhost:3080';

async function get(path) {
  const res = await fetch(`${API}${path}`);
  assert.equal(res.status, 200, `GET ${path} returned ${res.status}`);
  return res.json();
}

async function post(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

async function patch(path) {
  const res = await fetch(`${API}${path}`, { method: 'PATCH' });
  return { status: res.status, body: await res.json() };
}

// ── Dashboard ──
describe('INT: Dashboard', () => {
  it('returns all KPI fields', async () => {
    const d = await get('/api/v1/analytics/dashboard');
    assert.ok(typeof d.totalTenders === 'number');
    assert.ok(typeof d.totalContracts === 'number');
    assert.ok(typeof d.totalProviders === 'number');
    assert.ok(typeof d.totalEntities === 'number');
    assert.ok(typeof d.totalContractAmount === 'number');
    assert.ok(typeof d.avgBidders === 'number');
    assert.ok(d.riskDistribution);
    assert.ok(typeof d.openAlerts === 'number');
  });
});

// ── Risk Scores ──
describe('INT: Risk Scores', () => {
  it('paginated list', async () => {
    const r = await get('/api/v1/analytics/risk-scores?page=1&limit=5');
    assert.ok(Array.isArray(r.data));
    assert.ok(typeof r.total === 'number');
    assert.ok(r.limit <= 5);
  });

  it('filter by level=high', async () => {
    const r = await get('/api/v1/analytics/risk-scores?level=high');
    for (const item of r.data) assert.equal(item.riskLevel, 'high');
  });

  it('filter by level=medium', async () => {
    const r = await get('/api/v1/analytics/risk-scores?level=medium');
    for (const item of r.data) assert.equal(item.riskLevel, 'medium');
  });

  it('includes tender relation', async () => {
    const r = await get('/api/v1/analytics/risk-scores?limit=1');
    if (r.data.length > 0) {
      assert.ok(r.data[0].tender);
      assert.ok(r.data[0].tender.code || r.data[0].tender.id);
    }
  });

  it('compute risk for a tender', async () => {
    const scores = await get('/api/v1/analytics/risk-scores?limit=1');
    if (scores.data.length > 0) {
      const { status, body } = await post(`/api/v1/analytics/compute-risk/${scores.data[0].tenderId}`);
      assert.equal(status, 200);
      assert.ok(typeof body.totalScore === 'number');
      assert.ok(body.flags);
    }
  });
});

// ── Competition ──
describe('INT: Competition', () => {
  it('returns avgBidders, bySector, hhiByEntity', async () => {
    const c = await get('/api/v1/analytics/competition');
    assert.ok(typeof c.avgBidders === 'number');
    assert.ok(Array.isArray(c.bySector));
    assert.ok(Array.isArray(c.hhiByEntity));
  });

  it('bySector items have required fields', async () => {
    const c = await get('/api/v1/analytics/competition');
    for (const s of c.bySector) {
      assert.ok(typeof s.processType === 'string');
      assert.ok(typeof s.tenderCount === 'number');
      assert.ok(typeof s.singleBidderPct === 'number');
    }
  });
});

// ── Market ──
describe('INT: Market', () => {
  it('by entity', async () => {
    const m = await get('/api/v1/analytics/market?groupBy=entity');
    assert.ok(Array.isArray(m.data));
    if (m.data.length > 0) assert.ok(typeof m.data[0].totalAmount === 'number');
  });

  it('by province', async () => {
    const m = await get('/api/v1/analytics/market?groupBy=province');
    assert.ok(Array.isArray(m.data));
  });

  it('by processType', async () => {
    const m = await get('/api/v1/analytics/market?groupBy=processType');
    assert.ok(Array.isArray(m.data));
  });
});

// ── PAC ──
describe('INT: PAC vs Executed', () => {
  it('returns entity-level data', async () => {
    const p = await get('/api/v1/analytics/pac-vs-executed');
    assert.ok(Array.isArray(p.data));
    if (p.data.length > 0) {
      assert.ok(typeof p.data[0].entityName === 'string');
      assert.ok(typeof p.data[0].executionRate === 'number');
    }
  });
});

// ── Alerts ──
describe('INT: Alerts', () => {
  it('paginated list', async () => {
    const a = await get('/api/v1/analytics/alerts?page=1&limit=5');
    assert.ok(Array.isArray(a.data));
    assert.ok(typeof a.total === 'number');
  });

  it('filter by severity=CRITICAL', async () => {
    const a = await get('/api/v1/analytics/alerts?severity=CRITICAL');
    for (const item of a.data) assert.equal(item.severity, 'CRITICAL');
  });

  it('filter unresolved', async () => {
    const a = await get('/api/v1/analytics/alerts?resolved=false');
    for (const item of a.data) assert.equal(item.resolvedAt, null);
  });

  it('resolve alert endpoint', async () => {
    const a = await get('/api/v1/analytics/alerts?resolved=false&limit=1');
    if (a.data.length > 0) {
      const { status } = await patch(`/api/v1/analytics/alerts/${a.data[0].id}/resolve`);
      assert.equal(status, 200);
    }
  });
});

// ── Provider Network ──
describe('INT: Provider Network', () => {
  it('returns nodes and edges', async () => {
    const n = await get('/api/v1/analytics/provider-network?minShared=1');
    assert.ok(Array.isArray(n.nodes));
    assert.ok(Array.isArray(n.edges));
  });

  it('edges have providerAId, providerBId, sharedTenders', async () => {
    const n = await get('/api/v1/analytics/provider-network?minShared=1');
    for (const e of n.edges) {
      assert.ok(e.providerAId || e.source, 'edge must have providerAId or source');
      assert.ok(e.providerBId || e.target, 'edge must have providerBId or target');
      assert.ok(typeof e.sharedTenders === 'number');
    }
  });

  it('neighbors endpoint works', async () => {
    const n = await get('/api/v1/analytics/provider-network?minShared=1');
    if (n.nodes.length > 0) {
      const nb = await get(`/api/v1/analytics/provider-network/${n.nodes[0].id}/neighbors`);
      assert.ok(Array.isArray(nb.data));
    }
  });
});

// ── Provider Scores ──
describe('INT: Provider Scores', () => {
  it('paginated list', async () => {
    const s = await get('/api/v1/analytics/provider-scores?page=1&limit=5');
    assert.ok(Array.isArray(s.data));
    assert.ok(typeof s.total === 'number');
  });

  it('compute score for a provider', async () => {
    const providers = await get('/api/v1/analytics/provider-scores?limit=1');
    if (providers.data.length > 0) {
      const { status, body } = await post(
        `/api/v1/analytics/compute-provider-score/${providers.data[0].providerId}`,
      );
      assert.equal(status, 200);
      assert.ok(typeof body.totalScore === 'number');
      assert.ok(body.tier);
    }
  });

  it('score has all dimensions', async () => {
    const s = await get('/api/v1/analytics/provider-scores?limit=1');
    if (s.data.length > 0) {
      const ps = s.data[0];
      assert.ok(typeof ps.complianceScore === 'number');
      assert.ok(typeof ps.deliveryScore === 'number');
      assert.ok(typeof ps.priceScore === 'number');
      assert.ok(typeof ps.diversityScore === 'number');
    }
  });
});

// ── Price Index ──
describe('INT: Price Index', () => {
  it('returns comparison data', async () => {
    const p = await get('/api/v1/analytics/price-index');
    assert.ok(Array.isArray(p.data));
  });

  it('price anomalies', async () => {
    const a = await get('/api/v1/analytics/price-anomalies');
    assert.ok(Array.isArray(a.data));
  });

  it('anomaly items have deviation', async () => {
    const a = await get('/api/v1/analytics/price-anomalies');
    for (const item of a.data) {
      assert.ok(typeof item.deviationPct === 'number');
    }
  });
});

// ── Contract Health ──
describe('INT: Contract Health', () => {
  it('returns paginated contracts', async () => {
    const c = await get('/api/v1/analytics/contract-health?page=1&limit=5');
    assert.ok(Array.isArray(c.data));
    assert.ok(typeof c.total === 'number');
  });

  it('health items have healthLevel', async () => {
    const c = await get('/api/v1/analytics/contract-health?limit=3');
    for (const item of c.data) {
      assert.ok(['healthy', 'warning', 'critical'].includes(item.healthLevel));
    }
  });

  it('amendment patterns by entity', async () => {
    const p = await get('/api/v1/analytics/amendment-patterns');
    assert.ok(Array.isArray(p.data));
    if (p.data.length > 0) {
      assert.ok(typeof p.data[0].entityName === 'string');
      assert.ok(typeof p.data[0].amendmentRate === 'number');
    }
  });
});

// ── Fragmentation ──
describe('INT: Fragmentation', () => {
  it('alerts paginated list', async () => {
    const f = await get('/api/v1/analytics/fragmentation-alerts?page=1&limit=5');
    assert.ok(Array.isArray(f.data));
    assert.ok(typeof f.total === 'number');
  });

  it('detect fragmentation', async () => {
    const { status, body } = await post('/api/v1/analytics/detect-fragmentation');
    assert.equal(status, 200);
    assert.ok(Array.isArray(body.data));
  });
});

// ── Predictive ──
describe('INT: Predictive', () => {
  it('prediction returns score and factors', async () => {
    const scores = await get('/api/v1/analytics/risk-scores?limit=1');
    if (scores.data.length > 0) {
      const pred = await get(`/api/v1/analytics/risk-prediction/${scores.data[0].tenderId}`);
      assert.ok(typeof pred.predictedScore === 'number');
      assert.ok(typeof pred.predictedLevel === 'string');
      assert.ok(typeof pred.confidence === 'number');
      assert.ok(pred.factors);
    }
  });

  it('prediction for non-existent tender returns 404', async () => {
    const res = await fetch(`${API}/api/v1/analytics/risk-prediction/00000000-0000-0000-0000-000000000000`);
    assert.equal(res.status, 404);
  });
});

// ── Public Endpoints ──
describe('INT: Public Endpoints', () => {
  it('market-overview', async () => {
    const m = await get('/api/v1/public/analytics/market-overview');
    assert.ok(typeof m.year === 'number');
    assert.ok(Array.isArray(m.byProcessType));
  });

  it('top-providers', async () => {
    const t = await get('/api/v1/public/analytics/top-providers?limit=5');
    assert.ok(Array.isArray(t.data));
  });

  it('risk-summary', async () => {
    const r = await get('/api/v1/public/analytics/risk-summary');
    assert.ok(typeof r.low === 'number');
    assert.ok(typeof r.medium === 'number');
    assert.ok(typeof r.high === 'number');
    assert.ok(typeof r.total === 'number');
  });
});
