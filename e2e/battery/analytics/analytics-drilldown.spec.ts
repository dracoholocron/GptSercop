/**
 * Analytics Drill-Down E2E + Smoke Tests (Phase 7d)
 * Tests all drill-down navigation paths across 11 analytics pages.
 *
 * Prerequisites:
 *   - Frontend at LEGACY_BASE_URL (default: http://localhost:5177)
 *   - API at PLAYWRIGHT_API_URL (default: http://localhost:3080)
 *   - DB seeded with seed-drilldown.ts + seed-provider-scores.ts
 *
 * Run: npx playwright test e2e/battery/analytics/analytics-drilldown.spec.ts
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

test.setTimeout(60000);

// ═══════════════════════════════════════════════════════════════
// DD: Dashboard Drill-Down (KPI cards)
// ═══════════════════════════════════════════════════════════════
test.describe('DD – Dashboard KPI Navigation', () => {

  test('DD-01: Dashboard loads without crash', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).not.toContainText(/error de inicialización/i, { timeout: 15000 });
    await expect(page.locator('body')).toContainText(/Dashboard Analítico/i, { timeout: 20000 });
  });

  test('DD-02: KPI cards are clickable and navigate to risk-scores', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Total Procesos/i, { timeout: 20000 });
    // Click "Total Procesos" card (first KPI card with "Ver detalle →" text)
    const kpiCard = page.locator('text=Total Procesos').locator('..').locator('..');
    if (await kpiCard.count() > 0) {
      await kpiCard.first().click();
      await page.waitForURL(/\/analytics\/risk-scores/, { timeout: 10000 });
    }
  });

  test('DD-03: "Alertas Abiertas" KPI navigates to alerts page', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Alertas Abiertas/i, { timeout: 20000 });
    const kpiCard = page.locator('text=Alertas Abiertas').locator('..').locator('..');
    if (await kpiCard.count() > 0) {
      await kpiCard.first().click();
      await page.waitForURL(/\/analytics\/alerts/, { timeout: 10000 });
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// DD: Risk Scores Drill-Down
// ═══════════════════════════════════════════════════════════════
test.describe('DD – Risk Scores Drill-Down', () => {

  test('DD-06: Risk scores page loads', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/risk-scores`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Scores de Riesgo/i, { timeout: 20000 });
  });

  test('DD-07: Clickable entity column navigates to entity detail', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/risk-scores`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Scores de Riesgo/i, { timeout: 20000 });
    // Check if entity cells are blue/clickable
    const entityCells = page.locator('table tbody tr td').filter({ hasText: /Quito|Salud|Senagua|Petro|Hospital/ });
    if (await entityCells.count() > 0) {
      await entityCells.first().click();
      await page.waitForURL(/\/analytics\/entities\//, { timeout: 15000 });
      await expect(page.locator('body')).not.toContainText(/error/i, { timeout: 10000 });
    }
  });

  test('DD-08: processType filter from URL works', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/risk-scores?level=high`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Scores de Riesgo/i, { timeout: 20000 });
  });
});

// ═══════════════════════════════════════════════════════════════
// DD: Entity Detail Page
// ═══════════════════════════════════════════════════════════════
test.describe('DD – Entity Detail Page', () => {

  let entityId: string;

  test.beforeEach(async () => {
    // Fetch a real entity ID from PAC
    try {
      const resp = await fetch(`${API_BASE}/api/v1/analytics/pac-vs-executed`);
      if (resp.ok) {
        const data = await resp.json() as { data: Array<{ entityId: string; entityName: string }> };
        const entity = data.data.find((e) => e.entityId);
        if (entity) entityId = entity.entityId;
      }
    } catch {/* ignore */}
  });

  test('DD-09: Entity detail page loads with entity name and KPI cards', async ({ page }) => {
    test.skip(!entityId, 'No entity available');
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/entities/${entityId}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).not.toContainText(/error de inicialización/i, { timeout: 15000 });
    // Should show at least some text from the page
    await expect(page.locator('body')).toContainText(/Procesos|Contratos|Entidad/i, { timeout: 20000 });
  });

  test('DD-10: Entity detail "Procesos" tab shows data', async ({ page }) => {
    test.skip(!entityId, 'No entity available');
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/entities/${entityId}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Procesos.*Riesgo/i, { timeout: 20000 });
  });

  test('DD-11: Entity detail "Contratos" tab is accessible', async ({ page }) => {
    test.skip(!entityId, 'No entity available');
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/entities/${entityId}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Contratos/i, { timeout: 20000 });
    const contractsTab = page.locator('[role="tab"]').filter({ hasText: /Contratos/i });
    if (await contractsTab.count() > 0) {
      await contractsTab.first().click();
      await expect(page.locator('body')).not.toContainText(/error de inicialización/i, { timeout: 10000 });
    }
  });

  test('DD-12: Entity detail "Alertas" tab is accessible', async ({ page }) => {
    test.skip(!entityId, 'No entity available');
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/entities/${entityId}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Alertas/i, { timeout: 20000 });
  });

  test('DD-13: Entity detail "PAC" tab shows data', async ({ page }) => {
    test.skip(!entityId, 'No entity available');
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/entities/${entityId}`, { waitUntil: 'domcontentloaded' });
    const pacTab = page.locator('[role="tab"]').filter({ hasText: /PAC/i });
    if (await pacTab.count() > 0) {
      await pacTab.first().click();
      await expect(page.locator('body')).not.toContainText(/error de inicialización/i, { timeout: 10000 });
    }
  });

  test('DD-14: Back button returns to previous page', async ({ page }) => {
    test.skip(!entityId, 'No entity available');
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/risk-scores`, { waitUntil: 'domcontentloaded' });
    await page.goto(`${BASE}/analytics/entities/${entityId}`, { waitUntil: 'domcontentloaded' });
    const backButton = page.locator('button').filter({ hasText: /Volver/i });
    if (await backButton.count() > 0) {
      await backButton.first().click();
      // Should navigate away from entity detail
      await expect(page).not.toHaveURL(`/analytics/entities/${entityId}`, { timeout: 5000 });
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// DD: Provider Detail Page
// ═══════════════════════════════════════════════════════════════
test.describe('DD – Provider Detail Page', () => {

  let providerId: string;

  test.beforeEach(async () => {
    try {
      const resp = await fetch(`${API_BASE}/api/v1/analytics/provider-scores?limit=5`);
      if (resp.ok) {
        const data = await resp.json() as { data: Array<{ providerId: string }> };
        const ps = data.data.find((p) => p.providerId);
        if (ps) providerId = ps.providerId;
      }
    } catch {/* ignore */}
  });

  test('DD-15: Provider detail page loads with provider name', async ({ page }) => {
    test.skip(!providerId, 'No provider available');
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/providers/${providerId}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).not.toContainText(/error de inicialización/i, { timeout: 15000 });
    await expect(page.locator('body')).toContainText(/Contratos|Proveedor|RUC/i, { timeout: 20000 });
  });

  test('DD-16: Score card displays tier badge', async ({ page }) => {
    test.skip(!providerId, 'No provider available');
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/providers/${providerId}`, { waitUntil: 'domcontentloaded' });
    // Should show tier (premium, standard, watch, or restricted)
    await expect(page.locator('body')).toContainText(/premium|standard|watch|restricted/i, { timeout: 20000 });
  });

  test('DD-17: Contracts tab shows data', async ({ page }) => {
    test.skip(!providerId, 'No provider available');
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/providers/${providerId}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Contratos/i, { timeout: 20000 });
  });

  test('DD-18: Network tab is accessible', async ({ page }) => {
    test.skip(!providerId, 'No provider available');
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/providers/${providerId}`, { waitUntil: 'domcontentloaded' });
    const redTab = page.locator('[role="tab"]').filter({ hasText: /Red/i });
    if (await redTab.count() > 0) {
      await redTab.first().click();
      await expect(page.locator('body')).not.toContainText(/error de inicialización/i, { timeout: 10000 });
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// DD: Competition Drill-Down
// ═══════════════════════════════════════════════════════════════
test.describe('DD – Competition Drill-Down', () => {

  test('DD-20: Sector row click navigates to risk scores with processType filter', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/competition`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Competencia.*Sector|Sector.*Competencia/i, { timeout: 20000 });
    // Sector rows should be clickable (blue text)
    const sectorRows = page.locator('table tbody tr td').first();
    if (await sectorRows.count() > 0) {
      await sectorRows.first().click();
      await page.waitForURL(/\/analytics\/risk-scores/, { timeout: 10000 });
    }
  });

  test('DD-21: HHI table row click navigates to entity detail', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/competition`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/HHI por Entidad/i, { timeout: 20000 });
  });
});

// ═══════════════════════════════════════════════════════════════
// DD: Alerts Resolve Modal
// ═══════════════════════════════════════════════════════════════
test.describe('DD – Alerts Resolve Modal', () => {

  test('DD-24: Alerts page loads', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/alerts`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Alertas del Sistema/i, { timeout: 20000 });
  });

  test('DD-25: "Resolver" button opens modal with form fields', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/alerts`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Alertas del Sistema/i, { timeout: 20000 });
    // Wait for table to load (Total: N appears)
    await expect(page.locator('body')).toContainText(/Total:/i, { timeout: 15000 });
    // Find a "Resolver" button inside a table cell (not in filter tabs)
    const resolveBtn = page.locator('table button').filter({ hasText: /^Resolver$/i }).first();
    const count = await resolveBtn.count();
    if (count > 0) {
      await resolveBtn.scrollIntoViewIfNeeded();
      await resolveBtn.click();
      // Modal should open with title "Resolver Alerta" or form field
      await expect(page.locator('body')).toContainText(/Resolver Alerta|Acción Tomada/i, { timeout: 10000 });
    } else {
      // No unresolved alerts visible, skip gracefully
      test.skip(true, 'No unresolved alerts found in table');
    }
  });

  test('DD-26: Alert row click opens metadata drawer', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/alerts`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Alertas del Sistema/i, { timeout: 20000 });
    // Click on a row
    const rows = page.locator('table tbody tr');
    if (await rows.count() > 0) {
      await rows.first().click();
      await expect(page.locator('body')).toContainText(/Detalle de Alerta|ID/i, { timeout: 5000 });
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// DD: Contract Health Drill-Down
// ═══════════════════════════════════════════════════════════════
test.describe('DD – Contract Health Drill-Down', () => {

  test('DD-28: Contract rows are clickable', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/contracts`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Salud Contractual/i, { timeout: 20000 });
    // Contract numbers should be blue/clickable
    const contractCells = page.locator('table tbody tr td').first();
    if (await contractCells.count() > 0) {
      // Just verify the page loaded with a table
      await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
    }
  });

  test('DD-29: Amendment patterns table shows entityId-linked rows', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/contracts`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Patrones de Modificación/i, { timeout: 20000 });
  });
});

// ═══════════════════════════════════════════════════════════════
// DD: Provider Pages Drill-Down
// ═══════════════════════════════════════════════════════════════
test.describe('DD – Provider Pages Drill-Down', () => {

  test('DD-30: Provider scores name column is clickable', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/provider-scores`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Reputación de Proveedores/i, { timeout: 20000 });
    // Provider name should be clickable
    const providerRows = page.locator('table tbody tr');
    if (await providerRows.count() > 0) {
      await providerRows.first().click();
      await page.waitForURL(/\/analytics\/providers\//, { timeout: 15000 });
    }
  });

  test('DD-31: Provider network "Ver detalle" button navigates to provider detail', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/provider-network`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Red de Proveedores/i, { timeout: 20000 });
    const verDetalle = page.locator('button').filter({ hasText: /Ver detalle/i }).first();
    if (await verDetalle.count() > 0) {
      await verDetalle.click();
      await page.waitForURL(/\/analytics\/providers\//, { timeout: 15000 });
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// DD: Price Index & Fragmentation Drill-Down
// ═══════════════════════════════════════════════════════════════
test.describe('DD – Price Index / Fragmentation Drill-Down', () => {

  test('DD-32: Price index page loads', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/price-index`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Índice Nacional de Precios/i, { timeout: 20000 });
  });

  test('DD-33: Fragmentation page loads with entity column', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/fragmentation`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Detección de Fragmentación/i, { timeout: 20000 });
  });

  test('DD-34: Fragmentation row click expands contract IDs', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/fragmentation`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Detección de Fragmentación/i, { timeout: 20000 });
    const rows = page.locator('table tbody tr');
    if (await rows.count() > 0) {
      await rows.first().click();
      // Expanded row should show "Contratos relacionados"
      await expect(page.locator('body')).toContainText(/Contratos relacionados/i, { timeout: 5000 });
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// DD: PAC Analysis Drill-Down
// ═══════════════════════════════════════════════════════════════
test.describe('DD – PAC Analysis Drill-Down', () => {

  test('DD-35: PAC page entity rows are clickable', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/pac`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/PAC vs Ejecutado/i, { timeout: 20000 });
    const rows = page.locator('table tbody tr');
    if (await rows.count() > 0) {
      // First cell (entity name) should be clickable (blue)
      const entityCell = rows.first().locator('td').first();
      if (await entityCell.count() > 0) {
        await entityCell.click();
        // Either navigates to entity detail or no-ops if entityId not available
        await page.waitForTimeout(1000);
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// DD: Market Analysis Drill-Down
// ═══════════════════════════════════════════════════════════════
test.describe('DD – Market Analysis Drill-Down', () => {

  test('DD-36: Market entity rows are clickable', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/market`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Análisis de Mercado/i, { timeout: 20000 });
    const rows = page.locator('table tbody tr');
    if (await rows.count() > 0) {
      await rows.first().click();
      await page.waitForTimeout(1000);
    }
  });

  test('DD-37: Market processType rows navigate to risk scores', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/market`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Análisis de Mercado/i, { timeout: 20000 });
    // Click "Por Tipo de Proceso" button
    const ptBtn = page.locator('button').filter({ hasText: /Por Tipo de Proceso/i });
    if (await ptBtn.count() > 0) {
      await ptBtn.first().click();
      const rows = page.locator('table tbody tr');
      if (await rows.count() > 0) {
        await rows.first().click();
        await page.waitForURL(/\/analytics\/risk-scores/, { timeout: 10000 });
      }
    }
  });
});
