import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import agentSocePlugin from './plugin.js';
import { disconnectPrisma } from './db/client.js';
import { closeRedis, redis } from './session/redis.js';

const app = Fastify({ logger: true });

const corsOrigins = process.env.CORS_ALLOWED_ORIGINS?.trim();
const corsOpt = corsOrigins
  ? { origin: corsOrigins.split(',').map((o) => o.trim()).filter(Boolean) }
  : { origin: true };

await app.register(cors, corsOpt);
await app.register(rateLimit, {
  max: Number(process.env.RATE_LIMIT_MAX ?? 120),
  timeWindow: '1 minute',
});

app.get('/health', async () => {
  let redisOk = false;
  try {
    const pong = await redis.ping();
    redisOk = pong === 'PONG';
  } catch {
    redisOk = false;
  }
  return { status: 'ok', redis: redisOk, ts: new Date().toISOString() };
});

await app.register(agentSocePlugin, { prefix: '/api/v1/agent-soce' });

const host = process.env.HOST ?? '0.0.0.0';
const port = Number(process.env.PORT ?? 3090);

async function shutdown(signal: string): Promise<void> {
  app.log.info({ signal }, 'shutting down');
  try {
    await app.close();
  } finally {
    await disconnectPrisma();
    await closeRedis();
    process.exit(0);
  }
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    void shutdown(signal);
  });
}

try {
  await app.listen({ host, port });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
