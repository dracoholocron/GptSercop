import pg from 'pg';
import { assertSafeGraphName } from './age-client.js';
import { syncProviderGraph, getProviderCommunities } from './provider-graph.js';
import { prisma } from '../db/client.js';

interface SyncResult {
  synced: number;
  communities: number;
  nodes: number;
  edges: number;
  duration: number;
}

export async function syncGraphFromBids(graphName: string): Promise<SyncResult> {
  const start = Date.now();
  assertSafeGraphName(graphName);
  const hostUrl = process.env.HOST_DATABASE_URL;
  if (!hostUrl) throw new Error('HOST_DATABASE_URL not configured');

  const pool = new pg.Pool({ connectionString: hostUrl });
  try {
    const { rows } = await pool.query<{
      providerAId: string;
      providerBId: string;
      sharedTenders: number;
      providerAName: string | null;
      providerBName: string | null;
    }>(`
      SELECT
        LEAST(b1."providerId", b2."providerId") AS "providerAId",
        GREATEST(b1."providerId", b2."providerId") AS "providerBId",
        COUNT(DISTINCT b1."tenderId")::int AS "sharedTenders",
        MIN(p1.name) AS "providerAName",
        MIN(p2.name) AS "providerBName"
      FROM "Bid" b1
      JOIN "Bid" b2 ON b1."tenderId" = b2."tenderId" AND b1."providerId" < b2."providerId"
      LEFT JOIN "Provider" p1 ON p1.id = LEAST(b1."providerId", b2."providerId")
      LEFT JOIN "Provider" p2 ON p2.id = GREATEST(b1."providerId", b2."providerId")
      GROUP BY 1, 2
      HAVING COUNT(DISTINCT b1."tenderId") >= 1
    `);

    const relations = rows.map((r) => ({
      ...r,
      providerAName: r.providerAName ?? undefined,
      providerBName: r.providerBName ?? undefined,
    }));

    const synced = await syncProviderGraph(
      prisma as unknown as Parameters<typeof syncProviderGraph>[0],
      graphName,
      relations,
    );

    let communities: Awaited<ReturnType<typeof getProviderCommunities>> = [];
    try {
      communities = await getProviderCommunities(
        prisma as unknown as Parameters<typeof getProviderCommunities>[0],
        graphName,
      );
    } catch {
      // AGE may not be available — communities remain empty
    }

    const nodeSet = new Set<string>();
    for (const r of relations) {
      nodeSet.add(r.providerAId);
      nodeSet.add(r.providerBId);
    }

    return {
      synced,
      communities: communities.length,
      nodes: nodeSet.size,
      edges: relations.length,
      duration: Date.now() - start,
    };
  } finally {
    await pool.end();
  }
}

export function computePageRank(
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

export function computeBetweenness(
  edges: Array<{ from: string; to: string }>,
): Map<string, number> {
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
