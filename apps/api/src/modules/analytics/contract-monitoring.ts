/**
 * Contract Health Monitoring – tracks amendments, delays, execution status.
 */
import { prisma } from '../../db.js';

export type ContractHealth = {
  contractId: string;
  contractNo: string;
  providerId: string;
  providerName: string;
  entityName: string;
  amount: number;
  status: string;
  amendmentCount: number;
  montoAmendments: number;
  plazoAmendments: number;
  durationDays: number | null;
  healthLevel: 'healthy' | 'warning' | 'critical';
};

export type AmendmentPattern = {
  entityId: string;
  entityName: string;
  totalContracts: number;
  contractsWithAmendments: number;
  totalAmendments: number;
  montoAmendments: number;
  plazoAmendments: number;
  amendmentRate: number;
};

export async function getContractHealth(
  page = 1,
  limit = 20,
  healthLevel?: string,
  entityId?: string,
): Promise<{ data: ContractHealth[]; total: number; page: number; limit: number }> {
  const skip = (page - 1) * limit;
  const take = Math.min(limit, 100);

  const where: Record<string, unknown> = {};
  if (entityId) {
    where.tender = { procurementPlan: { entityId } };
  }

  const contracts = await prisma.contract.findMany({
    where,
    skip,
    take,
    orderBy: { createdAt: 'desc' },
    include: {
      amendments: true,
      provider: { select: { id: true, name: true } },
      tender: {
        select: {
          publishedAt: true,
          procurementPlan: { select: { entity: { select: { name: true } } } },
        },
      },
    },
  });

  const data: ContractHealth[] = contracts.map((c) => {
    const montoAmend = c.amendments.filter((a) => a.changeType === 'MONTO').length;
    const plazoAmend = c.amendments.filter((a) => a.changeType === 'PLAZO').length;
    const durationDays = c.signedAt && c.tender.publishedAt
      ? Math.round((c.signedAt.getTime() - c.tender.publishedAt.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    let healthLvl: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (c.amendments.length >= 3 || c.status === 'terminated') healthLvl = 'critical';
    else if (c.amendments.length >= 1 || c.status === 'suspended') healthLvl = 'warning';

    return {
      contractId: c.id,
      contractNo: c.contractNo ?? '',
      providerId: c.provider.id,
      providerName: c.provider.name,
      entityName: c.tender.procurementPlan?.entity?.name ?? '',
      amount: parseFloat(String(c.amount ?? 0)),
      status: c.status,
      amendmentCount: c.amendments.length,
      montoAmendments: montoAmend,
      plazoAmendments: plazoAmend,
      durationDays,
      healthLevel: healthLvl,
    };
  });

  const filtered = healthLevel ? data.filter((d) => d.healthLevel === healthLevel) : data;
  const total = await prisma.contract.count({ where });

  return { data: filtered, total, page, limit: take };
}

export async function getAmendmentPatterns(year?: number): Promise<AmendmentPattern[]> {
  const yearFilter = year ?? null;

  const rows = await prisma.$queryRawUnsafe<Array<{
    entityId: string;
    entityName: string;
    totalContracts: bigint;
    contractsWithAmendments: bigint;
    totalAmendments: bigint;
    montoAmendments: bigint;
    plazoAmendments: bigint;
  }>>(
    `SELECT
       e.id AS "entityId",
       e.name AS "entityName",
       COUNT(DISTINCT c.id) AS "totalContracts",
       COUNT(DISTINCT CASE WHEN ca.id IS NOT NULL THEN c.id END) AS "contractsWithAmendments",
       COUNT(ca.id) AS "totalAmendments",
       COUNT(CASE WHEN ca."changeType" = 'MONTO' THEN 1 END) AS "montoAmendments",
       COUNT(CASE WHEN ca."changeType" = 'PLAZO' THEN 1 END) AS "plazoAmendments"
     FROM "Entity" e
     JOIN "ProcurementPlan" pp ON pp."entityId" = e.id
     JOIN "Tender" t ON t."procurementPlanId" = pp.id
     JOIN "Contract" c ON c."tenderId" = t.id
     LEFT JOIN "ContractAmendment" ca ON ca."contractId" = c.id
     WHERE ($1::int IS NULL OR pp.year = $1)
     GROUP BY e.id, e.name
     ORDER BY "totalAmendments" DESC`,
    yearFilter,
  );

  return rows.map((r) => ({
    entityId: r.entityId,
    entityName: r.entityName,
    totalContracts: Number(r.totalContracts),
    contractsWithAmendments: Number(r.contractsWithAmendments),
    totalAmendments: Number(r.totalAmendments),
    montoAmendments: Number(r.montoAmendments),
    plazoAmendments: Number(r.plazoAmendments),
    amendmentRate: Number(r.totalContracts) > 0
      ? Math.round((Number(r.contractsWithAmendments) / Number(r.totalContracts)) * 10000) / 100
      : 0,
  }));
}
