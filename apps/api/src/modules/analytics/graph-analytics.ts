import { prisma } from '../../db.js';

// --- Types ---

export interface GraphOverview {
  totalProviders: number;
  totalRelations: number;
  totalCommunities: number;
  avgDegree: number;
  networkDensity: number;
  topCommunities: Array<{
    communityId: number;
    memberCount: number;
    totalSharedTenders: number;
    members: Array<{ id: string; name: string; degree: number }>;
  }>;
  riskSummary: {
    highRiskNodes: number;
    collusionCandidates: number;
    isolatedWinners: number;
  };
}

export interface CollusionCandidate {
  clusterId: number;
  members: Array<{ id: string; name: string; province?: string }>;
  evidence: {
    sharedTenders: number;
    rotationScore: number;
    bidSimilarityScore: number;
    sameAddress: boolean;
  };
  totalAmount: number;
  riskLevel: 'CRITICAL' | 'WARNING' | 'INFO';
}

export interface CentralityItem {
  providerId: string;
  providerName: string;
  province: string | null;
  degree: number;
  pageRank: number;
  betweenness: number;
  contractCount: number;
  totalAmount: number;
}

export interface EgoNetwork {
  center: { id: string; name: string; riskScore?: number };
  nodes: Array<{ id: string; name: string; degree: number; riskLevel?: string }>;
  edges: Array<{ from: string; to: string; sharedTenders: number }>;
}

export interface RiskPropagationItem {
  providerId: string;
  providerName: string;
  ownRiskScore: number;
  networkRiskScore: number;
  connectedHighRisk: number;
  riskIncrease: number;
}

// --- Graph Overview ---

export async function getGraphOverview(): Promise<GraphOverview> {
  const relations = await prisma.providerRelation.findMany({
    select: { providerAId: true, providerBId: true, sharedTenders: true },
  });

  const adj = new Map<string, Set<string>>();
  for (const r of relations) {
    if (!adj.has(r.providerAId)) adj.set(r.providerAId, new Set());
    if (!adj.has(r.providerBId)) adj.set(r.providerBId, new Set());
    adj.get(r.providerAId)!.add(r.providerBId);
    adj.get(r.providerBId)!.add(r.providerAId);
  }

  const nodes = [...adj.keys()];
  const n = nodes.length;
  const totalEdges = relations.length;
  const avgDegree = n > 0 ? (2 * totalEdges) / n : 0;
  const maxEdges = n > 1 ? (n * (n - 1)) / 2 : 1;
  const density = totalEdges / maxEdges;

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

  for (const r of relations) union(r.providerAId, r.providerBId);

  const groups = new Map<string, string[]>();
  for (const node of nodes) {
    const root = find(node);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(node);
  }

  const communities = [...groups.values()].filter((m) => m.length >= 2);

  const allIds = nodes.slice(0, 500);
  const providers =
    allIds.length > 0
      ? await prisma.provider.findMany({ where: { id: { in: allIds } }, select: { id: true, name: true } })
      : [];
  const nameMap = Object.fromEntries(providers.map((p) => [p.id, p.name]));

  const topCommunities = communities
    .sort((a, b) => b.length - a.length)
    .slice(0, 10)
    .map((members, i) => {
      const memberSet = new Set(members);
      const sharedSum = relations
        .filter((r) => memberSet.has(r.providerAId) && memberSet.has(r.providerBId))
        .reduce((s, r) => s + r.sharedTenders, 0);
      return {
        communityId: i,
        memberCount: members.length,
        totalSharedTenders: sharedSum,
        members: members.slice(0, 20).map((id) => ({
          id,
          name: nameMap[id] ?? id,
          degree: adj.get(id)?.size ?? 0,
        })),
      };
    });

  const highRiskCount = await prisma.riskScore.count({ where: { riskLevel: 'high' } });
  const collusionFlags = await prisma.riskScore.count({ where: { flags: { has: 'COLLUSION_CLUSTER' } } });

  // Providers with material contract volume but no co-bidding edges (aligned with network-risk ISOLATED_WINNER)
  const linkedIds = new Set<string>();
  for (const r of relations) {
    linkedIds.add(r.providerAId);
    linkedIds.add(r.providerBId);
  }
  const contractTotals = await prisma.contract.groupBy({
    by: ['providerId'],
    _sum: { amount: true },
  });
  let isolatedWinners = 0;
  for (const row of contractTotals) {
    if (linkedIds.has(row.providerId)) continue;
    const total = parseFloat(String(row._sum.amount ?? 0));
    if (total > 100_000) isolatedWinners += 1;
  }

  return {
    totalProviders: n,
    totalRelations: totalEdges,
    totalCommunities: communities.length,
    avgDegree: Math.round(avgDegree * 100) / 100,
    networkDensity: Math.round(density * 10000) / 10000,
    topCommunities,
    riskSummary: {
      highRiskNodes: highRiskCount,
      collusionCandidates: collusionFlags,
      isolatedWinners,
    },
  };
}

