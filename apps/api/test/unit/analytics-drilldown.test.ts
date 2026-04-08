/**
 * Unit tests for analytics drill-down logic.
 * Tests pure computation helpers without a real DB.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

// ---- Tier computation logic (mirrors provider-score.ts) ----
function computeTier(total: number): string {
  if (total >= 80) return 'premium';
  if (total >= 50) return 'standard';
  if (total >= 30) return 'watch';
  return 'restricted';
}

function computeTotalScore(c: number, d: number, p: number, div: number): number {
  return (c + d + p + div) / 4;
}

test('tier: score 80 is premium', () => {
  assert.equal(computeTier(80), 'premium');
});

test('tier: score 79 is standard', () => {
  assert.equal(computeTier(79), 'standard');
});

test('tier: score 50 is standard', () => {
  assert.equal(computeTier(50), 'standard');
});

test('tier: score 49 is watch', () => {
  assert.equal(computeTier(49), 'watch');
});

test('tier: score 30 is watch', () => {
  assert.equal(computeTier(30), 'watch');
});

test('tier: score 29 is restricted', () => {
  assert.equal(computeTier(29), 'restricted');
});

test('tier: score 0 is restricted', () => {
  assert.equal(computeTier(0), 'restricted');
});

test('tier: score 100 is premium', () => {
  assert.equal(computeTier(100), 'premium');
});

// ---- Total score calculation ----
test('totalScore: average of 4 dimensions', () => {
  const score = computeTotalScore(90, 80, 70, 60);
  assert.equal(score, 75);
});

test('totalScore: all max gives 100', () => {
  assert.equal(computeTotalScore(100, 100, 100, 100), 100);
});

test('totalScore: all zero gives 0', () => {
  assert.equal(computeTotalScore(0, 0, 0, 0), 0);
});

// ---- Entity KPI aggregation logic ----
function computeEntitySpend(contracts: Array<{ amount: number }>): number {
  return contracts.reduce((sum, c) => sum + c.amount, 0);
}

function computeAvgBidders(tenderBids: Array<{ bidCount: number }>): number {
  if (tenderBids.length === 0) return 0;
  const total = tenderBids.reduce((sum, t) => sum + t.bidCount, 0);
  return Math.round((total / tenderBids.length) * 100) / 100;
}

test('entityKPI: total spend sums amounts', () => {
  const result = computeEntitySpend([
    { amount: 100_000 },
    { amount: 250_000 },
    { amount: 50_000 },
  ]);
  assert.equal(result, 400_000);
});

test('entityKPI: spend is 0 with no contracts', () => {
  assert.equal(computeEntitySpend([]), 0);
});

test('entityKPI: avgBidders computes correctly', () => {
  const result = computeAvgBidders([
    { bidCount: 3 },
    { bidCount: 1 },
    { bidCount: 2 },
  ]);
  assert.equal(result, 2);
});

test('entityKPI: avgBidders returns 0 for no tenders', () => {
  assert.equal(computeAvgBidders([]), 0);
});

// ---- processType filter logic ----
function applyProcessTypeFilter(
  items: Array<{ processType: string; score: number }>,
  processType?: string,
): Array<{ processType: string; score: number }> {
  if (!processType) return items;
  return items.filter((i) => i.processType === processType);
}

test('processTypeFilter: no filter returns all', () => {
  const items = [
    { processType: 'licitacion', score: 50 },
    { processType: 'subasta_inversa', score: 30 },
  ];
  assert.equal(applyProcessTypeFilter(items).length, 2);
});

test('processTypeFilter: filters correctly', () => {
  const items = [
    { processType: 'licitacion', score: 50 },
    { processType: 'subasta_inversa', score: 30 },
    { processType: 'licitacion', score: 70 },
  ];
  const result = applyProcessTypeFilter(items, 'licitacion');
  assert.equal(result.length, 2);
  assert.ok(result.every((i) => i.processType === 'licitacion'));
});

test('processTypeFilter: unknown type returns empty', () => {
  const items = [{ processType: 'licitacion', score: 50 }];
  assert.equal(applyProcessTypeFilter(items, 'nonexistent').length, 0);
});

// ---- Resolve alert metadata merge ----
function buildResolveMetadata(
  existing: Record<string, unknown>,
  opts: { notes?: string; actionTaken?: string; resolvedBy?: string },
): Record<string, unknown> {
  return {
    ...existing,
    ...(opts.notes ? { notes: opts.notes } : {}),
    ...(opts.actionTaken ? { actionTaken: opts.actionTaken } : {}),
    resolvedBy: opts.resolvedBy ?? 'unknown',
  };
}

test('resolveMetadata: notes and actionTaken are merged', () => {
  const result = buildResolveMetadata({ totalScore: 75 }, {
    notes: 'Investigated, false positive',
    actionTaken: 'false_positive',
    resolvedBy: 'analyst@org.ec',
  });
  assert.equal(result.notes, 'Investigated, false positive');
  assert.equal(result.actionTaken, 'false_positive');
  assert.equal(result.resolvedBy, 'analyst@org.ec');
  assert.equal(result.totalScore, 75);
});

test('resolveMetadata: preserves existing metadata', () => {
  const result = buildResolveMetadata({ tenderId: 'abc-123', totalScore: 80 }, {
    resolvedBy: 'admin@org.ec',
  });
  assert.equal(result.tenderId, 'abc-123');
  assert.equal(result.resolvedBy, 'admin@org.ec');
});

test('resolveMetadata: notes not added if empty', () => {
  const result = buildResolveMetadata({}, { resolvedBy: 'admin' });
  assert.ok(!('notes' in result));
  assert.ok(!('actionTaken' in result));
});

test('resolveMetadata: resolvedBy defaults to unknown', () => {
  const result = buildResolveMetadata({}, {});
  assert.equal(result.resolvedBy, 'unknown');
});

// ---- Risk level URL param validation ----
function parseRiskLevel(level?: string): 'low' | 'medium' | 'high' | undefined {
  if (!level) return undefined;
  if (['low', 'medium', 'high'].includes(level)) return level as 'low' | 'medium' | 'high';
  return undefined;
}

test('riskLevel: high parses correctly', () => {
  assert.equal(parseRiskLevel('high'), 'high');
});

test('riskLevel: invalid value returns undefined', () => {
  assert.equal(parseRiskLevel('critical'), undefined);
});

test('riskLevel: empty string returns undefined', () => {
  assert.equal(parseRiskLevel(''), undefined);
});

test('riskLevel: undefined returns undefined', () => {
  assert.equal(parseRiskLevel(undefined), undefined);
});
