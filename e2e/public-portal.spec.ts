import { test, expect } from '@playwright/test';

/**
 * E2E tests – Portal público.
 * Requiere: npm run start --workspace=public-portal (puerto 3001)
 * O: npm run dev:public-portal
 */
test.describe('Portal público', () => {
  test('home carga correctamente', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.status()).toBe(200);
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText(/SERCOP|procesos|normativa/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('procesos carga y tiene filtros', async ({ page }) => {
    const res = await page.goto('/procesos');
    expect(res?.status()).toBe(200);
    // el botón está dentro de <details>; abrir "Filtros" si está colapsado
    const buscar = page.getByRole('button', { name: /Buscar/i });
    if (!(await buscar.isVisible().catch(() => false))) {
      await page.getByText('Filtros', { exact: true }).first().click().catch(() => {});
    }
    await expect(buscar).toBeVisible({ timeout: 15000 });
  });

  test('normativa tiene búsqueda', async ({ page }) => {
    const res = await page.goto('/normativa');
    expect(res?.status()).toBe(200);
    await expect(page.getByPlaceholder(/contratación|RUP|PAC/i)).toBeVisible({ timeout: 15000 });
  });

  test('cifras carga dashboard', async ({ page }) => {
    const res = await page.goto('/cifras');
    expect(res?.status()).toBe(200);
    await expect(page.locator('body')).toContainText(/Procesos|Contratos|Proveedores|Cargando/i);
  });

  test('skip link para accesibilidad', async ({ page }) => {
    await page.goto('/');
    const skipLink = page.locator('a[href="#main"]').filter({ hasText: /Saltar|contenido/i });
    await expect(skipLink).toBeAttached({ timeout: 15000 });
  });
});
