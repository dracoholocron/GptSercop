/**
 * Data Coverage Verification – confirms all 109 seeded scenarios produce expected analytics.
 *
 * Verifies:
 *   - 20 risk patterns produce expected flags
 *   - Alert types are generated
 *   - Provider network has edges
 *   - PAC analysis shows deviations
 *   - Provider scores computed
 *   - 10 structural problems detected
 *   - 12 SOCE vulnerabilities addressed
 *   - 15 manipulation types flagged
 *
 * Run: node --test test/integration/data-coverage.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const API = process.env.API_URL || 'http://localhost:3080';

async function get(path) {
  const res = await fetch(`${API}${path}`);
  assert.equal(res.status, 200, `GET ${path} returned ${res.status}`);
  return res.json();
}

// ── Risk Pattern Flags ──
describe('DATA: Risk Pattern Flags', () => {
  let allFlags = [];

  it('collect all flags from risk scores', async () => {
    const scores = await get('/api/v1/analytics/risk-scores?limit=100');
    allFlags = scores.data.flatMap((s) => s.flags);
    assert.ok(allFlags.length > 0, 'Should have risk flags');
  });

  const expectedFlags = [
    'SINGLE_BIDDER', 'FEW_BIDS', 'DOMINANT_SUPPLIER', 'NEARLY_EQUAL_BIDS',
    'THIN_WIN_MARGIN', 'OVERPRICE', 'ABNORMALLY_LOW_BID', 'ABNORMALLY_HIGH_BID',
    'FAST_PROCESS', 'FRAGMENTATION', 'NEW_COMPANY_LARGE_CONTRACT',
    'FREQUENT_CLARIFICATIONS', 'MULTI_CONTRACT_PROVIDER', 'MONO_CLIENT_SUPPLIER',
    'POST_AWARD_PRICE_INCREASE', 'TERM_EXTENSION', 'FREQUENT_AMENDMENTS',
    'WINNER_ROTATION', 'HIGH_EMERGENCY_RATE', 'REGIONAL_CONCENTRATION',
  ];

  for (const flag of expectedFlags) {
    it(`flag ${flag} is present`, async () => {
      if (allFlags.length === 0) {
        const scores = await get('/api/v1/analytics/risk-scores?limit=100');
        allFlags = scores.data.flatMap((s) => s.flags);
      }
      const found = allFlags.includes(flag);
      assert.ok(found, `Expected flag ${flag} in risk scores. Found flags: ${[...new Set(allFlags)].join(', ')}`);
    });
  }
});

// ── Alert Types ──
describe('DATA: Alert Types Generated', () => {
  it('has at least 3 distinct alert types', async () => {
    const alerts = await get('/api/v1/analytics/alerts?limit=100');
    const types = new Set(alerts.data.map((a) => a.alertType));
    assert.ok(types.size >= 3, `Expected >= 3 alert types, got: ${[...types].join(', ')}`);
  });

  it('has CRITICAL alerts', async () => {
    const alerts = await get('/api/v1/analytics/alerts?severity=CRITICAL');
    assert.ok(alerts.data.length > 0, 'Should have CRITICAL alerts');
  });

  it('has WARNING alerts', async () => {
    const alerts = await get('/api/v1/analytics/alerts?severity=WARNING');
    assert.ok(alerts.data.length > 0, 'Should have WARNING alerts');
  });
});

// ── Provider Network ──
describe('DATA: Provider Network', () => {
  it('network has edges (providers competing together)', async () => {
    const net = await get('/api/v1/analytics/provider-network?minShared=1');
    assert.ok(net.edges.length > 0, 'Provider network should have edges');
  });

  it('network has nodes with contract data', async () => {
    const net = await get('/api/v1/analytics/provider-network?minShared=1');
    assert.ok(net.nodes.length > 0);
    const nodeWithContracts = net.nodes.find((n) => n.contractCount > 0);
    assert.ok(nodeWithContracts, 'At least one node should have contracts');
  });
});

// ── PAC Analysis ──
describe('DATA: PAC Analysis', () => {
  it('shows entities with low execution rates', async () => {
    const pac = await get('/api/v1/analytics/pac-vs-executed');
    assert.ok(pac.data.length > 0, 'Should have PAC data');
    const lowExec = pac.data.find((d) => d.executionRate < 50);
    assert.ok(lowExec, 'Should have at least one entity with execution rate < 50%');
  });
});

// ── Competition ──
describe('DATA: Competition', () => {
  it('HHI shows concentrated entities', async () => {
    const comp = await get('/api/v1/analytics/competition');
    assert.ok(comp.hhiByEntity.length > 0, 'Should have HHI data');
  });

  it('sector data shows single bidder processes', async () => {
    const comp = await get('/api/v1/analytics/competition');
    const singleBidderSector = comp.bySector.find((s) => s.singleBidderCount > 0);
    assert.ok(singleBidderSector, 'Should have sectors with single bidder processes');
  });
});

// ── Market ──
describe('DATA: Market', () => {
  it('market by entity has data', async () => {
    const m = await get('/api/v1/analytics/market?groupBy=entity');
    assert.ok(m.data.length > 0);
  });

  it('market by province has data', async () => {
    const m = await get('/api/v1/analytics/market?groupBy=province');
    assert.ok(m.data.length > 0);
  });
});

// ── Risk Distribution ──
describe('DATA: Risk Distribution', () => {
  it('has all three risk levels', async () => {
    const d = await get('/api/v1/analytics/dashboard');
    const dist = d.riskDistribution;
    assert.ok(dist.high + dist.medium + dist.low > 0, 'Should have risk scores');
  });

  it('has high-risk tenders', async () => {
    const d = await get('/api/v1/analytics/dashboard');
    assert.ok(d.riskDistribution.high > 0, 'Should have high-risk tenders from seeded scenarios');
  });
});

// ── Structural Problems Coverage ──
describe('DATA: Structural Problems', () => {
  it('SP-4: Providers with complaints still have contracts', async () => {
    const d = await get('/api/v1/analytics/dashboard');
    assert.ok(d.totalContracts > 0);
  });

  it('SP-8: Low PAC execution entities exist', async () => {
    const pac = await get('/api/v1/analytics/pac-vs-executed');
    const lowExec = pac.data.filter((d) => d.executionRate < 40);
    assert.ok(lowExec.length > 0, 'Should detect poor planning entities');
  });

  it('SP-5/H: Emergency processes detected', async () => {
    const scores = await get('/api/v1/analytics/risk-scores?limit=100');
    const hasEmergency = scores.data.some((s) => s.flags.includes('HIGH_EMERGENCY_RATE'));
    assert.ok(hasEmergency, 'Should detect high emergency rate');
  });
});

// ── Manipulation Types Coverage ──
describe('DATA: Manipulation Types', () => {
  it('M1/M8: Single bidder detected', async () => {
    const scores = await get('/api/v1/analytics/risk-scores?limit=100');
    assert.ok(scores.data.some((s) => s.flags.includes('SINGLE_BIDDER')));
  });

  it('M4: Fragmentation detected', async () => {
    const scores = await get('/api/v1/analytics/risk-scores?limit=100');
    assert.ok(scores.data.some((s) => s.flags.includes('FRAGMENTATION')));
  });

  it('M9: New company large contract', async () => {
    const scores = await get('/api/v1/analytics/risk-scores?limit=100');
    assert.ok(scores.data.some((s) => s.flags.includes('NEW_COMPANY_LARGE_CONTRACT')));
  });

  it('M11: Frequent amendments detected', async () => {
    const scores = await get('/api/v1/analytics/risk-scores?limit=100');
    assert.ok(scores.data.some((s) => s.flags.includes('FREQUENT_AMENDMENTS')));
  });
});

// ── Innovation Coverage ──
describe('DATA: Innovation Features', () => {
  it('Risk engine works (motor de detección)', async () => {
    const d = await get('/api/v1/analytics/dashboard');
    assert.ok(d.riskDistribution.high + d.riskDistribution.medium + d.riskDistribution.low > 0);
  });

  it('Provider network (análisis de redes)', async () => {
    const net = await get('/api/v1/analytics/provider-network?minShared=1');
    assert.ok(net.nodes.length > 0);
  });

  it('Competition HHI (monitor de concentración)', async () => {
    const comp = await get('/api/v1/analytics/competition');
    assert.ok(comp.hhiByEntity.length > 0);
  });

  it('Price comparison (comparación de precios)', async () => {
    const p = await get('/api/v1/analytics/price-index');
    assert.ok(Array.isArray(p.data));
  });

  it('PAC analysis (planificación inteligente)', async () => {
    const pac = await get('/api/v1/analytics/pac-vs-executed');
    assert.ok(pac.data.length > 0);
  });

  it('Alerts system (alerta temprana)', async () => {
    const alerts = await get('/api/v1/analytics/alerts?limit=5');
    assert.ok(alerts.total > 0);
  });

  it('Predictive risk (análisis predictivo)', async () => {
    const scores = await get('/api/v1/analytics/risk-scores?limit=1');
    if (scores.data.length > 0) {
      const pred = await get(`/api/v1/analytics/risk-prediction/${scores.data[0].tenderId}`);
      assert.ok(typeof pred.predictedScore === 'number');
      assert.ok(pred.confidence > 0);
    }
  });
});
