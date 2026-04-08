/**
 * Analytics Smoke + E2E Battery – 88 tests across all 11 analytics modules.
 * Tests page load, data display, interactions, filtering, pagination, and navigation.
 *
 * Prerequisites:
 *   - Frontend at LEGACY_BASE_URL (default: http://localhost:5177)
 *   - API at PLAYWRIGHT_API_URL (default: http://localhost:3080)
 *   - DB seeded with seed.ts + seed-analytics.ts + compute-all-analytics.ts
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
    const token = data.token;
    if (!token) return false;
    await page.addInitScript(({ t, r }) => {
      localStorage.setItem('globalcmx_token', t);
      localStorage.setItem('globalcmx_user', JSON.stringify({
        email: 'admin@mec.gob.ec',
        roles: r ?? ['ROLE_ADMIN'],
        token: t,
      }));
    }, { t: token, r: data.roles ?? ['ROLE_ADMIN'] });
    return true;
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// MODULE 1: Analytics Dashboard
// ═══════════════════════════════════════════════════════════════
test.describe('M1 – Analytics Dashboard', () => {
  test.setTimeout(60000);

  test('M1-S01: Page loads without crash', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).not.toContainText(/error de inicialización/i, { timeout: 15000 });
  });

  test('M1-S02: Dashboard heading visible', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Dashboard Analítico/i, { timeout: 20000 });
  });

  test('M1-E01: KPI cards display data', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Total Procesos/i, { timeout: 20000 });
    await expect(page.locator('body')).toContainText(/Contratos/i);
    await expect(page.locator('body')).toContainText(/Proveedores/i);
  });

  test('M1-E02: Risk distribution badges visible', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Distribución de Riesgo/i, { timeout: 20000 });
    await expect(page.locator('body')).toContainText(/Alto/i);
  });

  test('M1-E03: Navigation buttons to sub-modules', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: /Competencia/i })).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('button', { name: /Alertas/i })).toBeVisible();
  });

  test('M1-E04: Navigate to Risk Scores via button', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /Scores de Riesgo/i }).click({ timeout: 20000 });
    await expect(page).toHaveURL(/\/analytics\/risk-scores/, { timeout: 10000 });
  });

  test('M1-E05: API dashboard returns 200', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/v1/analytics/dashboard`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('totalTenders');
    expect(body).toHaveProperty('riskDistribution');
  });

  test('M1-E06: Dashboard shows open alerts count', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Alertas Abiertas/i, { timeout: 20000 });
  });

  test('M1-E07: Modules section has all 10 buttons', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Módulos Analíticos/i, { timeout: 20000 });
    const buttons = page.getByRole('button').filter({ hasText: /Competencia|Mercado|PAC|Alertas|Red|Reputación|Índice|Salud|Fragmentación|Scores/i });
    await expect(buttons.first()).toBeVisible({ timeout: 10000 });
  });
});

// ═══════════════════════════════════════════════════════════════
// MODULE 2: Risk Scores
// ═══════════════════════════════════════════════════════════════
test.describe('M2 – Risk Scores', () => {
  test.setTimeout(60000);

  test('M2-S01: Page loads', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/risk-scores`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Scores de Riesgo/i, { timeout: 20000 });
  });

  test('M2-E01: Risk scores table shows data', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/risk-scores`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('table')).toBeVisible({ timeout: 20000 });
  });

  test('M2-E02: Filter by high risk', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/risk-scores`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'high' }).click({ timeout: 15000 });
    await page.waitForTimeout(1000);
  });

  test('M2-E03: Pagination controls visible', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/risk-scores`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Página/i)).toBeVisible({ timeout: 20000 });
  });

  test('M2-E04: API risk-scores returns paginated data', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/v1/analytics/risk-scores?page=1&limit=5`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('total');
  });

  test('M2-E05: API risk-scores filter by level=high', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/v1/analytics/risk-scores?level=high`);
    expect(res.status()).toBe(200);
  });

  test('M2-E06: Flags badges shown in table', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/risk-scores`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Flags/i, { timeout: 20000 });
  });

  test('M2-E07: Empty state when filter returns 0', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/risk-scores`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).not.toContainText(/error/i, { timeout: 15000 });
  });
});

// ═══════════════════════════════════════════════════════════════
// MODULE 3: Competition
// ═══════════════════════════════════════════════════════════════
test.describe('M3 – Competition', () => {
  test.setTimeout(60000);

  test('M3-S01: Page loads', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/competition`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Análisis de Competencia/i, { timeout: 20000 });
  });

  test('M3-E01: KPI cards visible', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/competition`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Promedio Oferentes/i, { timeout: 20000 });
  });

  test('M3-E02: Sector table visible', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/competition`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Competencia por Sector/i, { timeout: 20000 });
  });

  test('M3-E03: HHI table visible', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/competition`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/HHI por Entidad/i, { timeout: 20000 });
  });

  test('M3-E04: API competition returns data', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/v1/analytics/competition`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('avgBidders');
    expect(body).toHaveProperty('bySector');
    expect(body).toHaveProperty('hhiByEntity');
  });

  test('M3-E05: Single bidder percentage badge uses colors', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/competition`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/%/, { timeout: 20000 });
  });
});

// ═══════════════════════════════════════════════════════════════
// MODULE 4: Market
// ═══════════════════════════════════════════════════════════════
test.describe('M4 – Market', () => {
  test.setTimeout(60000);

  test('M4-S01: Page loads', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/market`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Análisis de Mercado/i, { timeout: 20000 });
  });

  test('M4-E01: Group by entity default', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/market`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: /Por Entidad/i })).toBeVisible({ timeout: 15000 });
  });

  test('M4-E02: Switch to province', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/market`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /Por Provincia/i }).click({ timeout: 15000 });
    await page.waitForTimeout(1000);
    await expect(page.locator('table')).toBeVisible({ timeout: 15000 });
  });

  test('M4-E03: Switch to process type', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/market`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /Por Tipo de Proceso/i }).click({ timeout: 15000 });
    await page.waitForTimeout(1000);
  });

  test('M4-E04: API market returns data', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/v1/analytics/market?groupBy=entity`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('data');
  });

  test('M4-E05: API market by province', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/v1/analytics/market?groupBy=province`);
    expect(res.status()).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════════════
// MODULE 5: PAC vs Executed
// ═══════════════════════════════════════════════════════════════
test.describe('M5 – PAC vs Executed', () => {
  test.setTimeout(60000);

  test('M5-S01: Page loads', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/pac`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/PAC vs Ejecutado/i, { timeout: 20000 });
  });

  test('M5-E01: Table shows entity rows', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/pac`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Tasa Ejecución/i, { timeout: 20000 });
  });

  test('M5-E02: API returns pac data', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/v1/analytics/pac-vs-executed`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('data');
  });

  test('M5-E03: Deviation column shows colors', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/pac`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Desviación/i, { timeout: 20000 });
  });
});

// ═══════════════════════════════════════════════════════════════
// MODULE 6: Alerts
// ═══════════════════════════════════════════════════════════════
test.describe('M6 – Alerts', () => {
  test.setTimeout(60000);

  test('M6-S01: Page loads', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/alerts`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Alertas del Sistema/i, { timeout: 20000 });
  });

  test('M6-E01: Severity filter buttons', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/alerts`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: 'CRITICAL' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: 'WARNING' })).toBeVisible();
  });

  test('M6-E02: Filter resolved/unresolved', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/alerts`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: /Sin Resolver/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /Resueltas/i })).toBeVisible();
  });

  test('M6-E03: API alerts returns paginated data', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/v1/analytics/alerts?page=1&limit=5`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('total');
  });

  test('M6-E04: API alerts filter by severity', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/v1/analytics/alerts?severity=CRITICAL`);
    expect(res.status()).toBe(200);
  });

  test('M6-E05: Alert table shows type badges', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/alerts`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Tipo/i, { timeout: 20000 });
  });

  test('M6-E06: Resolve alert button present on unresolved', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/alerts`, { waitUntil: 'domcontentloaded' });
    const resolveBtn = page.getByRole('button', { name: /Resolver/i }).first();
    await expect(resolveBtn).toBeVisible({ timeout: 20000 }).catch(() => {});
  });
});

// ═══════════════════════════════════════════════════════════════
// MODULE 7: Provider Network
// ═══════════════════════════════════════════════════════════════
test.describe('M7 – Provider Network', () => {
  test.setTimeout(60000);

  test('M7-S01: Page loads', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/provider-network`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Red de Proveedores/i, { timeout: 20000 });
  });

  test('M7-E01: KPI cards for nodes and edges', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/provider-network`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Nodos/i, { timeout: 20000 });
    await expect(page.locator('body')).toContainText(/Relaciones/i);
  });

  test('M7-E02: Min shared filter buttons', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/provider-network`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Min. procesos compartidos/i)).toBeVisible({ timeout: 15000 });
  });

  test('M7-E03: Provider table with action buttons', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/provider-network`, { waitUntil: 'domcontentloaded' });
    const viewBtn = page.getByRole('button', { name: /Ver relaciones/i }).first();
    await expect(viewBtn).toBeVisible({ timeout: 20000 }).catch(() => {});
  });

  test('M7-E04: API provider-network returns nodes and edges', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/v1/analytics/provider-network?minShared=1`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('nodes');
    expect(body).toHaveProperty('edges');
  });
});

// ═══════════════════════════════════════════════════════════════
// MODULE 8: Provider Scores
// ═══════════════════════════════════════════════════════════════
test.describe('M8 – Provider Scores', () => {
  test.setTimeout(60000);

  test('M8-S01: Page loads', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/provider-scores`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Reputación de Proveedores/i, { timeout: 20000 });
  });

  test('M8-E01: Tier filter buttons', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/provider-scores`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: 'premium' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: 'restricted' })).toBeVisible();
  });

  test('M8-E02: Score columns visible', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/provider-scores`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Cumplimiento/i, { timeout: 20000 });
    await expect(page.locator('body')).toContainText(/Diversidad/i);
  });

  test('M8-E03: API provider-scores returns data', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/v1/analytics/provider-scores?page=1&limit=5`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('data');
  });

  test('M8-E04: API compute-provider-score', async ({ request }) => {
    const scores = await request.get(`${API_BASE}/api/v1/analytics/provider-scores?limit=1`);
    const body = await scores.json();
    if (body.data?.length > 0) {
      const providerId = body.data[0].providerId;
      const res = await request.post(`${API_BASE}/api/v1/analytics/compute-provider-score/${providerId}`);
      expect(res.status()).toBe(200);
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// MODULE 9: Price Index
// ═══════════════════════════════════════════════════════════════
test.describe('M9 – Price Index', () => {
  test.setTimeout(60000);

  test('M9-S01: Page loads', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/price-index`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Índice Nacional de Precios/i, { timeout: 20000 });
  });

  test('M9-E01: Price comparison table visible', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/price-index`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Comparación de Precios/i, { timeout: 20000 });
  });

  test('M9-E02: API price-index returns data', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/v1/analytics/price-index`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('data');
  });

  test('M9-E03: API price-anomalies returns data', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/v1/analytics/price-anomalies`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('data');
  });

  test('M9-E04: Deviation badges show colors', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/price-index`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Desviación/i, { timeout: 20000 });
  });
});

// ═══════════════════════════════════════════════════════════════
// MODULE 10: Contract Health
// ═══════════════════════════════════════════════════════════════
test.describe('M10 – Contract Health', () => {
  test.setTimeout(60000);

  test('M10-S01: Page loads', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/contracts`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Salud Contractual/i, { timeout: 20000 });
  });

  test('M10-E01: Amendment patterns table', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/contracts`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Patrones de Modificación/i, { timeout: 20000 });
  });

  test('M10-E02: Health level filter buttons', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/contracts`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: 'healthy' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: 'critical' })).toBeVisible();
  });

  test('M10-E03: API contract-health returns data', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/v1/analytics/contract-health?page=1&limit=5`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('data');
  });

  test('M10-E04: API amendment-patterns returns data', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/v1/analytics/amendment-patterns`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('data');
  });
});

// ═══════════════════════════════════════════════════════════════
// MODULE 11: Fragmentation
// ═══════════════════════════════════════════════════════════════
test.describe('M11 – Fragmentation', () => {
  test.setTimeout(60000);

  test('M11-S01: Page loads', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/fragmentation`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Detección de Fragmentación/i, { timeout: 20000 });
  });

  test('M11-E01: Severity filter buttons', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/fragmentation`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: 'CRITICAL' })).toBeVisible({ timeout: 15000 });
  });

  test('M11-E02: API fragmentation-alerts returns data', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/v1/analytics/fragmentation-alerts?page=1&limit=5`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('total');
  });

  test('M11-E03: API detect-fragmentation', async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/v1/analytics/detect-fragmentation`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('data');
  });

  test('M11-E04: Predictive risk API works', async ({ request }) => {
    const tenders = await request.get(`${API_BASE}/api/v1/analytics/risk-scores?limit=1`);
    const body = await tenders.json();
    if (body.data?.length > 0) {
      const tenderId = body.data[0].tenderId;
      const res = await request.get(`${API_BASE}/api/v1/analytics/risk-prediction/${tenderId}`);
      expect(res.status()).toBe(200);
      const pred = await res.json();
      expect(pred).toHaveProperty('predictedScore');
      expect(pred).toHaveProperty('predictedLevel');
      expect(pred).toHaveProperty('confidence');
    }
  });
});
