import { prisma } from '../../db.js';
import { audit } from '../../audit.js';

const RISK_ALERT_THRESHOLD = 60;

const ALERT_MESSAGES: Record<string, string> = {
  SINGLE_BIDDER: 'Proceso con un solo oferente: posible restricción de competencia.',
  DOMINANT_SUPPLIER: 'Proveedor con más del 40% de contratos en esta entidad.',
  OVERPRICE: 'Contrato adjudicado al 97% o más del presupuesto referencial.',
  FRAGMENTATION: 'Contratos fragmentados detectados: múltiples contratos similares en 30 días.',
  FAST_PROCESS: 'Proceso adjudicado en menos de 15 días hábiles.',
  FREQUENT_AMENDMENTS: 'Contrato con 3 o más modificaciones registradas.',
  NEW_COMPANY_LARGE_CONTRACT: 'Empresa con menos de 1 año de existencia adjudicada con contrato mayor a $100.000.',
  HIGH_EMERGENCY_RATE: 'Entidad con más del 30% de procesos bajo régimen de emergencia.',
};

function severityForFlag(flag: string): 'INFO' | 'WARNING' | 'CRITICAL' {
  const critical = ['SINGLE_BIDDER', 'DOMINANT_SUPPLIER', 'OVERPRICE', 'FRAGMENTATION', 'NEW_COMPANY_LARGE_CONTRACT'];
  const warning = ['FAST_PROCESS', 'FREQUENT_AMENDMENTS', 'HIGH_EMERGENCY_RATE', 'FREQUENT_CLARIFICATIONS', 'REGIONAL_CONCENTRATION'];
  if (critical.includes(flag)) return 'CRITICAL';
  if (warning.includes(flag)) return 'WARNING';
  return 'INFO';
}

export async function generateAlerts(tenderId: string, flags: string[], totalScore: number): Promise<void> {
  if (totalScore <= RISK_ALERT_THRESHOLD && flags.length === 0) return;

  for (const flag of flags) {
    const severity = severityForFlag(flag);
    const message = ALERT_MESSAGES[flag] ?? `Indicador de riesgo detectado: ${flag}`;

    const existing = await prisma.alertEvent.findFirst({
      where: { alertType: flag, entityId: tenderId, resolvedAt: null },
    });

    if (!existing) {
      await prisma.alertEvent.create({
        data: {
          alertType: flag,
          severity,
          entityType: 'Tender',
          entityId: tenderId,
          message,
          metadata: { totalScore, tenderId },
        },
      });

      await audit({
        action: 'analytics.alert.created',
        entityType: 'AlertEvent',
        entityId: tenderId,
        payload: { alertType: flag, severity, totalScore },
      });
    }
  }
}

export async function resolveAlert(
  alertId: string,
  resolvedBy: string,
  opts?: { notes?: string; actionTaken?: string },
): Promise<void> {
  const existing = await prisma.alertEvent.findUnique({ where: { id: alertId } });
  const prevMeta = (existing?.metadata as Record<string, unknown>) ?? {};

  await prisma.alertEvent.update({
    where: { id: alertId },
    data: {
      resolvedAt: new Date(),
      metadata: {
        ...prevMeta,
        ...(opts?.notes ? { notes: opts.notes } : {}),
        ...(opts?.actionTaken ? { actionTaken: opts.actionTaken } : {}),
        resolvedBy,
      },
    },
  });

  await audit({
    action: 'analytics.alert.resolved',
    entityType: 'AlertEvent',
    entityId: alertId,
    actorId: resolvedBy,
    payload: { alertId, actionTaken: opts?.actionTaken },
  });
}
