import { prisma } from '../../db.js';
import { Q_MARKET_BY_ENTITY, Q_MARKET_BY_PROCESS_TYPE } from './queries.js';

export type MarketByEntity = {
  entityId: string;
  entityName: string;
  entityCode: string;
  contractCount: bigint;
  totalAmount: number;
};

export type MarketByProcessType = {
  processType: string;
  tenderCount: bigint;
  totalAmount: number;
  avgAmount: number;
};

export type MarketByProvince = {
  province: string;
  providerCount: bigint;
  contractCount: bigint;
  totalAmount: number;
};

export async function getMarketByEntity(year?: number): Promise<MarketByEntity[]> {
  return prisma.$queryRawUnsafe<MarketByEntity[]>(Q_MARKET_BY_ENTITY, year ?? null);
}

export async function getMarketByProcessType(year?: number): Promise<MarketByProcessType[]> {
  return prisma.$queryRawUnsafe<MarketByProcessType[]>(Q_MARKET_BY_PROCESS_TYPE, year ?? null);
}

export async function getMarketByProvince(year?: number): Promise<MarketByProvince[]> {
  return prisma.$queryRawUnsafe<MarketByProvince[]>(
    `SELECT
       COALESCE(p.province, 'Sin provincia') AS province,
       COUNT(DISTINCT p.id)                  AS "providerCount",
       COUNT(c.id)                           AS "contractCount",
       COALESCE(SUM(c.amount), 0)            AS "totalAmount"
     FROM "Provider" p
     LEFT JOIN "Contract" c ON c."providerId" = p.id
     LEFT JOIN "Tender" t ON t.id = c."tenderId"
     LEFT JOIN "ProcurementPlan" pp ON pp.id = t."procurementPlanId"
     WHERE ($1::int IS NULL OR pp.year = $1 OR c.id IS NULL)
     GROUP BY p.province
     ORDER BY "totalAmount" DESC
     LIMIT 15`,
    year ?? null,
  );
}

export async function getTopProviders(year?: number, limit = 10) {
  return prisma.$queryRawUnsafe<Array<{ providerId: string; name: string; totalAmount: number; contractCount: bigint }>>(
    `SELECT
       p.id   AS "providerId",
       p.name AS name,
       COALESCE(SUM(c.amount), 0) AS "totalAmount",
       COUNT(c.id)                AS "contractCount"
     FROM "Provider" p
     LEFT JOIN "Contract" c ON c."providerId" = p.id
     LEFT JOIN "Tender" t ON t.id = c."tenderId"
     LEFT JOIN "ProcurementPlan" pp ON pp.id = t."procurementPlanId"
     WHERE ($1::int IS NULL OR pp.year = $1)
     GROUP BY p.id, p.name
     ORDER BY "totalAmount" DESC
     LIMIT $2`,
    year ?? null,
    limit,
  );
}
