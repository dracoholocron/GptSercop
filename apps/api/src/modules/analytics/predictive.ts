/**
 * Predictive Risk Model – simple statistical prediction using historical patterns.
 *
 * Uses features:
 *   - bid count
 *   - bid concentration
 *   - entity historical risk
 *   - process type risk history
 * to predict risk before awarding.
 */
import { prisma } from '../../db.js';

export type RiskPrediction = {
  tenderId: string;
  predictedScore: number;
  predictedLevel: 'low' | 'medium' | 'high';
  factors: Record<string, number>;
  confidence: number;
};

export async function predictRisk(tenderId: string): Promise<RiskPrediction> {
  const tender = await prisma.tender.findUnique({
    where: { id: tenderId },
    include: {
      bids: true,
      procurementPlan: { include: { entity: true } },
    },
  });

  if (!tender) throw Object.assign(new Error('Tender not found'), { statusCode: 404 });

  const factors: Record<string, number> = {};

  const bidCount = tender.bids.length;
  factors.bidCountRisk = bidCount === 0 ? 50 : bidCount === 1 ? 90 : bidCount <= 2 ? 60 : Math.max(0, 40 - bidCount * 5);

  if (tender.bids.length >= 2) {
    const amounts = tender.bids.map((b) => parseFloat(String(b.amount ?? 0)));
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const stddev = Math.sqrt(amounts.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / amounts.length);
    const cv = avg > 0 ? stddev / avg : 0;
    factors.bidConcentrationRisk = cv < 0.02 ? 80 : cv < 0.05 ? 50 : 20;
  } else {
    factors.bidConcentrationRisk = 50;
  }

  const entityId = tender.procurementPlan?.entityId;
  if (entityId) {
    const entityRiskScores = await prisma.riskScore.findMany({
      where: { tender: { procurementPlan: { entityId } } },
      select: { totalScore: true },
    });
    if (entityRiskScores.length > 0) {
      factors.entityHistoricalRisk = Math.round(
        entityRiskScores.reduce((s, r) => s + r.totalScore, 0) / entityRiskScores.length,
      );
    } else {
      factors.entityHistoricalRisk = 40;
    }
  } else {
    factors.entityHistoricalRisk = 40;
  }

  if (tender.processType) {
    const typeScores = await prisma.riskScore.findMany({
      where: { tender: { processType: tender.processType } },
      select: { totalScore: true },
      take: 50,
    });
    if (typeScores.length > 0) {
      factors.processTypeRisk = Math.round(
        typeScores.reduce((s, r) => s + r.totalScore, 0) / typeScores.length,
      );
    } else {
      factors.processTypeRisk = 40;
    }
  } else {
    factors.processTypeRisk = 40;
  }

  if (tender.regime === 'emergencia') {
    factors.emergencyRisk = 70;
  } else {
    factors.emergencyRisk = 10;
  }

  const weights = {
    bidCountRisk: 0.25,
    bidConcentrationRisk: 0.15,
    entityHistoricalRisk: 0.25,
    processTypeRisk: 0.20,
    emergencyRisk: 0.15,
  };

  let predictedScore = 0;
  for (const [key, weight] of Object.entries(weights)) {
    predictedScore += (factors[key] ?? 0) * weight;
  }
  predictedScore = Math.min(100, Math.round(predictedScore));

  const predictedLevel: 'low' | 'medium' | 'high' =
    predictedScore <= 30 ? 'low' : predictedScore <= 60 ? 'medium' : 'high';

  const sampleSize = await prisma.riskScore.count();
  const confidence = Math.min(95, Math.round(50 + Math.sqrt(sampleSize) * 3));

  return { tenderId, predictedScore, predictedLevel, factors, confidence };
}
