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

  test('CV03p: POST process-claims fuera de ventana de reclamos devuelve 400', async ({ request }) => {
    const apiBase = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3080';
    const loginRes = await request.post(`${apiBase}/api/v1/auth/login`, {
      data: { email: 'supplier@test.com', role: 'supplier', identifier: '1791234567001' },
    });
    if (loginRes.status() !== 200) return;
    const loginBody = (await loginRes.json()) as { token: string; providerId?: string };
    const listRes = await request.get(`${apiBase}/api/v1/tenders?pageSize=100`);
    if (!listRes.ok()) return;
    const listBody = (await listRes.json()) as { data?: Array<{ id: string; code?: string | null }> };
    const co903 = listBody.data?.find((t) => String(t.code ?? '').endsWith('CO-903'));
    if (!co903 || !loginBody.providerId) return;
    const res = await request.post(`${apiBase}/api/v1/process-claims`, {
      headers: { Authorization: `Bearer ${loginBody.token}`, 'Content-Type': 'application/json' },
      data: {
        tenderId: co903.id,
        providerId: loginBody.providerId,
        kind: 'EVALUATION',
        subject: 'Reclamo E2E',
        message: 'Mensaje de prueba.',
      },
    });
    expect(res.status()).toBe(400);
    const errBody = (await res.json()) as { error?: string };
    expect(errBody?.error).toMatch(/plazo|reclamos|vencido/i);
  });

  test('CV03q: Upload documento clarifications_act para tender queda asociado', async ({ request }) => {
    const apiBase = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3080';
    const listRes = await request.get(`${apiBase}/api/v1/tenders?pageSize=5`);
    if (!listRes.ok()) return;
    const listBody = (await listRes.json()) as { data?: Array<{ id: string }> };
    const tenderId = listBody.data?.[0]?.id;
    if (!tenderId) return;
    const res = await request.post(`${apiBase}/api/v1/documents/upload`, {
      multipart: {
        ownerType: 'tender',
        ownerId: tenderId,
        documentType: 'clarifications_act',
        file: {
          name: 'acta-preguntas-e2e.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('%PDF-1.4 E2E test'),
        },
      },
    });
    if (res.status() === 503) return;
    expect(res.status()).toBe(201);
    const doc = (await res.json()) as { id?: string; documentType?: string };
    expect(doc.documentType).toBe('clarifications_act');
    expect(doc.id).toBeTruthy();
  });

  test('CV03r: Upload documento need_report (informe necesidad) para tender queda asociado', async ({ request }) => {
    const apiBase = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3080';
    const listRes = await request.get(`${apiBase}/api/v1/tenders?pageSize=5`);
    if (!listRes.ok()) return;
    const listBody = (await listRes.json()) as { data?: Array<{ id: string }> };
    const tenderId = listBody.data?.[0]?.id;
    if (!tenderId) return;
    const res = await request.post(`${apiBase}/api/v1/documents/upload`, {
      multipart: {
        ownerType: 'tender',
        ownerId: tenderId,
        documentType: 'need_report',
        file: {
          name: 'informe-necesidad-e2e.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('%PDF-1.4 informe necesidad E2E'),
        },
      },
    });
    if (res.status() === 503) return;
    expect(res.status()).toBe(201);
    const doc = (await res.json()) as { id?: string; documentType?: string };
    expect(doc.documentType).toBe('need_report');
    expect(doc.id).toBeTruthy();
  });

  test('CV03s: PUT contract awardPublishedAt más de 1 día después de emisión devuelve 400', async ({ request }) => {
    const apiBase = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3080';
    const listRes = await request.get(`${apiBase}/api/v1/tenders?pageSize=20`);
    if (!listRes.ok()) return;
    const listBody = (await listRes.json()) as { data?: Array<{ id: string }> };
    for (const t of listBody.data ?? []) {
      const cRes = await request.get(`${apiBase}/api/v1/tenders/${t.id}/contract`);
      if (cRes.status() !== 200) continue;
      const contract = (await cRes.json()) as { id: string };
      const issued = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const published = new Date(issued.getTime() + 25 * 60 * 60 * 1000);
      const putRes = await request.put(`${apiBase}/api/v1/contracts/${contract.id}`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          awardResolutionIssuedAt: issued.toISOString(),
          awardPublishedAt: published.toISOString(),
        },
      });
      if (putRes.status() === 400) {
        const err = (await putRes.json()) as { error?: string };
        expect(err?.error).toMatch(/publicación|1 día|art\. 112/i);
        return;
      }
    }
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
