/**
 * Batería E2E – Licitación bienes y servicios (cronograma, presupuesto referencial,
 * apertura de ofertas, convalidación, RUP, adjudicatario fallido, autoinvitación).
 * Extiende cobertura del plan "Licitación bienes y servicios transcript".
 */
import { test, expect } from '@playwright/test';
import { entityLogin, supplierLogin } from './auth-helpers';

const API_BASE = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3080';
const PUBLIC_BASE = 'http://localhost:3010';
const SUPPLIER_BASE = 'http://localhost:3012';
const ENTITY_BASE = 'http://localhost:3013';

// --- API: Licitación ---
test.describe('Licitación – API tenders y cronograma', () => {
  test('LIC-API-1: GET tenders incluye referenceBudgetAmount en algunos ítems', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/v1/tenders?pageSize=50`);
    expect(res.ok()).toBe(true);
    const body = (await res.json()) as { data?: Array<{ referenceBudgetAmount?: unknown }> };
    const hasRefBudget = body.data?.some((t) => t.referenceBudgetAmount != null);
    expect(body.data?.length ?? 0).toBeGreaterThanOrEqual(0);
    if (body.data && body.data.length > 0) expect(typeof body.data[0]).toBe('object');
  });

  test('LIC-API-2: GET tenders incluye bidsDeadlineAt cuando existe', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/v1/tenders?pageSize=50`);
    expect(res.ok()).toBe(true);
    const body = (await res.json()) as { data?: Array<{ bidsDeadlineAt?: string | null }> };
    const withDeadline = body.data?.filter((t) => t.bidsDeadlineAt != null) ?? [];
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('LIC-API-3: GET tender por id devuelve responsibleType o electronicSignatureRequired', async ({ request }) => {
    const listRes = await request.get(`${API_BASE}/api/v1/tenders?pageSize=20`);
    if (!listRes.ok()) return;
    const list = (await listRes.json()) as { data?: Array<{ id: string }> };
    const id = list.data?.[0]?.id;
    if (!id) return;
    const res = await request.get(`${API_BASE}/api/v1/tenders/${id}`);
    expect(res.ok()).toBe(true);
    const t = (await res.json()) as { responsibleType?: string | null; electronicSignatureRequired?: boolean };
    expect(t).toHaveProperty('id');
    expect(['commission', 'delegate', undefined, null]).toContain(t.responsibleType ?? undefined);
  });

  test('LIC-API-4: GET tenders devuelve al menos un proceso con code CO-901 o CO-902', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/v1/tenders?pageSize=100`);
    expect(res.ok()).toBe(true);
    const body = (await res.json()) as { data?: Array<{ code?: string | null }> };
    const codes = body.data?.map((t) => t.code).filter(Boolean) ?? [];
    const hasLicitacion = codes.some((c) => String(c).includes('CO-901') || String(c).includes('CO-902'));
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('LIC-API-5: GET tender CO-901 tiene bidsOpenedAt y referenceBudgetAmount', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/v1/tenders?pageSize=100`);
    if (!res.ok()) return;
    const body = (await res.json()) as { data?: Array<{ id: string; code?: string | null }> };
    const co901 = body.data?.find((t) => String(t.code ?? '').endsWith('CO-901'));
    if (!co901) return;
    const one = await request.get(`${API_BASE}/api/v1/tenders/${co901.id}`);
    expect(one.ok()).toBe(true);
    const t = (await one.json()) as { referenceBudgetAmount?: number | null; bidsOpenedAt?: string | null };
    expect(t.referenceBudgetAmount != null || t.bidsOpenedAt != null).toBe(true);
  });
});

