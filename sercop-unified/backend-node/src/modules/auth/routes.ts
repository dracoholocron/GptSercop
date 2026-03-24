import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../../db.js';
import { sign, hasJwtSecret } from '../../auth.js';

type LoginBody = {
  email?: string;
  role?: string;
  identifier?: string;
  username?: string;
  password?: string;
  entityId?: string;
};

type ResetRequestBody = { identifier?: string; email?: string; birthDate?: string };
type ResetConfirmBody = { token: string; newPassword: string };

export const authRoutes: FastifyPluginAsync = async (app) => {
  // Login (Fase 2): emite JWT para pruebas; en producción usar IdP OIDC.
  app.post<{ Body: LoginBody }>('/api/v1/auth/login', async (req, reply) => {
    const body = req.body as LoginBody;
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    if (!email) return reply.status(400).send({ error: 'email es obligatorio' });
    if (!hasJwtSecret()) return reply.status(503).send({ error: 'Auth no configurado (JWT_SECRET)' });
    const allowedRoles = ['supplier', 'entity', 'admin'] as const;
    const role = typeof body?.role === 'string' && allowedRoles.includes(body.role as (typeof allowedRoles)[number])
      ? (body.role as (typeof allowedRoles)[number])
      : 'supplier';
    let providerId: string | undefined;
    let entityId: string | undefined;
    if (role === 'supplier' && typeof body?.identifier === 'string' && body.identifier.trim()) {
      const p = await prisma.provider.findFirst({ where: { identifier: body.identifier.trim() }, select: { id: true } });
      if (p) providerId = p.id;
    }
    if (role === 'entity') {
      const u = await prisma.user.findUnique({ where: { email }, select: { organizationId: true } });
      if (u?.organizationId) entityId = u.organizationId;
      else if (typeof body?.entityId === 'string' && body.entityId.trim()) entityId = body.entityId.trim();
    }
    const token = sign({ sub: email, role });
    return reply.send({ token, expiresIn: 86400, providerId: providerId ?? null, entityId: entityId ?? null });
  });

  // Recuperación de contraseña
  app.post<{ Body: ResetRequestBody }>('/api/v1/auth/reset-request', async (req, reply) => {
    const body = req.body as ResetRequestBody;
    const identifier = typeof body?.identifier === 'string' ? body.identifier.trim() : '';
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    if (!identifier && !email)
      return reply.status(400).send({ error: 'Debe proporcionar al menos RUC/identificador o correo electrónico' });
    return reply.status(200).send({ ok: true, message: 'Si los datos corresponden a una cuenta, se enviará un enlace de recuperación.' });
  });

  app.post<{ Body: ResetConfirmBody }>('/api/v1/auth/reset-confirm', async (req, reply) => {
    const body = req.body as ResetConfirmBody;
    const token = typeof body?.token === 'string' ? body.token.trim() : '';
    const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : '';
    if (!token || !newPassword)
      return reply.status(400).send({ error: 'token y newPassword son obligatorios' });
    if (newPassword.length < 8)
      return reply.status(400).send({ error: 'La nueva contraseña debe tener al menos 8 caracteres' });
    return reply.status(200).send({ ok: true });
  });
};
