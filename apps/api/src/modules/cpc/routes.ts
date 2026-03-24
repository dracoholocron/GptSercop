import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../../db.js';
import { getCpcSuggestions } from '../../cpc.js';
import { Prisma } from '@prisma/client';

export const cpcRoutes: FastifyPluginAsync = async (app) => {
  // CPC (Clasificador Central de Productos)
  app.get<{ Querystring: { q?: string; limit?: string } }>('/api/v1/cpc/suggestions', async (req, reply) => {
    try {
      const q = typeof req.query?.q === 'string' ? req.query.q.trim() : '';
      const limit = Math.min(50, Math.max(1, parseInt(req.query?.limit || '15', 10) || 15));

      const where: Prisma.CpcNodeWhereInput = q
        ? {
            OR: [
              { code: { contains: q, mode: 'insensitive' } },
              { name: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {};

      const dbData = await prisma.cpcNode.findMany({
        where,
        orderBy: [{ code: 'asc' }],
        take: limit,
        select: { code: true, name: true, levelNum: true, nodeType: true, isLeaf: true },
      });

      if (dbData.length > 0) {
        return {
          data: dbData.map((r) => ({
            code: r.code,
            description: r.name,
            level: r.levelNum,
            type: r.nodeType,
            isLeaf: r.isLeaf,
          })),
          source: 'db',
        };
      }

      const data = getCpcSuggestions(q, limit);
      return { data, source: 'stub' };
    } catch (e) {
      req.log.error(e);
      return reply.status(500).send({ error: 'Error al obtener sugerencias CPC' });
    }
  });

  app.get<{ Querystring: { parentCode?: string; snapshotId?: string; limit?: string } }>('/api/v1/cpc/tree', async (req, reply) => {
    try {
      const parentCode = typeof req.query?.parentCode === 'string' ? req.query.parentCode.trim() : '';
      const snapshotId = typeof req.query?.snapshotId === 'string' ? req.query.snapshotId.trim() : '';
      const limit = Math.min(500, Math.max(1, parseInt(req.query?.limit || '100', 10) || 100));

      const snapshot = snapshotId
        ? await prisma.cpcSnapshot.findUnique({ where: { id: snapshotId }, select: { id: true } })
        : await prisma.cpcSnapshot.findFirst({ orderBy: { loadedAt: 'desc' }, select: { id: true } });

      if (!snapshot) return reply.status(404).send({ error: 'No hay snapshots CPC cargados' });

      if (!parentCode) {
        const roots = await prisma.cpcEdge.findMany({
          where: { snapshotId: snapshot.id, parentNodeId: null },
          include: { childNode: { select: { code: true, name: true, levelNum: true, nodeType: true, isLeaf: true } } },
          take: limit,
        });
        return { snapshotId: snapshot.id, parentCode: null, data: roots.map((r) => r.childNode) };
      }

      const parent = await prisma.cpcNode.findUnique({ where: { code: parentCode }, select: { id: true, code: true } });
      if (!parent) return reply.status(404).send({ error: 'parentCode no encontrado' });

      const children = await prisma.cpcEdge.findMany({
        where: { snapshotId: snapshot.id, parentNodeId: parent.id },
        include: { childNode: { select: { code: true, name: true, levelNum: true, nodeType: true, isLeaf: true } } },
        take: limit,
      });

      return { snapshotId: snapshot.id, parentCode: parent.code, data: children.map((r) => r.childNode) };
    } catch (e) {
      req.log.error(e);
      return reply.status(500).send({ error: 'Error al consultar árbol CPC' });
    }
  });
};
