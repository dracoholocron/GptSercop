import { prisma } from '../../db.js';
import { Q_COMPETITION_BY_SECTOR, Q_HHI_BY_ENTITY } from './queries.js';

export type CompetitionBySector = {
  processType: string;
  tenderCount: bigint;
  avgBidders: number;
  singleBidderCount: bigint;
  singleBidderPct: number;
};

export type HhiByEntity = {
  entityId: string;
  entityName: string;
  hhi: number;
};

export async function getCompetitionBySector(year?: number): Promise<CompetitionBySector[]> {
  const rows = await prisma.$queryRawUnsafe<CompetitionBySector[]>(
    Q_COMPETITION_BY_SECTOR,
    year ?? null,
  );
  return rows;
}

export async function getHhiByEntity(year?: number): Promise<HhiByEntity[]> {
  const rows = await prisma.$queryRawUnsafe<HhiByEntity[]>(
    Q_HHI_BY_ENTITY,
    year ?? null,
  );
  return rows;
}

export async function getAvgBidders(year?: number): Promise<number> {
  const result = await prisma.$queryRawUnsafe<Array<{ avg: number }>>(
    `SELECT AVG(bid_counts."bidCount") AS avg
     FROM (
       SELECT b."tenderId", COUNT(*) AS "bidCount"
       FROM "Bid" b
       JOIN "Tender" t ON t.id = b."tenderId"
       JOIN "ProcurementPlan" pp ON pp.id = t."procurementPlanId"
       WHERE ($1::int IS NULL OR pp.year = $1)
       GROUP BY b."tenderId"
     ) bid_counts`,
    year ?? null,
  );
  return parseFloat(String(result[0]?.avg ?? 0)) || 0;
}

export async function getMarketShare(entityId: string, year?: number): Promise<number> {
  const result = await prisma.$queryRawUnsafe<Array<{ share: number }>>(
    `SELECT ROUND(
       100.0 * entity_total.amount / NULLIF(grand_total.amount, 0),
       2
     ) AS share
     FROM (
       SELECT COALESCE(SUM(c.amount), 0) AS amount
       FROM "Contract" c
       JOIN "Tender" t ON t.id = c."tenderId"
       JOIN "ProcurementPlan" pp ON pp.id = t."procurementPlanId"
       WHERE pp."entityId" = $1
         AND ($2::int IS NULL OR pp.year = $2)
     ) entity_total,
     (
       SELECT COALESCE(SUM(c.amount), 0) AS amount
       FROM "Contract" c
       JOIN "Tender" t ON t.id = c."tenderId"
       JOIN "ProcurementPlan" pp ON pp.id = t."procurementPlanId"
       WHERE ($2::int IS NULL OR pp.year = $2)
     ) grand_total`,
    entityId,
    year ?? null,
  );
  return parseFloat(String(result[0]?.share ?? 0)) || 0;
}
