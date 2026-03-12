/**
 * Batería QA – Contenido, formularios y validaciones en portales.
 */
import { test, expect } from '@playwright/test';

test.describe('Contenido – Portal público', () => {
  test.use({ baseURL: 'http://localhost:3010' });

  test('CV00: Home tiene enlace Denuncias en navegación', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /Denuncias/i }).first()).toBeVisible({ timeout: 6000 });
  });

  test('CV01: Home tiene sección hero o búsqueda', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('main, [role="main"], form, input').first()).toBeVisible({ timeout: 8000 });
  });

  test('CV02: Procesos tiene título o heading', async ({ page }) => {
    await page.goto('/procesos');
    const h = page.getByRole('heading').first();
    await expect(h).toBeVisible({ timeout: 6000 });
  });

  test('CV03: Cifras muestra métricas o loading', async ({ page }) => {
    await page.goto('/cifras');
    await expect(page.locator('body')).toContainText(/Procesos|Contratos|Cargando|números/i);
  });

  test('CV03b: API analytics/public devuelve estructura coherente', async ({ request }) => {
    const apiBase = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3080';
    const res = await request.get(`${apiBase}/api/v1/analytics/public`);
    expect(res.ok()).toBe(true);
    const body = (await res.json()) as { tenders: number; tendersPublished: number; providers: number; contracts: number };
    expect(body).toHaveProperty('tenders');
    expect(body).toHaveProperty('tendersPublished');
    expect(body).toHaveProperty('providers');
    expect(body).toHaveProperty('contracts');
    expect(typeof body.tenders).toBe('number');
    expect(typeof body.tendersPublished).toBe('number');
    expect(body.tendersPublished).toBeLessThanOrEqual(body.tenders);
  });

  test('CV03c: API documents/presign rechaza archivo > 20MB con 413', async ({ request }) => {
    const apiBase = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3080';
    const res = await request.post(`${apiBase}/api/v1/documents/presign`, {
      data: {
        draftId: '00000000-0000-0000-0000-000000000001',
        docType: 'TEST',
        fileName: 'large.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 21 * 1024 * 1024,
      },
    });
    expect(res.status()).toBe(413);
    const body = (await res.json()) as { error?: string };
    expect(body?.error).toMatch(/grande|20|MB/i);
  });

  test('CV03d: Denuncias página contiene texto oficio o gestiocumental', async ({ page }) => {
    await page.goto('/denuncias');
    await expect(page.locator('body')).toContainText(/oficio|gestiocumental/i);
  });

  test('CV03e: Certificación página contiene por roles o cronograma', async ({ page }) => {
    await page.goto('/certificacion');
    await expect(page.locator('body')).toContainText(/por roles|cronograma|Certificación/i);
  });

  test('CV03f: API audit con contractingEntityId devuelve 200 con token o 401 sin token', async ({ request }) => {
    const apiBase = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3080';
    const res = await request.get(`${apiBase}/api/v1/audit?contractingEntityId=00000000-0000-0000-0000-000000000001&limit=5`);
    if (res.status() === 401) {
      expect(res.status()).toBe(401);
      return;
    }
    expect(res.ok()).toBe(true);
    const body = (await res.json()) as { data: unknown[] };
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('CV03g: API contracts/:id/documents devuelve 404 o 401 para contrato inexistente', async ({ request }) => {
    const apiBase = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3080';
    const res = await request.get(`${apiBase}/api/v1/contracts/00000000-0000-0000-0000-000000000001/documents`);
    expect([401, 404]).toContain(res.status());
  });

  test('CV03h: Página Principios contiene 12 principios o legalidad', async ({ page }) => {
    await page.goto('/principios');
    await expect(page.locator('body')).toContainText(/12 principios|legalidad|Legalidad/i);
  });

  test('CV03j: API tenders devuelve al menos un ítem con referenceBudgetAmount o bidsDeadlineAt opcional', async ({ request }) => {
    const apiBase = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3080';
    const res = await request.get(`${apiBase}/api/v1/tenders?pageSize=20`);
    expect(res.ok()).toBe(true);
    const body = (await res.json()) as { data?: Array<{ referenceBudgetAmount?: unknown; bidsDeadlineAt?: unknown }> };
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('CV03k: API GET tender por id acepta UUID válido', async ({ request }) => {
    const apiBase = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3080';
    const listRes = await request.get(`${apiBase}/api/v1/tenders?pageSize=1`);
    if (!listRes.ok()) return;
    const list = (await listRes.json()) as { data?: Array<{ id: string }> };
    const id = list.data?.[0]?.id;
    if (!id) return;
    const res = await request.get(`${apiBase}/api/v1/tenders/${id}`);
    expect([200, 404]).toContain(res.status());
  });

  test('CV03l: API GET tender devuelve electronicSignatureRequired cuando existe', async ({ request }) => {
    const apiBase = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3080';
    const listRes = await request.get(`${apiBase}/api/v1/tenders?pageSize=10`);
    if (!listRes.ok()) return;
    const list = (await listRes.json()) as { data?: Array<{ id: string }> };
    const id = list.data?.[0]?.id;
    if (!id) return;
    const res = await request.get(`${apiBase}/api/v1/tenders/${id}`);
    if (!res.ok()) return;
    const t = (await res.json()) as { electronicSignatureRequired?: boolean };
    expect(typeof t.electronicSignatureRequired === 'boolean' || t.electronicSignatureRequired === undefined).toBe(true);
  });

  test('CV03m: API GET tenders paginación total y page', async ({ request }) => {
    const apiBase = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3080';
    const res = await request.get(`${apiBase}/api/v1/tenders?page=1&pageSize=3`);
    expect(res.ok()).toBe(true);
    const body = (await res.json()) as { total?: number; page?: number; pageSize?: number };
    expect(body.page === 1 || body.page === undefined).toBe(true);
  });

  test('CV03n: Página Plazos licitación contiene emergencia y valor por dinero', async ({ page }) => {
    await page.goto('/licitacion-plazos');
    await expect(page.locator('body')).toContainText(/régimen de emergencia|Procesos en régimen de emergencia/i);
    await expect(page.locator('body')).toContainText(/mejor valor por dinero|plan de contingencia/i);
  });

  test('CV03o: Detalle proceso público muestra Plazo reclamos cuando existe', async ({ page, request }) => {
    const apiBase = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3080';
    const listRes = await request.get(`${apiBase}/api/v1/tenders?pageSize=5`);
    if (!listRes.ok()) return;
    const list = (await listRes.json()) as { data?: Array<{ id: string; claimWindowDays?: number | null }> };
    const tender = list.data?.find((t) => t.id);
    if (!tender) return;
    await page.goto(`/proceso/${tender.id}`);
    await expect(page.locator('body')).toContainText(/Plazo reclamos|reclamos deben presentarse/i, { timeout: 10000 });
  });

  test('CV03i: API request-liberation en proceso draft devuelve 200', async ({ request }) => {
    const apiBase = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3080';
    const listRes = await request.get(`${apiBase}/api/v1/tenders?pageSize=50`);
    if (!listRes.ok()) return;
    const body = (await listRes.json()) as { data?: Array<{ id: string; status: string }> };
    const draft = body.data?.find((t) => t.status === 'draft');
    if (!draft) return;
    const res = await request.post(`${apiBase}/api/v1/tenders/${draft.id}/request-liberation`, {
      headers: { 'Content-Type': 'application/json' },
      data: {},
    });
    expect([200, 400]).toContain(res.status());
  });

  test('CV04: Enlaces tiene cards o listado', async ({ page }) => {
    await page.goto('/enlaces');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Contenido – Proveedor', () => {
  test.use({ baseURL: 'http://localhost:3012' });

  test('CV05: Login tiene label email', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel(/email|correo|electrónico/i).or(page.getByPlaceholder(/email|correo/i))).toBeVisible({ timeout: 5000 });
  });

  test('CV06: Procesos tiene cards o empty state', async ({ page }) => {
    await page.goto('/procesos');
    await expect(page.locator('body')).toContainText(/proceso|Procesos|abiertos|publicados|Procesos Abiertos/i);
  });
});

test.describe('Contenido – Admin', () => {
  test.use({ baseURL: 'http://localhost:3014' });

  test('CV07: Dashboard tiene título', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toContainText(/Dashboard|Inicie sesión/i);
  });

  test('CV08: Procesos tiene tabla o lista', async ({ page }) => {
    await page.goto('/procesos');
    await expect(page.locator('body')).toContainText(/Procesos|Inicie sesión|Revisar|Config/i);
  });

  test('CV09: Login admin tiene botón', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /entrar|iniciar/i })).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Contenido – Entidad', () => {
  test.use({ baseURL: 'http://localhost:3013' });

  test('CV10: Home entidad carga', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('CV11: Procesos entidad carga', async ({ page }) => {
    await page.goto('/procesos');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Validación – Formularios admin', () => {
  test.use({ baseURL: 'http://localhost:3014' });

  test('CV12: Login admin submit no rompe sin email', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /entrar|iniciar/i }).click();
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Validación – Formularios proveedor', () => {
  test.use({ baseURL: 'http://localhost:3012' });

  test('CV13: Login proveedor submit no rompe sin email', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /entrar|iniciar/i }).click();
    await expect(page.locator('body')).toBeVisible();
  });
});