// --- Collusion Detection ---

export async function detectCollusion(): Promise<CollusionCandidate[]> {
  const relations = await prisma.providerRelation.findMany({
    where: { sharedTenders: { gte: 2 } },
    select: { providerAId: true, providerBId: true, sharedTenders: true },
  });

  const adj = new Map<string, Map<string, number>>();
  for (const r of relations) {
    if (!adj.has(r.providerAId)) adj.set(r.providerAId, new Map());
    if (!adj.has(r.providerBId)) adj.set(r.providerBId, new Map());
    adj.get(r.providerAId)!.set(r.providerBId, r.sharedTenders);
    adj.get(r.providerBId)!.set(r.providerAId, r.sharedTenders);
  }

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

  for (const r of relations) union(r.providerAId, r.providerBId);

  const groups = new Map<string, string[]>();
  for (const [node] of adj) {
    const root = find(node);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(node);
  }

  const clusters = [...groups.values()].filter((m) => m.length >= 3);
  if (clusters.length === 0) return [];

  const allIds = clusters.flat().slice(0, 300);
  const providers = await prisma.provider.findMany({
    where: { id: { in: allIds } },
    select: { id: true, name: true, province: true, address: true },
  });
  const provMap = Object.fromEntries(providers.map((p) => [p.id, p]));

  const contracts = await prisma.contract.findMany({
    where: { providerId: { in: allIds } },
    select: { providerId: true, amount: true },
  });
  const amountByProvider = new Map<string, number>();
  for (const c of contracts) {
    const amt = parseFloat(String(c.amount ?? 0));
    amountByProvider.set(c.providerId, (amountByProvider.get(c.providerId) ?? 0) + amt);
  }

  const candidates: CollusionCandidate[] = clusters.map((members, i) => {
    const memberSet = new Set(members);
    const totalShared = members.reduce((sum, id) => {
      const neighbors = adj.get(id);
      if (!neighbors) return sum;
      for (const [nid, shared] of neighbors) {
        if (memberSet.has(nid) && id < nid) sum += shared;
      }
      return sum;
    }, 0);

    const sameAddr =
      members.length >= 2 &&
      members.some((a) =>
        members.some((b) => a !== b && !!provMap[a]?.address && provMap[a]?.address === provMap[b]?.address),
      );

    const totalAmount = members.reduce((s, id) => s + (amountByProvider.get(id) ?? 0), 0);

    const rotationScore = Math.min(100, Math.round((totalShared / Math.max(1, members.length)) * 20));
    const bidSim = Math.min(100, totalShared * 10);

    const riskLevel: 'CRITICAL' | 'WARNING' | 'INFO' =
      members.length >= 5 || rotationScore > 70
        ? 'CRITICAL'
        : members.length >= 4 || rotationScore > 40
          ? 'WARNING'
          : 'INFO';

    return {
      clusterId: i,
      members: members.map((id) => {
        const prov = provMap[id];
        const m: { id: string; name: string; province?: string } = {
          id,
          name: prov?.name ?? id,
        };
        if (prov?.province) m.province = prov.province;
        return m;
      }),
      evidence: {
        sharedTenders: totalShared,
        rotationScore,
        bidSimilarityScore: bidSim,
        sameAddress: sameAddr,
      },
      totalAmount: Math.round(totalAmount * 100) / 100,
      riskLevel,
    };
  });

  return candidates.sort((a, b) => {
    const order = { CRITICAL: 0, WARNING: 1, INFO: 2 };
    return order[a.riskLevel] - order[b.riskLevel] || b.members.length - a.members.length;
  });
}

