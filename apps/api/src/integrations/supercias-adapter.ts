/**
 * Adaptador Superintendencia de Compañías (Supercias) – STUB.
 * En producción, consultar la API de Supercias para estructura societaria y beneficiarios finales.
 */

export type CompanyStructure = {
  ruc: string;
  legalName?: string;
  incorporationDate?: string;
  capital?: number;
  shareholders?: Array<{ name: string; percentage: number; isUBO: boolean }>;
  lastCheckAt: string;
  source: 'supercias_api' | 'stub';
};

const SUPERCIAS_API_URL = process.env.SUPERCIAS_API_URL;
const SUPERCIAS_API_KEY = process.env.SUPERCIAS_API_KEY;

export function isConfigured(): boolean {
  return Boolean(SUPERCIAS_API_URL && SUPERCIAS_API_KEY);
}

export async function getCompanyStructure(ruc: string): Promise<CompanyStructure> {
  if (!isConfigured()) {
    return {
      ruc,
      legalName: `Empresa RUC ${ruc}`,
      incorporationDate: '2010-01-01',
      capital: 10000,
      shareholders: [
        { name: 'Accionista Principal', percentage: 60, isUBO: true },
        { name: 'Accionista Minoritario', percentage: 40, isUBO: false },
      ],
      lastCheckAt: new Date().toISOString(),
      source: 'stub',
    };
  }

  const res = await fetch(`${SUPERCIAS_API_URL}/companies/${ruc}`, {
    headers: { Authorization: `Bearer ${SUPERCIAS_API_KEY}` },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    return { ruc, lastCheckAt: new Date().toISOString(), source: 'supercias_api' };
  }

  const data = await res.json() as CompanyStructure;
  return { ...data, ruc, lastCheckAt: new Date().toISOString(), source: 'supercias_api' };
}
