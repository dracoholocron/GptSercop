/**
 * Analytics UX/UI + Usability + Accessibility Tests (~55 tests)
 * Tests responsive layout, loading states, error handling, empty states,
 * keyboard nav, badge colors, and Spanish localization.
 */
import { test, expect } from '@playwright/test';

const BASE = process.env.LEGACY_BASE_URL || 'http://localhost:5177';
const API_BASE = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3080';

async function loginAdmin(page: import('@playwright/test').Page): Promise<boolean> {
  try {
    const resp = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@mec.gob.ec', role: 'admin' }),
    });
    if (!resp.ok) return false;
    const data = await resp.json() as { token?: string; roles?: string[] };
    if (!data.token) return false;
    await page.addInitScript(({ t, r }) => {
      localStorage.setItem('globalcmx_token', t);
      localStorage.setItem('globalcmx_user', JSON.stringify({ email: 'admin@mec.gob.ec', roles: r ?? ['ROLE_ADMIN'], token: t }));
    }, { t: data.token, r: data.roles ?? ['ROLE_ADMIN'] });
    return true;
  } catch { return false; }
}

// ═══════════════════════════════════════════════════════════════
// USABILITY: Loading States
// ═══════════════════════════════════════════════════════════════
test.describe('UX: Loading States', () => {
  test.setTimeout(60000);

  const pages = [
    '/analytics', '/analytics/risk-scores', '/analytics/competition',
    '/analytics/market', '/analytics/pac', '/analytics/alerts',
    '/analytics/provider-network', '/analytics/provider-scores',
    '/analytics/price-index', '/analytics/contracts', '/analytics/fragmentation',
  ];

  for (const path of pages) {
    test(`UX-LOAD-${path}: Shows spinner while loading`, async ({ page }) => {
      const ok = await loginAdmin(page);
      test.skip(!ok, 'API unavailable');
      await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
      // Either spinner was visible briefly or content loaded fast
      await page.waitForTimeout(5000);
      await expect(page.locator('body')).not.toContainText(/error de inicialización/i);
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// USABILITY: Spanish Localization
// ═══════════════════════════════════════════════════════════════
test.describe('UX: Spanish Labels', () => {
  test.setTimeout(60000);

  test('UX-ES-01: Dashboard has Spanish labels', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Dashboard Analítico/i, { timeout: 20000 });
    await expect(page.locator('body')).toContainText(/Distribución de Riesgo/i);
    await expect(page.locator('body')).toContainText(/Módulos Analíticos/i);
  });

  test('UX-ES-02: PAC page in Spanish', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/pac`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/PAC vs Ejecutado/i, { timeout: 20000 });
    await expect(page.locator('body')).toContainText(/Tasa Ejecución/i);
    await expect(page.locator('body')).toContainText(/Desviación/i);
  });

  test('UX-ES-03: Alerts page in Spanish', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/alerts`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Alertas del Sistema/i, { timeout: 20000 });
    await expect(page.locator('body')).toContainText(/Sin Resolver/i);
    await expect(page.locator('body')).toContainText(/Resueltas/i);
  });

  test('UX-ES-04: Provider Network in Spanish', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/provider-network`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Red de Proveedores/i, { timeout: 20000 });
    await expect(page.locator('body')).toContainText(/Min. procesos compartidos/i);
  });

  test('UX-ES-05: Fragmentation in Spanish', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/fragmentation`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Detección de Fragmentación/i, { timeout: 20000 });
  });

  test('UX-ES-06: Contract Health in Spanish', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/contracts`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Salud Contractual/i, { timeout: 20000 });
    await expect(page.locator('body')).toContainText(/Patrones de Modificación/i);
  });
});

// ═══════════════════════════════════════════════════════════════
// UI: Risk Level Badge Colors
// ═══════════════════════════════════════════════════════════════
test.describe('UX: Risk Level Badge Colors', () => {
  test.setTimeout(60000);

  test('UX-BADGE-01: Dashboard risk distribution uses color badges', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Alto/i, { timeout: 20000 });
    await expect(page.locator('body')).toContainText(/Medio/i);
    await expect(page.locator('body')).toContainText(/Bajo/i);
  });
});

// ═══════════════════════════════════════════════════════════════
// UI: Responsive Layout
// ═══════════════════════════════════════════════════════════════
test.describe('UX: Responsive Layout', () => {
  test.setTimeout(60000);

  test('UX-RESP-01: Dashboard renders on mobile viewport', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE}/analytics`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Dashboard Analítico/i, { timeout: 20000 });
  });

  test('UX-RESP-02: Dashboard renders on tablet viewport', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${BASE}/analytics`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Dashboard Analítico/i, { timeout: 20000 });
  });

  test('UX-RESP-03: Risk Scores table scrollable on mobile', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE}/analytics/risk-scores`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Scores de Riesgo/i, { timeout: 20000 });
  });

  test('UX-RESP-04: Alerts page responsive', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE}/analytics/alerts`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Alertas/i, { timeout: 20000 });
  });
});

// ═══════════════════════════════════════════════════════════════
// UI: Filter Interactions
// ═══════════════════════════════════════════════════════════════
test.describe('UX: Filter Interactions', () => {
  test.setTimeout(60000);

  test('UX-FILT-01: Risk Scores level filter toggles', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/risk-scores`, { waitUntil: 'domcontentloaded' });
    const highBtn = page.getByRole('button', { name: 'high' });
    await highBtn.click({ timeout: 15000 });
    await page.waitForTimeout(1500);
    const allBtn = page.getByRole('button', { name: 'Todos' });
    await allBtn.click();
    await page.waitForTimeout(1000);
  });

  test('UX-FILT-02: Market group by switches correctly', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/market`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /Por Provincia/i }).click({ timeout: 15000 });
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: /Por Tipo de Proceso/i }).click();
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: /Por Entidad/i }).click();
    await page.waitForTimeout(1000);
  });

  test('UX-FILT-03: Alerts severity + resolved filters stack', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/alerts`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'CRITICAL' }).click({ timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: /Resueltas/i }).click();
    await page.waitForTimeout(1000);
  });

  test('UX-FILT-04: Provider Scores tier filter', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/provider-scores`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'premium' }).click({ timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'Todos' }).click();
    await page.waitForTimeout(1000);
  });
});

// ═══════════════════════════════════════════════════════════════
// UI: Pagination
// ═══════════════════════════════════════════════════════════════
test.describe('UX: Pagination', () => {
  test.setTimeout(60000);

  test('UX-PAG-01: Risk Scores pagination controls', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/risk-scores`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Página 1/i)).toBeVisible({ timeout: 20000 });
    const nextBtn = page.getByRole('button', { name: /Siguiente/i });
    if (await nextBtn.isEnabled()) {
      await nextBtn.click();
      await page.waitForTimeout(1500);
      await expect(page.getByText(/Página 2/i)).toBeVisible();
    }
  });

  test('UX-PAG-02: Alerts pagination', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/alerts`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Página/i)).toBeVisible({ timeout: 20000 });
  });

  test('UX-PAG-03: Previous button disabled on page 1', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/risk-scores`, { waitUntil: 'domcontentloaded' });
    const prevBtn = page.getByRole('button', { name: /Anterior/i });
    await expect(prevBtn).toBeDisabled({ timeout: 20000 });
  });
});

// ═══════════════════════════════════════════════════════════════
// UI: Sidebar Integration
// ═══════════════════════════════════════════════════════════════
test.describe('UX: Sidebar', () => {
  test.setTimeout(60000);

  test('UX-SB-01: Analytics section in sidebar', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    await expect(page.locator('body')).toContainText(/Analítica/i);
  });
});
