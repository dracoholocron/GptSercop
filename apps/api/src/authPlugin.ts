/**
 * Plugin Fastify: rutas públicas vs protegidas, extracción y verificación JWT, RBAC básico.
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { verify, bearerFromHeader, hasJwtSecret, type JwtPayload } from './auth.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}

const PUBLIC_ROUTES: Array<{ method: string; path: RegExp }> = [
  { method: 'GET', path: /^\/health$/ },
  { method: 'GET', path: /^\/ready$/ },
  { method: 'GET', path: /^\/openapi\.json$/ },
  { method: 'GET', path: /^\/documentation$/ },
  { method: 'GET', path: /^\/api\/v1\/tenders$/ },
  { method: 'GET', path: /^\/api\/v1\/tenders\/export$/ },
  { method: 'GET', path: /^\/api\/v1\/tenders\/[^/]+$/ },
  { method: 'GET', path: /^\/api\/v1\/pac$/ },
  { method: 'GET', path: /^\/api\/v1\/pac\/[^/]+$/ },
  { method: 'GET', path: /^\/api\/v1\/providers$/ },
  { method: 'GET', path: /^\/api\/v1\/providers\/[^/]+$/ },
  { method: 'POST', path: /^\/api\/v1\/auth\/login$/ },
  { method: 'GET', path: /^\/api\/v1\/rag\/search$/ },
  { method: 'POST', path: /^\/api\/v1\/rag\/ask$/ },
  { method: 'GET', path: /^\/api\/v1\/analytics\/public$/ },
  { method: 'GET', path: /^\/api\/v1\/entities$/ },
  { method: 'GET', path: /^\/api\/v1\/entities\/[^/]+$/ },
];

function isPublic(method: string, path: string): boolean {
  const p = path.split('?')[0];
  return PUBLIC_ROUTES.some((r) => r.method === method && r.path.test(p));
}

async function authHook(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (isPublic(req.method, req.url)) return;

  const token = bearerFromHeader(req.headers.authorization);
  if (!token) {
    return reply.status(401).send({ error: 'Unauthorized', message: 'Missing or invalid Authorization header' });
  }
  try {
    req.user = verify(token);
  } catch {
    return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid or expired token' });
  }
}

export async function authPlugin(app: FastifyInstance): Promise<void> {
  if (!hasJwtSecret()) {
    app.log.warn('JWT_SECRET not set or too short; auth disabled (all routes public). Set JWT_SECRET in production.');
    return;
  }
  app.addHook('preHandler', authHook);
}
