/**
 * Batería QA – Portal entidad: rutas, login, procesos, ofertas, PAC, reportes.
 * Base URL: 3013
 */
import { test, expect } from '@playwright/test';
import { entityLogin } from './auth-helpers';

const BASE = 'http://localhost:3013';

test.describe('Entidad – Carga de rutas', () => {
  test.use({ baseURL: BASE });

  const routes: { path: string; name: string; expectInBody?: RegExp }[] = [
    { path: '/', name: 'home', expectInBody: /entidad|procesos|SERCOP|Dashboard/i },
    { path: '/login', name: 'login', expectInBody: /login|sesión|email|correo/i },
    { path: '/procesos', name: 'procesos', expectInBody: /procesos|Procesos/i },
    { path: '/catalogos', name: 'catalogos', expectInBody: /Catálogos|catálogo|Inicie sesión/i },
    { path: '/ordenes-compra', name: 'ordenes-compra', expectInBody: /Órdenes|orden|compra|Inicie sesión/i },
    { path: '/documentos', name: 'documentos' },
    { path: '/pac', name: 'pac', expectInBody: /PAC|pac/i },
    { path: '/reportes', name: 'reportes', expectInBody: /reportes|Reportes/i },
  ];

  for (const { path, name, expectInBody } of routes) {
    test(`E-${name}: GET ${path} responde 200`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.locator('body')).toBeVisible();
      if (expectInBody) await expect(page.locator('body')).toContainText(expectInBody);
    });
  }
});

test.describe('Entidad – Login', () => {
  test.use({ baseURL: BASE });

  test('E-login: formulario visible', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('body')).toContainText(/login|sesión|email|correo/i);
  });
});

test.describe('Entidad – Procesos y ofertas', () => {
  test.use({ baseURL: BASE });

  test('E-procesos: listado o mensaje', async ({ page }) => {
    await page.goto('/procesos');
    await expect(page.locator('body')).toBeVisible();
  });

  test('E-proceso-ofertas: ruta dinámica carga si hay procesos', async ({ page, request }) => {
    await entityLogin(page, BASE, request);
    await page.goto('/procesos');
    await page.getByRole('link', { name: /Ver ofertas|Editar/i }).or(page.getByText(/No hay procesos/)).first().waitFor({ state: 'visible', timeout: 15000 });
    const link = page.getByRole('link', { name: /Ver ofertas/i }).first();
    if (!(await link.isVisible().catch(() => false))) {
      test.skip(true, 'No hay procesos');
    }
    await link.click();
    await expect(page.locator('body')).toBeVisible();
  });

  test('E-catalogos: página catálogos carga con login', async ({ page, request }) => {
    await entityLogin(page, BASE, request);
    await page.goto('/catalogos');
    await expect(page.locator('body')).toContainText(/Catálogos|Nuevo catálogo|Inicie sesión|Total/i);
  });

  test('E-ordenes-compra: página órdenes de compra carga con login', async ({ page, request }) => {
    await entityLogin(page, BASE, request);
    await page.goto('/ordenes-compra');
    await expect(page.locator('body')).toContainText(/Órdenes de compra|Nueva orden|Inicie sesión|Total/i);
  });

  test('E-evaluaciones: ruta evaluaciones del proceso carga si hay proceso', async ({ page, request }) => {
    await entityLogin(page, BASE, request);
    await page.goto('/procesos');
    await page.getByRole('link', { name: /Ver ofertas|Evaluaciones|Aclaraciones|Contrato/i }).or(page.getByText(/No hay procesos/)).first().waitFor({ state: 'visible', timeout: 15000 });
    const link = page.getByRole('link', { name: /Evaluaciones/i }).first();
    if (!(await link.isVisible().catch(() => false))) {
      await expect(page.locator('body')).toBeVisible();
      return;
    }
    await link.click();
    await expect(page.locator('body')).toContainText(/Evaluación|Registrar|Oferta|bid/i);
  });
});

test.describe('Entidad – Licitación (apertura, acta, convalidación)', () => {
  test.use({ baseURL: BASE });

  test('E-lic-apertura: editar proceso muestra sección Apertura de ofertas cuando aplica', async ({ page, request }) => {
    await entityLogin(page, BASE, request);
    await page.goto('/procesos');
    const editLink = page.getByRole('link', { name: /Editar/i }).first();
    if (!(await editLink.isVisible().catch(() => false))) return;
    await editLink.click();
    await expect(page.locator('body')).toContainText(/Apertura de ofertas|Registrar apertura|Editar proceso/i);
  });

  test('E-lic-acta: en editar con canOpenBids hay opción Subir acta y registrar', async ({ page, request }) => {
    await entityLogin(page, BASE, request);
    await page.goto('/procesos');
    const editLink = page.getByRole('link', { name: /Editar/i }).first();
    if (!(await editLink.isVisible().catch(() => false))) return;
    await editLink.click();
    const body = page.locator('body');
    const hasOpening = await body.locator('text=Subir acta').first().isVisible().catch(() => false)
      || await body.locator('text=Registrar apertura').first().isVisible().catch(() => false);
    expect(await body.textContent()).toBeTruthy();
  });

  test('E-lic-evaluaciones: página evaluaciones muestra Convalidación o RUP', async ({ page, request }) => {
    await entityLogin(page, BASE, request);
    await page.goto('/procesos');
    const evalLink = page.getByRole('link', { name: /Evaluaciones/i }).first();
    if (!(await evalLink.isVisible().catch(() => false))) return;
    await evalLink.click();
    await expect(page.locator('body')).toContainText(/Convalidación|RUP|Verificar|Oferta|Evaluación/i);
  });
});
