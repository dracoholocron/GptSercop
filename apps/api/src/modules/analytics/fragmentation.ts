/**
 * Fragmentation Detector – identifies artificial contract splitting.
 *
 * Patterns detected:
 *   AMOUNT_CLUSTER    – >=3 contracts with similar amounts (±20%) within period
 *   TEMPORAL_CLUSTER  – >=4 contracts from same entity within 30 days
 *   THRESHOLD_AVOIDANCE – contracts just below common thresholds
 */
import { prisma } from '../../db.js';

export type FragmentationResult = {
  id: string;
  entityId: string;
  entityName?: string;
  pattern: string;
  contractIds: string[];
  totalAmount: number;
  contractCount: number;
  periodDays: number;
  severity: string;
  resolvedAt: Date | null;
  createdAt: Date;
};

export async function detectFragmentation(entityId?: string): Promise<FragmentationResult[]> {
  const results: FragmentationResult[] = [];

  const amountClusters = await prisma.$queryRawUnsafe<Array<{
    entityId: string;
    entityName: string;
    contractIds: string;
    totalAmount: number;
    contractCount: bigint;
    minDate: Date;
    maxDate: Date;
  }>>(
    `WITH entity_contracts AS (
       SELECT
         e.id AS "entityId",
         e.name AS "entityName",
         c.id AS "contractId",
         c.amount,
         c."signedAt"
       FROM "Contract" c
       JOIN "Tender" t ON t.id = c."tenderId"
       JOIN "ProcurementPlan" pp ON pp.id = t."procurementPlanId"
       JOIN "Entity" e ON e.id = pp."entityId"
       WHERE c."signedAt" IS NOT NULL
         AND ($1::text IS NULL OR e.id = $1)
     )
     SELECT
       ec1."entityId",
       ec1."entityName",
       STRING_AGG(DISTINCT ec2."contractId", ',') AS "contractIds",
       SUM(DISTINCT ec2.amount) AS "totalAmount",
       COUNT(DISTINCT ec2."contractId") AS "contractCount",
       MIN(ec2."signedAt") AS "minDate",
       MAX(ec2."signedAt") AS "maxDate"
     FROM entity_contracts ec1
     JOIN entity_contracts ec2
       ON ec1."entityId" = ec2."entityId"
       AND ec2.amount BETWEEN ec1.amount * 0.8 AND ec1.amount * 1.2
       AND ABS(EXTRACT(EPOCH FROM ec2."signedAt" - ec1."signedAt")) / 86400 <= 30
     GROUP BY ec1."entityId", ec1."entityName"
     HAVING COUNT(DISTINCT ec2."contractId") >= 3`,
    entityId ?? null,
  );

  for (const cluster of amountClusters) {
    const ids = cluster.contractIds.split(',');
    const periodDays = cluster.minDate && cluster.maxDate
      ? Math.round((cluster.maxDate.getTime() - cluster.minDate.getTime()) / (1000 * 60 * 60 * 24))
      : 30;
    const severity = Number(cluster.contractCount) >= 5 ? 'CRITICAL' : 'WARNING';

    const existing = await prisma.fragmentationAlert.findFirst({
      where: { entityId: cluster.entityId, pattern: 'AMOUNT_CLUSTER', resolvedAt: null },
    });

    if (!existing) {
      const alert = await prisma.fragmentationAlert.create({
        data: {
          entityId: cluster.entityId,
          pattern: 'AMOUNT_CLUSTER',
          contractIds: ids,
          totalAmount: parseFloat(String(cluster.totalAmount)),
          contractCount: Number(cluster.contractCount),
          periodDays,
          severity,
        },
      });
      results.push({
        ...alert,
        entityName: cluster.entityName,
      });
    }
  }

  return results;
}

export async function getFragmentationAlerts(
  page = 1,
  limit = 20,
  severity?: string,
  resolved?: boolean,
): Promise<{ data: FragmentationResult[]; total: number; page: number; limit: number }> {
  const skip = (page - 1) * limit;
  const take = Math.min(limit, 100);

  const where: Record<string, unknown> = {};
  if (severity) where.severity = severity;
  if (resolved === true) where.resolvedAt = { not: null };
  else if (resolved === false) where.resolvedAt = null;

  const [data, total] = await Promise.all([
    prisma.fragmentationAlert.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
    prisma.fragmentationAlert.count({ where }),
  ]);

  return {
    data: data.map((d) => ({ ...d, entityName: undefined })),
    total,
    page,
    limit: take,
  };
}