// --- Centrality Rankings ---

export async function getCentralityRankings(limit = 50): Promise<CentralityItem[]> {
  const relations = await prisma.providerRelation.findMany({
    select: { providerAId: true, providerBId: true, sharedTenders: true },
  });

  if (relations.length === 0) return [];

  const degree = new Map<string, number>();
  for (const r of relations) {
    degree.set(r.providerAId, (degree.get(r.providerAId) ?? 0) + 1);
    degree.set(r.providerBId, (degree.get(r.providerBId) ?? 0) + 1);
  }

  const nodes = [...degree.keys()];
  const n = nodes.length;
  const damping = 0.85;
  const iterations = 20;
  const rank = new Map<string, number>();
  for (const node of nodes) rank.set(node, 1 / n);

  const outDeg = new Map<string, number>();
  const inEdges = new Map<string, Array<{ from: string; w: number }>>();
  for (const r of relations) {
    outDeg.set(r.providerAId, (outDeg.get(r.providerAId) ?? 0) + r.sharedTenders);
    outDeg.set(r.providerBId, (outDeg.get(r.providerBId) ?? 0) + r.sharedTenders);
    if (!inEdges.has(r.providerBId)) inEdges.set(r.providerBId, []);
    inEdges.get(r.providerBId)!.push({ from: r.providerAId, w: r.sharedTenders });
    if (!inEdges.has(r.providerAId)) inEdges.set(r.providerAId, []);
    inEdges.get(r.providerAId)!.push({ from: r.providerBId, w: r.sharedTenders });
  }

  for (let i = 0; i < iterations; i++) {
    const nr = new Map<string, number>();
    for (const node of nodes) {
      let sum = 0;
      for (const { from, w } of inEdges.get(node) ?? []) {
        sum += (rank.get(from) ?? 0) * (w / (outDeg.get(from) ?? 1));
      }
      nr.set(node, (1 - damping) / n + damping * sum);
    }
    for (const [k, v] of nr) rank.set(k, v);
  }

  const sorted = [...rank.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
  const ids = sorted.map(([id]) => id);

  const providerRows = await prisma.provider.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, province: true },
  });
  const provMap = Object.fromEntries(providerRows.map((p) => [p.id, p]));

  const contracts = await prisma.contract.groupBy({
    by: ['providerId'],
    where: { providerId: { in: ids } },
    _count: true,
    _sum: { amount: true },
  });
  const contractMap = Object.fromEntries(
    contracts.map((c) => [
      c.providerId,
      { count: c._count, amount: parseFloat(String(c._sum.amount ?? 0)) },
    ]),
  );

  return sorted.map(([id, pr]) => ({
    providerId: id,
    providerName: provMap[id]?.name ?? id,
    province: provMap[id]?.province ?? null,
    degree: degree.get(id) ?? 0,
    pageRank: Math.round(pr * 10000) / 10000,
    betweenness: 0,
    contractCount: contractMap[id]?.count ?? 0,
    totalAmount: Math.round((contractMap[id]?.amount ?? 0) * 100) / 100,
  }));
}

// --- Ego Network ---

