/**
 * Helpers de autenticación para batería E2E – login vía API e inyección en storage (credenciales del seed).
 */
import { Page, APIRequestContext } from '@playwright/test';

const API_BASE = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3080';
const SUPPLIER_EMAIL = 'supplier@test.com';
const SUPPLIER_RUC = '1791234567001'; // TecEcuador (seed)
const ENTITY_EMAIL = 'admin@mec.gob.ec'; // seed: usuario entity MEC
const ADMIN_EMAIL = 'admin@mec.gob.ec'; // cualquier email con rol admin en API

/** Inicia sesión en el portal admin (API + localStorage). Requiere request del fixture. */
export async function adminLogin(page: Page, baseUrl: string, request: APIRequestContext): Promise<void> {
  const res = await request.post(`${API_BASE}/api/v1/auth/login`, {
    data: { email: ADMIN_EMAIL, role: 'admin' },
  });
  if (res.status() !== 200) {
    const text = await res.text();
    throw new Error(`Admin login API failed: ${res.status()} ${text}`);
  }
  const body = (await res.json()) as { token: string };
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.evaluate(
    ({ token }: { token: string }) => {
      localStorage.setItem('sercop_admin_token', token);
    },
    { token: body.token }
  );
}

/** Inicia sesión en el portal proveedor (API + localStorage). Requiere request del fixture. */
export async function supplierLogin(page: Page, baseUrl: string, request: APIRequestContext): Promise<void> {
  const res = await request.post(`${API_BASE}/api/v1/auth/login`, {
    data: { email: SUPPLIER_EMAIL, role: 'supplier', identifier: SUPPLIER_RUC },
  });
  if (res.status() !== 200) {
    const text = await res.text();
    throw new Error(`Supplier login API failed: ${res.status()} ${text}`);
  }
  const body = (await res.json()) as { token: string; providerId?: string | null };
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.evaluate(
    ({ token, providerId }: { token: string; providerId: string | null }) => {
      localStorage.setItem('sercop_supplier_token', token);
      if (providerId) localStorage.setItem('sercop_supplier_provider_id', providerId);
    },
    { token: body.token, providerId: body.providerId ?? null }
  );
}

/** Inicia sesión en el portal entidad (API + localStorage). Usa MEC para coincidir con proceso primario del seed (contrato + aclaraciones). */
export async function entityLogin(page: Page, baseUrl: string, request: APIRequestContext): Promise<void> {
  const entitiesRes = await request.get(`${API_BASE}/api/v1/entities`);
  const entities = entitiesRes.ok ? ((await entitiesRes.json()) as { data?: Array<{ id: string; code?: string | null }> })?.data : [];
  const mec = entities?.find((e) => (e.code ?? '').toUpperCase() === 'MEC');
  const entityId = mec?.id ?? entities?.[0]?.id ?? '';
  const res = await request.post(`${API_BASE}/api/v1/auth/login`, {
    data: { email: ENTITY_EMAIL, role: 'entity', entityId: entityId || undefined },
  });
  if (res.status() !== 200) {
    const text = await res.text();
    throw new Error(`Entity login API failed: ${res.status()} ${text}`);
  }
  const body = (await res.json()) as { token: string; entityId?: string | null };
  const finalEntityId = body.entityId ?? entityId;
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.evaluate(
    ({ token, entityId }: { token: string; entityId: string }) => {
      localStorage.setItem('sercop_entity_token', token);
      if (entityId) localStorage.setItem('sercop_entity_id', entityId);
    },
    { token: body.token, entityId: finalEntityId || '' }
  );
}
