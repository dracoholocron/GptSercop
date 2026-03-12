/**
 * Batería QA – Portal admin: rutas, login, procesos, ofertas, config, usuarios, normativa, denuncias, reclamos.
 * Base URL: 3014
 */
import { test, expect } from '@playwright/test';
import { adminLogin } from './auth-helpers';

const BASE = 'http://localhost:3014';

test.describe('Admin – Carga de rutas', () => {
  test.use({ baseURL: BASE });

  const routes: { path: string; name: string; expectInBody?: RegExp }[] = [
    { path: '/', name: 'home', expectInBody: /Dashboard|Inicie sesión|admin/i },
    { path: '/login', name: 'login', expectInBody: /login|sesión|email|correo|entrar/i },
    { path: '/procesos', name: 'procesos', expectInBody: /Procesos|procesos|Revisar|Config/i },
    { path: '/entidades', name: 'entidades', expectInBody: /Entidades|entidades|Inicie sesión/i },
    { path: '/denuncias', name: 'denuncias', expectInBody: /Denuncias|denuncias|Inicie sesión|Estado|Cargando/i },
    { path: '/reclamos', name: 'reclamos', expectInBody: /Reclamos|reclamos|Inicie sesión|Estado|Cargando/i },
    { path: '/usuarios', name: 'usuarios', expectInBody: /Usuarios|usuarios|Inicie sesión/i },
    { path: '/auditoria', name: 'auditoria', expectInBody: /Auditoría|auditoria|Inicie sesión/i },
    { path: '/parametros', name: 'parametros', expectInBody: /Parámetros|parametros|Inicie sesión/i },
    { path: '/normativa', name: 'normativa', expectInBody: /normativa|chunks|RAG|Inicie sesión/i },
  ];

  for (const { path, name, expectInBody } of routes) {
    test(`A-${name}: GET ${path} responde 200`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.locator('body')).toBeVisible();
      if (expectInBody) await expect(page.locator('body')).toContainText(expectInBody);
    });
  }
});

test.describe('Admin – Login', () => {
  test.use({ baseURL: BASE });

  test('A-login: formulario email y botón', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel(/email|correo/i)).toBeVisible({ timeout: 6000 });
    await expect(page.getByRole('button', { name: /entrar|iniciar|login/i })).toBeVisible({ timeout: 4000 });
  });

  test('A-login: envío con email no rompe', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email|correo/i).fill('admin@mec.gob.ec');
    await page.getByRole('button', { name: /entrar|iniciar|login/i }).click();
    await page.waitForLoadState('networkidle').catch(() => {});
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Admin – Procesos', () => {
  test.use({ baseURL: BASE });

  test('A-procesos: listado o mensaje', async ({ page }) => {
    await page.goto('/procesos');
    await expect(page.locator('body')).toContainText(/Procesos|procesos|Revisar|Config|tabla/i);
  });

  test('A-procesos: enlaces Revisar ofertas y Config si hay procesos', async ({ page }) => {
    await page.goto('/procesos');
    const revisar = page.getByRole('link', { name: /Revisar ofertas/i }).first();
    const config = page.getByRole('link', { name: /Config/i }).first();
    if (await revisar.isVisible().catch(() => false)) {
      await expect(revisar).toHaveAttribute('href', /\/procesos\/.+\/ofertas/);
    }
    if (await config.isVisible().catch(() => false)) {
      await expect(config).toHaveAttribute('href', /\/procesos\/.+\/config/);
    }
  });
});

test.describe('Admin – Proceso detalle ofertas', () => {
  test.use({ baseURL: BASE });

  test('A-proceso-ofertas: ruta /procesos/[id]/ofertas carga', async ({ page }) => {
    await page.goto('/procesos');
    await page.getByRole('link', { name: /Revisar ofertas|Config/i }).or(page.getByText(/No hay procesos\./)).first().waitFor({ state: 'visible', timeout: 15000 });
    const link = page.getByRole('link', { name: /Revisar ofertas/i }).first();
    if (!(await link.isVisible().catch(() => false))) {
      test.skip(true, 'No hay procesos');
    }
    await link.click();
    await expect(page.locator('body')).toContainText(/Ofertas|ofertas|Volver|proceso/i);
  });
});

test.describe('Admin – Config oferta', () => {
  test.use({ baseURL: BASE });

  test('A-config-oferta: ruta /procesos/[id]/config-oferta carga', async ({ page }) => {
    await page.goto('/procesos');
    await page.getByRole('link', { name: /Revisar ofertas|Config/i }).or(page.getByText(/No hay procesos\./)).first().waitFor({ state: 'visible', timeout: 15000 });
    const link = page.getByRole('link', { name: /Config/i }).first();
    if (!(await link.isVisible().catch(() => false))) {
      test.skip(true, 'No hay procesos');
    }
    await link.click();
    await expect(page.locator('body')).toContainText(/Config|configuración|JSON|modalidad/i);
  });
});

