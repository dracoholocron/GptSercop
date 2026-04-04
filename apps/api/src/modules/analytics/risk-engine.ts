/**
 * Motor de riesgo analítico SERCOP.
 * Implementa los 20 patrones de riesgo definidos en el blueprint con fórmula ponderada.
 *
 * Dimensiones y pesos:
 *   competition  25% – concentración de mercado, mono-proveedor
 *   price        20% – sobreprecio, ofertas anómalas
 *   supplier     20% – empresa nueva, mono-cliente, dominancia
 *   process      15% – velocidad, modificaciones de pliego
 *   execution    20% – modificaciones contractuales, frecuencia emergencias
 *
 * Niveles: score ≤ 30 → low | score ≤ 60 → medium | score > 60 → high
 */
import { prisma } from '../../db.js';

const WEIGHTS = {
  competition: 0.25,
  price: 0.20,
  supplier: 0.20,
  process: 0.15,
  execution: 0.20,
} as const;

type RiskDimensions = {
  competitionRisk: number;
  priceRisk: number;
  supplierRisk: number;
  processRisk: number;
  executionRisk: number;
};

function calcTotal(d: RiskDimensions): number {
  return (
    d.competitionRisk * WEIGHTS.competition +
    d.priceRisk * WEIGHTS.price +
    d.supplierRisk * WEIGHTS.supplier +
    d.processRisk * WEIGHTS.process +
    d.executionRisk * WEIGHTS.execution
  );
}

function riskLevel(score: number): 'low' | 'medium' | 'high' {
  if (score <= 30) return 'low';
  if (score <= 60) return 'medium';
  return 'high';
}

