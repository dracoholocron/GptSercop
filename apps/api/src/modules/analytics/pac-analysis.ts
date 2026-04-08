import { prisma } from '../../db.js';
import { Q_PAC_VS_EXECUTED } from './queries.js';

export type PacVsExecuted = {
  entityId: string;
  entityName: string;
  planned: bigint;
  executed: bigint;
  plannedAmount: number;
  executedAmount: number;
  executionRate: number;
  deviation: number;
};

export async function getPacVsExecuted(year?: number, entityId?: string): Promise<PacVsExecuted[]> {
  const rows = await prisma.$queryRawUnsafe<Omit<PacVsExecuted, 'deviation'>[]>(
    Q_PAC_VS_EXECUTED,
    year ?? null,
  );
  const mapped = rows.map((r) => ({
    ...r,
    deviation: parseFloat(String(r.plannedAmount)) - parseFloat(String(r.executedAmount)),
  }));
  if (entityId) return mapped.filter((r) => r.entityId === entityId);
  return mapped;
}

export async function getPacDeviationSummary(year?: number) {
  const data = await getPacVsExecuted(year);
  const total = data.length;
  const avgExecutionRate = total
    ? data.reduce((sum, d) => sum + (parseFloat(String(d.executionRate)) || 0), 0) / total
    : 0;
  const highDeviation = data.filter((d) => (parseFloat(String(d.executionRate)) || 0) < 50);
  return {
    total,
    avgExecutionRate: Math.round(avgExecutionRate * 100) / 100,
    highDeviationCount: highDeviation.length,
    entities: data,
  };
}
