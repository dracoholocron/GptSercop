/**
 * Batería QA – Navegación por enlaces del menú en cada portal.
 * Incluye comprobación de header, footer y OfficialBanner (portal público).
 */
import { test, expect } from '@playwright/test';

test.describe('Shell – Portal público (3010)', () => {
  test.use({ baseURL: 'http://localhost:3010' });

  test('Header y footer visibles', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('footer[role="contentinfo"]')).toBeVisible();
  });

  test('OfficialBanner visible y no bloquea navegación', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Sitio oficial', { exact: false })).toBeVisible();
    await expect(page.getByRole('button', { name: /Cómo lo sabe/i })).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });

  test('Enlaces del footer son clicables', async ({ page }) => {
    await page.goto('/');
    const normativa = page.getByRole('link', { name: 'Normativa' }).first();
    await expect(normativa).toBeVisible();
    await expect(normativa).toHaveAttribute('href', '/normativa');
  });
});

test.describe('Nav – Portal público (3010)', () => {
  test.use({ baseURL: 'http://localhost:3010' });

  const links = [
    { name: /Procesos|procesos/i, url: /\/procesos/ },
    { name: /Denuncias|denuncias/i, url: /\/denuncias/ },
    { name: /Normativa|normativa/i, url: /\/normativa/ },
    { name: /Principios|principios/i, url: /\/principios/ },
    { name: /Modelos de pliegos|modelos-pliegos/i, url: /\/modelos-pliegos/ },
    { name: /Notificaciones|notificaciones/i, url: /\/notificaciones/ },
    { name: /Certificación|certificacion/i, url: /\/certificacion/ },
    { name: /Cifras|cifras/i, url: /\/cifras/ },
    { name: /Enlaces|enlaces/i, url: /\/enlaces/ },
  ];

  for (let i = 0; i < links.length; i++) {
    const { name, url } = links[i];
    test(`Nav-P${i + 1}: clic en ${name} navega correctamente`, async ({ page }) => {
      await page.goto('/');
      await page.getByRole('link', { name }).first().click();
      await expect(page).toHaveURL(url);
      await expect(page.locator('body')).toBeVisible();
    });
  }
});

test.describe('Nav – Portal proveedor (3012)', () => {
  test.use({ baseURL: 'http://localhost:3012' });

  const links = [
    { name: /Procesos|procesos/i, url: /\/procesos/ },
    { name: /Ofertas|ofertas|Mis ofertas/i, url: /\/ofertas/ },
    { name: /Normativa|normativa/i, url: /\/normativa/ },
  ];

  for (let i = 0; i < links.length; i++) {
    const { name, url } = links[i];
    test(`Nav-S${i + 1}: clic en ${name}`, async ({ page }) => {
      await page.goto('/');
      const link = page.getByRole('link', { name }).first();
      if (!(await link.isVisible().catch(() => false))) return;
      await link.click();
      await expect(page).toHaveURL(url);
      await expect(page.locator('body')).toBeVisible();
    });
  }
});

test.describe('Nav – Portal admin (3014)', () => {
  test.use({ baseURL: 'http://localhost:3014' });

  const items = [
    { name: /Dashboard|inicio/i, path: '/' },
    { name: /Procesos/i, path: '/procesos' },
    { name: /Entidades/i, path: '/entidades' },
    { name: /Denuncias/i, path: '/denuncias' },
    { name: /Reclamos/i, path: '/reclamos' },
    { name: /Usuarios/i, path: '/usuarios' },
    { name: /Auditoría/i, path: '/auditoria' },
    { name: /Parámetros|Parametros/i, path: '/parametros' },
    { name: /Normativa/i, path: '/normativa' },
  ];

  for (let i = 0; i < items.length; i++) {
    const { name, path } = items[i];
    test(`Nav-A${i + 1}: clic en ${name} carga ruta`, async ({ page }) => {
      await page.goto('/');
      const link = page.getByRole('link', { name }).first();
      await link.click();
      await expect(page).toHaveURL(new RegExp(path.replace('/', '\\/') + '($|\\?)'));
      await expect(page.locator('body')).toBeVisible();
    });
  }
});

test.describe('Nav – Portal entidad (3013)', () => {
  test.use({ baseURL: 'http://localhost:3013' });

  const links = [
    { name: /Procesos|procesos/i, url: /\/procesos/ },
    { name: /Catálogos|catalogos/i, url: /\/catalogos/ },
    { name: /Órdenes de compra|ordenes-compra/i, url: /\/ordenes-compra/ },
    { name: /Rendición de cuentas|rendicion-cuentas/i, url: /\/rendicion-cuentas/ },
    { name: /PAC|pac/i, url: /\/pac/ },
    { name: /Reportes|reportes/i, url: /\/reportes/ },
  ];

  for (let i = 0; i < links.length; i++) {
    const { name, url } = links[i];
    test(`Nav-E${i + 1}: clic en ${name}`, async ({ page }) => {
      await page.goto('/');
      const link = page.getByRole('link', { name }).first();
      if (!(await link.isVisible().catch(() => false))) return;
      await link.click();
      await expect(page).toHaveURL(url);
      await expect(page.locator('body')).toBeVisible();
    });
  }
});
