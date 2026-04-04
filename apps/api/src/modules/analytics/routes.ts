import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../../db.js';
import { audit } from '../../audit.js';
import { computeRiskScore } from './risk-engine.js';
import { generateAlerts, resolveAlert } from './alerts.js';
import { getCompetitionBySector, getHhiByEntity, getAvgBidders } from './competition.js';
import { getMarketByEntity, getMarketByProcessType, getMarketByProvince, getTopProviders } from './market.js';
import { getPacVsExecuted } from './pac-analysis.js';
import { buildProviderNetwork, getProviderNeighbors } from './provider-network.js';

export const analyticsRoutes: FastifyPluginAsync = async (app) => {

  // GET /api/v1/analytics/dashboard – métricas globales + competencia + riesgo promedio
  app.get('/api/v1/analytics/dashboard', async (_req, reply) => {
    try {
      const [
        totalTenders,
        totalContracts,
        totalProviders,
        totalEntities,
        avgBidders,
        highRisk,
        mediumRisk,
        lowRisk,
        recentAlerts,
      ] = await Promise.all([
        prisma.tender.count(),
        prisma.contract.count(),
        prisma.provider.count(),
        prisma.entity.count(),
        getAvgBidders(),
        prisma.riskScore.count({ where: { riskLevel: 'high' } }),
        prisma.riskScore.count({ where: { riskLevel: 'medium' } }),
        prisma.riskScore.count({ where: { riskLevel: 'low' } }),
        prisma.alertEvent.count({ where: { resolvedAt: null } }),
      ]);

      const totalAmount = await prisma.$queryRawUnsafe<Array<{ total: number }>>(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM "Contract"`,
      );

      return {
        totalTenders,
        totalContracts,
        totalProviders,
        totalEntities,
        totalContractAmount: parseFloat(String(totalAmount[0]?.total ?? 0)),
        avgBidders: Math.round(avgBidders * 100) / 100,
        riskDistribution: { high: highRisk, medium: mediumRisk, low: lowRisk },
        openAlerts: recentAlerts,
      };
    } catch (e) {
      return reply.status(500).send({ error: 'Error al obtener dashboard analítico' });
    }
  });

  // GET /api/v1/analytics/risk-scores – listado paginado con filtros
  app.get<{ Querystring: { level?: string; entityId?: string; from?: string; to?: string; page?: string; limit?: string } }>(
    '/api/v1/analytics/risk-scores',
    async (req, reply) => {
      try {
        const { level, entityId, from, to, page = '1', limit = '20' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = Math.min(parseInt(limit), 100);

        const where: Record<string, unknown> = {};
        if (level && ['low', 'medium', 'high'].includes(level)) where.riskLevel = level;
        if (from || to) {
          where.calculatedAt = {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          };
        }
        if (entityId) {
          where.tender = { procurementPlan: { entityId } };
        }

        const [data, total] = await Promise.all([
          prisma.riskScore.findMany({
            where,
            skip,
            take,
            orderBy: { totalScore: 'desc' },
            include: {
              tender: {
                select: {
                  id: true,
                  code: true,
                  title: true,
                  processType: true,
                  procurementPlan: {
                    select: { entity: { select: { id: true, name: true } } },
                  },
                },
              },
            },
          }),
          prisma.riskScore.count({ where }),
        ]);

        return { data, total, page: parseInt(page), limit: take };
      } catch (e) {
        return reply.status(500).send({ error: 'Error al obtener risk scores' });
      }
    },
  );

  // GET /api/v1/analytics/competition – HHI, avgBidders, singleBidderPct por sector
  app.get<{ Querystring: { year?: string } }>(
    '/api/v1/analytics/competition',
    async (req, reply) => {
      try {
        const year = req.query.year ? parseInt(req.query.year) : undefined;
        const [bySector, byEntity, avgBidders] = await Promise.all([
          getCompetitionBySector(year),
          getHhiByEntity(year),
          getAvgBidders(year),
        ]);
        return {
          avgBidders: Math.round(avgBidders * 100) / 100,
          bySector: bySector.map((s) => ({
            ...s,
            tenderCount: Number(s.tenderCount),
            singleBidderCount: Number(s.singleBidderCount),
            avgBidders: parseFloat(String(s.avgBidders ?? 0)),
            singleBidderPct: parseFloat(String(s.singleBidderPct ?? 0)),
          })),
          hhiByEntity: byEntity.map((e) => ({
            ...e,
            hhi: parseFloat(String(e.hhi ?? 0)),
          })),
        };
      } catch (e) {
        return reply.status(500).send({ error: 'Error al obtener datos de competencia' });
      }
    },
  );

  // GET /api/v1/analytics/market – gasto por entidad/provincia/tipo
  app.get<{ Querystring: { year?: string; groupBy?: string } }>(
    '/api/v1/analytics/market',
    async (req, reply) => {
      try {
        const year = req.query.year ? parseInt(req.query.year) : undefined;
        const groupBy = req.query.groupBy ?? 'entity';

        if (groupBy === 'province') {
          const data = await getMarketByProvince(year);
          return {
            data: data.map((d) => ({
              ...d,
              providerCount: Number(d.providerCount),
              contractCount: Number(d.contractCount),
              totalAmount: parseFloat(String(d.totalAmount)),
            })),
          };
        }

        if (groupBy === 'processType') {
          const data = await getMarketByProcessType(year);
          return {
            data: data.map((d) => ({
              ...d,
              tenderCount: Number(d.tenderCount),
              totalAmount: parseFloat(String(d.totalAmount)),
              avgAmount: parseFloat(String(d.avgAmount ?? 0)),
            })),
          };
        }

        const data = await getMarketByEntity(year);
        return {
          data: data.map((d) => ({
            ...d,
            contractCount: Number(d.contractCount),
            totalAmount: parseFloat(String(d.totalAmount)),
          })),
        };
      } catch (e) {
        return reply.status(500).send({ error: 'Error al obtener datos de mercado' });
      }
    },
  );

  // GET /api/v1/analytics/pac-vs-executed – comparación PAC vs ejecutado
  app.get<{ Querystring: { year?: string } }>(
    '/api/v1/analytics/pac-vs-executed',
    async (req, reply) => {
      try {
        const year = req.query.year ? parseInt(req.query.year) : undefined;
        const data = await getPacVsExecuted(year);
        return {
          data: data.map((d) => ({
            ...d,
            planned: Number(d.planned),
            executed: Number(d.executed),
            plannedAmount: parseFloat(String(d.plannedAmount)),
            executedAmount: parseFloat(String(d.executedAmount)),
            executionRate: parseFloat(String(d.executionRate ?? 0)),
            deviation: parseFloat(String(d.deviation)),
          })),
        };
      } catch (e) {
        return reply.status(500).send({ error: 'Error al obtener PAC vs ejecutado' });
      }
    },
  );

  // GET /api/v1/analytics/alerts – alertas del sistema
  app.get<{ Querystring: { severity?: string; resolved?: string; from?: string; page?: string; limit?: string } }>(
    '/api/v1/analytics/alerts',
    async (req, reply) => {
      try {
        const { severity, resolved, from, page = '1', limit = '20' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = Math.min(parseInt(limit), 100);

        const where: Record<string, unknown> = {};
        if (severity) where.severity = severity;
        if (resolved === 'true') {
          where.resolvedAt = { not: null };
        } else if (resolved === 'false') {
          where.resolvedAt = null;
        }
        if (from) where.createdAt = { gte: new Date(from) };

        const [data, total] = await Promise.all([
          prisma.alertEvent.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
          prisma.alertEvent.count({ where }),
        ]);

        return { data, total, page: parseInt(page), limit: take };
      } catch (e) {
        return reply.status(500).send({ error: 'Error al obtener alertas' });
      }
    },
  );

  // POST /api/v1/analytics/compute-risk/:tenderId – calcular y persistir RiskScore
  app.post<{ Params: { tenderId: string } }>(
    '/api/v1/analytics/compute-risk/:tenderId',
    async (req, reply) => {
      try {
        const riskScore = await computeRiskScore(req.params.tenderId);
        await generateAlerts(req.params.tenderId, riskScore.flags, riskScore.totalScore);
        await audit({
          action: 'analytics.risk.computed',
          entityType: 'Tender',
          entityId: req.params.tenderId,
          payload: { riskLevel: riskScore.riskLevel, totalScore: riskScore.totalScore, flags: riskScore.flags },
        });
        return riskScore;
      } catch (e: unknown) {
        if ((e as { statusCode?: number }).statusCode === 404) {
          return reply.status(404).send({ error: 'Proceso no encontrado' });
        }
        return reply.status(500).send({ error: 'Error al calcular riesgo' });
      }
    },
  );

  // PATCH /api/v1/analytics/alerts/:alertId/resolve – resolver una alerta
  app.patch<{ Params: { alertId: string } }>(
    '/api/v1/analytics/alerts/:alertId/resolve',
    async (req, reply) => {
      try {
        const actorId = (req as unknown as { user?: { id?: string } }).user?.id ?? 'unknown';
        await resolveAlert(req.params.alertId, actorId);
        return { ok: true };
      } catch (e) {
        return reply.status(500).send({ error: 'Error al resolver alerta' });
      }
    },
  );

  // GET /api/v1/analytics/provider-network – nodos y aristas para visualización
  app.get<{ Querystring: { minShared?: string } }>(
    '/api/v1/analytics/provider-network',
    async (req, reply) => {
      try {
        const minShared = req.query.minShared ? parseInt(req.query.minShared) : 2;
        const network = await buildProviderNetwork(minShared);
        return network;
      } catch (e) {
        return reply.status(500).send({ error: 'Error al obtener red de proveedores' });
      }
    },
  );

  // GET /api/v1/analytics/provider-network/:id/neighbors
  app.get<{ Params: { id: string } }>(
    '/api/v1/analytics/provider-network/:id/neighbors',
    async (req, reply) => {
      try {
        const neighbors = await getProviderNeighbors(req.params.id);
        return { data: neighbors };
      } catch (e) {
        return reply.status(500).send({ error: 'Error al obtener vecinos' });
      }
    },
  );

  // ---- PUBLIC ENDPOINTS (no auth required) ----

  // GET /api/v1/public/analytics/market-overview
  app.get('/api/v1/public/analytics/market-overview', async (_req, reply) => {
    try {
      const year = new Date().getFullYear();
      const [byType, topAmountResult] = await Promise.all([
        getMarketByProcessType(year),
        prisma.$queryRawUnsafe<Array<{ total: number }>>(
          `SELECT COALESCE(SUM(c.amount), 0) AS total FROM "Contract" c
           JOIN "Tender" t ON t.id = c."tenderId"
           JOIN "ProcurementPlan" pp ON pp.id = t."procurementPlanId"
           WHERE pp.year = $1`,
          year,
        ),
      ]);
      return {
        year,
        totalContractAmount: parseFloat(String(topAmountResult[0]?.total ?? 0)),
        byProcessType: byType.map((d) => ({
          processType: d.processType,
          tenderCount: Number(d.tenderCount),
          totalAmount: parseFloat(String(d.totalAmount)),
        })),
      };
    } catch (e) {
      return reply.status(500).send({ error: 'Error al obtener resumen de mercado' });
    }
  });

  // GET /api/v1/public/analytics/top-providers
  app.get<{ Querystring: { year?: string; limit?: string } }>(
    '/api/v1/public/analytics/top-providers',
    async (req, reply) => {
      try {
        const year = req.query.year ? parseInt(req.query.year) : undefined;
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const providers = await getTopProviders(year, Math.min(limit, 20));
        return {
          data: providers.map((p) => ({
            providerId: p.providerId,
            name: p.name,
            totalAmount: parseFloat(String(p.totalAmount)),
            contractCount: Number(p.contractCount),
          })),
        };
      } catch (e) {
        return reply.status(500).send({ error: 'Error al obtener top proveedores' });
      }
    },
  );

  // GET /api/v1/public/analytics/risk-summary
  app.get('/api/v1/public/analytics/risk-summary', async (_req, reply) => {
    try {
      const [low, medium, high, total] = await Promise.all([
        prisma.riskScore.count({ where: { riskLevel: 'low' } }),
        prisma.riskScore.count({ where: { riskLevel: 'medium' } }),
        prisma.riskScore.count({ where: { riskLevel: 'high' } }),
        prisma.riskScore.count(),
      ]);
      return { low, medium, high, total };
    } catch (e) {
      return reply.status(500).send({ error: 'Error al obtener resumen de riesgo' });
    }
  });
};
