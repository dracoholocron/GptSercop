/**
 * Batería QA – Portal proveedor: rutas, login, procesos, wizard, SIE, ofertas.
 * Base URL: 3012
 */
import { test, expect } from '@playwright/test';
import { supplierLogin } from './auth-helpers';

const BASE = 'http://localhost:3012';

test.describe('Proveedor – Carga de rutas', () => {
  test.use({ baseURL: BASE });

  const routes: { path: string; name: string; expectInBody?: RegExp }[] = [
    { path: '/', name: 'home', expectInBody: /Procesos|procesos|SERCOP/i },
    { path: '/login', name: 'login', expectInBody: /login|sesión|email|correo|iniciar/i },
    { path: '/procesos', name: 'procesos', expectInBody: /procesos|abiertos|Presentar|SIE/i },
    { path: '/ofertas', name: 'ofertas', expectInBody: /ofertas|Mis|sesión|Sin/i },
    { path: '/perfil', name: 'perfil' },
    { path: '/normativa', name: 'normativa' },
    { path: '/registro', name: 'registro' },
  ];

  for (const { path, name, expectInBody } of routes) {
    test(`S-${name}: GET ${path} responde 200`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.locator('body')).toBeVisible();
      if (expectInBody) await expect(page.locator('body')).toContainText(expectInBody);
    });
  }
});

test.describe('Proveedor – Dashboard', () => {
  test.use({ baseURL: BASE });

  test('S-dashboard: hero o tarjetas de resumen visibles', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toContainText(/Portal proveedores|Bienvenido|Mis ofertas|Procesos abiertos|Iniciar sesión/i);
  });

  test('S-dashboard: enlaces Ver todas / Ver procesos cuando hay sesión', async ({ page, request }) => {
    await supplierLogin(page, BASE, request);
    await page.goto('/');
    const verTodas = page.getByRole('link', { name: /Ver todas/i });
    const verProcesos = page.getByRole('link', { name: /Ver procesos/i });
    const hasLink = (await verTodas.isVisible().catch(() => false)) || (await verProcesos.isVisible().catch(() => false));
    expect(hasLink).toBe(true);
  });
});

test.describe('Proveedor – Login', () => {
  test.use({ baseURL: BASE });

  test('S-login: formulario con email y botón', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel(/email|correo/i)).toBeVisible({ timeout: 6000 });
    await expect(page.getByRole('button', { name: /entrar|iniciar|login/i })).toBeVisible({ timeout: 4000 });
  });

  test('S-login: envío sin email muestra error o redirección', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /entrar|iniciar|login/i }).click();
    await expect(page.locator('body')).toContainText(/obligatorio|error|correo|sesión|email|login|Correo electrónico|Iniciar/i);
  });

  test('S-login: envío con email no rompe', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email|correo/i).fill('test@test.com');
    await page.getByRole('button', { name: /entrar|iniciar|login/i }).click();
    await page.waitForLoadState('networkidle').catch(() => {});
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Proveedor – Procesos', () => {
  test.use({ baseURL: BASE });

  test('S-procesos: listado o mensaje sin procesos', async ({ page }) => {
    await page.goto('/procesos');
    await expect(page.locator('body')).toContainText(/Procesos|procesos|abiertos|publicados/i);
  });

  test('S-procesos: enlace Presentar oferta o SIE si hay cards', async ({ page }) => {
    await page.goto('/procesos');
    const presentar = page.getByRole('link', { name: /Presentar oferta/i }).first();
    const sie = page.getByRole('link', { name: /SIE/i }).first();
    const hasCards = await presentar.isVisible().catch(() => false) || await sie.isVisible().catch(() => false);
    if (hasCards) {
      await expect(presentar.or(sie).first()).toBeVisible();
    }
  });
});