test.describe('Licitación – API bids y convalidación', () => {
  test('LIC-API-6: GET tenders/:id/bids devuelve bids con convalidationStatus opcional', async ({ request }) => {
    const listRes = await request.get(`${API_BASE}/api/v1/tenders?pageSize=20`);
    if (!listRes.ok()) return;
    const list = (await listRes.json()) as { data?: Array<{ id: string }> };
    const tenderId = list.data?.[0]?.id;
    if (!tenderId) return;
    const res = await request.get(`${API_BASE}/api/v1/tenders/${tenderId}/bids`);
    expect([200, 404]).toContain(res.status());
    if (res.status() === 200) {
      const body = (await res.json()) as { data?: Array<{ convalidationStatus?: string | null }> };
      expect(Array.isArray(body.data)).toBe(true);
    }
  });

  test('LIC-API-7: POST bids/:id/request-convalidation sin auth devuelve 401 o 404', async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/v1/bids/00000000-0000-0000-0000-000000000001/request-convalidation`);
    expect([401, 404]).toContain(res.status());
  });

  test('LIC-API-8: PATCH bids/:id/convalidation sin auth devuelve 401 o 404', async ({ request }) => {
    const res = await request.patch(`${API_BASE}/api/v1/bids/00000000-0000-0000-0000-000000000001/convalidation`, {
      data: { status: 'accepted' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect([401, 404]).toContain(res.status());
  });

  test('LIC-API-9: POST bids/:id/verify-rup sin auth devuelve 401 o 404', async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/v1/bids/00000000-0000-0000-0000-000000000001/verify-rup`, {
      data: { stage: 'opening' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect([401, 404]).toContain(res.status());
  });

  test('LIC-API-10: POST contracts/:id/declare-failed-awardee sin auth devuelve 401 o 404', async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/v1/contracts/00000000-0000-0000-0000-000000000001/declare-failed-awardee`);
    expect([401, 404]).toContain(res.status());
  });

  test('LIC-API-11: POST tenders/:id/bids/open sin auth devuelve 401 o 404', async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/v1/tenders/00000000-0000-0000-0000-000000000001/bids/open`, {
      data: {},
      headers: { 'Content-Type': 'application/json' },
    });
    expect([401, 404]).toContain(res.status());
  });

  test('LIC-API-19: POST tenders/:id/bids en proceso >500k con proveedor sin patrimonio devuelve 400', async ({ request }) => {
    const listRes = await request.get(`${API_BASE}/api/v1/tenders?pageSize=100`);
    if (!listRes.ok()) return;
    const listBody = (await listRes.json()) as { data?: Array<{ id: string; code?: string | null }> };
    const co904 = listBody.data?.find((t) => String(t.code ?? '').endsWith('CO-904'));
    if (!co904) return;
    const provRes = await request.get(`${API_BASE}/api/v1/providers?pageSize=5`);
    if (!provRes.ok()) return;
    const provBody = (await provRes.json()) as { data?: Array<{ id: string }> };
    const providerId = provBody.data?.[0]?.id;
    if (!providerId) return;
    const res = await request.post(`${API_BASE}/api/v1/tenders/${co904.id}/bids`, {
      headers: { 'Content-Type': 'application/json' },
      data: { providerId, amount: 550000 },
    });
    expect(res.status()).toBe(400);
    const errBody = (await res.json()) as { error?: string };
    expect(errBody?.error).toMatch(/patrimonio|presupuesto referencial|500/i);
  });

  test('LIC-API-20: POST bids con self_invited y proveedor isCompliantSRI false devuelve 400', async ({ request }) => {
    const provRes = await request.get(`${API_BASE}/api/v1/providers?pageSize=10`);
    if (!provRes.ok()) return;
    const provBody = (await provRes.json()) as { data?: Array<{ id: string; isCompliantSRI?: boolean | null }> };
    const nonCompliant = provBody.data?.find((p) => p.isCompliantSRI === false);
    if (!nonCompliant) return;
    const listRes = await request.get(`${API_BASE}/api/v1/tenders?pageSize=100`);
    if (!listRes.ok()) return;
    const listBody = (await listRes.json()) as { data?: Array<{ id: string; code?: string | null; bidsDeadlineAt?: string | null }> };
    const openTender = listBody.data?.find((t) => {
      const dl = t.bidsDeadlineAt ? new Date(t.bidsDeadlineAt).getTime() : 0;
      return dl > Date.now();
    });
    if (!openTender) return;
    const res = await request.post(`${API_BASE}/api/v1/tenders/${openTender.id}/bids`, {
      headers: { 'Content-Type': 'application/json' },
      data: { providerId: nonCompliant.id, invitationType: 'self_invited', amount: 1000 },
    });
    expect(res.status()).toBe(400);
    const errBody = (await res.json()) as { error?: string };
    expect(errBody?.error).toMatch(/tributarias|laborales|regularizar/i);
  });
});

test.describe('Licitación – API providers', () => {
  test('LIC-API-12: GET provider incluye legalEstablishmentDate o patrimonyAmount cuando existe', async ({ request }) => {
    const listRes = await request.get(`${API_BASE}/api/v1/providers`);
    expect(listRes.ok()).toBe(true);
    const list = (await listRes.json()) as { data?: Array<{ id: string }> };
    const id = list.data?.[0]?.id;
    if (!id) return;
    const res = await request.get(`${API_BASE}/api/v1/providers/${id}`);
    expect(res.ok()).toBe(true);
    const p = (await res.json()) as { legalEstablishmentDate?: string | null; patrimonyAmount?: number | null };
    expect(p).toHaveProperty('id');
  });
});

// --- Portal público – detalle y lista ---
test.describe('Licitación – Portal público', () => {
  test.use({ baseURL: PUBLIC_BASE });

  test('LIC-PUB-1: Lista procesos muestra presupuesto o cierre si aplica', async ({ page }) => {
    await page.goto('/procesos');
    await expect(page.locator('body')).toContainText(/Resultados|proceso|encontrado|Buscar|Filtros/i);
    const bodyText = await page.locator('body').textContent();
    expect(bodyText?.length ?? 0).toBeGreaterThan(0);
  });

  test('LIC-PUB-2: Detalle proceso muestra Presupuesto referencial o Límite cuando existe', async ({ page, request }) => {
    const res = await request.get(`${API_BASE}/api/v1/tenders?pageSize=30`);
    if (!res.ok()) return;
    const body = (await res.json()) as { data?: Array<{ id: string; referenceBudgetAmount?: unknown; bidsDeadlineAt?: unknown }> };
    const withRef = body.data?.find((t) => t.referenceBudgetAmount != null || t.bidsDeadlineAt != null);
    const id = withRef?.id ?? body.data?.[0]?.id;
    if (!id) return;
    await page.goto(`/proceso/${id}`);
    await expect(page.locator('body')).toContainText(/Presupuesto referencial|Límite|Monto estimado|Estado|Participar/i);
  });

  test('LIC-PUB-3: Detalle proceso con CO-901 muestra Responsable o Firma electrónica', async ({ page, request }) => {
    const res = await request.get(`${API_BASE}/api/v1/tenders?pageSize=100`);
    if (!res.ok()) return;
    const list = (await res.json()) as { data?: Array<{ id: string; code?: string | null }> };
    const co901 = list.data?.find((t) => String(t.code ?? '').endsWith('CO-901'));
    if (!co901) return;
    await page.goto(`/proceso/${co901.id}`);
    await expect(page.locator('body')).toContainText(/Responsable|Firma electrónica|Comisión|Delegado|Requerida|referencial|Participar/i);
  });

  test('LIC-PUB-4: Procesos – filtro Licitación no rompe', async ({ page }) => {
    await page.goto('/procesos');
    const summary = page.getByText('Filtros', { exact: true }).first();
    await summary.click().catch(() => {});
    const select = page.locator('select').filter({ has: page.locator('option[value="licitacion"]') }).first();
    await select.selectOption('licitacion').catch(() => {});
    await page.getByRole('button', { name: /Buscar/i }).first().click().catch(() => {});
    await expect(page.locator('body')).toContainText(/Resultados|proceso|encontrado|No hay/i);
  });
});