export async function getEgoNetwork(providerId: string, maxHops = 2): Promise<EgoNetwork> {
  const provider = await prisma.provider.findUnique({ where: { id: providerId }, select: { id: true, name: true } });
  if (!provider) throw Object.assign(new Error('Provider not found'), { statusCode: 404 });

  const centerRisk = await prisma.riskScore.findFirst({
    where: { tender: { contract: { providerId } } },
    orderBy: { totalScore: 'desc' },
    select: { totalScore: true },
  });

  const visited = new Set<string>([providerId]);
  let frontier = [providerId];
  const allEdges: Array<{ from: string; to: string; sharedTenders: number }> = [];

  for (let hop = 0; hop < maxHops && frontier.length > 0; hop++) {
    const rels = await prisma.providerRelation.findMany({
      where: { OR: [{ providerAId: { in: frontier } }, { providerBId: { in: frontier } }] },
      select: { providerAId: true, providerBId: true, sharedTenders: true },
    });

    const nextFrontier: string[] = [];
    for (const r of rels) {
      allEdges.push({ from: r.providerAId, to: r.providerBId, sharedTenders: r.sharedTenders });
      for (const id of [r.providerAId, r.providerBId]) {
        if (!visited.has(id)) {
          visited.add(id);
          nextFrontier.push(id);
        }
      }
    }
    frontier = nextFrontier;
  }

  const nodeIds = [...visited];
  const providers = await prisma.provider.findMany({
    where: { id: { in: nodeIds } },
    select: { id: true, name: true },
  });
  const nameMap = Object.fromEntries(providers.map((p) => [p.id, p.name]));

  const degree = new Map<string, number>();
  for (const e of allEdges) {
    degree.set(e.from, (degree.get(e.from) ?? 0) + 1);
    degree.set(e.to, (degree.get(e.to) ?? 0) + 1);
  }

  const edgeSet = new Set<string>();
  const uniqueEdges = allEdges.filter((e) => {
    const key = [e.from, e.to].sort().join('-');
    if (edgeSet.has(key)) return false;
    edgeSet.add(key);
    return true;
  });

  return {
    center: { id: provider.id, name: provider.name, riskScore: centerRisk?.totalScore },
    nodes: nodeIds.map((id) => ({
      id,
      name: nameMap[id] ?? id,
      degree: degree.get(id) ?? 0,
    })),
    edges: uniqueEdges,
  };
}

// --- Risk Propagation ---

export async function getRiskPropagation(limit = 50): Promise<RiskPropagationItem[]> {
  const riskScores = await prisma.riskScore.findMany({
    include: { tender: { include: { contract: { select: { providerId: true } } } } },
  });

  const providerRisk = new Map<string, number>();
  for (const rs of riskScores) {
    const pid = rs.tender?.contract?.providerId;
    if (pid) {
      providerRisk.set(pid, Math.max(providerRisk.get(pid) ?? 0, rs.totalScore));
    }
  }

  const relations = await prisma.providerRelation.findMany({
    select: { providerAId: true, providerBId: true, sharedTenders: true },
  });

  const networkRisk = new Map<string, { score: number; highRiskNeighbors: number }>();

  for (const pid of providerRisk.keys()) {
    const neighbors = relations.filter((r) => r.providerAId === pid || r.providerBId === pid);
    let weightedSum = 0;
    let totalWeight = 0;
    let highCount = 0;

    for (const rel of neighbors) {
      const neighborId = rel.providerAId === pid ? rel.providerBId : rel.providerAId;
      const nRisk = providerRisk.get(neighborId) ?? 0;
      weightedSum += nRisk * rel.sharedTenders;
      totalWeight += rel.sharedTenders;
      if (nRisk > 60) highCount++;
    }

    const netScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
    networkRisk.set(pid, { score: Math.round(netScore * 100) / 100, highRiskNeighbors: highCount });
  }

  const items: RiskPropagationItem[] = [];
  for (const [pid, own] of providerRisk) {
    const net = networkRisk.get(pid);
    if (!net) continue;
    const increase = net.score - own;
    if (increase > 5 || net.highRiskNeighbors > 0) {
      items.push({
        providerId: pid,
        providerName: pid,
        ownRiskScore: own,
        networkRiskScore: net.score,
        connectedHighRisk: net.highRiskNeighbors,
        riskIncrease: Math.round(increase * 100) / 100,
      });
    }
  }

  const sortedItems = items.sort((a, b) => b.riskIncrease - a.riskIncrease).slice(0, limit);
  const ids = sortedItems.map((i) => i.providerId);
  const providerRows =
    ids.length > 0
      ? await prisma.provider.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } })
      : [];
  const nameMap = Object.fromEntries(providerRows.map((p) => [p.id, p.name]));
  for (const item of sortedItems) item.providerName = nameMap[item.providerId] ?? item.providerId;

  return sortedItems;
}
