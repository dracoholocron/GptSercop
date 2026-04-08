/**
 * Provider Reputation Score – "Buró de crédito" de proveedores del Estado.
 *
 * Dimensions:
 *   compliance  30% – cumplimiento contractual (amendments, complaints)
 *   delivery    25% – puntualidad (contract duration vs expected)
 *   price       25% – competitividad (win ratio, avg bid vs reference)
 *   diversity   20% – diversificación de clientes
 *
 * Tiers: totalScore >= 80 → premium | >= 50 → standard | >= 30 → watch | < 30 → restricted
 */
import { prisma } from '../../db.js';

const WEIGHTS = { compliance: 0.30, delivery: 0.25, price: 0.25, diversity: 0.20 };

function tier(score: number): string {
  if (score >= 80) return 'premium';
  if (score >= 50) return 'standard';
  if (score >= 30) return 'watch';
  return 'restricted';
}

export async function computeProviderScore(providerId: string) {
  const provider = await prisma.provider.findUnique({ where: { id: providerId } });
  if (!provider) throw Object.assign(new Error('Provider not found'), { statusCode: 404 });

  const contracts = await prisma.contract.findMany({
    where: { providerId },
    include: { amendments: true, tender: true },
  });

  const bids = await prisma.bid.findMany({ where: { providerId } });
  const complaints = await prisma.complaint.count({ where: { providerId } });

  // --- Compliance (fewer amendments & complaints = better) ---
  let complianceScore = 100;
  const totalAmendments = contracts.reduce((s, c) => s + c.amendments.length, 0);
  if (totalAmendments > 0) complianceScore -= Math.min(50, totalAmendments * 10);
  if (complaints > 0) complianceScore -= Math.min(30, complaints * 10);
  const terminatedContracts = contracts.filter((c) => c.status === 'terminated').length;
  if (terminatedContracts > 0) complianceScore -= Math.min(20, terminatedContracts * 15);
  complianceScore = Math.max(0, complianceScore);

  // --- Delivery (on-time ratio approximated by signed-to-updated gap) ---
  let deliveryScore = 70;
  const extensionAmendments = contracts.reduce(
    (s, c) => s + c.amendments.filter((a) => a.changeType === 'PLAZO').length,
    0,
  );
  if (extensionAmendments > 0) deliveryScore -= Math.min(40, extensionAmendments * 12);
  deliveryScore = Math.max(0, deliveryScore);

  // --- Price (competitive bidder: win rate and how close to reference) ---
  const wins = contracts.length;
  const participations = bids.length;
  const winRate = participations > 0 ? wins / participations : 0;
  let priceScore = Math.min(100, Math.round(winRate * 100 + 20));
  const avgBidToRef = contracts.reduce((sum, c) => {
    const ref = parseFloat(String(c.tender?.referenceBudgetAmount ?? c.tender?.estimatedAmount ?? 0));
    const amt = parseFloat(String(c.amount ?? 0));
    return ref > 0 ? sum + amt / ref : sum;
  }, 0);
  if (contracts.length > 0) {
    const avgRatio = avgBidToRef / contracts.length;
    if (avgRatio > 0.97) priceScore -= 15;
    if (avgRatio < 0.7) priceScore += 10;
  }
  priceScore = Math.max(0, Math.min(100, priceScore));

  // --- Diversity (serves multiple entities) ---
  const distinctEntities = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
    `SELECT COUNT(DISTINCT pp."entityId") AS count
     FROM "Contract" c
     JOIN "Tender" t ON t.id = c."tenderId"
     JOIN "ProcurementPlan" pp ON pp.id = t."procurementPlanId"
     WHERE c."providerId" = $1`,
    providerId,
  );
  const entityCount = Number(distinctEntities[0]?.count ?? 0);
  let diversityScore = entityCount === 0 ? 50 : Math.min(100, entityCount * 20);

  const totalScore = Math.round(
    complianceScore * WEIGHTS.compliance +
    deliveryScore * WEIGHTS.delivery +
    priceScore * WEIGHTS.price +
    diversityScore * WEIGHTS.diversity,
  );

  return prisma.providerScore.upsert({
    where: { providerId },
    create: {
      providerId,
      complianceScore,
      deliveryScore,
      priceScore,
      diversityScore,
      totalScore,
      tier: tier(totalScore),
      calculatedAt: new Date(),
    },
    update: {
      complianceScore,
      deliveryScore,
      priceScore,
      diversityScore,
      totalScore,
      tier: tier(totalScore),
      calculatedAt: new Date(),
    },
  });
}

export async function getProviderScores(page = 1, limit = 20, tierFilter?: string) {
  const skip = (page - 1) * limit;
  const take = Math.min(limit, 100);
  const where: Record<string, unknown> = {};
  if (tierFilter) where.tier = tierFilter;

  const [data, total] = await Promise.all([
    prisma.providerScore.findMany({
      where,
      skip,
      take,
      orderBy: { totalScore: 'desc' },
      include: { provider: { select: { id: true, name: true, identifier: true, province: true } } },
    }),
    prisma.providerScore.count({ where }),
  ]);

  return { data, total, page, limit: take };
}
