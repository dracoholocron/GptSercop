import { prisma } from '../../db.js';

export interface NetworkRiskResult {
  score: number;
  flags: string[];
}

export async function computeNetworkRisk(providerId: string): Promise<NetworkRiskResult> {
  const flags: string[] = [];
  let score = 0;

  const relations = await prisma.providerRelation.findMany({
    where: { OR: [{ providerAId: providerId }, { providerBId: providerId }] },
    select: { providerAId: true, providerBId: true, sharedTenders: true },
  });

  if (relations.length === 0) {
    const contracts = await prisma.contract.findMany({
      where: { providerId },
      select: { amount: true },
    });
    const totalAmount = contracts.reduce((s, c) => s + parseFloat(String(c.amount ?? 0)), 0);
    if (contracts.length > 0 && totalAmount > 100000) {
      score = Math.max(score, 60);
      flags.push('ISOLATED_WINNER');
    }
    return { score, flags };
  }

  const neighborIds = relations.map((r) => (r.providerAId === providerId ? r.providerBId : r.providerAId));

  const neighborRisks = await prisma.riskScore.findMany({
    where: { tender: { contract: { providerId: { in: neighborIds } } } },
    select: { totalScore: true, riskLevel: true, flags: true },
  });

  const highRiskNeighbors = neighborRisks.filter((r) => r.riskLevel === 'high').length;
  if (highRiskNeighbors >= 2) {
    score = Math.max(score, 70);
    flags.push('NETWORK_RISK_CONTAGION');
  } else if (highRiskNeighbors === 1) {
    score = Math.max(score, 40);
    flags.push('NETWORK_RISK_CONTAGION');
  }

  const highShared = relations.filter((r) => r.sharedTenders >= 3);
  if (highShared.length >= 3) {
    score = Math.max(score, 80);
    flags.push('COLLUSION_CLUSTER');
  } else if (highShared.length >= 2) {
    score = Math.max(score, 55);
    flags.push('COLLUSION_CLUSTER');
  }

  if (relations.length >= 10) {
    score = Math.max(score, 65);
    flags.push('HIGH_CENTRALITY');
  }

  return { score, flags };
}
