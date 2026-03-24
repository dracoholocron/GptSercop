import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../../db.js';
import { audit } from '../../audit.js';
import { Prisma } from '@prisma/client';

type RupRegistrationStepBody = {
  step: number;
  data: Record<string, unknown>;
};

type ProviderBody = { name: string; identifier?: string; legalName?: string; tradeName?: string; province?: string; canton?: string; address?: string };

type ProviderUpdateBody = {
  name?: string; identifier?: string; legalName?: string; tradeName?: string; province?: string; canton?: string; address?: string; status?: string;
  registrationStep?: number; registrationData?: Record<string, unknown>; activityCodes?: string[];
  legalEstablishmentDate?: string | null;
  patrimonyAmount?: number | null;
  isCompliantSRI?: boolean | null;
  isCompliantIESS?: boolean | null;
};

export const providersRoutes: FastifyPluginAsync = async (app) => {
  // RUP – Registro proveedor (wizard FO/RPE 1–8): API de borrador por pasos.
  
  // Obtiene el borrador de registro RUP para el proveedor autenticado
  app.get('/api/v1/rup/registration', async (req, reply) => {
    const user = req.user;
    if (!user || user.role !== 'supplier') return reply.status(401).send({ error: 'Solo proveedores autenticados pueden acceder a su registro RUP' });
    const email = user.sub;
    const provider = await prisma.provider.findFirst({
      where: { identifier: email },
      select: { id: true, registrationStep: true, registrationData: true },
    });
    if (!provider) return reply.status(200).send({ data: { registrationStep: 0, registrationData: null } });
    return reply.status(200).send({ data: provider });
  });

  // Actualiza el borrador de registro RUP para un paso específico.
  app.patch<{ Body: RupRegistrationStepBody }>('/api/v1/rup/registration', async (req, reply) => {
    const user = req.user;
    if (!user || user.role !== 'supplier') return reply.status(401).send({ error: 'Solo proveedores autenticados pueden actualizar su registro RUP' });
    const body = req.body as RupRegistrationStepBody;
    const step = typeof body?.step === 'number' ? body.step : NaN;
    if (!Number.isInteger(step) || step < 1 || step > 8)
      return reply.status(400).send({ error: 'step debe estar entre 1 y 8' });
    const data = body?.data && typeof body.data === 'object' ? body.data : {};
    const email = user.sub;
    let provider = await prisma.provider.findFirst({ where: { identifier: email } });
    if (!provider) {
      provider = await prisma.provider.create({
        data: {
          name: email,
          identifier: email,
          status: 'active',
          registrationStep: step,
          registrationData: data as Prisma.InputJsonValue,
        },
      });
      return reply.status(200).send({ data: provider });
    }
    const nextStep = Math.max(provider.registrationStep ?? 0, step);
    const updated = await prisma.provider.update({
      where: { id: provider.id },
      data: {
        registrationStep: nextStep,
        registrationData: data as Prisma.InputJsonValue,
      },
      select: { id: true, registrationStep: true, registrationData: true },
    });
    return reply.status(200).send({ data: updated });
  });

  // API v1 – Providers (RUP)
  app.get<{ Querystring: { identifier?: string } }>('/api/v1/providers', async (req, reply) => {
    try {
      const where: { status: string; identifier?: string } = { status: 'active' };
      if (typeof req.query?.identifier === 'string' && req.query.identifier.trim())
        where.identifier = req.query.identifier.trim();
      const providers = await prisma.provider.findMany({
        where,
        orderBy: { name: 'asc' },
        select: { id: true, name: true, identifier: true, status: true, legalName: true, tradeName: true, province: true, canton: true, address: true, isCompliantSRI: true, isCompliantIESS: true },
      });
      return { data: providers };
    } catch (e) {
      req.log.error(e);
      return reply.status(500).send({ error: 'Error al listar proveedores' });
    }
  });

  app.get<{ Params: { id: string } }>('/api/v1/providers/:id', async (req, reply) => {
    const { id } = req.params;
    try {
      const provider = await prisma.provider.findUnique({ where: { id } });
      if (!provider) return reply.status(404).send({ error: 'Proveedor no encontrado' });
      return provider;
    } catch (e) {
      req.log.error(e);
      return reply.status(500).send({ error: 'Error al obtener proveedor' });
    }
  });

  app.get<{ Params: { id: string } }>('/api/v1/providers/:id/bids', async (req, reply) => {
    const { id } = req.params;
    try {
      const bids = await prisma.bid.findMany({
        where: { providerId: id },
        include: { tender: { select: { id: true, title: true, status: true } } },
        orderBy: { createdAt: 'desc' },
      });
      return { data: bids };
    } catch (e) {
      req.log.error(e);
      return reply.status(500).send({ error: 'Error al listar ofertas del proveedor' });
    }
  });

  app.post<{ Body: ProviderBody }>('/api/v1/providers', async (req, reply) => {
    const body = req.body as ProviderBody;
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    if (!name) return reply.status(400).send({ error: 'name es obligatorio' });
    try {
      const provider = await prisma.provider.create({
        data: {
          name,
          identifier: body?.identifier?.trim() || null,
          legalName: body?.legalName?.trim() || null,
          tradeName: body?.tradeName?.trim() || null,
          province: body?.province?.trim() || null,
          canton: body?.canton?.trim() || null,
          address: body?.address?.trim() || null,
        },
      });
      await audit({ action: 'provider.create', entityType: 'Provider', entityId: provider.id, payload: { name: provider.name } });
      return reply.status(201).send(provider);
    } catch (e: unknown) {
      req.log.error(e);
      const prismaEx = e as { code?: string; message?: string };
      if (prismaEx?.code === 'P2002') {
        return reply.status(409).send({ error: 'Ya existe un proveedor con ese correo o identificador. Use otro correo o inicie sesión.' });
      }
      if (prismaEx?.code === 'P1001' || prismaEx?.code === 'P1002' || (prismaEx?.message && /connect|reach|database/i.test(String(prismaEx.message)))) {
        return reply.status(503).send({ error: 'Servicio no disponible. Verifique que la base de datos esté activa e intente más tarde.' });
      }
      return reply.status(500).send({ error: 'Error al crear proveedor. Intente de nuevo más tarde.' });
    }
  });

  app.put<{ Params: { id: string }; Body: ProviderUpdateBody }>('/api/v1/providers/:id', async (req, reply) => {
    const { id } = req.params;
    const body = (req.body as ProviderUpdateBody) || {};
    const data: Prisma.ProviderUpdateInput = {};
    if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim();
    if (typeof body.identifier === 'string') data.identifier = body.identifier.trim() || null;
    if (typeof body.legalName === 'string') data.legalName = body.legalName.trim() || null;
    if (typeof body.tradeName === 'string') data.tradeName = body.tradeName.trim() || null;
    if (typeof body.province === 'string') data.province = body.province.trim() || null;
    if (typeof body.canton === 'string') data.canton = body.canton.trim() || null;
    if (typeof body.address === 'string') data.address = body.address.trim() || null;
    if (['active', 'inactive', 'suspended'].includes(String(body.status))) data.status = body.status;
    if (typeof body.registrationStep === 'number' && body.registrationStep >= 0 && body.registrationStep <= 14)
      data.registrationStep = body.registrationStep;
    if (body.registrationData && typeof body.registrationData === 'object')
      data.registrationData = body.registrationData as Prisma.InputJsonValue;
    if (Array.isArray(body.activityCodes)) data.activityCodes = body.activityCodes.filter((c): c is string => typeof c === 'string');
    if (body.legalEstablishmentDate !== undefined) {
      if (body.legalEstablishmentDate === null) data.legalEstablishmentDate = null;
      else if (typeof body.legalEstablishmentDate === 'string' && body.legalEstablishmentDate.trim()) {
        const d = new Date(body.legalEstablishmentDate.trim());
        if (Number.isFinite(d.getTime())) data.legalEstablishmentDate = d;
      }
    }
    if (body.patrimonyAmount !== undefined)
      data.patrimonyAmount = typeof body.patrimonyAmount === 'number' && Number.isFinite(body.patrimonyAmount) ? body.patrimonyAmount : body.patrimonyAmount === null ? null : undefined;
    if (body.isCompliantSRI !== undefined) data.isCompliantSRI = typeof body.isCompliantSRI === 'boolean' ? body.isCompliantSRI : body.isCompliantSRI === null ? null : undefined;
    if (body.isCompliantIESS !== undefined) data.isCompliantIESS = typeof body.isCompliantIESS === 'boolean' ? body.isCompliantIESS : body.isCompliantIESS === null ? null : undefined;
    if (Object.keys(data).length === 0) return reply.status(400).send({ error: 'Ningún campo válido para actualizar' });

    try {
      if (data.registrationStep === 9 || data.status === 'active') {
        const existing = await prisma.provider.findUnique({ where: { id } });
        if (!existing) return reply.status(404).send({ error: 'Proveedor no encontrado' });
        
        const checkIdentifier = data.identifier !== undefined ? data.identifier : existing.identifier;
        if (!checkIdentifier) return reply.status(400).send({ error: 'El RUC / Identificador es obligatorio para finalizar el registro.' });

        const checkProvince = data.province !== undefined ? data.province : existing.province;
        if (!checkProvince) return reply.status(400).send({ error: 'La provincia es obligatoria para finalizar el registro.' });

        const checkActivities = data.activityCodes !== undefined ? data.activityCodes : existing.activityCodes;
        if (!checkActivities || !Array.isArray(checkActivities) || checkActivities.length === 0) {
          return reply.status(400).send({ error: 'Debe tener al menos un código CPC seleccionado para finalizar.' });
        }
      }

      const provider = await prisma.provider.update({ where: { id }, data });
      await audit({ action: 'provider.update', entityType: 'Provider', entityId: id, payload: data });
      return provider;
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === 'P2025')
        return reply.status(404).send({ error: 'Proveedor no encontrado' });
      req.log.error(e);
      return reply.status(500).send({ error: 'Error al actualizar proveedor' });
    }
  });
};
