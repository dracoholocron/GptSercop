import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { hasJwtSecret, isAuthDisabled } from './auth.js';
import { authPlugin } from './authPlugin.js';
import { registerCoreFlowRoutes } from './sercop/core-flow-routes.js';
import { observabilityRoutes } from './modules/observability/routes.js';
import { authRoutes } from './modules/auth/routes.js';
import { providersRoutes } from './modules/providers/routes.js';
import { tendersRoutes } from './modules/tenders/routes.js';
import { offersRoutes } from './modules/offers/routes.js';
import { casesRoutes } from './modules/cases/routes.js';
import { contractsRoutes } from './modules/contracts/routes.js';
import { cpcRoutes } from './modules/cpc/routes.js';
import { awardsRoutes } from './modules/awards/routes.js';
import { pacRoutes } from './modules/pac/routes.js';
import { coreRoutes } from './modules/core/routes.js';
import { analyticsRoutes } from './modules/analytics/routes.js';

const app = Fastify({ logger: true, bodyLimit: 20 * 1024 * 1024 });

// CORS: en producción usar CORS_ALLOWED_ORIGINS (lista separada por coma); si no, permitir todo (desarrollo)
const corsOrigins = process.env.CORS_ALLOWED_ORIGINS?.trim();
const corsOpt = corsOrigins
  ? { origin: corsOrigins.split(',').map((o) => o.trim()).filter(Boolean) }
  : { origin: true };

await app.register(cors, corsOpt);
await app.register(multipart, { limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB por archivo (legacy)
await app.register(authPlugin);
await registerCoreFlowRoutes(app);

// Security headers (Fase 2)
app.addHook('onSend', async (_request, reply) => {
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('X-Frame-Options', 'DENY');
});

// Register domain plugins
await app.register(observabilityRoutes);
await app.register(authRoutes);
await app.register(providersRoutes);
await app.register(tendersRoutes);
await app.register(offersRoutes);
await app.register(casesRoutes);
await app.register(contractsRoutes);
await app.register(cpcRoutes);
await app.register(awardsRoutes);
await app.register(pacRoutes);
await app.register(coreRoutes);
await app.register(analyticsRoutes);

const host = process.env.HOST ?? '0.0.0.0';
const port = Number(process.env.PORT ?? 3080);

// Producción: exigir JWT_SECRET y bloquear AUTH_DISABLED
if (process.env.NODE_ENV === 'production') {
  if (isAuthDisabled()) {
    app.log.error('En producción AUTH_DISABLED no está permitido. Quite AUTH_DISABLED y configure JWT_SECRET.');
    process.exit(1);
  }
  if (!hasJwtSecret()) {
    app.log.error('En producción JWT_SECRET es obligatorio y debe tener al menos 16 caracteres. No se inicia la API.');
    process.exit(1);
  }
}

export { app };

if (process.env.NODE_ENV !== 'test') {
  try {
    await app.listen({ host, port });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}
