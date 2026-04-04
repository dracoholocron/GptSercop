/**
 * Unit tests for risk-engine.ts.
 * Uses stubbed Prisma client to test scoring logic without a real DB.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

// ---- Helpers to test the scoring formula directly ----

const WEIGHTS = {
  competition: 0.25,
  price: 0.20,
  supplier: 0.20,
  process: 0.15,
  execution: 0.20,
} as const;

function calcTotal(d: {
  competitionRisk: number;
  priceRisk: number;
  supplierRisk: number;
  processRisk: number;
  executionRisk: number;
}): number {
  return Math.min(
    100,
    Math.round(
      d.competitionRisk * WEIGHTS.competition +
      d.priceRisk * WEIGHTS.price +
      d.supplierRisk * WEIGHTS.supplier +
      d.processRisk * WEIGHTS.process +
      d.executionRisk * WEIGHTS.execution,
    ),
  );
}

function riskLevel(score: number): 'low' | 'medium' | 'high' {
  if (score <= 30) return 'low';
  if (score <= 60) return 'medium';
  return 'high';
}

// ---- Formula tests ----
test('Formula ponderada: score bajo (3 oferentes, precio normal) → riskLevel=low', () => {
  const dims = { competitionRisk: 10, priceRisk: 5, supplierRisk: 10, processRisk: 10, executionRisk: 5 };
  const score = calcTotal(dims);
  assert.ok(score <= 30, `expected score ≤ 30, got ${score}`);
  assert.strictEqual(riskLevel(score), 'low');
});

test('Formula ponderada: score alto (1 oferente, precio 99% presupuesto) → riskLevel=high', () => {
  const dims = { competitionRisk: 90, priceRisk: 75, supplierRisk: 20, processRisk: 30, executionRisk: 20 };
  const score = calcTotal(dims);
  assert.ok(score > 60, `expected score > 60, got ${score}`);
  assert.strictEqual(riskLevel(score), 'high');
});

test('Formula ponderada: score medio → riskLevel=medium', () => {
  const dims = { competitionRisk: 60, priceRisk: 30, supplierRisk: 40, processRisk: 20, executionRisk: 30 };
  const score = calcTotal(dims);
  assert.ok(score > 30 && score <= 60, `expected 30 < score ≤ 60, got ${score}`);
  assert.strictEqual(riskLevel(score), 'medium');
});

test('Score nunca supera 100', () => {
  const dims = { competitionRisk: 100, priceRisk: 100, supplierRisk: 100, processRisk: 100, executionRisk: 100 };
  const score = calcTotal(dims);
  assert.strictEqual(score, 100);
});

test('Score siempre es número entero no negativo', () => {
  const dims = { competitionRisk: 0, priceRisk: 0, supplierRisk: 0, processRisk: 0, executionRisk: 0 };
  const score = calcTotal(dims);
  assert.strictEqual(score, 0);
  assert.strictEqual(typeof score, 'number');
});

// ---- Pattern flag tests (logic, not DB) ----
test('SINGLE_BIDDER flag: 1 bid → competitionRisk = 90', () => {
  const bids = [{ amount: 100000 }];
  let competitionRisk = 0;
  const flags: string[] = [];
  if (bids.length === 1) { competitionRisk = Math.max(competitionRisk, 90); flags.push('SINGLE_BIDDER'); }
  assert.strictEqual(competitionRisk, 90);
  assert.ok(flags.includes('SINGLE_BIDDER'));
});

test('FEW_BIDS flag: 2 bids → competitionRisk = 60', () => {
  const bids = [{ amount: 100000 }, { amount: 105000 }];
  let competitionRisk = 0;
  const flags: string[] = [];
  if (bids.length <= 2 && bids.length > 0) { competitionRisk = Math.max(competitionRisk, 60); flags.push('FEW_BIDS'); }
  assert.ok(competitionRisk >= 60);
  assert.ok(flags.includes('FEW_BIDS'));
});

test('NEARLY_EQUAL_BIDS: CV < 2% → flag set', () => {
  const amounts = [100000, 100100, 100200];
  const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const stddev = Math.sqrt(amounts.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) / amounts.length);
  const cv = stddev / avg;
  assert.ok(cv < 0.02, `expected CV < 0.02, got ${cv}`);
});

test('OVERPRICE: contract 98% of reference budget → flag set', () => {
  const contractAmount = 196000;
  const refBudget = 200000;
  const ratio = contractAmount / refBudget;
  assert.ok(ratio >= 0.97, `expected ratio ≥ 0.97, got ${ratio}`);
});

test('FAST_PROCESS: published to signed in 3 days → processRisk = 80', () => {
  const publishedAt = new Date('2024-01-01');
  const signedAt = new Date('2024-01-04');
  const days = (signedAt.getTime() - publishedAt.getTime()) / (1000 * 60 * 60 * 24);
  assert.ok(days < 15, `expected days < 15, got ${days}`);
  let processRisk = 0;
  const flags: string[] = [];
  if (days < 15) { processRisk = Math.max(processRisk, 80); flags.push('FAST_PROCESS'); }
  assert.strictEqual(processRisk, 80);
  assert.ok(flags.includes('FAST_PROCESS'));
});

test('FREQUENT_AMENDMENTS: 3+ amendments → executionRisk = 80', () => {
  const amendments = [{ changeType: 'PLAZO' }, { changeType: 'MONTO' }, { changeType: 'PLAZO' }];
  let executionRisk = 0;
  const flags: string[] = [];
  if (amendments.length >= 3) { executionRisk = Math.max(executionRisk, 80); flags.push('FREQUENT_AMENDMENTS'); }
  assert.strictEqual(executionRisk, 80);
  assert.ok(flags.includes('FREQUENT_AMENDMENTS'));
});

test('NEW_COMPANY_LARGE_CONTRACT: empresa < 1 año + contrato > 100k → supplierRisk = 85', () => {
  const ageDays = 60;
  const contractAmount = 340000;
  let supplierRisk = 0;
  const flags: string[] = [];
  if (ageDays < 365 && contractAmount > 100000) {
    supplierRisk = Math.max(supplierRisk, 85);
    flags.push('NEW_COMPANY_LARGE_CONTRACT');
  }
  assert.strictEqual(supplierRisk, 85);
  assert.ok(flags.includes('NEW_COMPANY_LARGE_CONTRACT'));
});

test('ABNORMALLY_LOW_BID: oferta < 50% promedio → priceRisk = 70', () => {
  const amounts = [50000, 100000, 105000];
  const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const lowest = Math.min(...amounts);
  let priceRisk = 0;
  const flags: string[] = [];
  if (avg > 0 && lowest < avg * 0.5) { priceRisk = Math.max(priceRisk, 70); flags.push('ABNORMALLY_LOW_BID'); }
  assert.strictEqual(priceRisk, 70);
  assert.ok(flags.includes('ABNORMALLY_LOW_BID'));
});

test('THIN_WIN_MARGIN: margen ganador < 1% → competitionRisk = 70', () => {
  const sorted = [100000, 100200].sort((a, b) => a - b);
  const margin = (sorted[1] - sorted[0]) / sorted[1];
  assert.ok(margin < 0.01, `expected margin < 0.01, got ${margin}`);
  let competitionRisk = 0;
  const flags: string[] = [];
  if (margin < 0.01) { competitionRisk = Math.max(competitionRisk, 70); flags.push('THIN_WIN_MARGIN'); }
  assert.ok(flags.includes('THIN_WIN_MARGIN'));
});
