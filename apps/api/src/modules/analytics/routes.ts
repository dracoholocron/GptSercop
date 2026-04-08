import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../../db.js';
import { audit } from '../../audit.js';
import { computeRiskScore } from './risk-engine.js';
import { generateAlerts, resolveAlert } from './alerts.js';
import { getCompetitionBySector, getHhiByEntity, getAvgBidders } from './competition.js';
import { getMarketByEntity, getMarketByProcessType, getMarketByProvince, getTopProviders } from './market.js';
import { getPacVsExecuted } from './pac-analysis.js';
import { buildProviderNetwork, getProviderNeighbors } from './provider-network.js';
import { computeProviderScore, getProviderScores } from './provider-score.js';
import { getPriceIndex, getPriceAnomalies } from './price-index.js';
import { getContractHealth, getAmendmentPatterns } from './contract-monitoring.js';
import { detectFragmentation, getFragmentationAlerts } from './fragmentation.js';
import { predictRisk } from './predictive.js';

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
  app.get<{ Querystring: { level?: string; entityId?: string; processType?: string; from?: string; to?: string; page?: string; limit?: string } }>(
    '/api/v1/analytics/risk-scores',
    async (req, reply) => {
      try {
        const { level, entityId, processType, from, to, page = '1', limit = '20' } = req.query;
        const pageNum = Math.max(1, parseInt(page) || 1);
        const skip = (pageNum - 1) * Math.max(1, parseInt(limit) || 20);
        const take = Math.min(Math.max(1, parseInt(limit) || 20), 100);

        const where: Record<string, unknown> = {};
        if (level && ['low', 'medium', 'high'].includes(level)) where.riskLevel = level;
        if (from || to) {
          where.calculatedAt = {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          };
        }

        // Build tender filter combining entityId and processType
        const tenderFilter: Record<string, unknown> = {};
        if (entityId) tenderFilter.procurementPlan = { entityId };
        if (processType) tenderFilter.processType = processType;
        if (Object.keys(tenderFilter).length > 0) where.tender = tenderFilter;

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
  app.get<{ Querystring: { year?: string; entityId?: string } }>(
    '/api/v1/analytics/pac-vs-executed',
    async (req, reply) => {
      try {
        const year = req.query.year ? parseInt(req.query.year) : undefined;
        const data = await getPacVsExecuted(year, req.query.entityId);
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
  app.get<{ Querystring: { severity?: string; resolved?: string; entityId?: string; from?: string; page?: string; limit?: string } }>(
    '/api/v1/analytics/alerts',
    async (req, reply) => {
      try {
        const { severity, resolved, entityId, from, page = '1', limit = '20' } = req.query;
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

        // entityId filter: alerts where entityType='Entity' and entityId matches,
        // or alerts whose linked tender belongs to this entity
        if (entityId) {
          where.OR = [
            { entityType: 'Entity', entityId },
            {
              entityType: 'Tender',
              entityId: {
                in: (await prisma.tender.findMany({
                  where: { procurementPlan: { entityId } },
                  select: { id: true },
                })).map((t) => t.id),
              },
            },
          ];
        }

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

  // PATCH /api/v1/analytics/alerts/:alertId/resolve – resolver una alerta (con notas opcionales)
  app.patch<{ Params: { alertId: string }; Body: { notes?: string; actionTaken?: string; resolvedBy?: string } }>(
    '/api/v1/analytics/alerts/:alertId/resolve',
    async (req, reply) => {
      try {
        const actorId = (req as unknown as { user?: { id?: string } }).user?.id
          ?? (req.body as Record<string, string>)?.resolvedBy
          ?? 'unknown';
        await resolveAlert(req.params.alertId, actorId, {
          notes: (req.body as Record<string, string>)?.notes,
          actionTaken: (req.body as Record<string, string>)?.actionTaken,
        });
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
        return {
          ...network,
          edges: network.edges.map((e) => ({ ...e, source: e.providerAId, target: e.providerBId })),
        };
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

  // ---- PROVIDER SCORES ----

  // GET /api/v1/analytics/provider-scores – paginated list
  app.get<{ Querystring: { page?: string; limit?: string; tier?: string } }>(
    '/api/v1/analytics/provider-scores',
    async (req, reply) => {
      try {
        const page = parseInt(req.query.page ?? '1');
        const limit = parseInt(req.query.limit ?? '20');
        return await getProviderScores(page, limit, req.query.tier);
      } catch (e) {
        return reply.status(500).send({ error: 'Error al obtener scores de proveedores' });
      }
    },
  );

  // GET /api/v1/analytics/provider-scores/:providerId
  app.get<{ Params: { providerId: string } }>(
    '/api/v1/analytics/provider-scores/:providerId',
    async (req, reply) => {
      try {
        const score = await prisma.providerScore.findUnique({
          where: { providerId: req.params.providerId },
          include: { provider: { select: { id: true, name: true, identifier: true, province: true } } },
        });
        if (!score) return reply.status(404).send({ error: 'Score no encontrado' });
        return score;
      } catch (e) {
        return reply.status(500).send({ error: 'Error al obtener score de proveedor' });
      }
    },
  );

  // POST /api/v1/analytics/compute-provider-score/:providerId
  app.post<{ Params: { providerId: string } }>(
    '/api/v1/analytics/compute-provider-score/:providerId',
    async (req, reply) => {
      try {
        const score = await computeProviderScore(req.params.providerId);
        return score;
      } catch (e: unknown) {
        if ((e as { statusCode?: number }).statusCode === 404) {
          return reply.status(404).send({ error: 'Proveedor no encontrado' });
        }
        return reply.status(500).send({ error: 'Error al calcular score' });
      }
    },
  );

  // ---- PRICE INDEX ----

  // GET /api/v1/analytics/price-index
  app.get<{ Querystring: { year?: string; processType?: string } }>(
    '/api/v1/analytics/price-index',
    async (req, reply) => {
      try {
        const year = req.query.year ? parseInt(req.query.year) : undefined;
        const data = await getPriceIndex(year, req.query.processType);
        return { data };
      } catch (e) {
        return reply.status(500).send({ error: 'Error al obtener índice de precios' });
      }
    },
  );

  // GET /api/v1/analytics/price-anomalies
  app.get<{ Querystring: { year?: string; threshold?: string } }>(
    '/api/v1/analytics/price-anomalies',
    async (req, reply) => {
      try {
        const year = req.query.year ? parseInt(req.query.year) : undefined;
        const threshold = req.query.threshold ? parseFloat(req.query.threshold) : 50;
        const data = await getPriceAnomalies(year, threshold);
        return { data };
      } catch (e) {
        return reply.status(500).send({ error: 'Error al obtener anomalías de precio' });
      }
    },
  );

  // ---- CONTRACT MONITORING ----

  // GET /api/v1/analytics/contract-health
  app.get<{ Querystring: { page?: string; limit?: string; healthLevel?: string; entityId?: string } }>(
    '/api/v1/analytics/contract-health',
    async (req, reply) => {
      try {
        const page = parseInt(req.query.page ?? '1');
        const limit = parseInt(req.query.limit ?? '20');
        return await getContractHealth(page, limit, req.query.healthLevel, req.query.entityId);
      } catch (e) {
        return reply.status(500).send({ error: 'Error al obtener salud contractual' });
      }
    },
  );

  // GET /api/v1/analytics/amendment-patterns
  app.get<{ Querystring: { year?: string } }>(
    '/api/v1/analytics/amendment-patterns',
    async (req, reply) => {
      try {
        const year = req.query.year ? parseInt(req.query.year) : undefined;
        const data = await getAmendmentPatterns(year);
        return { data };
      } catch (e) {
        return reply.status(500).send({ error: 'Error al obtener patrones de modificaciones' });
      }
    },
  );

  // ---- FRAGMENTATION ----

  // GET /api/v1/analytics/fragmentation-alerts
  app.get<{ Querystring: { page?: string; limit?: string; severity?: string; resolved?: string } }>(
    '/api/v1/analytics/fragmentation-alerts',
    async (req, reply) => {
      try {
        const page = parseInt(req.query.page ?? '1');
        const limit = parseInt(req.query.limit ?? '20');
        const resolved = req.query.resolved === 'true' ? true : req.query.resolved === 'false' ? false : undefined;
        return await getFragmentationAlerts(page, limit, req.query.severity, resolved);
      } catch (e) {
        return reply.status(500).send({ error: 'Error al obtener alertas de fragmentación' });
      }
    },
  );

  // POST /api/v1/analytics/detect-fragmentation
  app.post<{ Querystring: { entityId?: string } }>(
    '/api/v1/analytics/detect-fragmentation',
    async (req, reply) => {
      try {
        const results = await detectFragmentation(req.query.entityId);
        return { data: results, newAlerts: results.length };
      } catch (e) {
        return reply.status(500).send({ error: 'Error al detectar fragmentación' });
      }
    },
  );

  // ---- PREDICTIVE ----

  // GET /api/v1/analytics/risk-prediction/:tenderId
  app.get<{ Params: { tenderId: string } }>(
    '/api/v1/analytics/risk-prediction/:tenderId',
    async (req, reply) => {
      try {
        return await predictRisk(req.params.tenderId);
      } catch (e: unknown) {
        if ((e as { statusCode?: number }).statusCode === 404) {
          return reply.status(404).send({ error: 'Proceso no encontrado' });
        }
        return reply.status(500).send({ error: 'Error al predecir riesgo' });
      }
    },
  );

  // ---- ENTITY & PROVIDER OVERVIEWS ----

  // GET /api/v1/analytics/entities/:entityId/overview
  app.get<{ Params: { entityId: string } }>(
    '/api/v1/analytics/entities/:entityId/overview',
    async (req, reply) => {
      try {
        const { entityId } = req.params;
        const entity = await prisma.entity.findUnique({ where: { id: entityId } });
        if (!entity) return reply.status(404).send({ error: 'Entidad no encontrada' });

        const [
          tenderIds,
          totalContracts,
          openAlerts,
          riskHigh,
          riskMedium,
          riskLow,
        ] = await Promise.all([
          prisma.tender.findMany({
            where: { procurementPlan: { entityId } },
            select: { id: true },
          }),
          prisma.contract.count({
            where: { tender: { procurementPlan: { entityId } } },
          }),
          prisma.alertEvent.count({ where: { entityType: 'Entity', entityId, resolvedAt: null } }),
          prisma.riskScore.count({ where: { riskLevel: 'high', tender: { procurementPlan: { entityId } } } }),
          prisma.riskScore.count({ where: { riskLevel: 'medium', tender: { procurementPlan: { entityId } } } }),
          prisma.riskScore.count({ where: { riskLevel: 'low', tender: { procurementPlan: { entityId } } } }),
        ]);

        const tIds = tenderIds.map((t) => t.id);
        const totalTenders = tIds.length;

        const totalSpendResult = await prisma.$queryRawUnsafe<Array<{ total: number }>>(
          `SELECT COALESCE(SUM(c.amount), 0) AS total
           FROM "Contract" c
           JOIN "Tender" t ON t.id = c."tenderId"
           JOIN "ProcurementPlan" pp ON pp.id = t."procurementPlanId"
           WHERE pp."entityId" = $1`,
          entityId,
        );
        const totalSpend = parseFloat(String(totalSpendResult[0]?.total ?? 0));

        const avgBiddersResult = await prisma.$queryRawUnsafe<Array<{ avg: number }>>(
          `SELECT AVG(bid_counts."bidCount") AS avg
           FROM (
             SELECT b."tenderId", COUNT(*) AS "bidCount"
             FROM "Bid" b
             JOIN "Tender" t ON t.id = b."tenderId"
             JOIN "ProcurementPlan" pp ON pp.id = t."procurementPlanId"
             WHERE pp."entityId" = $1
             GROUP BY b."tenderId"
           ) bid_counts`,
          entityId,
        );
        const avgBidders = Math.round((parseFloat(String(avgBiddersResult[0]?.avg ?? 0)) || 0) * 100) / 100;

        return {
          entity: { id: entity.id, name: entity.name, code: entity.code, organizationType: entity.organizationType },
          totalTenders,
          totalContracts,
          totalSpend,
          avgBidders,
          riskDistribution: { high: riskHigh, medium: riskMedium, low: riskLow },
          openAlerts,
        };
      } catch (e) {
        return reply.status(500).send({ error: 'Error al obtener overview de entidad' });
      }
    },
  );

  // GET /api/v1/analytics/providers/:providerId/overview
  app.get<{ Params: { providerId: string }; Querystring: { page?: string; limit?: string } }>(
    '/api/v1/analytics/providers/:providerId/overview',
    async (req, reply) => {
      try {
        const { providerId } = req.params;
        const page = Math.max(1, parseInt(req.query.page ?? '1') || 1);
        const limit = Math.min(parseInt(req.query.limit ?? '20') || 20, 50);
        const skip = (page - 1) * limit;

        const provider = await prisma.provider.findUnique({ where: { id: providerId } });
        if (!provider) return reply.status(404).send({ error: 'Proveedor no encontrado' });

        const [score, bidsCount, neighborCount, contractsTotal] = await Promise.all([
          prisma.providerScore.findUnique({
            where: { providerId },
            select: {
              complianceScore: true,
              deliveryScore: true,
              priceScore: true,
              diversityScore: true,
              totalScore: true,
              tier: true,
              calculatedAt: true,
            },
          }),
          prisma.bid.count({ where: { providerId } }),
          prisma.providerRelation.count({
            where: { OR: [{ providerAId: providerId }, { providerBId: providerId }] },
          }),
          prisma.contract.count({ where: { providerId } }),
        ]);

        const contracts = await prisma.contract.findMany({
          where: { providerId },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            amendments: { select: { id: true } },
            tender: {
              select: {
                id: true,
                code: true,
                title: true,
                processType: true,
                procurementPlan: { select: { entity: { select: { id: true, name: true } } } },
              },
            },
          },
        });

        const contractData = contracts.map((c) => {
          const amendCount = c.amendments.length;
          let healthLevel: 'healthy' | 'warning' | 'critical' = 'healthy';
          if (amendCount >= 3 || c.status === 'terminated') healthLevel = 'critical';
          else if (amendCount >= 1 || c.status === 'suspended') healthLevel = 'warning';
          return {
            contractId: c.id,
            contractNo: c.contractNo ?? '',
            amount: parseFloat(String(c.amount ?? 0)),
            status: c.status,
            amendmentCount: amendCount,
            healthLevel,
            tenderId: c.tender?.id,
            tenderCode: c.tender?.code,
            tenderTitle: c.tender?.title,
            processType: c.tender?.processType,
            entityId: c.tender?.procurementPlan?.entity?.id,
            entityName: c.tender?.procurementPlan?.entity?.name,
            signedAt: c.signedAt,
          };
        });

        return {
          provider: {
            id: provider.id,
            name: provider.name,
            identifier: provider.identifier,
            province: provider.province,
            status: provider.status,
          },
          score,
          contracts: { data: contractData, total: contractsTotal, page, limit },
          bidsCount,
          neighborCount,
        };
      } catch (e) {
        return reply.status(500).send({ error: 'Error al obtener overview de proveedor' });
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
