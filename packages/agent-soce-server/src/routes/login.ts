import type { FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from '../db/client.js';
import { signToken } from './auth.js';

interface LoginBody {
  email: string;
  password: string;
}

const loginRoutes: FastifyPluginAsync = async (fastify) => {
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
};

export default loginRoutes;
