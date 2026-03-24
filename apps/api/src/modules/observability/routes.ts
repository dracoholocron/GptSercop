import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../../db.js';
import { isRedisConfigured, pingRedis } from '../../redis.js';
import { openapiSpec } from '../../openapi.js';

export const observabilityRoutes: FastifyPluginAsync = async (app) => {
  // Health check (Fase 4: DB + Redis)
  app.get('/health', async (req, reply) => {
    let db: 'connected' | 'disconnected' = 'disconnected';
    try {
      await prisma.$queryRaw`SELECT 1`;
      db = 'connected';
    } catch (_) {}
    const payload: Record<string, string> = { status: db === 'connected' ? 'ok' : 'degraded', service: 'api', database: db };
    if (isRedisConfigured()) {
      payload.redis = await pingRedis();
      if (payload.status === 'ok' && payload.redis === 'disconnected') payload.status = 'degraded';
    }
    if (payload.status === 'degraded') return reply.status(503).send(payload);
    return payload;
  });

  // Ready (K8s: tráfico listo)
  app.get('/ready', async (_req, reply) => {
    return { ready: true };
  });

  // OpenAPI spec y documentación (públicos)
  app.get('/openapi.json', async (_req, reply) => {
    return reply.type('application/json').send(openapiSpec);
  });
  app.get('/documentation', async (_req, reply) => {
    const html = `<!DOCTYPE html><html><head><title>SERCOP API – Documentación</title><link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"/></head><body><div id="swagger-ui"></div><script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script><script>SwaggerUIBundle({ url: '/openapi.json', dom_id: '#swagger-ui' })</script></body></html>`;
    return reply.type('text/html').send(html);
  });
};
