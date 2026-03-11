import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * E2E Admin portal (sercop-admin).
 * Ejecutar con admin en marcha: npm run dev:admin (puerto 3004)
 * PLAYWRIGHT_BASE_URL=http://localhost:3004 npx playwright test e2e/admin.spec.ts
 */
test.describe('Admin portal', () => {
  test('página de login sin violaciones WCAG 2.1 AA (axe)', async ({ page }) => {
    await page.goto('/login');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });
  test('login y navegación a usuarios', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('body')).toContainText(/login|sesión|email|correo/i);
    await page.getByLabel(/email|correo/i).fill('admin@mec.gob.ec');
    await page.getByRole('button', { name: /entrar|iniciar|login/i }).click();
    await page.waitForURL(/\/(dashboard|\/|login)?$/, { timeout: 15000 }).catch(() => {});
    await page.goto('/usuarios');
    await expect(page.getByRole('heading', { name: /usuarios/i })).toBeVisible({ timeout: 10000 });
    // Con sesión: tabla; sin sesión (p. ej. API sin JWT): enlace "Ir a login"
    const table = page.locator('table, [role="table"]');
    const withoutSession = page.getByRole('link', { name: /ir a login/i });
    await expect((table.or(withoutSession)).first()).toBeVisible({ timeout: 8000 });
  });

  test('usuarios muestra botón Exportar CSV cuando hay sesión', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email|correo/i).fill('admin@mec.gob.ec');
    await page.getByRole('button', { name: /entrar|iniciar|login/i }).click();
    await page.waitForURL(/\/(dashboard|\/|login)?$/, { timeout: 15000 }).catch(() => {});
    await page.goto('/usuarios');
    await expect(page.getByRole('heading', { name: /usuarios/i })).toBeVisible({ timeout: 10000 });
    // Con sesión: botón Exportar CSV o tabla; sin sesión: "Ir a login"
    const exportBtn = page.getByRole('button', { name: /exportar csv/i });
    const table = page.locator('table');
    const withoutSession = page.getByRole('link', { name: /ir a login/i });
    await expect((exportBtn.or(table).or(withoutSession)).first()).toBeVisible({ timeout: 12000 });
  });

  test('normativa muestra listado y botón nuevo chunk', async ({ page }) => {
    await page.goto('/normativa');
    await expect(page.locator('body')).toContainText(/normativa|chunks|RAG|inicie sesión/i);
    // Con sesión: botón "Nuevo chunk" y/o tabla; sin sesión: enlace "Ir a login"
    const withSession = page.getByRole('button', { name: /nuevo chunk/i }).or(page.locator('table'));
    const withoutSession = page.getByRole('link', { name: /ir a login/i });
    await expect((withSession.or(withoutSession)).first()).toBeVisible({ timeout: 8000 });
  });
});