export async function computeRiskScore(tenderId: string) {
  const tender = await prisma.tender.findUnique({
    where: { id: tenderId },
    include: {
      bids: { include: { provider: true } },
      contract: {
        include: {
          amendments: true,
          provider: true,
        },
      },
      procurementPlan: { include: { entity: true } },
    },
  });

  if (!tender) throw Object.assign(new Error('Tender not found'), { statusCode: 404 });

  const flags: string[] = [];
  const dims: RiskDimensions = { competitionRisk: 0, priceRisk: 0, supplierRisk: 0, processRisk: 0, executionRisk: 0 };

  const bids = tender.bids;
  const contract = tender.contract;
  const entity = tender.procurementPlan?.entity;
  const bidAmounts = bids.map((b) => parseFloat(String(b.amount)));
  const avgBidAmount = bidAmounts.length ? bidAmounts.reduce((a, b) => a + b, 0) / bidAmounts.length : 0;
  const refBudget = parseFloat(String(tender.referenceBudgetAmount ?? tender.estimatedAmount ?? 0));
  const contractAmount = contract ? parseFloat(String(contract.amount)) : 0;

  // --- COMPETITION DIMENSION (25%) ---

  // Patrón 1: Pocas ofertas ≤ 2
  if (bids.length <= 2 && bids.length > 0) {
    dims.competitionRisk = Math.max(dims.competitionRisk, 60);
    flags.push('FEW_BIDS');
  }

  // Patrón 5: Proceso un solo oferente
  if (bids.length === 1) {
    dims.competitionRisk = Math.max(dims.competitionRisk, 90);
    flags.push('SINGLE_BIDDER');
  }

  // Patrón 3: Ofertas casi iguales (posible colusión de precios)
  if (bidAmounts.length >= 2 && avgBidAmount > 0) {
    const stddev = Math.sqrt(bidAmounts.reduce((acc, v) => acc + Math.pow(v - avgBidAmount, 2), 0) / bidAmounts.length);
    const cv = stddev / avgBidAmount;
    if (cv < 0.02) {
      dims.competitionRisk = Math.max(dims.competitionRisk, 80);
      flags.push('NEARLY_EQUAL_BIDS');
    }
  }

  // Patrón 4: Ganador por margen < 1%
  if (bidAmounts.length >= 2) {
    const sorted = [...bidAmounts].sort((a, b) => a - b);
    const margin = (sorted[1] - sorted[0]) / sorted[1];
    if (margin < 0.01) {
      dims.competitionRisk = Math.max(dims.competitionRisk, 70);
      flags.push('THIN_WIN_MARGIN');
    }
  }

  // Patrón 13: Rotación de ganadores – verificar si proveedor alterna victorias con otro en misma entidad
  if (entity && contract) {
    const recentContracts = await prisma.contract.findMany({
      where: {
        tender: { procurementPlan: { entityId: entity.id } },
        NOT: { tenderId },
      },
      orderBy: { signedAt: 'desc' },
      take: 10,
      select: { providerId: true },
    });
    const uniqueWinners = new Set(recentContracts.map((c) => c.providerId));
    if (uniqueWinners.size >= 2 && contract.providerId && uniqueWinners.has(contract.providerId)) {
      const otherWinner = recentContracts.find((c) => c.providerId !== contract.providerId);
      if (otherWinner) {
        dims.competitionRisk = Math.max(dims.competitionRisk, 50);
        flags.push('WINNER_ROTATION');
      }
    }
  }

  // --- PRICE DIMENSION (20%) ---

  // Patrón 9: Oferta anormalmente baja (< 50% promedio)
  const lowestBid = bidAmounts.length ? Math.min(...bidAmounts) : 0;
  if (avgBidAmount > 0 && lowestBid < avgBidAmount * 0.5) {
    dims.priceRisk = Math.max(dims.priceRisk, 70);
    flags.push('ABNORMALLY_LOW_BID');
  }

  // Patrón 10: Oferta anormalmente alta (> 150% promedio)
  const highestBid = bidAmounts.length ? Math.max(...bidAmounts) : 0;
  if (avgBidAmount > 0 && highestBid > avgBidAmount * 1.5) {
    dims.priceRisk = Math.max(dims.priceRisk, 60);
    flags.push('ABNORMALLY_HIGH_BID');
  }

  // Patrón 3/OVERPRICE: Contrato al ≥ 97% del presupuesto referencial
  if (refBudget > 0 && contractAmount > 0) {
    const ratio = contractAmount / refBudget;
    if (ratio >= 0.97) {
      dims.priceRisk = Math.max(dims.priceRisk, 75);
      flags.push('OVERPRICE');
    }
  }

  // Patrón 18: Variación de precios entre entidades (mismo processType, precio > 2x promedio sector)
  if (tender.processType && avgBidAmount > 0) {
    const sectorAvg = await prisma.$queryRawUnsafe<Array<{ avg: number }>>(
      `SELECT AVG(b.amount) AS avg
       FROM "Bid" b
       JOIN "Tender" t ON t.id = b."tenderId"
       WHERE t."processType" = $1 AND t.id != $2`,
      tender.processType,
      tenderId,
    );
    const sAvg = parseFloat(String(sectorAvg[0]?.avg ?? 0));
    if (sAvg > 0 && avgBidAmount > sAvg * 2) {
      dims.priceRisk = Math.max(dims.priceRisk, 65);
      flags.push('SECTOR_PRICE_OUTLIER');
    }
  }

  // --- SUPPLIER DIMENSION (20%) ---

  // Patrón 2: Proveedor dominante (>40% contratos en una entidad)
  if (entity && contract) {
    const entityContracts = await prisma.contract.count({
      where: { tender: { procurementPlan: { entityId: entity.id } } },
    });
    const providerContracts = await prisma.contract.count({
      where: {
        providerId: contract.providerId,
        tender: { procurementPlan: { entityId: entity.id } },
      },
    });
    if (entityContracts > 0 && providerContracts / entityContracts > 0.4) {
      dims.supplierRisk = Math.max(dims.supplierRisk, 75);
      flags.push('DOMINANT_SUPPLIER');
    }
  }

  // Patrón 8: Empresa nueva + contrato grande (< 1 año, monto > $100k)
  if (contract?.provider?.legalEstablishmentDate) {
    const ageMs = Date.now() - contract.provider.legalEstablishmentDate.getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    if (ageDays < 365 && contractAmount > 100000) {
      dims.supplierRisk = Math.max(dims.supplierRisk, 85);
      flags.push('NEW_COMPANY_LARGE_CONTRACT');
    }
  }

  // Patrón 16: Proveedor monocliente
  if (contract) {
    const distinctEntities = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(DISTINCT pp."entityId") AS count
       FROM "Contract" c
       JOIN "Tender" t ON t.id = c."tenderId"
       JOIN "ProcurementPlan" pp ON pp.id = t."procurementPlanId"
       WHERE c."providerId" = $1`,
      contract.providerId,
    );
    const entityCount = Number(distinctEntities[0]?.count ?? 0);
    if (entityCount === 1) {
      dims.supplierRisk = Math.max(dims.supplierRisk, 55);
      flags.push('MONO_CLIENT_SUPPLIER');
    }
  }

  // Patrón 17: Empresa siempre pierde (wins=0, participaciones>5)
  // Calculado en batch, no en per-tender; skip here.

  // Patrón 14: Múltiples contratos simultáneos (provider con > 10 contratos activos)
  if (contract) {
    const activeCount = await prisma.contract.count({
      where: { providerId: contract.providerId, status: 'active' },
    });
    if (activeCount > 10) {
      dims.supplierRisk = Math.max(dims.supplierRisk, 50);
      flags.push('MULTI_CONTRACT_PROVIDER');
    }
  }

  // --- PROCESS DIMENSION (15%) ---

  // Patrón 11: Proceso muy rápido (adjudicado en < 15 días)
  if (tender.publishedAt && contract?.signedAt) {
    const days = (contract.signedAt.getTime() - tender.publishedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (days < 15) {
      dims.processRisk = Math.max(dims.processRisk, 80);
      flags.push('FAST_PROCESS');
    }
  }

  // Patrón 12: Cambios frecuentes en pliego (aclaraciones > 5)
  const clarificationsCount = await prisma.tenderClarification.count({ where: { tenderId } });
  if (clarificationsCount > 5) {
    dims.processRisk = Math.max(dims.processRisk, 60);
    flags.push('FREQUENT_CLARIFICATIONS');
  }

  // Patrón 19: Alta frecuencia de emergencias (processType=emergencia > 30% del total en entidad)
  if (entity) {
    const totalEntityTenders = await prisma.tender.count({ where: { procurementPlan: { entityId: entity.id } } });
    const emergencyTenders = await prisma.tender.count({
      where: { procurementPlan: { entityId: entity.id }, regime: 'emergencia' },
    });
    if (totalEntityTenders > 0 && emergencyTenders / totalEntityTenders > 0.3) {
      dims.processRisk = Math.max(dims.processRisk, 70);
      flags.push('HIGH_EMERGENCY_RATE');
    }
  }

  // Patrón 20: Concentración regional (>70% contratos a proveedores de misma provincia)
  if (entity) {
    const provinceCounts = await prisma.$queryRawUnsafe<Array<{ province: string; count: bigint }>>(
      `SELECT p.province, COUNT(c.id) AS count
       FROM "Contract" c
       JOIN "Provider" p ON p.id = c."providerId"
       JOIN "Tender" t ON t.id = c."tenderId"
       JOIN "ProcurementPlan" pp ON pp.id = t."procurementPlanId"
       WHERE pp."entityId" = $1
       GROUP BY p.province
       ORDER BY count DESC
       LIMIT 1`,
      entity.id,
    );
    const topProvince = provinceCounts[0];
    if (topProvince) {
      const totalEntityContracts = await prisma.contract.count({ where: { tender: { procurementPlan: { entityId: entity.id } } } });
      const topCount = Number(topProvince.count);
      if (totalEntityContracts > 0 && topCount / totalEntityContracts > 0.7) {
        dims.processRisk = Math.max(dims.processRisk, 55);
        flags.push('REGIONAL_CONCENTRATION');
      }
    }
  }

  // Patrón 15: Contratos fragmentados – misma entidad, montos similares, < 30 días
  if (entity && contractAmount > 0) {
    const thirtyDaysAgo = contract?.signedAt
      ? new Date(contract.signedAt.getTime() - 30 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const similarContracts = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) AS count
       FROM "Contract" c
       JOIN "Tender" t ON t.id = c."tenderId"
       JOIN "ProcurementPlan" pp ON pp.id = t."procurementPlanId"
       WHERE pp."entityId" = $1
         AND c."tenderId" != $2
         AND c."signedAt" >= $3
         AND c.amount BETWEEN $4 * 0.8 AND $4 * 1.2`,
      entity.id,
      tenderId,
      thirtyDaysAgo,
      contractAmount,
    );
    if (Number(similarContracts[0]?.count ?? 0) >= 3) {
      dims.processRisk = Math.max(dims.processRisk, 75);
      flags.push('FRAGMENTATION');
    }
  }

  // --- EXECUTION DIMENSION (20%) ---

  // Patrón 6: Incremento post-adjudicación (ContractAmendment MONTO)
  if (contract) {
    const montoAmendments = contract.amendments.filter((a) => a.changeType === 'MONTO');
    if (montoAmendments.length > 0) {
      dims.executionRisk = Math.max(dims.executionRisk, 65);
      flags.push('POST_AWARD_PRICE_INCREASE');
    }

    // Patrón 7: Ampliaciones de plazo (ContractAmendment PLAZO)
    const plazoAmendments = contract.amendments.filter((a) => a.changeType === 'PLAZO');
    if (plazoAmendments.length > 0) {
      dims.executionRisk = Math.max(dims.executionRisk, 45);
      flags.push('TERM_EXTENSION');
    }

    // FREQUENT_AMENDMENTS: 3+ modificaciones
    if (contract.amendments.length >= 3) {
      dims.executionRisk = Math.max(dims.executionRisk, 80);
      flags.push('FREQUENT_AMENDMENTS');
    }
  }

  // Calculate final score
  const totalScore = Math.min(100, Math.round(calcTotal(dims)));
  const level = riskLevel(totalScore);

  const upserted = await prisma.riskScore.upsert({
    where: { tenderId },
    create: {
      tenderId,
      competitionRisk: dims.competitionRisk,
      priceRisk: dims.priceRisk,
      supplierRisk: dims.supplierRisk,
      processRisk: dims.processRisk,
      executionRisk: dims.executionRisk,
      totalScore,
      riskLevel: level,
      flags,
      calculatedAt: new Date(),
    },
    update: {
      competitionRisk: dims.competitionRisk,
      priceRisk: dims.priceRisk,
      supplierRisk: dims.supplierRisk,
      processRisk: dims.processRisk,
      executionRisk: dims.executionRisk,
      totalScore,
      riskLevel: level,
      flags,
      calculatedAt: new Date(),
    },
  });

  return upserted;
}
