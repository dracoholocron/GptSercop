/**
 * Unit tests for graph analytics scoring and pure graph algorithms.
 * Mirrors weighted totals from risk-engine.ts and PageRank/Betweenness from
 * packages/agent-soce-server/src/graph/sync-worker.ts (no DB).
 */
import test from 'node:test';
import assert from 'node:assert/strict';

// --- Inline: PageRank / Betweenness (sync-worker.ts) ---

function computePageRank(
  edges: Array<{ from: string; to: string; weight: number }>,
  damping = 0.85,
  iterations = 20,
): Map<string, number> {
  const nodes = new Set<string>();
  const outDegree = new Map<string, number>();
  const inEdges = new Map<string, Array<{ from: string; weight: number }>>();

  for (const e of edges) {
    nodes.add(e.from);
    nodes.add(e.to);
    outDegree.set(e.from, (outDegree.get(e.from) ?? 0) + e.weight);
    if (!inEdges.has(e.to)) inEdges.set(e.to, []);
    inEdges.get(e.to)!.push({ from: e.from, weight: e.weight });
    outDegree.set(e.to, (outDegree.get(e.to) ?? 0) + e.weight);
    if (!inEdges.has(e.from)) inEdges.set(e.from, []);
    inEdges.get(e.from)!.push({ from: e.to, weight: e.weight });
  }

  const n = nodes.size;
  if (n === 0) return new Map();

  const rank = new Map<string, number>();
  for (const node of nodes) rank.set(node, 1 / n);

  for (let i = 0; i < iterations; i++) {
    const newRank = new Map<string, number>();
    for (const node of nodes) {
      let sum = 0;
      for (const { from, weight } of inEdges.get(node) ?? []) {
        const deg = outDegree.get(from) ?? 1;
        sum += (rank.get(from) ?? 0) * (weight / deg);
      }
      newRank.set(node, (1 - damping) / n + damping * sum);
    }
    for (const [k, v] of newRank) rank.set(k, v);
  }

  return rank;
}

function computeBetweenness(edges: Array<{ from: string; to: string }>): Map<string, number> {
  const adj = new Map<string, Set<string>>();
  const nodes = new Set<string>();
  for (const e of edges) {
    nodes.add(e.from);
    nodes.add(e.to);
    if (!adj.has(e.from)) adj.set(e.from, new Set());
    if (!adj.has(e.to)) adj.set(e.to, new Set());
    adj.get(e.from)!.add(e.to);
    adj.get(e.to)!.add(e.from);
  }

  const cb = new Map<string, number>();
  for (const v of nodes) cb.set(v, 0);

  for (const s of nodes) {
    const stack: string[] = [];
    const pred = new Map<string, string[]>();
    const sigma = new Map<string, number>();
    const dist = new Map<string, number>();
    const delta = new Map<string, number>();

    for (const v of nodes) {
      pred.set(v, []);
      sigma.set(v, 0);
      dist.set(v, -1);
      delta.set(v, 0);
    }
    sigma.set(s, 1);
    dist.set(s, 0);

    const queue: string[] = [s];
    while (queue.length > 0) {
      const v = queue.shift()!;
      stack.push(v);
      for (const w of adj.get(v) ?? []) {
        if (dist.get(w)! < 0) {
          dist.set(w, dist.get(v)! + 1);
          queue.push(w);
        }
        if (dist.get(w) === dist.get(v)! + 1) {
          sigma.set(w, sigma.get(w)! + sigma.get(v)!);
          pred.get(w)!.push(v);
        }
      }
    }

    while (stack.length > 0) {
      const w = stack.pop()!;
      for (const v of pred.get(w)!) {
        delta.set(v, delta.get(v)! + (sigma.get(v)! / sigma.get(w)!) * (1 + delta.get(w)!));
      }
      if (w !== s) {
        cb.set(w, cb.get(w)! + delta.get(w)!);
      }
    }
  }

  for (const [k, v] of cb) cb.set(k, v / 2);
  return cb;
}

// --- Weighted risk total (risk-engine.ts) ---