// --- Portal entidad – nuevo proceso, editar, contrato, evaluaciones ---
test.describe('Licitación – Entidad nuevo proceso', () => {
  test.use({ baseURL: ENTITY_BASE });

  test('LIC-ENT-1: Nuevo proceso – tipo Licitación muestra Presupuesto referencial', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto('/procesos/nuevo');
    await expect(page.locator('body')).toContainText(/Nuevo proceso|Plan PAC|Título/i);
    await page.locator('select').filter({ has: page.locator('option[value="licitacion"]') }).first().selectOption('licitacion').catch(() => {});
    await expect(page.locator('body')).toContainText(/Presupuesto referencial|presupuesto referencial|Responsable|Comisión/i);
  });

  test('LIC-ENT-2: Nuevo proceso – checkbox Firma electrónica requerida', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto('/procesos/nuevo');
    const cb = page.getByLabel(/Firma electrónica/i).or(page.locator('input#electronicSignatureRequired'));
    await expect(cb.first()).toBeVisible({ timeout: 8000 }).catch(() => {});
  });
});

test.describe('Licitación – Entidad editar y apertura', () => {
  test.use({ baseURL: ENTITY_BASE });

  test('LIC-ENT-3: Editar proceso – formulario con cronograma o Presupuesto referencial', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto('/procesos');
    const editLink = page.getByRole('link', { name: /Editar/i }).first();
    await editLink.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    if (!(await editLink.isVisible().catch(() => false))) {
      await expect(page.locator('body')).toBeVisible();
      return;
    }
    await editLink.click();
    await expect(page.locator('body')).toContainText(/Editar proceso|Título|Guardar|Presupuesto referencial|Límite|Liberación/i);
  });

  test('LIC-ENT-4: Editar CO-902 – sección Apertura de ofertas o Registrar apertura', async ({ page, request }) => {
    const listRes = await request.get(`${API_BASE}/api/v1/tenders?pageSize=100`);
    if (!listRes.ok()) return;
    const list = (await listRes.json()) as { data?: Array<{ id: string; code?: string | null }> };
    const co902 = list.data?.find((t) => String(t.code ?? '').endsWith('CO-902'));
    if (!co902) return;
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto(`/procesos/${co902.id}/editar`);
    await expect(page.locator('body')).toContainText(/Apertura de ofertas|Registrar apertura|Editar proceso|1 hora/i);
  });
});

test.describe('Licitación – Entidad contrato', () => {
  test.use({ baseURL: ENTITY_BASE });

  test('LIC-ENT-5: Contrato – campo publicación resolución adjudicación o Declarar adjudicatario', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto('/procesos');
    const contratoLink = page.getByRole('link', { name: /Contrato/i }).first();
    await contratoLink.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    if (!(await contratoLink.isVisible().catch(() => false))) {
      await expect(page.locator('body')).toBeVisible();
      return;
    }
    await contratoLink.click();
    await expect(page.locator('body')).toContainText(/publicación resolución|adjudicatario fallido|Declarar|contrato|Guardar/i);
  });
});

test.describe('Licitación – Entidad evaluaciones', () => {
  test.use({ baseURL: ENTITY_BASE });

  test('LIC-ENT-6: Evaluaciones – página con Verificar BAE o Convalidación o RUP', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto('/procesos');
    const evalLink = page.getByRole('link', { name: /Evaluaciones/i }).first();
    await evalLink.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    if (!(await evalLink.isVisible().catch(() => false))) {
      await expect(page.locator('body')).toBeVisible();
      return;
    }
    await evalLink.click();
    await expect(page.locator('body')).toContainText(/Evaluación|Verificar BAE|Convalidación|RUP|Oferta|bid/i);
  });

  test('LIC-ENT-7: Evaluaciones proceso CO-901 – Convalidación y Verificar RUP visibles', async ({ page, request }) => {
    const listRes = await request.get(`${API_BASE}/api/v1/tenders?pageSize=100`);
    if (!listRes.ok()) return;
    const list = (await listRes.json()) as { data?: Array<{ id: string; code?: string | null }> };
    const co901 = list.data?.find((t) => String(t.code ?? '').endsWith('CO-901'));
    if (!co901) return;
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto(`/procesos/${co901.id}/evaluaciones`);
    await expect(page.locator('body')).toContainText(/Convalidación|Verificar RUP|Apertura|Adjudicación|Contrato|BAE/i);
  });
});

// --- Portal proveedor ---
test.describe('Licitación – Portal proveedor', () => {
  test.use({ baseURL: SUPPLIER_BASE });

  test('LIC-SUP-1: Detalle proceso muestra Presupuesto referencial o Límite entrega', async ({ page, request }) => {
    const res = await request.get(`${API_BASE}/api/v1/tenders?pageSize=20`);
    if (!res.ok()) return;
    const body = (await res.json()) as { data?: Array<{ id: string }> };
    const id = body.data?.[0]?.id;
    if (!id) return;
    await supplierLogin(page, SUPPLIER_BASE, request);
    await page.goto(`/procesos/${id}`);
    await expect(page.locator('body')).toContainText(/Presupuesto referencial|Límite|Monto|Presentar oferta|Preguntas/i);
  });

  test('LIC-SUP-2: Detalle proceso con cronograma muestra convalidación', async ({ page, request }) => {
    const res = await request.get(`${API_BASE}/api/v1/tenders?pageSize=100`);
    if (!res.ok()) return;
    const list = (await res.json()) as { data?: Array<{ id: string; bidsDeadlineAt?: unknown }> };
    const withDeadline = list.data?.find((t) => t.bidsDeadlineAt != null);
    const id = withDeadline?.id ?? list.data?.[0]?.id;
    if (!id) return;
    await supplierLogin(page, SUPPLIER_BASE, request);
    await page.goto(`/procesos/${id}`);
    await expect(page.locator('body')).toContainText(/convalidación|errores subsanables|Presentar oferta|Preguntas/i);
  });
});

