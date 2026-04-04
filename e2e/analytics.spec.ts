import { test, expect } from '@playwright/test';

/**
 * E2E – Plataforma Analítica SERCOP (admin portal).
 * Ejecutar con admin en marcha: puerto 3014 (o ADMIN_URL)
 */
test.describe('Analytics – Admin Dashboard', () => {
  test.use({ baseURL: process.env.ADMIN_URL || 'http://localhost:3014' });

  test('navegar a /analytics muestra título Analítica', async ({ page }) => {
    await page.goto('/analytics');
    await expect(page.getByRole('heading', { name: /analítica|plataforma analítica/i })).toBeVisible({ timeout: 10000 });
  });

  test('/analytics muestra links de navegación secundarios', async ({ page }) => {
    await page.goto('/analytics');
    await expect(page.getByRole('link', { name: /mercado/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('link', { name: /pac/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /riesgo/i })).toBeVisible();
  });

  test('/analytics muestra datos o enlace de login', async ({ page }) => {
    await page.goto('/analytics');
    const withSession = page.locator('[class*="rounded-xl"]').first();
    const withoutSession = page.getByRole('link', { name: /ir a login/i });
    await expect(withSession.or(withoutSession)).toBeVisible({ timeout: 12000 });
  });

  test('/analytics/market muestra tabla de mercado', async ({ page }) => {
    await page.goto('/analytics/market');
    await expect(page.getByRole('heading', { name: /análisis de mercado/i })).toBeVisible({ timeout: 10000 });
    const table = page.locator('table');
    const noData = page.getByText(/sin datos/i);
    const loginLink = page.getByRole('link', { name: /ir a login/i });
    await expect(table.or(noData).or(loginLink)).toBeVisible({ timeout: 12000 });
  });

  test('/analytics/market tiene selector de año y grupo', async ({ page }) => {
    await page.goto('/analytics/market');
    await expect(page.locator('select').first()).toBeVisible({ timeout: 8000 });
  });

  test('/analytics/pac muestra título PAC vs Ejecutado', async ({ page }) => {
    await page.goto('/analytics/pac');
    await expect(page.getByRole('heading', { name: /pac vs ejecutado/i })).toBeVisible({ timeout: 10000 });
  });

  test('/analytics/pac muestra tabla o sin datos', async ({ page }) => {
    await page.goto('/analytics/pac');
    const table = page.locator('table');
    const noData = page.getByText(/sin datos/i);
    const loginLink = page.getByRole('link', { name: /ir a login/i });
    await expect(table.or(noData).or(loginLink)).toBeVisible({ timeout: 12000 });
  });

  test('/analytics/risk muestra dashboard de riesgo', async ({ page }) => {
    await page.goto('/analytics/risk');
    await expect(page.getByRole('heading', { name: /dashboard de riesgo/i })).toBeVisible({ timeout: 10000 });
  });

  test('/analytics/risk muestra tabla o mensaje de sin evaluaciones', async ({ page }) => {
    await page.goto('/analytics/risk');
    const table = page.locator('table');
    const empty = page.getByText(/sin evaluaciones/i);
    const loginLink = page.getByRole('link', { name: /ir a login/i });
    await expect(table.or(empty).or(loginLink)).toBeVisible({ timeout: 12000 });
  });
});

test.describe('Analytics – Portal público', () => {
  test.use({ baseURL: process.env.PUBLIC_URL || 'http://localhost:3000' });

  test('/cifras carga correctamente', async ({ page }) => {
    await page.goto('/cifras');
    await expect(page.getByRole('heading', { name: /cifras|estadísticas|datos/i })).toBeVisible({ timeout: 10000 });
  });

  test('/transparencia muestra portal ciudadano', async ({ page }) => {
    await page.goto('/transparencia');
    await expect(page.getByRole('heading', { name: /transparencia/i })).toBeVisible({ timeout: 10000 });
  });

  test('/transparencia tiene botón Descargar CSV', async ({ page }) => {
    await page.goto('/transparencia');
    // The CSV button is present but may be disabled with no data
    const btn = page.getByRole('button', { name: /descargar csv/i });
    await expect(btn).toBeVisible({ timeout: 12000 });
  });

  test('/redes-proveedores carga la página de red', async ({ page }) => {
    await page.goto('/redes-proveedores');
    await expect(page.getByRole('heading', { name: /red de proveedores/i })).toBeVisible({ timeout: 10000 });
  });
});