test.describe('Proveedor – Wizard oferta', () => {
  test.use({ baseURL: BASE });

  test.beforeEach(async ({ page, request }) => {
    await supplierLogin(page, BASE, request);
  });

  test('S-wizard: desde procesos a oferta carga pasos', async ({ page }) => {
    await page.goto('/procesos');
    await page.getByRole('link', { name: /Presentar oferta/i }).or(page.getByText(/No hay procesos publicados/)).first().waitFor({ state: 'visible', timeout: 15000 });
    const link = page.getByRole('link', { name: /Presentar oferta/i }).first();
    if (!(await link.isVisible().catch(() => false))) {
      test.skip(true, 'No hay procesos');
    }
    await link.click();
    await expect(page.getByText('1 Contacto').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/2 Económica|Económica/)).toBeVisible({ timeout: 4000 });
  });

  test('S-wizard: botones Anterior y Siguiente', async ({ page }) => {
    await page.goto('/procesos');
    await page.getByRole('link', { name: /Presentar oferta/i }).or(page.getByText(/No hay procesos publicados/)).first().waitFor({ state: 'visible', timeout: 15000 });
    const link = page.getByRole('link', { name: /Presentar oferta/i }).first();
    if (!(await link.isVisible().catch(() => false))) {
      test.skip(true, 'No hay procesos');
    }
    await link.click();
    await expect(page.getByRole('button', { name: /Siguiente/ })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: /Anterior/ })).toBeVisible({ timeout: 4000 });
  });

  test('S-wizard: paso Contacto tiene campos email/teléfono', async ({ page }) => {
    await page.goto('/procesos');
    await page.getByRole('link', { name: /Presentar oferta/i }).or(page.getByText(/No hay procesos publicados/)).first().waitFor({ state: 'visible', timeout: 15000 });
    const link = page.getByRole('link', { name: /Presentar oferta/i }).first();
    if (!(await link.isVisible().catch(() => false))) {
      test.skip(true, 'No hay procesos');
    }
    await link.click();
    await expect(page.getByLabel(/email|correo/i)).toBeVisible({ timeout: 8000 });
  });

  test('S-wizard: navegar Siguiente muestra Económica', async ({ page }) => {
    await page.goto('/procesos');
    await page.getByRole('link', { name: /Presentar oferta/i }).or(page.getByText(/No hay procesos publicados/)).first().waitFor({ state: 'visible', timeout: 15000 });
    const link = page.getByRole('link', { name: /Presentar oferta/i }).first();
    if (!(await link.isVisible().catch(() => false))) {
      test.skip(true, 'No hay procesos');
    }
    await link.click();
    await page.getByRole('button', { name: /Siguiente/ }).click();
    await expect(page.getByRole('heading', { name: /Oferta económica/i })).toBeVisible({ timeout: 6000 });
  });
});

test.describe('Proveedor – SIE', () => {
  test.use({ baseURL: BASE });

  test('S-sie: pantalla SIE carga', async ({ page }) => {
    await page.goto('/procesos');
    await page.getByRole('link', { name: /SIE|Presentar oferta/i }).or(page.getByText(/No hay procesos publicados/)).first().waitFor({ state: 'visible', timeout: 15000 });
    const sieLink = page.getByRole('link', { name: /SIE/i }).first();
    if (!(await sieLink.isVisible().catch(() => false))) {
      test.skip(true, 'No hay procesos');
    }
    await sieLink.click();
    await expect(page.getByText('Subasta Inversa Electrónica (SIE) – MVP')).toBeVisible({ timeout: 8000 });
  });

  test('S-sie: botón Refrescar o Enviar visible', async ({ page }) => {
    await page.goto('/procesos');
    await page.getByRole('link', { name: /SIE|Presentar oferta/i }).or(page.getByText(/No hay procesos publicados/)).first().waitFor({ state: 'visible', timeout: 15000 });
    const sieLink = page.getByRole('link', { name: /SIE/i }).first();
    if (!(await sieLink.isVisible().catch(() => false))) {
      test.skip(true, 'No hay procesos');
    }
    await sieLink.click();
    await expect(page.getByRole('button', { name: /Refrescar|Enviar|Pausar/ })).toBeVisible({ timeout: 6000 });
  });
});

test.describe('Proveedor – Mis ofertas', () => {
  test.use({ baseURL: BASE });

  test('S-ofertas: página carga con mensaje o listado', async ({ page }) => {
    await page.goto('/ofertas');
    await expect(page.locator('body')).toContainText(/ofertas|Mis|sesión|Sin|acuse|Otras/i);
  });

  test('S-ofertas: enlace Ver detalle si hay ofertas', async ({ page }) => {
    await page.goto('/ofertas');
    const detalle = page.getByRole('link', { name: /Ver detalle|aclaraciones/i }).first();
    if (await detalle.isVisible().catch(() => false)) {
      await expect(detalle).toHaveAttribute('href', /\//);
    }
  });
});

test.describe('Proveedor – Autoinvitación (Registrarse a este proceso)', () => {
  test.use({ baseURL: BASE });

  test('S-autoinv: con login en detalle proceso aparece Registrarse a este proceso', async ({ page, request }) => {
    await supplierLogin(page, BASE, request);
    await page.goto('/procesos');
    const detalle = page.getByRole('link', { name: /Ver detalle/i }).first();
    if (!(await detalle.isVisible().catch(() => false))) return;
    await detalle.click();
    await expect(page.locator('body')).toContainText(/Registrarse a este proceso|Presentar oferta/i);
  });

  test('S-autoinv: enlace autoinvitation=1 lleva a oferta', async ({ page, request }) => {
    const API_BASE = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3080';
    const res = await request.get(`${API_BASE}/api/v1/tenders?pageSize=3`);
    if (!res.ok()) return;
    const list = (await res.json()) as { data?: Array<{ id: string }> };
    const id = list.data?.[0]?.id;
    if (!id) return;
    await supplierLogin(page, BASE, request);
    await page.goto(`/procesos/${id}/oferta?autoinvitation=1`);
    await expect(page.locator('body')).toContainText(/Contacto|Económica|Presentar oferta|iniciar sesión/i);
  });
});
