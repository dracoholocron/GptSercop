import type { FastifyPluginAsync } from 'fastify';
import { requireAdmin } from './auth.js';
import { prisma } from '../db/client.js';

const adminRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', requireAdmin);

  // ─── Roles ───────────────────────────────────────────────

  fastify.get('/roles', async () => {
    return prisma.agentRole.findMany({
      include: { _count: { select: { users: true } } },
      orderBy: { name: 'asc' },
    });
  });

  fastify.post<{ Body: { name: string; description?: string } }>('/roles', async (request) => {
    return prisma.agentRole.create({ data: request.body });
  });

  fastify.put<{ Params: { id: string }; Body: { name?: string; description?: string } }>(
    '/roles/:id',
    async (request) => {
      return prisma.agentRole.update({
        where: { id: request.params.id },
        data: request.body,
      });
    },
  );

  fastify.delete<{ Params: { id: string } }>('/roles/:id', async (request, reply) => {
    const role = await prisma.agentRole.findUnique({ where: { id: request.params.id } });
    if (role?.isSystem) {
      return reply.code(400).send({ error: 'Cannot delete system role' });
    }
    await prisma.agentRole.delete({ where: { id: request.params.id } });
    return { ok: true };
  });

  // ─── Users ───────────────────────────────────────────────

  fastify.get('/users', async () => {
    return prisma.agentUser.findMany({
      include: { roles: { include: { role: true } } },
      orderBy: { displayName: 'asc' },
    });
  });

  fastify.post<{ Body: { externalId: string; email: string; displayName: string; roleIds?: string[] } }>(
    '/users',
    async (request) => {
      const { externalId, email, displayName, roleIds } = request.body;
      return prisma.agentUser.create({
        data: {
          externalId,
          email,
          displayName,
          ...(roleIds?.length
            ? { roles: { create: roleIds.map((roleId) => ({ roleId })) } }
            : {}),
        },
        include: { roles: { include: { role: true } } },
      });
    },
  );

  fastify.put<{ Params: { id: string }; Body: { email?: string; displayName?: string; status?: string; roleIds?: string[] } }>(
    '/users/:id',
    async (request) => {
      const { roleIds, ...data } = request.body;
      if (roleIds) {
        await prisma.agentUserRole.deleteMany({ where: { userId: request.params.id } });
        await prisma.agentUserRole.createMany({
          data: roleIds.map((roleId) => ({ userId: request.params.id, roleId })),
        });
      }
      return prisma.agentUser.update({
        where: { id: request.params.id },
        data,
        include: { roles: { include: { role: true } } },
      });
    },
  );

  // ─── Permissions ─────────────────────────────────────────

  fastify.get<{ Querystring: { roleId?: string } }>('/permissions', async (request) => {
    const where = request.query.roleId ? { roleId: request.query.roleId } : {};
    return prisma.agentDataPermission.findMany({
      where,
      include: { role: true, dataSource: true },
      orderBy: { tableName: 'asc' },
    });
  });

  fastify.put<{ Body: Array<{ roleId: string; dataSourceId: string; tableName: string; allowedColumns?: string[]; rowFilter?: string; accessLevel?: string }> }>(
    '/permissions',
    async (request) => {
      const permissions = request.body;
      const results = await Promise.all(
        permissions.map((p) =>
          prisma.agentDataPermission.upsert({
            where: {
              roleId_dataSourceId_tableName: {
                roleId: p.roleId,
                dataSourceId: p.dataSourceId,
                tableName: p.tableName,
              },
            },
            update: {
              allowedColumns: p.allowedColumns ?? [],
              rowFilter: p.rowFilter ?? null,
              accessLevel: p.accessLevel ?? 'read',
            },
            create: {
              roleId: p.roleId,
              dataSourceId: p.dataSourceId,
              tableName: p.tableName,
              allowedColumns: p.allowedColumns ?? [],
              rowFilter: p.rowFilter ?? null,
              accessLevel: p.accessLevel ?? 'read',
            },
          }),
        ),
      );
      return results;
    },
  );

  // ─── Data Sources ────────────────────────────────────────

  fastify.get('/data-sources', async () => {
    return prisma.agentDataSource.findMany({ orderBy: { name: 'asc' } });
  });

  fastify.post<{ Body: { name: string; type: string; connectionUrl: string; schema?: string; maxPoolSize?: number; timeoutMs?: number } }>(
    '/data-sources',
    async (request) => {
      return prisma.agentDataSource.create({ data: request.body });
    },
  );

  fastify.put<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/data-sources/:id',
    async (request) => {
      return prisma.agentDataSource.update({
        where: { id: request.params.id },
        data: request.body,
      });
    },
  );

  fastify.delete<{ Params: { id: string } }>('/data-sources/:id', async (request) => {
    await prisma.agentDataSource.delete({ where: { id: request.params.id } });
    return { ok: true };
  });

  fastify.post<{ Params: { id: string } }>('/data-sources/:id/test', async (request) => {
    const ds = await prisma.agentDataSource.findUnique({ where: { id: request.params.id } });
    if (!ds) return { ok: false, error: 'Data source not found' };

    const { DataSourceRegistry } = await import('../data-access/DataSourceRegistry.js');
    const reg = new DataSourceRegistry();
    reg.register(ds);
    const result = await reg.testConnection(ds.id);
    await reg.close();
    return result;
  });

  fastify.get<{ Params: { id: string } }>('/data-sources/:id/catalog', async (request) => {
    const ds = await prisma.agentDataSource.findUnique({ where: { id: request.params.id } });
    if (!ds) return [];

    const { DataSourceRegistry } = await import('../data-access/DataSourceRegistry.js');
    const reg = new DataSourceRegistry();
    reg.register(ds);
    const catalog = await reg.getCatalog(ds.id);
    await reg.close();
    return catalog;
  });

  // ─── Audit ───────────────────────────────────────────────

  fastify.get<{ Querystring: { userId?: string; from?: string; to?: string; skip?: string; take?: string } }>(
    '/audit',
    async (request) => {
      const { userId, from, to, skip, take } = request.query;
      const where: Record<string, unknown> = {};
      if (userId) where.userId = userId;
      if (from || to) {
        where.createdAt = {};
        if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
        if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to);
      }
      return prisma.agentAuditLog.findMany({
        where,
        include: { user: { select: { displayName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: skip ? Number(skip) : 0,
        take: take ? Number(take) : 50,
      });
    },
  );

  // ─── Training Datasets ──────────────────────────────────

  fastify.get('/training/datasets', async () => {
    return prisma.agentTrainingDataset.findMany({
      include: { _count: { select: { entries: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  });

  fastify.post<{ Body: { name: string; description?: string; format?: string } }>(
    '/training/datasets',
    async (request) => {
      return prisma.agentTrainingDataset.create({ data: request.body });
    },
  );

  fastify.get<{ Params: { id: string } }>('/training/datasets/:id', async (request) => {
    return prisma.agentTrainingDataset.findUnique({
      where: { id: request.params.id },
      include: { entries: { include: { interaction: true } } },
    });
  });

  fastify.put<{ Params: { id: string }; Body: { name?: string; description?: string; status?: string } }>(
    '/training/datasets/:id',
    async (request) => {
      return prisma.agentTrainingDataset.update({
        where: { id: request.params.id },
        data: request.body,
      });
    },
  );

  fastify.delete<{ Params: { id: string } }>('/training/datasets/:id', async (request) => {
    await prisma.agentTrainingDataset.delete({ where: { id: request.params.id } });
    return { ok: true };
  });

  fastify.post<{ Params: { id: string }; Body: { interactionId: string; userMessage: string; idealResponse: string; systemPrompt?: string; category?: string } }>(
    '/training/datasets/:id/entries',
    async (request) => {
      const entry = await prisma.agentTrainingEntry.create({
        data: {
          datasetId: request.params.id,
          ...request.body,
        },
      });
      await prisma.agentTrainingDataset.update({
        where: { id: request.params.id },
        data: { totalPairs: { increment: 1 } },
      });
      return entry;
    },
  );

  fastify.get<{ Params: { id: string } }>('/training/datasets/:id/entries', async (request) => {
    return prisma.agentTrainingEntry.findMany({
      where: { datasetId: request.params.id },
      include: { interaction: { select: { content: true, messageRole: true } } },
      orderBy: { createdAt: 'desc' },
    });
  });

  // ─── Interactions ────────────────────────────────────────

  fastify.get<{ Querystring: { userId?: string; from?: string; to?: string; rating?: string; status?: string } }>(
    '/interactions',
    async (request) => {
      const { userId, from, to, rating, status } = request.query;
      const where: Record<string, unknown> = {};
      if (userId) where.userId = userId;
      if (rating) where.feedbackRating = { gte: Number(rating) };
      if (status) where.trainingStatus = status;
      if (from || to) {
        where.createdAt = {};
        if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
        if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to);
      }
      return prisma.agentInteraction.findMany({
        where,
        include: { user: { select: { displayName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    },
  );

  fastify.get('/interactions/stats', async () => {
    const { getInteractionStats } = await import('../telemetry/audit.js');
    return getInteractionStats(prisma as unknown as Parameters<typeof getInteractionStats>[0]);
  });
};

export default adminRoutes;
