import type { FastifyPluginAsync } from 'fastify';
import { requireAdmin } from './auth.js';
import { prisma } from '../db/client.js';
import { assertSafeGraphName } from '../graph/age-client.js';
import { findMultiHopConnections, getProviderCommunities } from '../graph/provider-graph.js';
import { computePageRank, computeBetweenness } from '../graph/sync-worker.js';

function parseAgtypeId(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  const s = String(value);
  try {
    const parsed = JSON.parse(s) as unknown;
    if (typeof parsed === 'string') return parsed;
    return String(parsed);
  } catch {
    return s.replace(/"/g, '');
  }
}

function parseAgtypeInt(value: unknown): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  const n = parseInt(String(value).replace(/"/g, ''), 10);
  return Number.isNaN(n) ? 1 : n;
}

const graphRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', requireAdmin);

  fastify.get('/stats', async () => {
    const config = await prisma.agentGraphConfig.findFirst();
    const graphName = config?.graphName ?? 'sercop_graph';
    assertSafeGraphName(graphName);

    let nodeCount = 0;
    let edgeCount = 0;
    try {
      const nodeResult = await prisma.$queryRawUnsafe<[{ count: unknown }]>(
        `SELECT * FROM cypher('${graphName}', $$ MATCH (n:Provider) RETURN count(n) AS count $$) AS ("count" agtype)`,
      );
      nodeCount = parseAgtypeInt(nodeResult[0]?.count);
      const edgeResult = await prisma.$queryRawUnsafe<[{ count: unknown }]>(
        `SELECT * FROM cypher('${graphName}', $$ MATCH ()-[r:CO_BIDDER]->() RETURN count(r) AS count $$) AS ("count" agtype)`,
      );
      edgeCount = parseAgtypeInt(edgeResult[0]?.count);
    } catch {
      // AGE not available
    }

    return {
      graphName,
      nodeCount,
      edgeCount,
      syncEnabled: config?.syncEnabled ?? false,
      syncCron: config?.syncCron ?? '0 */6 * * *',
    };
  });

  fastify.get('/communities', async () => {
    const config = await prisma.agentGraphConfig.findFirst();
    const graphName = config?.graphName ?? 'sercop_graph';
    try {
      const communities = await getProviderCommunities(
        prisma as unknown as Parameters<typeof getProviderCommunities>[0],
        graphName,
      );
      return { data: communities, total: communities.length };
    } catch {
      return { data: [], total: 0, error: 'AGE extension not available' };
    }
  });

  fastify.get<{ Params: { id: string }; Querystring: { maxHops?: string } }>(
    '/provider/:id/connections',
    async (request) => {
      const config = await prisma.agentGraphConfig.findFirst();
      const graphName = config?.graphName ?? 'sercop_graph';
      const maxHops = parseInt(request.query.maxHops ?? '3', 10);
      try {
        const connections = await findMultiHopConnections(
          prisma as unknown as Parameters<typeof findMultiHopConnections>[0],
          graphName,
          request.params.id,
          maxHops,
        );
        return { data: connections };
      } catch {
        return { data: [], error: 'AGE extension not available' };
      }
    },
  );

  fastify.get('/centrality', async () => {
    const config = await prisma.agentGraphConfig.findFirst();
    const graphName = config?.graphName ?? 'sercop_graph';
    assertSafeGraphName(graphName);

    try {
      const edgesRaw = await prisma.$queryRawUnsafe<
        Array<{ a_id: unknown; b_id: unknown; shared: unknown }>
      >(
        `SELECT * FROM cypher('${graphName}', $$ 
          MATCH (a:Provider)-[r:CO_BIDDER]->(b:Provider) 
          RETURN a.id, b.id, r.sharedTenders 
        $$) AS ("a_id" agtype, "b_id" agtype, "shared" agtype)`,
      );

      const edges = edgesRaw.map((r) => ({
        from: parseAgtypeId(r.a_id),
        to: parseAgtypeId(r.b_id),
        weight: parseAgtypeInt(r.shared),
      }));

      const pagerank = computePageRank(edges);
      const betweenness = computeBetweenness(edges.map((e) => ({ from: e.from, to: e.to })));

      const items = [...pagerank.entries()]
        .map(([id, pr]) => ({
          providerId: id,
          pageRank: Math.round(pr * 10000) / 10000,
          betweenness: Math.round((betweenness.get(id) ?? 0) * 100) / 100,
          degree: edges.filter((e) => e.from === id || e.to === id).length,
        }))
        .sort((a, b) => b.pageRank - a.pageRank)
        .slice(0, 50);

      return { data: items };
    } catch {
      return { data: [], error: 'AGE extension not available' };
    }
  });

  fastify.get('/collusion-candidates', async () => {
    const config = await prisma.agentGraphConfig.findFirst();
    const graphName = config?.graphName ?? 'sercop_graph';
    try {
      const communities = await getProviderCommunities(
        prisma as unknown as Parameters<typeof getProviderCommunities>[0],
        graphName,
      );

      const candidates = communities
        .filter((c) => c.members.length >= 3)
        .map((c) => ({
          communityId: c.communityId,
          memberCount: c.members.length,
          members: c.members,
          riskLevel:
            c.members.length >= 5 ? 'CRITICAL' : c.members.length >= 4 ? 'WARNING' : 'INFO',
        }));

      return { data: candidates, total: candidates.length };
    } catch {
      return { data: [], total: 0, error: 'AGE extension not available' };
    }
  });
};

export default graphRoutes;
