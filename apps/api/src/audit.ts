import { prisma } from './db.js';

export type AuditPayload = Record<string, unknown>;

export async function audit(params: {
  action: string;
  entityType: string;
  entityId?: string;
  actorId?: string;
  payload?: AuditPayload;
  contractingEntityId?: string;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        actorId: params.actorId ?? null,
        payload: (params.payload ?? undefined) as object | undefined,
        contractingEntityId: params.contractingEntityId ?? null,
      },
    });
  } catch (e) {
    console.error('audit log failed', e);
  }
}