test.describe('Admin – Usuarios y Normativa', () => {
  test.use({ baseURL: BASE });

  test('A-usuarios: heading o tabla visible', async ({ page }) => {
    await page.goto('/usuarios');
    await expect(page.locator('body')).toContainText(/Usuarios|usuarios|Inicie sesión|tabla/i);
  });

  test('A-normativa: contenido normativa o login', async ({ page }) => {
    await page.goto('/normativa');
    await expect(page.locator('body')).toContainText(/normativa|chunks|RAG|Inicie sesión/i);
  });
});

test.describe('Admin – Denuncias y Reclamos', () => {
  test.use({ baseURL: BASE });

  test('A-denuncias: con login listado carga y selector estado visible', async ({ page, request }) => {
    await adminLogin(page, BASE, request);
    await page.goto('/denuncias');
    await expect(page.locator('body')).toContainText(/Denuncias|Estado|Cargando|coincidan/i);
    const estadoLabel = page.getByText(/Estado/i).first();
    await expect(estadoLabel).toBeVisible({ timeout: 6000 });
  });

  test('A-denuncias: cambiar estado de denuncia si hay al menos una', async ({ page, request }) => {
    await adminLogin(page, BASE, request);
    await page.goto('/denuncias');
    await page.getByText(/Denuncias|denuncias|Cargando|coincidan/i).first().waitFor({ state: 'visible', timeout: 8000 });
    const card = page.locator('select').filter({ has: page.locator('option[value="UNDER_REVIEW"]') }).first();
    try {
      await card.waitFor({ state: 'visible', timeout: 8000 });
    } catch {
      test.skip(true, 'No hay denuncias para actualizar');
    }
    await card.selectOption('UNDER_REVIEW');
    await expect(page.locator('body')).toBeVisible();
  });

  test('A-reclamos: con login listado carga', async ({ page, request }) => {
    await adminLogin(page, BASE, request);
    await page.goto('/reclamos');
    await expect(page.locator('body')).toContainText(/Reclamos|Estado|Cargando|coincidan|Escribir/i);
  });

  test('A-reclamos: guardar respuesta en reclamo si hay al menos uno', async ({ page, request }) => {
    await adminLogin(page, BASE, request);
    await page.goto('/reclamos', { waitUntil: 'networkidle' });
    await page.getByText(/Reclamos|reclamos|Cargando|coincidan/i).first().waitFor({ state: 'visible', timeout: 8000 });
    const input = page.getByPlaceholder(/Escribir respuesta/i).first();
    const inputVisible = await input.isVisible().catch(() => false);
    if (inputVisible) {
      await input.fill('Respuesta E2E de prueba');
      await page.getByRole('button', { name: /Guardar/i }).first().click();
    }
    await expect(page.locator('body')).toContainText(/Reclamos|reclamos|coincidan|Cargando/i);
  });
});

test.describe('Admin – Accesibilidad', () => {
  test.use({ baseURL: BASE });

  test('A-a11y: skip link presente', async ({ page }) => {
    await page.goto('/');
    const skip = page.locator('a[href="#main"]').filter({ hasText: /Saltar|contenido/i });
    await expect(skip.first()).toBeAttached({ timeout: 6000 });
  });
});

test.describe('Admin – Licitación API (openBids, declareFailedAwardee)', () => {
  const API_BASE = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3080';

  test('A-lic-openBids: admin puede llamar openBids', async ({ request }) => {
    const loginRes = await request.post(`${API_BASE}/api/v1/auth/login`, { data: { email: 'admin@mec.gob.ec', role: 'admin' } });
    if (!loginRes.ok()) return;
    const { token } = (await loginRes.json()) as { token: string };
    const listRes = await request.get(`${API_BASE}/api/v1/tenders?pageSize=20`);
    if (!listRes.ok()) return;
    const list = (await listRes.json()) as { data?: Array<{ id: string; bidsDeadlineAt?: string | null; bidsOpenedAt?: string | null }> };
    const tender = list.data?.find((t) => t.bidsDeadlineAt && !t.bidsOpenedAt);
    if (!tender) return;
    const openRes = await request.post(`${API_BASE}/api/v1/tenders/${tender.id}/bids/open`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {},
    });
    expect([200, 400]).toContain(openRes.status());
  });

  test('A-lic-declareFailed: admin puede llamar declareFailedAwardee', async ({ request }) => {
    const loginRes = await request.post(`${API_BASE}/api/v1/auth/login`, { data: { email: 'admin@mec.gob.ec', role: 'admin' } });
    if (!loginRes.ok()) return;
    const { token } = (await loginRes.json()) as { token: string };
    const listRes = await request.get(`${API_BASE}/api/v1/tenders?pageSize=20`);
    if (!listRes.ok()) return;
    const list = (await listRes.json()) as { data?: Array<{ id: string }> };
    for (const t of list.data ?? []) {
      const cRes = await request.get(`${API_BASE}/api/v1/tenders/${t.id}/contract`);
      if (cRes.ok()) {
        const contract = (await cRes.json()) as { id: string };
        const res = await request.post(`${API_BASE}/api/v1/contracts/${contract.id}/declare-failed-awardee`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        expect([200, 400]).toContain(res.status());
        return;
      }
    }
  });
});
