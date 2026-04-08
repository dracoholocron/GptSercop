import { ensureGraphExists, cypherQuery } from './age-client.js';

type PrismaLike = {
  $queryRawUnsafe: <T>(query: string, ...values: unknown[]) => Promise<T>;
  $executeRawUnsafe: (query: string, ...values: unknown[]) => Promise<number>;
};

interface ProviderRelationRow {
  providerAId: string;
  providerBId: string;
  sharedTenders: number;
  providerAName?: string;
  providerBName?: string;
}

export async function syncProviderGraph(
  prisma: PrismaLike,
  graphName: string,
  relations: ProviderRelationRow[],
): Promise<number> {
  await ensureGraphExists(prisma, graphName);

  let synced = 0;
  for (const rel of relations) {
    const nameA = (rel.providerAName ?? rel.providerAId).replace(/'/g, "''");
    const nameB = (rel.providerBName ?? rel.providerBId).replace(/'/g, "''");
    const idA = rel.providerAId.replace(/'/g, "''");
    const idB = rel.providerBId.replace(/'/g, "''");

    await cypherQuery(prisma, graphName, `
      MERGE (a:Provider {id: '${idA}'})
      ON CREATE SET a.name = '${nameA}'
      MERGE (b:Provider {id: '${idB}'})
      ON CREATE SET b.name = '${nameB}'
      MERGE (a)-[r:CO_BIDDER]->(b)
      SET r.sharedTenders = ${Number(rel.sharedTenders)}
    `);
    synced++;
  }

  return synced;
}

export async function findMultiHopConnections(
  prisma: PrismaLike,
  graphName: string,
  providerId: string,
  maxHops: number,
): Promise<Array<{ id: string; name: string; hops: number }>> {
  const hops = Math.min(Math.max(maxHops, 1), 10);
  const safeId = providerId.replace(/'/g, "''");

  const cypher = `
    MATCH path = (start:Provider {id: '${safeId}'})-[:CO_BIDDER*1..${hops}]-(connected:Provider)
    WHERE connected.id <> '${safeId}'
    RETURN DISTINCT connected.id AS id, connected.name AS name, length(path) AS hops
    ORDER BY hops, connected.name
  `;

  return cypherQuery<{ id: string; name: string; hops: number }>(prisma, graphName, cypher);
}

interface Community {
  communityId: number;
  members: Array<{ id: string; name: string }>;
}

export async function getProviderCommunities(
  prisma: PrismaLike,
  graphName: string,
): Promise<Community[]> {
  const edges = await cypherQuery<{ aId: string; bId: string }>(
    prisma,
    graphName,
    `MATCH (a:Provider)-[:CO_BIDDER]-(b:Provider)
     WHERE a.id < b.id
     RETURN a.id AS aId, b.id AS bId`,
  );

  // Union-Find for connected components
  const parent = new Map<string, string>();
  function find(x: string): string {
    if (!parent.has(x)) parent.set(x, x);
    if (parent.get(x) !== x) parent.set(x, find(parent.get(x)!));
    return parent.get(x)!;
  }
  function union(a: string, b: string): void {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  }

  for (const e of edges) {
    union(e.aId, e.bId);
  }

  const groups = new Map<string, string[]>();
  for (const [node] of parent) {
    const root = find(node);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(node);
  }

  let communityId = 0;
  const communities: Community[] = [];
  for (const members of groups.values()) {
    if (members.length < 2) continue;
    communities.push({
      communityId: communityId++,
      members: members.map((id) => ({ id, name: id })),
    });
  }

  return communities;
}
