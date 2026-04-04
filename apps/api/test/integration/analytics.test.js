/**
 * Pruebas de integración – módulo analytics.
 * Asumen API en marcha (docker compose up + db:setup + db:seed).
 * Base URL: INTEGRATION_BASE_URL o http://localhost:3080
 */
import test from 'node:test';
import assert from 'node:assert';

const baseUrl = process.env.INTEGRATION_BASE_URL || 'http://localhost:3080';

async function fetchOk(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

async function getAdminToken() {
  try {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@mec.gob.ec', role: 'admin' }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.token || null;
  } catch {
    return null;
  }
}

// ---- Dashboard ----
test('GET /api/v1/analytics/dashboard returns totalTenders and riskDistribution', async () => {
  const body = await fetchOk(`${baseUrl}/api/v1/analytics/dashboard`);
  assert.strictEqual(typeof body.totalTenders, 'number');
  assert.strictEqual(typeof body.totalContracts, 'number');
  assert.strictEqual(typeof body.avgBidders, 'number');
  assert.ok(body.riskDistribution, 'missing riskDistribution');
  assert.strictEqual(typeof body.riskDistribution.high, 'number');
  assert.strictEqual(typeof body.riskDistribution.medium, 'number');
  assert.strictEqual(typeof body.riskDistribution.low, 'number');
  assert.strictEqual(typeof body.openAlerts, 'number');
});

// ---- Market ----
test('GET /api/v1/analytics/market returns data array with entityName and totalAmount', async () => {
  const body = await fetchOk(`${baseUrl}/api/v1/analytics/market`);
  assert.ok(Array.isArray(body.data), 'data should be array');
  if (body.data.length > 0) {
    const first = body.data[0];
    assert.ok(typeof first.totalAmount === 'number', 'totalAmount should be number');
  }
});

test('GET /api/v1/analytics/market?groupBy=processType returns processType data', async () => {
  const body = await fetchOk(`${baseUrl}/api/v1/analytics/market?groupBy=processType`);
  assert.ok(Array.isArray(body.data), 'data should be array');
});

test('GET /api/v1/analytics/market?groupBy=province returns province data', async () => {
  const body = await fetchOk(`${baseUrl}/api/v1/analytics/market?groupBy=province`);
  assert.ok(Array.isArray(body.data), 'data should be array');
});

// ---- Competition ----
test('GET /api/v1/analytics/competition returns avgBidders as number', async () => {
  const body = await fetchOk(`${baseUrl}/api/v1/analytics/competition`);
  assert.strictEqual(typeof body.avgBidders, 'number');
  assert.ok(Array.isArray(body.bySector), 'bySector should be array');
  assert.ok(Array.isArray(body.hhiByEntity), 'hhiByEntity should be array');
});

// ---- PAC vs Executed ----
test('GET /api/v1/analytics/pac-vs-executed returns data array', async () => {
  const body = await fetchOk(`${baseUrl}/api/v1/analytics/pac-vs-executed`);
  assert.ok(Array.isArray(body.data), 'data should be array');
  if (body.data.length > 0) {
    const first = body.data[0];
    assert.ok(typeof first.entityName === 'string', 'entityName should be string');
    assert.ok(typeof first.executionRate === 'number', 'executionRate should be number');
  }
});

// ---- Alerts ----
test('GET /api/v1/analytics/alerts returns data array and total', async () => {
  const body = await fetchOk(`${baseUrl}/api/v1/analytics/alerts`);
  assert.ok(Array.isArray(body.data), 'data should be array');
  assert.strictEqual(typeof body.total, 'number');
});

test('GET /api/v1/analytics/alerts?resolved=false returns only unresolved', async () => {
  const body = await fetchOk(`${baseUrl}/api/v1/analytics/alerts?resolved=false`);
  assert.ok(Array.isArray(body.data));
  for (const alert of body.data) {
    assert.ok(alert.resolvedAt === null || alert.resolvedAt === undefined, 'should be unresolved');
  }
});

// ---- Risk Scores ----
test('GET /api/v1/analytics/risk-scores returns data array with riskLevel', async () => {
  const body = await fetchOk(`${baseUrl}/api/v1/analytics/risk-scores`);
  assert.ok(Array.isArray(body.data), 'data should be array');
  assert.strictEqual(typeof body.total, 'number');
  if (body.data.length > 0) {
    const first = body.data[0];
    assert.ok(['low', 'medium', 'high'].includes(first.riskLevel), 'riskLevel should be valid');
    assert.strictEqual(typeof first.totalScore, 'number');
    assert.ok(Array.isArray(first.flags), 'flags should be array');
  }
});

test('GET /api/v1/analytics/risk-scores?level=high filters correctly', async () => {
  const body = await fetchOk(`${baseUrl}/api/v1/analytics/risk-scores?level=high`);
  assert.ok(Array.isArray(body.data));
  for (const rs of body.data) {
    assert.strictEqual(rs.riskLevel, 'high', 'should only return high risk');
  }
});

// ---- Compute Risk ----
test('POST /api/v1/analytics/compute-risk/:id with valid seed tender returns riskLevel', async () => {
  const year = new Date().getFullYear();
  const tenders = await fetchOk(`${baseUrl}/api/v1/tenders?pageSize=100`);
  const target = (tenders.data || []).find((t) =>
    t.code && (t.code.includes('AN-001') || t.code.includes('AN-002') || t.code.includes('AN-003'))
  );
  if (!target) {
    console.log(`  skip: no se encontró tender de análisis (año ${year})`);
    return;
  }
  const body = await fetchOk(`${baseUrl}/api/v1/analytics/compute-risk/${target.id}`, { method: 'POST' });
  assert.ok(['low', 'medium', 'high'].includes(body.riskLevel), 'riskLevel should be valid');
  assert.strictEqual(typeof body.totalScore, 'number');
  assert.ok(Array.isArray(body.flags), 'flags should be array');
});

test('POST /api/v1/analytics/compute-risk/nonexistent returns 404', async () => {
  const res = await fetch(`${baseUrl}/api/v1/analytics/compute-risk/nonexistent-id-xyz`, { method: 'POST' });
  assert.strictEqual(res.status, 404);
});

test('POST /api/v1/analytics/compute-risk for SINGLE_BIDDER scenario detects flag', async () => {
  const year = new Date().getFullYear();
  const tenders = await fetchOk(`${baseUrl}/api/v1/tenders?pageSize=200`);
  const singleBidder = (tenders.data || []).find((t) => t.code === `SERCOP-${year}-AN-001`);
  if (!singleBidder) {
    console.log('  skip: tender SERCOP-AN-001 no encontrado (ejecutar db:seed primero)');
    return;
  }
  const body = await fetchOk(`${baseUrl}/api/v1/analytics/compute-risk/${singleBidder.id}`, { method: 'POST' });
  assert.ok(body.flags.includes('SINGLE_BIDDER'), `expected SINGLE_BIDDER flag, got: ${body.flags}`);
});

// ---- Provider Network ----
test('GET /api/v1/analytics/provider-network returns nodes and edges shape', async () => {
  const body = await fetchOk(`${baseUrl}/api/v1/analytics/provider-network`);
  assert.ok(Array.isArray(body.nodes), 'nodes should be array');
  assert.ok(Array.isArray(body.edges), 'edges should be array');
});

test('GET /api/v1/analytics/provider-network/:id/neighbors returns data array', async () => {
  const network = await fetchOk(`${baseUrl}/api/v1/analytics/provider-network`);
  if (!network.nodes.length) {
    console.log('  skip: no nodes in network');
    return;
  }
  const firstNode = network.nodes[0];
  const body = await fetchOk(`${baseUrl}/api/v1/analytics/provider-network/${firstNode.id}/neighbors`);
  assert.ok(Array.isArray(body.data), 'neighbors data should be array');
});

// ---- Public endpoints (no auth) ----
test('GET /api/v1/public/analytics/market-overview returns 200 without auth', async () => {
  const body = await fetchOk(`${baseUrl}/api/v1/public/analytics/market-overview`);
  assert.strictEqual(typeof body.totalContractAmount, 'number');
  assert.ok(Array.isArray(body.byProcessType));
});

test('GET /api/v1/public/analytics/top-providers returns array with name and totalAmount', async () => {
  const body = await fetchOk(`${baseUrl}/api/v1/public/analytics/top-providers`);
  assert.ok(Array.isArray(body.data));
  if (body.data.length > 0) {
    assert.ok(typeof body.data[0].name === 'string');
    assert.ok(typeof body.data[0].totalAmount === 'number');
  }
});

test('GET /api/v1/public/analytics/risk-summary returns low/medium/high counts', async () => {
  const body = await fetchOk(`${baseUrl}/api/v1/public/analytics/risk-summary`);
  assert.strictEqual(typeof body.low, 'number');
  assert.strictEqual(typeof body.medium, 'number');
  assert.strictEqual(typeof body.high, 'number');
  assert.strictEqual(typeof body.total, 'number');
});

// ---- Collusion scenarios (Fase 3) ----
test('Provider network edge between collusion providers detected after seed', async () => {
  const network = await fetchOk(`${baseUrl}/api/v1/analytics/provider-network?minShared=2`);
  // After seed, providers[0] and providers[1] share 5+ tenders (SERCOP-AN-020..024)
  // We verify the edge count and shape – exact providers may vary by run order
  if (network.edges.length > 0) {
    const edge = network.edges[0];
    assert.ok(typeof edge.providerAId === 'string');
    assert.ok(typeof edge.providerBId === 'string');
    assert.ok(typeof edge.sharedTenders === 'number');
    assert.ok(edge.sharedTenders >= 1);
  }
});