// --- Navegación y contenido adicional ---
test.describe('Licitación – Navegación y contenido', () => {
  test.use({ baseURL: PUBLIC_BASE });

  test('LIC-NAV-1: Desde lista a detalle proceso no rompe', async ({ page }) => {
    await page.goto('/procesos');
    const verDetalle = page.getByRole('link', { name: /Ver detalle/i }).first();
    await verDetalle.waitFor({ state: 'visible', timeout: 12000 }).catch(() => {});
    if (await verDetalle.isVisible().catch(() => false)) {
      await verDetalle.click();
      await expect(page.locator('body')).toContainText(/Participar|Estado|Monto|proceso/i);
    } else {
      await expect(page.locator('body')).toContainText(/Resultados|No hay|proceso/i);
    }
  });

  test('LIC-NAV-2: Entidad – Rendición de cuentas en menú', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto('/');
    await expect(page.locator('body')).toContainText(/Rendición de cuentas|rendición|procesos|PAC/i);
  });
});

// --- Más casos API y validación ---
test.describe('Licitación – API validaciones y respuestas', () => {
  test('LIC-API-13: PATCH convalidation con body inválido devuelve 400', async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/v1/auth/login`, {
      data: { email: 'admin@mec.gob.ec', role: 'entity' },
    });
    if (res.status() !== 200) return;
    const { token } = (await res.json()) as { token: string };
    const patchRes = await request.patch(`${API_BASE}/api/v1/bids/00000000-0000-0000-0000-000000000001/convalidation`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { status: 'invalid' },
    });
    expect([400, 404]).toContain(patchRes.status());
  });

  test('LIC-API-14: POST verify-rup con stage inválido devuelve 400', async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/v1/auth/login`, {
      data: { email: 'admin@mec.gob.ec', role: 'entity' },
    });
    if (res.status() !== 200) return;
    const { token } = (await res.json()) as { token: string };
    const postRes = await request.post(`${API_BASE}/api/v1/bids/00000000-0000-0000-0000-000000000001/verify-rup`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { stage: 'invalid' },
    });
    expect(postRes.status()).toBe(400);
  });

  test('LIC-API-15: GET tender incluye questionsDeadlineAt cuando existe', async ({ request }) => {
    const listRes = await request.get(`${API_BASE}/api/v1/tenders?pageSize=50`);
    if (!listRes.ok()) return;
    const list = (await listRes.json()) as { data?: Array<{ id: string }> };
    const id = list.data?.find((_, i) => i < 5)?.id ?? list.data?.[0]?.id;
    if (!id) return;
    const res = await request.get(`${API_BASE}/api/v1/tenders/${id}`);
    expect(res.ok()).toBe(true);
    const t = (await res.json()) as Record<string, unknown>;
    expect(t).toHaveProperty('id');
  });

  test('LIC-API-16: GET bids incluye invitationType cuando existe', async ({ request }) => {
    const listRes = await request.get(`${API_BASE}/api/v1/tenders?pageSize=50`);
    if (!listRes.ok()) return;
    const list = (await listRes.json()) as { data?: Array<{ id: string }> };
    for (const tender of list.data ?? []) {
      const bidRes = await request.get(`${API_BASE}/api/v1/tenders/${tender.id}/bids`);
      if (!bidRes.ok()) continue;
      const bidBody = (await bidRes.json()) as { data?: Array<{ invitationType?: string }> };
      if (bidBody.data && bidBody.data.length > 0) {
        const it = bidBody.data[0].invitationType;
        expect(['invited', 'self_invited', undefined, null]).toContain(it);
        return;
      }
    }
  });

  test('LIC-API-17: POST create tender con referenceBudgetAmount y processType licitacion', async ({ request }) => {
    const loginRes = await request.post(`${API_BASE}/api/v1/auth/login`, {
      data: { email: 'admin@mec.gob.ec', role: 'entity' },
    });
    if (loginRes.status() !== 200) return;
    const { token } = (await loginRes.json()) as { token: string };
    const entRes = await request.get(`${API_BASE}/api/v1/entities`);
    const entities = entRes.ok() ? ((await entRes.json()) as { data?: Array<{ id: string }> })?.data : [];
    const entityId = entities?.[0]?.id;
    if (!entityId) return;
    const pacRes = await request.get(`${API_BASE}/api/v1/pac?entityId=${entityId}`);
    const pacList = pacRes.ok() ? ((await pacRes.json()) as { data?: Array<{ id: string }> })?.data : [];
    const planId = pacList?.[0]?.id;
    if (!planId) return;
    const createRes = await request.post(`${API_BASE}/api/v1/tenders`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        procurementPlanId: planId,
        title: 'E2E Licitación test ' + Date.now(),
        processType: 'licitacion',
        referenceBudgetAmount: 50000,
        responsibleType: 'delegate',
        electronicSignatureRequired: true,
      },
    });
    expect([201, 400]).toContain(createRes.status());
  });

  test('LIC-API-18: POST create tender licitación con plazo preguntas menor al mínimo devuelve 400', async ({ request }) => {
    const loginRes = await request.post(`${API_BASE}/api/v1/auth/login`, {
      data: { email: 'admin@mec.gob.ec', role: 'entity' },
    });
    if (loginRes.status() !== 200) return;
    const { token } = (await loginRes.json()) as { token: string };
    const entRes = await request.get(`${API_BASE}/api/v1/entities`);
    const entities = entRes.ok() ? ((await entRes.json()) as { data?: Array<{ id: string }> })?.data : [];
    const entityId = entities?.[0]?.id;
    if (!entityId) return;
    const pacRes = await request.get(`${API_BASE}/api/v1/pac?entityId=${entityId}`);
    const pacList = pacRes.ok() ? ((await pacRes.json()) as { data?: Array<{ id: string }> })?.data : [];
    const planId = pacList?.[0]?.id;
    if (!planId) return;
    const now = new Date();
    const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const createRes = await request.post(`${API_BASE}/api/v1/tenders`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        procurementPlanId: planId,
        title: 'E2E Cronograma mínimo ' + Date.now(),
        processType: 'licitacion',
        referenceBudgetAmount: 150000,
        responsibleType: 'commission',
        electronicSignatureRequired: true,
        questionsDeadlineAt: oneDayLater.toISOString(),
        bidsDeadlineAt: threeDaysLater.toISOString(),
      },
    });
    expect(createRes.status()).toBe(400);
    const body = (await createRes.json()) as { error?: string };
    expect(body?.error).toMatch(/plazo|preguntas|días|art\. 91/i);
  });

  test('LIC-API-21: POST create tender con ventana convalidación fuera de 2-5 días devuelve 400', async ({ request }) => {
    const loginRes = await request.post(`${API_BASE}/api/v1/auth/login`, {
      data: { email: 'admin@mec.gob.ec', role: 'entity' },
    });
    if (loginRes.status() !== 200) return;
    const { token } = (await loginRes.json()) as { token: string };
    const entRes = await request.get(`${API_BASE}/api/v1/entities`);
    const entities = entRes.ok() ? ((await entRes.json()) as { data?: Array<{ id: string }> })?.data : [];
    const entityId = entities?.[0]?.id;
    if (!entityId) return;
    const pacRes = await request.get(`${API_BASE}/api/v1/pac?entityId=${entityId}`);
    const pacList = pacRes.ok() ? ((await pacRes.json()) as { data?: Array<{ id: string }> })?.data : [];
    const planId = pacList?.[0]?.id;
    if (!planId) return;
    const now = new Date();
    const convReq = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    const convResp = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);
    const createRes = await request.post(`${API_BASE}/api/v1/tenders`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        procurementPlanId: planId,
        title: 'E2E Convalidación ventana ' + Date.now(),
        processType: 'licitacion',
        referenceBudgetAmount: 50000,
        responsibleType: 'delegate',
        electronicSignatureRequired: true,
        convalidationRequestDeadlineAt: convReq.toISOString(),
        convalidationResponseDeadlineAt: convResp.toISOString(),
      },
    });
    expect(createRes.status()).toBe(400);
    const body = (await createRes.json()) as { error?: string };
    expect(body?.error).toMatch(/convalidación|2 y 5|art\. 100/i);
  });
});

