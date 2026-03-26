import { test, expect } from '@playwright/test';

const BASE = process.env.LEGACY_BASE_URL || 'http://localhost:5177';
const USERNAME = process.env.LEGACY_E2E_USER || 'cp_admin';
const PASSWORD = process.env.LEGACY_E2E_PASSWORD || 'Demo123!';

async function loginLegacy(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}/login`);
  await page.locator('input[type="text"]').first().fill(USERNAME);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  await page.locator('button[type="submit"]').first().click();
}

async function loginOrSkip(page: import('@playwright/test').Page): Promise<boolean> {
  await loginLegacy(page);
  const onLogin = /\/login$/.test(page.url());
  if (onLogin) {
    return false;
  }
  return true;
}

test.describe('Legacy GPTsercop RBAC and failure modes', () => {
  test('L1-admin: login and access GPT assistant route', async ({ page }) => {
    const loggedIn = await loginOrSkip(page);
    test.skip(!loggedIn, 'No fue posible autenticar en entorno local con credenciales legacy.');
    await page.goto(`${BASE}/cp/ai-assistant`);
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).toContainText(/Asistente|Inteligencia Artificial|GPT/i);
  });

  test('L2-deny: unauthenticated direct route redirects to login', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.evaluate(() => {
      localStorage.removeItem('globalcmx_token');
      localStorage.removeItem('globalcmx_user');
    });
    await page.goto(`${BASE}/cp/ai-assistant`);
    await expect(page).toHaveURL(/\/login$/);
  });

  test('L3-fallback: legal-help 403 does not crash assistant UI', async ({ page }) => {
    const loggedIn = await loginOrSkip(page);
    test.skip(!loggedIn, 'No fue posible autenticar en entorno local con credenciales legacy.');

    await page.route('**/api/compras-publicas/ai/legal-help', async (route) => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Forbidden',
          errorCode: 'PERMISSION_DENIED',
          message: 'Denied in test',
        }),
      });
    });

    await page.goto(`${BASE}/cp/ai-assistant`);
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).not.toContainText(/Error de Inicializaci[oó]n/i);
  });
});
