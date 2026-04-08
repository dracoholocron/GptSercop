import type { FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from '../db/client.js';
import { signToken } from './auth.js';

// Shared key used by the host app widget to request session tokens.
// Set WIDGET_API_KEY in .env (same value as VITE_AGENT_SOCE_WIDGET_KEY in frontend).
const WIDGET_API_KEY = process.env.WIDGET_API_KEY ?? 'agent-soce-widget-dev-key';

interface LoginBody {
  email: string;
  password: string;
}

interface SessionBody {
  /** Host app user email – used to look up or auto-create an AgentUser */
  email: string;
  displayName: string;
  /** Shared secret that proves the request comes from the trusted host app */
  widgetKey: string;
}

const loginRoutes: FastifyPluginAsync = async (fastify) => {
  // ─── Admin login (email + password) ────────────────────────────────────────
  fastify.post<{ Body: LoginBody }>('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 1 },
        },
      },
    },
  }, async (request, reply) => {
    const { email, password } = request.body;

    const user = await prisma.agentUser.findFirst({
      where: { email, status: 'active' },
      include: { roles: { include: { role: true } } },
    });

    if (!user || !user.passwordHash) {
      return reply.code(401).send({ error: 'Credenciales inválidas' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return reply.code(401).send({ error: 'Credenciales inválidas' });
    }

    const roleNames = user.roles.map((ur) => ur.role.name);
    const token = signToken({
      sub: user.id,
      email: user.email,
      displayName: user.displayName,
      roles: roleNames,
    });

    return { token, user: { id: user.id, email: user.email, displayName: user.displayName, roles: roleNames } };
  });

  // ─── Widget session token (SSO bridge) ─────────────────────────────────────
  // Called by the chat widget after the user is already logged in to the host app.
  // Returns a short-lived Agent SOCE JWT for the chat_user role.
  fastify.post<{ Body: SessionBody }>('/session', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'displayName', 'widgetKey'],
        properties: {
          email: { type: 'string' },
          displayName: { type: 'string' },
          widgetKey: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { email, displayName, widgetKey } = request.body;

    if (widgetKey !== WIDGET_API_KEY) {
      return reply.code(403).send({ error: 'Invalid widget key' });
    }

    // Find or auto-create the AgentUser (entity_user role by default for chat)
    let user = await prisma.agentUser.findFirst({
      where: { email, status: 'active' },
      include: { roles: { include: { role: true } } },
    });

    if (!user) {
      const entityRole = await prisma.agentRole.findUnique({ where: { name: 'entity_user' } });
      user = await prisma.agentUser.create({
        data: {
          externalId: `widget-${email}`,
          email,
          displayName,
          status: 'active',
          ...(entityRole ? { roles: { create: { roleId: entityRole.id } } } : {}),
        },
        include: { roles: { include: { role: true } } },
      });
    }

    const roleNames = user.roles.map((ur) => ur.role.name);
    const token = signToken({
      sub: user.id,
      email: user.email,
      displayName: user.displayName,
      roles: roleNames,
    });

    return { token };
  });
};

export default loginRoutes;