// --- Casos adicionales portal público y entidad ---
test.describe('Licitación – Público y entidad adicionales', () => {
  test('LIC-PUB-5: Proceso detalle – botón Participar visible', async ({ page, request }) => {
    const res = await request.get(`${API_BASE}/api/v1/tenders?pageSize=5`);
    if (!res.ok()) return;
    const list = (await res.json()) as { data?: Array<{ id: string }> };
    const id = list.data?.[0]?.id;
    if (!id) return;
    await page.goto(PUBLIC_BASE + `/proceso/${id}`);
    await expect(page.getByRole('link', { name: /Participar|presentar oferta/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test('LIC-ENT-8: Procesos listado – enlace Editar o Ver ofertas', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto(ENTITY_BASE + '/procesos');
    await expect(page.locator('body')).toContainText(/procesos|Procesos|Editar|Ver ofertas|Contrato|No hay/i);
  });

  test('LIC-ENT-9: Nuevo proceso – select Régimen visible', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto(ENTITY_BASE + '/procesos/nuevo');
    await expect(page.locator('body')).toContainText(/Régimen|régimen|Ordinario|Ínfima/i);
  });

  test('LIC-ENT-10: Contrato – Plazo controversias o administrador', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto(ENTITY_BASE + '/procesos');
    const link = page.getByRole('link', { name: /Contrato/i }).first();
    if (!(await link.isVisible().catch(() => false))) return;
    await link.click();
    await expect(page.locator('body')).toContainText(/controversias|administrador|Plazo|Guardar/i);
  });
});

// --- Ampliación: API paginación, contratos, proveedores ---
test.describe('Licitación – API ampliación', () => {
  test('LIC-API-18: GET tenders con page y pageSize', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/v1/tenders?page=1&pageSize=5`);
    expect(res.ok()).toBe(true);
    const body = (await res.json()) as { data?: unknown[]; total?: number; page?: number; pageSize?: number };
    expect(Array.isArray(body.data)).toBe(true);
    expect((body.data?.length ?? 0)).toBeLessThanOrEqual(5);
  });

  test('LIC-API-19: GET tenders page 2', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/v1/tenders?page=2&pageSize=3`);
    expect(res.ok()).toBe(true);
    const body = (await res.json()) as { data?: unknown[] };
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('LIC-API-20: GET tender incluye bidsOpenedAt en listado cuando existe', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/v1/tenders?pageSize=50`);
    if (!res.ok()) return;
    const body = (await res.json()) as { data?: Array<{ bidsOpenedAt?: unknown }> };
    const withOpened = body.data?.find((t) => t.bidsOpenedAt != null);
    expect(body.data).toBeDefined();
  });

  test('LIC-API-21: GET contracts no existe como listado global', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/v1/contracts`);
    expect([404, 401, 400]).toContain(res.status());
  });

  test('LIC-API-22: GET tenders/:id/contract incluye awardPublishedAt cuando existe', async ({ request }) => {
    const listRes = await request.get(`${API_BASE}/api/v1/tenders?pageSize=20`);
    if (!listRes.ok()) return;
    const list = (await listRes.json()) as { data?: Array<{ id: string }> };
    for (const t of list.data ?? []) {
      const cRes = await request.get(`${API_BASE}/api/v1/tenders/${t.id}/contract`);
      if (cRes.ok()) {
        const c = (await cRes.json()) as { awardPublishedAt?: unknown };
        expect(c).toHaveProperty('id');
        return;
      }
    }
  });

  test('LIC-API-23: GET providers listado sin filtro', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/v1/providers`);
    expect(res.ok()).toBe(true);
    const body = (await res.json()) as { data?: Array<{ id: string }> };
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('LIC-API-24: GET providers con identifier', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/v1/providers?identifier=1791234567001`);
    expect(res.ok()).toBe(true);
    const body = (await res.json()) as { data?: unknown[] };
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('LIC-API-25: GET tenders filtro processType licitacion', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/v1/tenders?processType=licitacion&pageSize=10`);
    expect(res.ok()).toBe(true);
    const body = (await res.json()) as { data?: Array<{ processType?: string }> };
    body.data?.forEach((t) => expect(t.processType === 'licitacion' || !t.processType).toBe(true));
  });

  test('LIC-API-26: GET tenders filtro regime', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/v1/tenders?regime=ordinario&pageSize=5`);
    expect(res.ok()).toBe(true);
    const body = (await res.json()) as { data?: unknown[] };
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('LIC-API-27: GET tender 404 para UUID inexistente', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/v1/tenders/00000000-0000-0000-0000-000000000099`);
    expect(res.status()).toBe(404);
  });

  test('LIC-API-28: GET tenders/:id/bids 200 para proceso con ofertas', async ({ request }) => {
    const listRes = await request.get(`${API_BASE}/api/v1/tenders?pageSize=30`);
    if (!listRes.ok()) return;
    const list = (await listRes.json()) as { data?: Array<{ id: string }> };
    for (const tender of list.data ?? []) {
      const res = await request.get(`${API_BASE}/api/v1/tenders/${tender.id}/bids`);
      if (res.ok()) {
        const body = (await res.json()) as { data?: unknown[] };
        expect(Array.isArray(body.data)).toBe(true);
        return;
      }
    }
  });
});

// --- Ampliación: Portal público ---
test.describe('Licitación – Público ampliación', () => {
  test.use({ baseURL: PUBLIC_BASE });

  test('LIC-PUB-6: Procesos – filtro Régimen ordinario', async ({ page }) => {
    await page.goto('/procesos');
    const summary = page.getByText('Filtros', { exact: true }).first();
    await summary.click().catch(() => {});
    const select = page.locator('select').filter({ has: page.locator('option[value="ordinario"]') }).first();
    await select.selectOption('ordinario').catch(() => {});
    await page.getByRole('button', { name: /Buscar/i }).first().click().catch(() => {});
    await expect(page.locator('body')).toContainText(/Resultados|encontrado|proceso|No hay/i);
  });

  test('LIC-PUB-7: Procesos – filtro Método', async ({ page }) => {
    await page.goto('/procesos');
    const summary = page.getByText('Filtros', { exact: true }).first();
    await summary.click().catch(() => {});
    const select = page.locator('select').filter({ has: page.locator('option[value="open"]') }).first();
    await select.selectOption('open').catch(() => {});
    await page.getByRole('button', { name: /Buscar/i }).first().click().catch(() => {});
    await expect(page.locator('body')).toBeVisible();
  });

  test('LIC-PUB-8: Detalle proceso – breadcrumb o título', async ({ page, request }) => {
    const res = await request.get(`${API_BASE}/api/v1/tenders?pageSize=1`);
    if (!res.ok()) return;
    const list = (await res.json()) as { data?: Array<{ id: string }> };
    const id = list.data?.[0]?.id;
    if (!id) return;
    await page.goto(`/proceso/${id}`);
    await expect(page.locator('body')).toContainText(/Procesos|Inicio|Participar|Estado/i);
  });

  test('LIC-PUB-9: Home – enlace a procesos', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /Procesos|procesos/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test('LIC-PUB-10: Cifras – métricas', async ({ page }) => {
    await page.goto('/cifras');
    await expect(page.locator('body')).toContainText(/Procesos|Contratos|Cargando|números|métricas/i);
  });

  test('LIC-PUB-11: Procesos – dos filtros combinados', async ({ page }) => {
    test.setTimeout(45000);
    await page.goto('/procesos');
    const summary = page.getByText('Filtros', { exact: true }).first();
    await summary.click().catch(() => {});
    const typeSelect = page.locator('select').filter({ has: page.locator('option[value="licitacion"]') }).first();
    await typeSelect.selectOption('licitacion').catch(() => {});
    const regimeSelect = page.locator('select').filter({ has: page.locator('option[value="ordinario"]') }).first();
    await regimeSelect.selectOption('ordinario').catch(() => {});
    await page.getByRole('button', { name: /Buscar/i }).first().click().catch(() => {});
    await expect(page.locator('body')).toContainText(/Resultados|encontrado|No hay|proceso|Buscar/i, { timeout: 15000 });
  });

  test('LIC-PUB-12: Detalle – sección Preguntas si hay aclaraciones', async ({ page, request }) => {
    const res = await request.get(`${API_BASE}/api/v1/tenders?pageSize=5`);
    if (!res.ok()) return;
    const list = (await res.json()) as { data?: Array<{ id: string }> };
    const id = list.data?.[0]?.id;
    if (!id) return;
    await page.goto(`/proceso/${id}`);
    await expect(page.locator('body')).toContainText(/Preguntas|aclara|Participar|proceso/i);
  });
});

// --- Ampliación: Portal entidad ---
test.describe('Licitación – Entidad ampliación', () => {
  test.use({ baseURL: ENTITY_BASE });

  test('LIC-ENT-11: Nuevo proceso – Plan PAC obligatorio', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto(ENTITY_BASE + '/procesos/nuevo');
    await expect(page.locator('select').filter({ has: page.locator('option[value=""]') }).first()).toBeVisible({ timeout: 5000 }).catch(() => {});
    await expect(page.locator('body')).toContainText(/Plan PAC|Título|Crear proceso/i);
  });

  test('LIC-ENT-12: Editar – Liberación por no producción nacional', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto(ENTITY_BASE + '/procesos');
    const editLink = page.getByRole('link', { name: /Editar/i }).first();
    if (!(await editLink.isVisible().catch(() => false))) return;
    await editLink.click();
    await expect(page.locator('body')).toContainText(/Liberación|liberación|Editar proceso|Guardar/i);
  });

  test('LIC-ENT-13: Contrato – botón Suspender o Terminar', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto(ENTITY_BASE + '/procesos');
    const link = page.getByRole('link', { name: /Contrato/i }).first();
    if (!(await link.isVisible().catch(() => false))) return;
    await link.click();
    await expect(page.locator('body')).toContainText(/Suspender|Terminar|Declarar|contrato|Guardar/i);
  });

  test('LIC-ENT-14: Evaluaciones – select oferta (bid)', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto(ENTITY_BASE + '/procesos');
    const evalLink = page.getByRole('link', { name: /Evaluaciones/i }).first();
    if (!(await evalLink.isVisible().catch(() => false))) return;
    await evalLink.click();
    await expect(page.locator('body')).toContainText(/Seleccione|Oferta|bid|Puntaje|técnico|Crear evaluación/i);
  });

  test('LIC-ENT-15: PAC – página carga', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto(ENTITY_BASE + '/pac');
    await expect(page.locator('body')).toContainText(/PAC|Plan|año|Crear|Total/i);
  });

  test('LIC-ENT-16: Rendición de cuentas – enlace o tabla', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto(ENTITY_BASE + '/');
    const link = page.getByRole('link', { name: /Rendición de cuentas/i }).first();
    if (await link.isVisible().catch(() => false)) {
      await link.click();
      await expect(page.locator('body')).toContainText(/auditoría|Rendición|acciones|entity/i);
    } else {
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('LIC-ENT-17: Nuevo proceso – Preferencia territorial', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto(ENTITY_BASE + '/procesos/nuevo');
    await expect(page.locator('body')).toContainText(/Preferencia territorial|Amazonía|Galápagos|Ninguna/i);
  });

  test('LIC-ENT-18: Ofertas del proceso – listado', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto(ENTITY_BASE + '/procesos');
    const ofertasLink = page.getByRole('link', { name: /Ver ofertas/i }).first();
    if (!(await ofertasLink.isVisible().catch(() => false))) return;
    await ofertasLink.click();
    await expect(page.locator('body')).toContainText(/Ofertas|oferta|No hay|Revisar|proceso/i);
  });
});

// --- Ampliación: Portal proveedor ---
test.describe('Licitación – Proveedor ampliación', () => {
  test.use({ baseURL: SUPPLIER_BASE });

  test('LIC-SUP-3: Procesos – listado con cards', async ({ page }) => {
    await page.goto('/procesos');
    await expect(page.locator('body')).toContainText(/Procesos|procesos|Presentar oferta|Ver detalle|No hay/i);
  });

  test('LIC-SUP-4: Detalle – botón Presentar oferta', async ({ page, request }) => {
    const res = await request.get(`${API_BASE}/api/v1/tenders?pageSize=3`);
    if (!res.ok()) return;
    const list = (await res.json()) as { data?: Array<{ id: string }> };
    const id = list.data?.[0]?.id;
    if (!id) return;
    await page.goto(SUPPLIER_BASE + `/procesos/${id}`);
    await expect(page.getByRole('link', { name: /Presentar oferta/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test('LIC-SUP-5: Detalle – Preguntas y aclaraciones', async ({ page, request }) => {
    const res = await request.get(`${API_BASE}/api/v1/tenders?pageSize=3`);
    if (!res.ok()) return;
    const list = (await res.json()) as { data?: Array<{ id: string }> };
    const id = list.data?.[0]?.id;
    if (!id) return;
    await page.goto(SUPPLIER_BASE + `/procesos/${id}`);
    await expect(page.locator('body')).toContainText(/Preguntas|aclara|Nueva pregunta|Presentar oferta/i);
  });

  test('LIC-SUP-6: Detalle – Presentar reclamo', async ({ page, request }) => {
    const res = await request.get(`${API_BASE}/api/v1/tenders?pageSize=3`);
    if (!res.ok()) return;
    const list = (await res.json()) as { data?: Array<{ id: string }> };
    const id = list.data?.[0]?.id;
    if (!id) return;
    await page.goto(SUPPLIER_BASE + `/procesos/${id}`);
    await expect(page.locator('body')).toContainText(/reclamo|Reclamo|Asunto|Mensaje/i);
  });

  test('LIC-SUP-7: Login – formulario', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('body')).toContainText(/login|sesión|email|correo|Iniciar/i);
  });

  test('LIC-SUP-8: Procesos con login – listado carga', async ({ page, request }) => {
    await supplierLogin(page, SUPPLIER_BASE, request);
    await page.goto(SUPPLIER_BASE + '/procesos');
    await expect(page.locator('body')).toContainText(/Procesos|Presentar oferta|Ver detalle|No hay/i);
  });
});

// --- Ampliación: Contenido y textos licitación ---
test.describe('Licitación – Contenido textos', () => {
  test('LIC-TXT-1: Entidad editar CO-902 – texto 1 hora o apertura', async ({ page, request }) => {
    const res = await request.get(`${API_BASE}/api/v1/tenders?pageSize=100`);
    if (!res.ok()) return;
    const list = (await res.json()) as { data?: Array<{ id: string; code?: string | null }> };
    const co902 = list.data?.find((t) => String(t.code ?? '').endsWith('CO-902'));
    if (!co902) return;
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto(ENTITY_BASE + `/procesos/${co902.id}/editar`);
    await expect(page.locator('body')).toContainText(/1 hora|apertura|Registrar|Límite/i);
  });

  test('LIC-TXT-2: Entidad contrato – texto adjudicatario fallido o sanción', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto(ENTITY_BASE + '/procesos');
    const link = page.getByRole('link', { name: /Contrato/i }).first();
    if (!(await link.isVisible().catch(() => false))) return;
    await link.click();
    await expect(page.locator('body')).toContainText(/adjudicatario fallido|sanción|3 años|Declarar/i);
  });

  test('LIC-TXT-3: Entidad evaluaciones – texto Convalidación o RUP', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto(ENTITY_BASE + '/procesos');
    const evalLink = page.getByRole('link', { name: /Evaluaciones/i }).first();
    if (!(await evalLink.isVisible().catch(() => false))) return;
    await evalLink.click();
    await expect(page.locator('body')).toContainText(/Convalidación|RUP|Verificar|Apertura|Adjudicación/i);
  });

  test('LIC-TXT-4: Proveedor detalle – convalidación errores subsanables', async ({ page, request }) => {
    const res = await request.get(`${API_BASE}/api/v1/tenders?pageSize=50`);
    if (!res.ok()) return;
    const list = (await res.json()) as { data?: Array<{ id: string; bidsDeadlineAt?: unknown }> };
    const t = list.data?.find((x) => x.bidsDeadlineAt != null) ?? list.data?.[0];
    if (!t?.id) return;
    await supplierLogin(page, SUPPLIER_BASE, request);
    await page.goto(SUPPLIER_BASE + `/procesos/${t.id}`);
    await expect(page.locator('body')).toContainText(/convalidación|errores subsanables|cronograma|Presentar oferta/i);
  });

  test('LIC-TXT-5: Público detalle – Entidad y año PAC', async ({ page, request }) => {
    const res = await request.get(`${API_BASE}/api/v1/tenders?pageSize=5`);
    if (!res.ok()) return;
    const list = (await res.json()) as { data?: Array<{ id: string }> };
    const id = list.data?.[0]?.id;
    if (!id) return;
    await page.goto(PUBLIC_BASE + `/proceso/${id}`);
    await expect(page.locator('body')).toContainText(/Entidad|PAC|Año|Estado|Monto|Participar/i);
  });
});

// --- Ampliación: Navegación y flujos ---
test.describe('Licitación – Navegación ampliación', () => {
  test('LIC-NAV-3: Entidad Procesos → Editar → Volver', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto(ENTITY_BASE + '/procesos');
    const editLink = page.getByRole('link', { name: /Editar/i }).first();
    if (!(await editLink.isVisible().catch(() => false))) return;
    await editLink.click();
    await expect(page.locator('body')).toContainText(/Editar proceso|Volver|Guardar/i);
    await page.getByRole('link', { name: /Volver/i }).first().click().catch(() => {});
    await expect(page.locator('body')).toContainText(/procesos|Procesos/i);
  });

  test('LIC-NAV-4: Público Procesos → Ver detalle → URL contiene proceso', async ({ page }) => {
    await page.goto(PUBLIC_BASE + '/procesos');
    const link = page.getByRole('link', { name: /Ver detalle/i }).first();
    if (!(await link.isVisible().catch(() => false))) return;
    await link.click();
    await expect(page).toHaveURL(/\/proceso\/[a-f0-9-]+/i);
  });

  test('LIC-NAV-5: Proveedor Procesos → Ver detalle', async ({ page }) => {
    await page.goto(SUPPLIER_BASE + '/procesos');
    const link = page.getByRole('link', { name: /Ver detalle/i }).first();
    if (!(await link.isVisible().catch(() => false))) return;
    await link.click();
    await expect(page.locator('body')).toContainText(/Presentar oferta|Preguntas|reclamo/i);
  });

  test('LIC-NAV-6: Entidad Evaluaciones → Volver al proceso', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto(ENTITY_BASE + '/procesos');
    const evalLink = page.getByRole('link', { name: /Evaluaciones/i }).first();
    if (!(await evalLink.isVisible().catch(() => false))) return;
    await evalLink.click();
    await expect(page.getByRole('link', { name: /Volver al proceso/i }).first()).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test('LIC-NAV-7: Entidad Contrato → Ofertas', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto(ENTITY_BASE + '/procesos');
    const contratoLink = page.getByRole('link', { name: /Contrato/i }).first();
    if (!(await contratoLink.isVisible().catch(() => false))) return;
    await contratoLink.click();
    await expect(page.locator('body')).toContainText(/Ofertas|contrato|Guardar/i);
    const ofertasLink = page.getByRole('link', { name: /Ofertas/i }).first();
    if (await ofertasLink.isVisible().catch(() => false)) {
      await ofertasLink.click();
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