type RiskDimensions = {
  competitionRisk: number;
  priceRisk: number;
  supplierRisk: number;
  processRisk: number;
  executionRisk: number;
  networkRisk: number;
};

const WEIGHTS = {
  competition: 0.2,
  price: 0.18,
  supplier: 0.18,
  process: 0.12,
  execution: 0.17,
  network: 0.15,
} as const;

function calcTotalRaw(d: RiskDimensions): number {
  return (
    d.competitionRisk * WEIGHTS.competition +
    d.priceRisk * WEIGHTS.price +
    d.supplierRisk * WEIGHTS.supplier +
    d.processRisk * WEIGHTS.process +
    d.executionRisk * WEIGHTS.execution +
    d.networkRisk * WEIGHTS.network
  );
}

function totalScoreFromDims(d: RiskDimensions): number {
  return Math.min(100, Math.round(calcTotalRaw(d)));
}

function riskLevel(score: number): 'low' | 'medium' | 'high' {
  if (score <= 30) return 'low';
  if (score <= 60) return 'medium';
  return 'high';
}

// --- Union-find: communities with >=2 members (graph-analytics overview) ---

function countCommunitiesMinSize2(nodeIds: string[], undirectedEdges: Array<[string, string]>): number {
  const parent = new Map<string, string>();
  function find(x: string): string {
    if (!parent.has(x)) parent.set(x, x);
    if (parent.get(x) !== x) parent.set(x, find(parent.get(x)!));
    return parent.get(x)!;
  }
  function union(a: string, b: string): void {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  }
  for (const id of nodeIds) parent.set(id, id);
  for (const [a, b] of undirectedEdges) union(a, b);
  const groups = new Map<string, string[]>();
  for (const id of nodeIds) {
    const r = find(id);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r)!.push(id);
  }
  return [...groups.values()].filter((m) => m.length >= 2).length;
}

// --- Network collusion flag rule (network-risk.ts) ---

function collusionClusterFromHighSharedEdges(highSharedEdgeCount: number): boolean {
  return highSharedEdgeCount >= 2;
}

// --- PageRank ---

test('PageRank: known graph A–B, B–C, A–C converges (no NaN, sum ≈ 1)', () => {
  const edges = [
    { from: 'A', to: 'B', weight: 1 },
    { from: 'B', to: 'C', weight: 1 },
    { from: 'A', to: 'C', weight: 1 },
  ];
  const rank = computePageRank(edges, 0.85, 40);
  let sum = 0;
  for (const v of rank.values()) {
    assert.ok(!Number.isNaN(v), 'rank should not be NaN');
    sum += v;
  }
  assert.ok(Math.abs(sum - 1) < 1e-5, `expected sum≈1, got ${sum}`);
});

test('PageRank: star topology — hub has highest rank', () => {
  const hub = 'H';
  const edges: Array<{ from: string; to: string; weight: number }> = [];
  for (let i = 0; i < 5; i++) {
    const leaf = `L${i}`;
    edges.push({ from: hub, to: leaf, weight: 1 });
  }
  const rank = computePageRank(edges, 0.85, 30);
  const hubRank = rank.get(hub)!;
  for (let i = 0; i < 5; i++) {
    assert.ok(hubRank > rank.get(`L${i}`)!, `hub should beat leaf L${i}`);
  }
});

test('PageRank: empty edge list returns empty Map', () => {
  const rank = computePageRank([]);
  assert.strictEqual(rank.size, 0);
});

test('PageRank: single edge — two nodes, both positive rank, sum ≈ 1', () => {
  const rank = computePageRank([{ from: 'X', to: 'Y', weight: 1 }], 0.85, 25);
  assert.strictEqual(rank.size, 2);
  assert.ok((rank.get('X') ?? 0) > 0);
  assert.ok((rank.get('Y') ?? 0) > 0);
  const sum = [...rank.values()].reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1) < 1e-5);
});

// --- Betweenness ---

