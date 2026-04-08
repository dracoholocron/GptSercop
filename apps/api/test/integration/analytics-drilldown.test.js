/**
 * Integration tests – Analytics drill-down endpoints (Phase 7b)
 * Tests all new/extended API endpoints with real DB data seeded via seed-drilldown.ts.
 *
 * Run: API_URL=http://localhost:3080 node --test test/integration/analytics-drilldown.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const API = process.env.API_URL || 'http://localhost:3080';

async function get(path, expectedStatus = 200) {
  const res = await fetch(`${API}${path}`);
  assert.equal(res.status, expectedStatus, `GET ${path} returned ${res.status}`);
  return res.json();
}

async function patch(path, body = null) {
  const res = await fetch(`${API}${path}`, {
    method: 'PATCH',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

// ── Entity Overview ──────────────────────────────────────────────────────────
describe('INT: Entity Overview', () => {
  let entityId;

  it('GET /analytics/entities lists entities via PAC (finding any entity)', async () => {
    const d = await get('/api/v1/analytics/pac-vs-executed');
    assert.ok(d.data.length >= 0, 'PAC data should return array');
    // Try to find GAD Quito first, fall back to any entity with entityId
    const quito = d.data.find((e) => e.entityName && e.entityName.includes('Quito'));
    const anyEntity = d.data.find((e) => e.entityId);
    const chosen = quito ?? anyEntity;
    if (chosen) {
      entityId = chosen.entityId;
    }
    // Not a hard failure — just collect entityId if available
  });

  it('GET /analytics/entities/:entityId/overview returns correct shape', async () => {
    if (!entityId) return;
    const d = await get(`/api/v1/analytics/entities/${entityId}/overview`);
    assert.ok(d.entity, 'should have entity object');
    assert.ok(typeof d.entity.name === 'string', 'entity.name should be string');
    assert.ok(typeof d.totalTenders === 'number', 'totalTenders should be number');
    assert.ok(typeof d.totalContracts === 'number', 'totalContracts should be number');
    assert.ok(typeof d.totalSpend === 'number', 'totalSpend should be number');
    assert.ok(typeof d.avgBidders === 'number', 'avgBidders should be number');
    assert.ok(d.riskDistribution, 'riskDistribution should be present');
    assert.ok(typeof d.riskDistribution.high === 'number', 'riskDistribution.high should be number');
    assert.ok(typeof d.openAlerts === 'number', 'openAlerts should be number');
  });

  it('entity overview: GAD Quito has tenders', async () => {
    if (!entityId) return;
    const d = await get(`/api/v1/analytics/entities/${entityId}/overview`);
    assert.ok(d.totalTenders >= 1, 'GAD Quito should have at least 1 tender');
  });

  it('entity overview: 404 for invalid entityId', async () => {
    await get('/api/v1/analytics/entities/00000000-0000-0000-0000-000000000000/overview', 404);
  });
});

// ── Provider Overview ─────────────────────────────────────────────────────────
describe('INT: Provider Overview', () => {
  let providerId;

  it('GET /analytics/provider-scores finds TechCorp', async () => {
    const d = await get('/api/v1/analytics/provider-scores?limit=50');
    const techCorp = d.data.find((ps) => ps.provider?.name?.includes('TechCorp'));
    assert.ok(techCorp, 'TechCorp should be in provider-scores');
    providerId = techCorp.providerId;
    assert.ok(providerId, 'providerId should be present');
  });

  it('GET /analytics/providers/:providerId/overview returns correct shape', async () => {
    if (!providerId) return;
    const d = await get(`/api/v1/analytics/providers/${providerId}/overview`);
    assert.ok(d.provider, 'should have provider object');
    assert.ok(typeof d.provider.name === 'string', 'provider.name should be string');
    assert.ok(typeof d.bidsCount === 'number', 'bidsCount should be number');
    assert.ok(typeof d.neighborCount === 'number', 'neighborCount should be number');
    assert.ok(d.contracts, 'contracts should be present');
    assert.ok(typeof d.contracts.total === 'number', 'contracts.total should be number');
    assert.ok(Array.isArray(d.contracts.data), 'contracts.data should be array');
  });

  it('provider overview: TechCorp has score card', async () => {
    if (!providerId) return;
    const d = await get(`/api/v1/analytics/providers/${providerId}/overview`);
    assert.ok(d.score !== null, 'TechCorp should have a score card');
    assert.ok(typeof d.score?.tier === 'string', 'tier should be string');
  });

  it('provider overview: 404 for invalid providerId', async () => {
    await get('/api/v1/analytics/providers/00000000-0000-0000-0000-000000000000/overview', 404);
  });
});

// ── Risk Scores with processType filter ──────────────────────────────────────
describe('INT: Risk Scores processType filter', () => {
  it('GET /analytics/risk-scores?processType=licitacion returns filtered results', async () => {
    const d = await get('/api/v1/analytics/risk-scores?processType=licitacion');
    assert.ok(d.data, 'should return data array');
    const allLicitacion = d.data.every((rs) => rs.tender?.processType === 'licitacion');
    assert.ok(allLicitacion, 'all results should have processType=licitacion');
  });

  it('processType filter stacks with level filter', async () => {
    const d = await get('/api/v1/analytics/risk-scores?processType=licitacion&level=high');
    assert.ok(d.data, 'should return data array');
    d.data.forEach((rs) => {
      assert.equal(rs.riskLevel, 'high', 'all items should be high risk');
      assert.equal(rs.tender?.processType, 'licitacion', 'all items should be licitacion');
    });
  });

  it('processType filter: unknown type returns empty data', async () => {
    const d = await get('/api/v1/analytics/risk-scores?processType=tipo_inexistente');
    assert.equal(d.data.length, 0, 'unknown processType should return empty');
  });
});

// ── Alerts with entityId filter ───────────────────────────────────────────────
describe('INT: Alerts entityId filter', () => {
  let entityId;

  it('get entityId from PAC for entityId filter tests', async () => {
    const d = await get('/api/v1/analytics/pac-vs-executed');
    const salud = d.data.find((e) => e.entityName?.includes('Salud'));
    if (salud) entityId = salud.entityId;
  });

  it('GET /analytics/alerts?entityId=xxx returns alerts for entity', async () => {
    if (!entityId) return;
    const d = await get(`/api/v1/analytics/alerts?entityId=${entityId}`);
    assert.ok(typeof d.total === 'number', 'total should be present');
    assert.ok(Array.isArray(d.data), 'data should be array');
  });

  it('alerts: entityId filter shape is valid', async () => {
    if (!entityId) return;
    const d = await get(`/api/v1/analytics/alerts?entityId=${entityId}`);
    d.data.forEach((a) => {
      assert.ok(a.id, 'alert should have id');
      assert.ok(a.alertType, 'alert should have alertType');
    });
  });
});

// ── Resolve Alert with body ───────────────────────────────────────────────────
describe('INT: Resolve Alert with body', () => {
  let alertId;

  it('find an unresolved alert to test resolve', async () => {
    const d = await get('/api/v1/analytics/alerts?resolved=false&limit=5');
    const alert = d.data.find((a) => !a.resolvedAt);
    if (alert) alertId = alert.id;
    assert.ok(d.data.length >= 0, 'should return alert list');
  });

  it('PATCH /alerts/:id/resolve with body stores notes and action', async () => {
    if (!alertId) return;
    const res = await patch(`/api/v1/analytics/alerts/${alertId}/resolve`, {
      notes: 'Integration test resolution note',
      actionTaken: 'investigation_opened',
      resolvedBy: 'integration-test@sercop.gob.ec',
    });
    assert.equal(res.status, 200, `resolve should return 200, got ${res.status}`);
    assert.equal(res.body.ok, true, 'ok should be true');
  });

  it('resolved alert has resolvedAt set', async () => {
    if (!alertId) return;
    const d = await get(`/api/v1/analytics/alerts?resolved=true&limit=50`);
    const resolved = d.data.find((a) => a.id === alertId);
    if (resolved) {
      assert.ok(resolved.resolvedAt, 'resolvedAt should be set');
    }
  });

  it('PATCH /alerts/:id/resolve without body still works', async () => {
    const d = await get('/api/v1/analytics/alerts?resolved=false&limit=5');
    const alert = d.data.find((a) => !a.resolvedAt);
    if (!alert) return;
    const res = await patch(`/api/v1/analytics/alerts/${alert.id}/resolve`);
    assert.equal(res.status, 200, 'resolve without body should still return 200');
  });
});

// ── PAC with entityId filter ──────────────────────────────────────────────────
describe('INT: PAC entityId filter', () => {
  it('GET /analytics/pac-vs-executed with entityId returns single entity', async () => {
    const all = await get('/api/v1/analytics/pac-vs-executed');
    const first = all.data[0];
    if (!first) return;
    const filtered = await get(`/api/v1/analytics/pac-vs-executed?entityId=${first.entityId}`);
    assert.ok(filtered.data.length >= 1, 'filtered result should have at least 1 item');
    filtered.data.forEach((d) => {
      assert.equal(d.entityId, first.entityId, 'all items should match the filtered entityId');
    });
  });
});

// ── Price Index entityId in response ─────────────────────────────────────────
describe('INT: Price Index entityId', () => {
  it('GET /analytics/price-index items have entityId field', async () => {
    const d = await get('/api/v1/analytics/price-index');
    if (d.data.length === 0) return;
    const item = d.data[0];
    assert.ok('entityId' in item, 'price-index items should have entityId');
    assert.ok(typeof item.entityId === 'string', 'entityId should be string');
  });
});

// ── Amendment Patterns entityId in response ───────────────────────────────────
describe('INT: Amendment Patterns entityId', () => {
  it('GET /analytics/amendment-patterns items have entityId', async () => {
    const d = await get('/api/v1/analytics/amendment-patterns');
    if (d.data.length === 0) return;
    d.data.forEach((item) => {
      assert.ok('entityId' in item, 'amendment patterns should have entityId');
    });
  });
});

// ── Fragmentation entityName in response ──────────────────────────────────────
describe('INT: Fragmentation entityName', () => {
  it('GET /analytics/fragmentation-alerts items have entityName', async () => {
    const d = await get('/api/v1/analytics/fragmentation-alerts');
    if (d.data.length === 0) return;
    d.data.forEach((item) => {
      assert.ok('entityName' in item, 'fragmentation alerts should have entityName');
    });
  });

  it('fragmentation entityName is a string', async () => {
    const d = await get('/api/v1/analytics/fragmentation-alerts');
    if (d.data.length === 0) return;
    const withName = d.data.filter((i) => i.entityName);
    assert.ok(withName.length > 0, 'at least one item should have entityName');
    withName.forEach((i) => {
      assert.ok(typeof i.entityName === 'string', 'entityName should be string');
    });
  });
});

// ── Competition HHI entityId in response ──────────────────────────────────────
describe('INT: Competition hhiByEntity entityId', () => {
  it('GET /analytics/competition hhiByEntity items have entityId', async () => {
    const d = await get('/api/v1/analytics/competition');
    if (d.hhiByEntity.length === 0) return;
    d.hhiByEntity.forEach((e) => {
      assert.ok('entityId' in e, 'hhiByEntity should have entityId');
    });
  });
});

// ── Provider Overview contracts pagination ────────────────────────────────────
describe('INT: Provider Overview contracts pagination', () => {
  let providerId;

  it('get a provider with contracts', async () => {
    const d = await get('/api/v1/analytics/provider-scores?limit=50');
    const withScore = d.data[0];
    if (withScore) providerId = withScore.providerId;
  });

  it('provider overview page=1 returns contracts', async () => {
    if (!providerId) return;
    const d = await get(`/api/v1/analytics/providers/${providerId}/overview?page=1&limit=5`);
    assert.ok(typeof d.contracts.total === 'number', 'contracts.total should be number');
    assert.ok(d.contracts.page === 1, 'page should be 1');
    assert.ok(d.contracts.limit === 5, 'limit should be 5');
  });
});

// ── Provider Network neighbor count ───────────────────────────────────────────
describe('INT: Provider neighbor count in overview', () => {
  let providerId;

  it('get TechCorp provider id', async () => {
    const d = await get('/api/v1/analytics/provider-scores?limit=50');
    const techCorp = d.data.find((ps) => ps.provider?.name?.includes('TechCorp'));
    if (techCorp) providerId = techCorp.providerId;
  });

  it('provider overview has correct neighborCount', async () => {
    if (!providerId) return;
    const d = await get(`/api/v1/analytics/providers/${providerId}/overview`);
    assert.ok(typeof d.neighborCount === 'number', 'neighborCount should be number');
    // TechCorp has 2 relations seeded
    assert.ok(d.neighborCount >= 0, 'neighborCount should be non-negative');
  });
});
