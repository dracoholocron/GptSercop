/**
 * Adaptador SRI (Servicio de Rentas Internas) – STUB.
 * En producción, conectar con la API del SRI para validación tributaria.
 */

export type SriComplianceResult = {
  ruc: string;
  isCompliantSRI: boolean;
  taxpayerType?: string;
  isActive?: boolean;
  lastCheckAt: string;
  source: 'sri_api' | 'stub';
};

const SRI_API_URL = process.env.SRI_API_URL;
const SRI_API_KEY = process.env.SRI_API_KEY;

export function isConfigured(): boolean {
  return Boolean(SRI_API_URL && SRI_API_KEY);
}

export async function verifyTaxCompliance(ruc: string): Promise<SriComplianceResult> {
  if (!isConfigured()) {
    return {
      ruc,
      isCompliantSRI: true,
      taxpayerType: 'sociedad',
      isActive: true,
      lastCheckAt: new Date().toISOString(),
      source: 'stub',
    };
  }

  const res = await fetch(`${SRI_API_URL}/contribuyente/${ruc}`, {
    headers: { Authorization: `Bearer ${SRI_API_KEY}` },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    return { ruc, isCompliantSRI: false, lastCheckAt: new Date().toISOString(), source: 'sri_api' };
  }

  const data = await res.json() as { estado?: string; tipo?: string; activo?: boolean };
  return {
    ruc,
    isCompliantSRI: data.estado === 'ACTIVO',
    taxpayerType: data.tipo,
    isActive: data.activo,
    lastCheckAt: new Date().toISOString(),
    source: 'sri_api',
  };
}