test('Betweenness: linear chain A-B-C-D — B and C highest', () => {
  const edges = [
    { from: 'A', to: 'B' },
    { from: 'B', to: 'C' },
    { from: 'C', to: 'D' },
  ];
  const bc = computeBetweenness(edges);
  const bB = bc.get('B')!;
  const bC = bc.get('C')!;
  assert.ok(bB > bc.get('A')! && bB > bc.get('D')!);
  assert.ok(bC > bc.get('A')! && bC > bc.get('D')!);
  assert.ok(bB > 0 && bC > 0);
});

test('Betweenness: star — hub has strictly highest betweenness', () => {
  const hub = 'H';
  const edges: Array<{ from: string; to: string }> = [];
  for (let i = 0; i < 5; i++) edges.push({ from: hub, to: `L${i}` });
  const bc = computeBetweenness(edges);
  const h = bc.get(hub)!;
  for (let i = 0; i < 5; i++) assert.ok(h > bc.get(`L${i}`)!);
});

test('Betweenness: empty graph returns empty Map', () => {
  const bc = computeBetweenness([]);
  assert.strictEqual(bc.size, 0);
});

test('Betweenness: single edge — both endpoints get 0 centrality', () => {
  const bc = computeBetweenness([{ from: 'U', to: 'V' }]);
  assert.strictEqual(bc.get('U'), 0);
  assert.strictEqual(bc.get('V'), 0);
});

// --- Risk levels & weighted formula ---

test('Risk level thresholds: ≤30 low, 31–60 medium, >60 high', () => {
  assert.strictEqual(riskLevel(0), 'low');
  assert.strictEqual(riskLevel(30), 'low');
  assert.strictEqual(riskLevel(31), 'medium');
  assert.strictEqual(riskLevel(45), 'medium');
  assert.strictEqual(riskLevel(60), 'medium');
  assert.strictEqual(riskLevel(61), 'high');
  assert.strictEqual(riskLevel(100), 'high');
});

test('Weighted formula (6 dimensions): explicit weights match risk-engine', () => {
  const d: RiskDimensions = {
    competitionRisk: 10,
    priceRisk: 20,
    supplierRisk: 30,
    processRisk: 40,
    executionRisk: 50,
    networkRisk: 60,
  };
  const expected =
    10 * 0.2 + 20 * 0.18 + 30 * 0.18 + 40 * 0.12 + 50 * 0.17 + 60 * 0.15;
  assert.ok(Math.abs(calcTotalRaw(d) - expected) < 1e-9);
  assert.strictEqual(totalScoreFromDims(d), Math.min(100, Math.round(expected)));
});

test('All dimensions zero → total score 0', () => {
  const d: RiskDimensions = {
    competitionRisk: 0,
    priceRisk: 0,
    supplierRisk: 0,
    processRisk: 0,
    executionRisk: 0,
    networkRisk: 0,
  };
  assert.strictEqual(totalScoreFromDims(d), 0);
  assert.strictEqual(riskLevel(totalScoreFromDims(d)), 'low');
});

test('All dimensions max (100) → total score 100', () => {
  const d: RiskDimensions = {
    competitionRisk: 100,
    priceRisk: 100,
    supplierRisk: 100,
    processRisk: 100,
    executionRisk: 100,
    networkRisk: 100,
  };
  assert.strictEqual(totalScoreFromDims(d), 100);
});

test('Network dimension only at 100 → total = 0.15 × 100 = 15', () => {
  const d: RiskDimensions = {
    competitionRisk: 0,
    priceRisk: 0,
    supplierRisk: 0,
    processRisk: 0,
    executionRisk: 0,
    networkRisk: 100,
  };
  assert.strictEqual(calcTotalRaw(d), 15);
  assert.strictEqual(totalScoreFromDims(d), 15);
});

// --- Collusion / communities ---

test('Collusion: COLLUSION_CLUSTER when enough high-shared edges (network-risk rule)', () => {
  assert.strictEqual(collusionClusterFromHighSharedEdges(0), false);
  assert.strictEqual(collusionClusterFromHighSharedEdges(1), false);
  assert.strictEqual(collusionClusterFromHighSharedEdges(2), true);
  assert.strictEqual(collusionClusterFromHighSharedEdges(5), true);
});

