/**
 * National Price Index – compares prices across entities for same product types.
 * Detects overpricing by comparing against historical averages.
 */
import { prisma } from '../../db.js';

export type PriceComparison = {
  processType: string;
  entityName: string;
  avgContractPrice: number;
  nationalAvg: number;
  deviation: number;
  contractCount: number;
};

export type PriceAnomaly = {
  tenderId: string;
  tenderCode: string;
  entityName: string;
  contractAmount: number;
  nationalAvg: number;
  deviationPct: number;
  processType: string;
};

export async function getPriceIndex(year?: number, processType?: string): Promise<PriceComparison[]> {
  const yearFilter = year ?? new Date().getFullYear();

  const rows = await prisma.$queryRawUnsafe<Array<{
    processType: string;
    entityName: string;
    avgContractPrice: number;
    contractCount: bigint;
  }>>(
    `SELECT
       t."processType",
       e.name AS "entityName",
       AVG(c.amount) AS "avgContractPrice",
       COUNT(c.id)   AS "contractCount"
     FROM "Contract" c
     JOIN "Tender" t ON t.id = c."tenderId"
     JOIN "ProcurementPlan" pp ON pp.id = t."procurementPlanId"
     JOIN "Entity" e ON e.id = pp."entityId"
     WHERE ($1::int IS NULL OR pp.year = $1)
       AND ($2::text IS NULL OR t."processType" = $2)
       AND t."processType" IS NOT NULL
     GROUP BY t."processType", e.name
     ORDER BY t."processType", "avgContractPrice" DESC`,
    yearFilter,
    processType ?? null,
  );

  const nationalAvgs: Record<string, number> = {};
  const nationalCounts: Record<string, number> = {};
  for (const r of rows) {
    const key = r.processType;
    nationalAvgs[key] = (nationalAvgs[key] ?? 0) + parseFloat(String(r.avgContractPrice)) * Number(r.contractCount);
    nationalCounts[key] = (nationalCounts[key] ?? 0) + Number(r.contractCount);
  }
  for (const key of Object.keys(nationalAvgs)) {
    nationalAvgs[key] = nationalCounts[key] > 0 ? nationalAvgs[key] / nationalCounts[key] : 0;
  }

  return rows.map((r) => {
    const avg = parseFloat(String(r.avgContractPrice));
    const natAvg = nationalAvgs[r.processType] ?? 0;
    return {
      processType: r.processType,
      entityName: r.entityName,
      avgContractPrice: Math.round(avg * 100) / 100,
      nationalAvg: Math.round(natAvg * 100) / 100,
      deviation: natAvg > 0 ? Math.round(((avg - natAvg) / natAvg) * 10000) / 100 : 0,
      contractCount: Number(r.contractCount),
    };
  });
}

export async function getPriceAnomalies(year?: number, threshold = 50): Promise<PriceAnomaly[]> {
  const yearFilter = year ?? new Date().getFullYear();

  const rows = await prisma.$queryRawUnsafe<Array<{
    tenderId: string;
    tenderCode: string;
    entityName: string;
    contractAmount: number;
    processType: string;
    nationalAvg: number;
  }>>(
    `WITH sector_avg AS (
       SELECT t."processType", AVG(c.amount) AS avg_price
       FROM "Contract" c
       JOIN "Tender" t ON t.id = c."tenderId"
       JOIN "ProcurementPlan" pp ON pp.id = t."procurementPlanId"
       WHERE ($1::int IS NULL OR pp.year = $1)
         AND t."processType" IS NOT NULL
       GROUP BY t."processType"
     )
     SELECT
       t.id AS "tenderId",
       t.code AS "tenderCode",
       e.name AS "entityName",
       c.amount AS "contractAmount",
       t."processType",
       sa.avg_price AS "nationalAvg"
     FROM "Contract" c
     JOIN "Tender" t ON t.id = c."tenderId"
     JOIN "ProcurementPlan" pp ON pp.id = t."procurementPlanId"
     JOIN "Entity" e ON e.id = pp."entityId"
     JOIN sector_avg sa ON sa."processType" = t."processType"
     WHERE ($1::int IS NULL OR pp.year = $1)
       AND sa.avg_price > 0
       AND (c.amount / sa.avg_price - 1) * 100 > $2
     ORDER BY (c.amount / sa.avg_price) DESC
     LIMIT 50`,
    yearFilter,
    threshold,
  );

  return rows.map((r) => ({
    tenderId: r.tenderId,
    tenderCode: r.tenderCode ?? '',
    entityName: r.entityName,
    contractAmount: parseFloat(String(r.contractAmount)),
    nationalAvg: parseFloat(String(r.nationalAvg)),
    deviationPct: Math.round(
      ((parseFloat(String(r.contractAmount)) / parseFloat(String(r.nationalAvg))) - 1) * 10000,
    ) / 100,
    processType: r.processType,
  }));
}

export async function rebuildPriceReferences(year?: number): Promise<number> {
  const yearFilter = year ?? new Date().getFullYear();

  const rows = await prisma.$queryRawUnsafe<Array<{
    processType: string;
    province: string;
    avg: number;
    min: number;
    max: number;
    count: bigint;
  }>>(
    `SELECT
       t."processType",
       COALESCE(p.province, 'Nacional') AS province,
       AVG(c.amount) AS avg,
       MIN(c.amount) AS min,
       MAX(c.amount) AS max,
       COUNT(c.id) AS count
     FROM "Contract" c
     JOIN "Tender" t ON t.id = c."tenderId"
     JOIN "ProcurementPlan" pp ON pp.id = t."procurementPlanId"
     JOIN "Provider" p ON p.id = c."providerId"
     WHERE ($1::int IS NULL OR pp.year = $1)
       AND t."processType" IS NOT NULL
     GROUP BY t."processType", p.province`,
    yearFilter,
  );

  let created = 0;
  for (const r of rows) {
    await prisma.priceReference.create({
      data: {
        processType: r.processType,
        description: `${r.processType} – ${r.province}`,
        avgPrice: parseFloat(String(r.avg)),
        minPrice: parseFloat(String(r.min)),
        maxPrice: parseFloat(String(r.max)),
        sampleSize: Number(r.count),
        year: yearFilter,
        province: r.province,
      },
    });
    created++;
  }
  return created;
}
