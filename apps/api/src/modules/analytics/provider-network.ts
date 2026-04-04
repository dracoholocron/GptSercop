import { prisma } from '../../db.js';

export type NetworkNode = {
  id: string;
  name: string;
  contractCount: number;
  totalAmount: number;
};

export type NetworkEdge = {
  providerAId: string;
  providerBId: string;
  sharedTenders: number;
  lastSeenAt: Date | null;
};

export async function buildProviderNetwork(minSharedTenders = 2): Promise<{ nodes: NetworkNode[]; edges: NetworkEdge[] }> {
  // Upsert provider relations from shared tender participation
  await prisma.$executeRawUnsafe(`
    INSERT INTO "ProviderRelation" ("id", "providerAId", "providerBId", "sharedTenders", "lastSeenAt", "createdAt")
    SELECT
      gen_random_uuid()::text,
      LEAST(b1."providerId", b2."providerId"),
      GREATEST(b1."providerId", b2."providerId"),
      COUNT(DISTINCT b1."tenderId"),
      MAX(t."publishedAt"),
      NOW()
    FROM "Bid" b1
    JOIN "Bid" b2
      ON b1."tenderId" = b2."tenderId"
      AND b1."providerId" < b2."providerId"
    JOIN "Tender" t ON t.id = b1."tenderId"
    GROUP BY LEAST(b1."providerId", b2."providerId"), GREATEST(b1."providerId", b2."providerId")
    ON CONFLICT ("providerAId", "providerBId")
    DO UPDATE SET
      "sharedTenders" = EXCLUDED."sharedTenders",
      "lastSeenAt"    = EXCLUDED."lastSeenAt"
  `);

  const edges = await prisma.providerRelation.findMany({
    where: { sharedTenders: { gte: minSharedTenders } },
    orderBy: { sharedTenders: 'desc' },
    take: 200,
  });

  if (!edges.length) return { nodes: [], edges: [] };

  const providerIds = [...new Set(edges.flatMap((e) => [e.providerAId, e.providerBId]))];

  const providerStats = await prisma.$queryRawUnsafe<Array<{ id: string; name: string; contractCount: bigint; totalAmount: number }>>(
    `SELECT
       p.id,
       p.name,
       COUNT(c.id) AS "contractCount",
       COALESCE(SUM(c.amount), 0) AS "totalAmount"
     FROM "Provider" p
     LEFT JOIN "Contract" c ON c."providerId" = p.id
     WHERE p.id = ANY($1::text[])
     GROUP BY p.id, p.name`,
    providerIds,
  );

  const nodes: NetworkNode[] = providerStats.map((p) => ({
    id: p.id,
    name: p.name,
    contractCount: Number(p.contractCount),
    totalAmount: parseFloat(String(p.totalAmount)),
  }));

  return {
    nodes,
    edges: edges.map((e) => ({
      providerAId: e.providerAId,
      providerBId: e.providerBId,
      sharedTenders: e.sharedTenders,
      lastSeenAt: e.lastSeenAt,
    })),
  };
}

export async function getProviderNeighbors(providerId: string): Promise<NetworkNode[]> {
  const relations = await prisma.providerRelation.findMany({
    where: {
      OR: [{ providerAId: providerId }, { providerBId: providerId }],
    },
    orderBy: { sharedTenders: 'desc' },
  });

  const neighborIds = relations.map((r) => (r.providerAId === providerId ? r.providerBId : r.providerAId));
  if (!neighborIds.length) return [];

  const providers = await prisma.$queryRawUnsafe<Array<{ id: string; name: string; contractCount: bigint; totalAmount: number }>>(
    `SELECT
       p.id,
       p.name,
       COUNT(c.id) AS "contractCount",
       COALESCE(SUM(c.amount), 0) AS "totalAmount"
     FROM "Provider" p
     LEFT JOIN "Contract" c ON c."providerId" = p.id
     WHERE p.id = ANY($1::text[])
     GROUP BY p.id, p.name`,
    neighborIds,
  );

  return providers.map((p) => ({
    id: p.id,
    name: p.name,
    contractCount: Number(p.contractCount),
    totalAmount: parseFloat(String(p.totalAmount)),
  }));
}