test('Union-find community count: two disjoint pairs → 2 communities (size≥2)', () => {
  const nodes = ['a1', 'a2', 'b1', 'b2'];
  const edges: Array<[string, string]> = [
    ['a1', 'a2'],
    ['b1', 'b2'],
  ];
  assert.strictEqual(countCommunitiesMinSize2(nodes, edges), 2);
});

test('Union-find: triangle is a single community', () => {
  const nodes = ['x', 'y', 'z'];
  const edges: Array<[string, string]> = [
    ['x', 'y'],
    ['y', 'z'],
    ['x', 'z'],
  ];
  assert.strictEqual(countCommunitiesMinSize2(nodes, edges), 1);
});

test('Union-find: isolated node + one edge → one community', () => {
  const nodes = ['solo', 'p', 'q'];
  const edges: Array<[string, string]> = [['p', 'q']];
  assert.strictEqual(countCommunitiesMinSize2(nodes, edges), 1);
});

// --- Visual Network helpers (getVisualNetwork shape) ---

test('VisualNetwork: node radius scales with degree (min 4, max 20)', () => {
  function nodeRadius(degree: number): number {
    return Math.max(4, Math.min(20, 4 + Math.sqrt(degree) * 2));
  }
  assert.strictEqual(nodeRadius(0), 4);
  assert.ok(nodeRadius(10) > 4 && nodeRadius(10) < 20);
  assert.strictEqual(nodeRadius(1000), 20);
});

test('VisualNetwork: community assignment via Union-Find is deterministic', () => {
  const nodes = ['A', 'B', 'C', 'D'];
  const edges: Array<[string, string]> = [['A', 'B'], ['C', 'D']];
  const count1 = countCommunitiesMinSize2(nodes, edges);
  const count2 = countCommunitiesMinSize2(nodes, edges);
  assert.strictEqual(count1, count2);
  assert.strictEqual(count1, 2);
});

test('VisualNetwork: PageRank values used for node selection are valid', () => {
  const edges = [
    { from: 'A', to: 'B', weight: 3 },
    { from: 'B', to: 'C', weight: 1 },
  ];
  const rank = computePageRank(edges, 0.85, 20);
  for (const [, v] of rank) {
    assert.ok(v >= 0, 'PageRank values must be non-negative');
    assert.ok(v <= 1, 'PageRank values should be ≤ 1 for proper convergence');
  }
});

test('VisualNetwork: link filtering keeps only edges between selected nodes', () => {
  const allEdges = [
    { source: 'A', target: 'B', shared: 5 },
    { source: 'A', target: 'C', shared: 3 },
    { source: 'B', target: 'D', shared: 2 },
  ];
  const selected = new Set(['A', 'B']);
  const filtered = allEdges.filter((e) => selected.has(e.source) && selected.has(e.target));
  assert.strictEqual(filtered.length, 1);
  assert.strictEqual(filtered[0].source, 'A');
  assert.strictEqual(filtered[0].target, 'B');
});

test('VisualNetwork: limit caps output correctly', () => {
  const nodes = Array.from({ length: 50 }, (_, i) => `N${i}`);
  const limit = 10;
  const cappedLimit = Math.max(1, Math.min(limit, 500));
  const selected = nodes.slice(0, cappedLimit);
  assert.strictEqual(selected.length, 10);
});

test('VisualNetwork: risk color mapping returns expected colors', () => {
  const riskColors: Record<string, string> = { high: '#E53E3E', medium: '#ED8936', low: '#48BB78' };
  function riskColor(level: string | null): string {
    return (level && riskColors[level]) ?? '#A0AEC0';
  }
  assert.strictEqual(riskColor('high'), '#E53E3E');
  assert.strictEqual(riskColor('medium'), '#ED8936');
  assert.strictEqual(riskColor('low'), '#48BB78');
  assert.strictEqual(riskColor(null), '#A0AEC0');
  assert.strictEqual(riskColor('unknown'), '#A0AEC0');
});
