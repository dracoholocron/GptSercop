/**
 * Batería QA – Portal público: navegación, contenido y accesibilidad.
 * Base URL: 3010
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3010';

test.describe('Portal público – Carga de rutas', () => {
  test.use({ baseURL: BASE });

  const routes: { path: string; name: string; expectText?: RegExp }[] = [
    { path: '/', name: 'home', expectText: /SERCOP|procesos|normativa/i },
    { path: '/procesos', name: 'procesos', expectText: /Buscar|procesos|Resultados/i },
    { path: '/denuncias', name: 'denuncias', expectText: /Denuncias|denuncia|Registrar|Canal/i },
    { path: '/normativa', name: 'normativa', expectText: /normativa|búsqueda|RAG/i },
    { path: '/modelos-pliegos', name: 'modelos-pliegos', expectText: /Modelos de pliegos|pliegos|documentos/i },
    { path: '/notificaciones', name: 'notificaciones', expectText: /Notificaciones|comunicados|Oficios|No hay/i },
    { path: '/certificacion', name: 'certificacion', expectText: /Certificación|fundamentos|sábados|registro/i },
    { path: '/cifras', name: 'cifras', expectText: /Procesos|Contratos|Proveedores|Cargando/i },
    { path: '/enlaces', name: 'enlaces', expectText: /enlaces|sitio|ir/i },
    { path: '/servicios', name: 'servicios' },
  ];

  for (const { path, name, expectText } of routes) {
    test(`P-${name}: GET ${path} responde 200`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.locator('body')).toBeVisible();
      if (expectText) await expect(page.locator('body')).toContainText(expectText);
    });
  }
});

test.describe('Portal público – Procesos', () => {
  test.use({ baseURL: BASE });

  test('P-procesos: filtros colapsables y botón Buscar', async ({ page }) => {
    await page.goto('/procesos');
    const summary = page.getByText('Filtros', { exact: true }).first();
    await summary.click().catch(() => {});
    const buscar = page.getByRole('button', { name: /Buscar/i });
    await expect(buscar).toBeVisible({ timeout: 10000 });
  });

  test('P-procesos: cuerpo contiene resultados o mensaje vacío', async ({ page }) => {
    await page.goto('/procesos');
    await expect(page.locator('body')).toContainText(/Resultados|encontrado|No hay|proceso/i);
  });

  test('P-procesos: enlace a detalle si hay al menos una card', async ({ page }) => {
    await page.goto('/procesos');
    const verDetalle = page.getByRole('link', { name: /Ver detalle/i }).first();
    if (await verDetalle.isVisible().catch(() => false)) {
      await expect(verDetalle).toHaveAttribute('href', /\//);
    }
  });

  test('P-procesos: badge de tipo o territorio visible cuando hay resultados', async ({ page }) => {
    await page.goto('/procesos');
    await page.getByText(/Resultados|encontrado|No hay|proceso/i).first().waitFor({ state: 'visible', timeout: 10000 });
    const card = page.locator('[class*="rounded-lg"]').filter({ hasText: /Ver detalle|Presupuesto|Cierre/ }).first();
    if (await card.isVisible().catch(() => false)) {
      await expect(page.locator('body')).toContainText(/Licitación|SIE|Catálogo|Amazonía|Galápagos|Ordinario|Ínfima/i);
    }
  });

  test('P-procesos: paginación o lista visible', async ({ page }) => {
    await page.goto('/procesos');
    await expect(page.locator('main')).toBeVisible();
  });

  test('P-procesos: botón Exportar CSV visible y no falla al pulsar', async ({ page }) => {
    await page.goto('/procesos');
    const exportBtn = page.getByRole('button', { name: /Exportar CSV/i });
    await expect(exportBtn).toBeVisible({ timeout: 10000 });
    await exportBtn.click();
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Portal público – Normativa', () => {
  test.use({ baseURL: BASE });

  test('P-normativa: input de búsqueda visible', async ({ page }) => {
    await page.goto('/normativa');
    await expect(page.getByPlaceholder(/contratación|RUP|PAC|buscar/i)).toBeVisible({ timeout: 8000 });
  });

  test('P-normativa: envío de búsqueda no rompe la página', async ({ page }) => {
    await page.goto('/normativa');
    const input = page.getByPlaceholder(/contratación|RUP|PAC|buscar/i).first();
    await input.fill('contratación').catch(() => {});
    await page.getByRole('button', { name: /Buscar|buscar/i }).first().click().catch(() => {});
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Portal público – Detalle proceso', () => {
  test.use({ baseURL: BASE });

  test('P-proceso-id: ruta dinámica /proceso/[id] carga con id válido', async ({ page }) => {
    await page.goto('/procesos');
    await page.getByRole('link', { name: /Ver detalle/i }).or(page.getByText(/No hay procesos/)).first().waitFor({ state: 'visible', timeout: 15000 });
    const link = page.getByRole('link', { name: /Ver detalle/i }).first();
    if (!(await link.isVisible().catch(() => false))) {
      test.skip(true, 'No hay procesos para navegar');
    }
    const href = await link.getAttribute('href');
    if (!href) return;
    const res = await page.goto(href.startsWith('http') ? href : `${BASE}${href}`);
    expect(res?.status()).toBe(200);
    await expect(page.locator('body')).toBeVisible();
  });

  test('P-proceso-id: cuerpo puede mostrar aclaraciones o participar', async ({ page }) => {
    await page.goto('/procesos');
    await page.getByRole('link', { name: /Ver detalle/i }).or(page.getByText(/No hay procesos/)).first().waitFor({ state: 'visible', timeout: 15000 });
    const link = page.getByRole('link', { name: /Ver detalle/i }).first();
    if (!(await link.isVisible().catch(() => false))) {
      test.skip(true, 'No hay procesos');
    }
    const href = await link.getAttribute('href');
    if (!href) return;
    await page.goto(href.startsWith('http') ? href : `${BASE}${href}`);
    await expect(page.locator('body')).toContainText(/Participar|Preguntas y aclaraciones|proceso|Estado|Monto/i);
  });
});

test.describe('Portal público – Denuncias', () => {
  test.use({ baseURL: BASE });

  test('P-denuncias: formulario con categoría y resumen', async ({ page }) => {
    await page.goto('/denuncias');
    await expect(page.getByLabel(/Categoría/i).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByLabel(/Resumen/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('P-denuncias: botón Enviar denuncia visible', async ({ page }) => {
    await page.goto('/denuncias');
    await expect(page.getByRole('button', { name: /Enviar denuncia/i })).toBeVisible({ timeout: 8000 });
  });

  test('P-denuncias: enviar denuncia mínima (categoría + resumen)', async ({ page }) => {
    await page.goto('/denuncias');
    const categorySelect = page.locator('select').filter({ has: page.locator('option[value="TRANSPARENCIA"]') }).first();
    await categorySelect.waitFor({ state: 'visible', timeout: 8000 });
    await categorySelect.selectOption('TRANSPARENCIA');
    await page.getByPlaceholder(/Breve descripción/i).fill('Prueba E2E denuncia');
    await page.getByRole('button', { name: /Enviar denuncia/i }).click();
    await expect(page.locator('body')).toContainText(/registrada|correctamente|recibido|Denuncia/i, { timeout: 10000 });
  });
});

test.describe('Portal público – Hero y CTA', () => {
  test.use({ baseURL: BASE });

  test('P-hero: título principal visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 }).filter({ hasText: /Encuentra|procesos|contratación/i })).toBeVisible({ timeout: 8000 });
  });

  test('P-hero: CTA Buscar visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /Buscar/i }).first()).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Portal público – Accesibilidad', () => {
  test.use({ baseURL: BASE });

  test('P-a11y: skip link presente', async ({ page }) => {
    await page.goto('/');
    const skip = page.locator('a[href="#main"]').filter({ hasText: /Saltar|contenido/i });
    await expect(skip.first()).toBeAttached({ timeout: 8000 });
  });

  test('P-a11y: home tiene título o heading', async ({ page }) => {
    await page.goto('/');
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible({ timeout: 5000 });
  });
});
