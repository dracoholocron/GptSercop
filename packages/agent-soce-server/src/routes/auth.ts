import type { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

// Augment Fastify's Request type to carry the decoded agent user
declare module 'fastify' {
  interface FastifyRequest {
    agentUser?: AgentJWTPayload;
  }
}

const JWT_SECRET = process.env.JWT_SECRET ?? 'agent-soce-dev-secret-min-32-chars!!';

export interface AgentJWTPayload {
  sub: string;
  email: string;
  displayName: string;
  roles: string[];
}

export function verifyToken(token: string): AgentJWTPayload {
  return jwt.verify(token, JWT_SECRET) as AgentJWTPayload;
}

export function signToken(payload: AgentJWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    reply.code(401).send({ error: 'Missing or invalid Authorization header' });
    return;
  }

  try {
    const payload = verifyToken(header.slice(7));
    request.agentUser = payload;
  } catch {
    reply.code(401).send({ error: 'Invalid or expired token' });
  }
}

export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  await requireAuth(request, reply);
  if (reply.sent) return;

  const user = request.agentUser;
  if (!user?.roles.includes('agent_admin')) {
    reply.code(403).send({ error: 'Admin role required' });
  }
}

export function getAgentUser(request: FastifyRequest): AgentJWTPayload | null {
  return request.agentUser ?? null;
}
