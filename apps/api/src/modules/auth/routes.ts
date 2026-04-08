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
    // Auto-detect role from DB; client hint is only used as a fallback.
    // Priority: explicit admin emails → entity users (in User table) → supplier
    const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? 'sercop@sercop.gob.ec,superadmin@sercop.gob.ec').split(',');
    let role: 'admin' | 'entity' | 'supplier' = 'supplier';
    let providerId: string | undefined;
    let entityId: string | undefined;

    if (ADMIN_EMAILS.includes(email)) {
      role = 'admin';
    } else {
      // Check if email belongs to a registered entity user
      const entityUser = await prisma.user.findUnique({
        where: { email },
        select: { organizationId: true },
      });
      if (entityUser) {
        role = 'entity';
        if (entityUser.organizationId) entityId = entityUser.organizationId;
      } else {
        // Check if a supplier identifier was provided
        const identifier = typeof body?.identifier === 'string' ? body.identifier.trim() : '';
        if (identifier) {
          const p = await prisma.provider.findFirst({ where: { identifier }, select: { id: true } });
          if (p) providerId = p.id;
        }
        // Allow client to escalate to admin only when explicitly requested
        // (useful for dev; remove in production)
        const clientRole = typeof body?.role === 'string' ? body.role : '';
        if (clientRole === 'admin') role = 'admin';
        else if (clientRole === 'entity') role = 'entity';
      }
    }

    const token = sign({ sub: email, role });

    // Map internal role to ROLE_* array expected by the frontend permission system
    const roleMap: Record<string, string[]> = {
      admin:    ['ROLE_ADMIN'],
      entity:   ['ROLE_CP_SUPERVISOR', 'ROLE_CP_ANALISTA', 'ROLE_USER'],
      supplier: ['ROLE_USER'],
    };
    const roles = roleMap[role] ?? ['ROLE_USER'];

    return reply.send({
      token,
      expiresIn: 86400,
      roles,
      role,
      email,
      providerId: providerId ?? null,
      entityId: entityId ?? null,
    });
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
