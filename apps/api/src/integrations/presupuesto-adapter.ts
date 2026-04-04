/**
 * Adaptador Ministerio de Finanzas / eSIGEF – STUB.
 * En producción, consultar disponibilidad presupuestaria mediante la API de eSIGEF.
 */

export type BudgetAvailability = {
  entityId: string;
  fiscalYear: number;
  totalBudget: number;
  committed: number;
  available: number;
  executionRate: number;
  lastCheckAt: string;
  source: 'esigef_api' | 'stub';
};

const ESIGEF_API_URL = process.env.ESIGEF_API_URL;
const ESIGEF_API_KEY = process.env.ESIGEF_API_KEY;

export function isConfigured(): boolean {
  return Boolean(ESIGEF_API_URL && ESIGEF_API_KEY);
}

export async function getBudgetAvailability(entityId: string, fiscalYear?: number): Promise<BudgetAvailability> {
  const year = fiscalYear ?? new Date().getFullYear();

  if (!isConfigured()) {
    return {
      entityId,
      fiscalYear: year,
      totalBudget: 5000000,
      committed: 3200000,
      available: 1800000,
      executionRate: 64,
      lastCheckAt: new Date().toISOString(),
      source: 'stub',
    };
  }

  const res = await fetch(`${ESIGEF_API_URL}/budget/${entityId}?year=${year}`, {
    headers: { Authorization: `Bearer ${ESIGEF_API_KEY}` },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    return { entityId, fiscalYear: year, totalBudget: 0, committed: 0, available: 0, executionRate: 0, lastCheckAt: new Date().toISOString(), source: 'esigef_api' };
  }

  const data = await res.json() as Omit<BudgetAvailability, 'entityId' | 'lastCheckAt' | 'source'>;
  const executionRate = data.totalBudget > 0
    ? Math.round((data.committed / data.totalBudget) * 100)
    : 0;

  return {
    entityId,
    fiscalYear: year,
    totalBudget: data.totalBudget ?? 0,
    committed: data.committed ?? 0,
    available: data.available ?? 0,
    executionRate,
    lastCheckAt: new Date().toISOString(),
    source: 'esigef_api',
  };
}
