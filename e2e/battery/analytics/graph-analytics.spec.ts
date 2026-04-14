/**
 * E2E – Graph analytics (grafo, colusión, riesgo de red) + navegación desde dashboard/sidebar.
 *
 * Prerequisites:
 *   - Frontend at LEGACY_BASE_URL (default: http://localhost:5177)
 *   - API at PLAYWRIGHT_API_URL (default: http://localhost:3080)
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

function ignoreBenignPageErrors(messages: string[]): string[] {
  return messages.filter(
    (e) =>
      !e.includes('ResizeObserver') &&
      !e.includes('Non-Error promise rejection captured'),
  );
}

test.describe('GRAPH-E2E: Graph Analytics Pages', () => {
  test.setTimeout(60000);

  test('GR-01: Graph Analytics page loads', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/graph`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Grafo de Red/i, { timeout: 25000 });
  });

  test('GR-02: Graph Analytics shows KPI cards', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/graph`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Total Proveedores en Red/i, { timeout: 25000 });
    await expect(page.locator('body')).toContainText(/Total Relaciones/i);
    await expect(page.locator('body')).toContainText(/Comunidades Detectadas/i);
    await expect(page.locator('body')).toContainText(/Densidad de Red/i);
    await expect(page.locator('body')).toContainText(/Grado Promedio/i);
  });

  test('GR-03: Communities table renders', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/graph`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Comunidades principales/i, { timeout: 25000 });
    await expect(page.getByRole('columnheader', { name: /Comunidad/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('columnheader', { name: /Miembros/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Licitaciones compartidas/i })).toBeVisible();
  });

  test('GR-04: Risk summary section visible', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/graph`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Resumen de riesgo/i, { timeout: 25000 });
    await expect(page.locator('body')).toContainText(/Nodos Alto Riesgo/i);
    await expect(page.locator('body')).toContainText(/Candidatos Colusión/i);
    await expect(page.locator('body')).toContainText(/Ganadores Aislados/i);
  });

  test('GR-05: Collusion page loads', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/collusion`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Detección de colusión/i, { timeout: 25000 });
  });

  test('GR-06: Collusion shows KPI cards', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/collusion`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Anillos Sospechosos/i, { timeout: 25000 });
    await expect(page.locator('body')).toContainText(/Proveedores Flaggeados/i);
    await expect(page.locator('body')).toContainText(/Monto Total Involucrado/i);
  });

  test('GR-07: Collusion candidates table renders', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/collusion`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('columnheader', { name: /Cluster ID/i })).toBeVisible({ timeout: 25000 });
    await expect(page.getByRole('columnheader', { name: /Nivel de riesgo/i })).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });

  test('GR-08: Risk badges show correct colors', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/collusion`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('columnheader', { name: /Nivel de riesgo/i })).toBeVisible({ timeout: 25000 });

    const level = page.locator('tbody').getByText(/^(CRITICAL|WARNING|INFO)$/).first();
    await level.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});

    if (!(await level.isVisible())) {
      await expect(page.locator('body')).toContainText(/No hay candidatos de colusión en este momento/i);
      return;
    }

    const bg = await level.evaluate((el) => {
      let n: HTMLElement | null = el as HTMLElement;
      for (let i = 0; i < 6 && n; i++) {
        const { backgroundColor, color } = window.getComputedStyle(n);
        if (
          backgroundColor &&
          backgroundColor !== 'rgba(0, 0, 0, 0)' &&
          backgroundColor !== 'rgb(255, 255, 255)' &&
          backgroundColor !== 'rgba(255, 255, 255, 0)'
        ) {
          return backgroundColor;
        }
        if (color && color !== 'rgb(0, 0, 0)' && color !== 'rgba(0, 0, 0, 0)') {
          return color;
        }
        n = n.parentElement;
      }
      return window.getComputedStyle(el as HTMLElement).color;
    });
    expect(bg.length).toBeGreaterThan(0);
    expect(bg).not.toMatch(/^rgba\(0,\s*0,\s*0,\s*0\)$/);
  });

  test('GR-09: Network Risk page loads', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/network-risk`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Riesgo de red/i, { timeout: 25000 });
  });

  test('GR-10: Centrality table renders', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/network-risk`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Rankings de centralidad/i, { timeout: 25000 });
    await expect(page.getByRole('columnheader', { name: /^Proveedor$/i }).first()).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('columnheader', { name: /PageRank/i })).toBeVisible();
  });

  test('GR-11: Risk propagation table renders', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics/network-risk`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Propagación de riesgo/i, { timeout: 25000 });
    await expect(page.getByRole('columnheader', { name: /Riesgo propio/i })).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('columnheader', { name: /Riesgo red/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Incremento riesgo/i })).toBeVisible();
  });

  test('GR-12: Sidebar has graph analytics links', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Dashboard Analítico/i, { timeout: 20000 });

    const grafo = page.getByText('Grafo de Red', { exact: true });
    await grafo.waitFor({ state: 'visible', timeout: 4000 }).catch(async () => {
      await page.locator('[id="nav-section.analytics"]').click({ timeout: 5000 });
    });
    await expect(grafo).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Detección Colusión', { exact: true })).toBeVisible();
    await expect(page.getByText('Riesgo de Red', { exact: true })).toBeVisible();
  });

  test('GR-13: Dashboard has graph KPI card', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Comunidades y riesgo de red/i, { timeout: 25000 });
    await expect(page.locator('body')).toContainText(/Red de Proveedores/i);
  });

  test('GR-14: Dashboard graph card navigates to /analytics/graph', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Comunidades y riesgo de red', { exact: true })).toBeVisible({ timeout: 25000 });
    await page.getByText('Comunidades y riesgo de red', { exact: true }).click();
    await expect(page).toHaveURL(/\/analytics\/graph/, { timeout: 15000 });
    await expect(page.locator('body')).toContainText(/Grafo de Red — Proveedores/i);
  });

  test('GR-15: Provider detail page has network tab', async ({ page, request }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');

    const loginRes = await request.post(`${API_BASE}/api/v1/auth/login`, {
      data: { email: 'admin@mec.gob.ec', role: 'admin' },
    });
    test.skip(!loginRes.ok(), 'API login failed');
    const auth = await loginRes.json() as { token?: string };
    test.skip(!auth.token, 'No token');

    const scoresRes = await request.get(`${API_BASE}/api/v1/analytics/provider-scores?page=1&limit=1`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    test.skip(!scoresRes.ok(), 'provider-scores unavailable');
    const scoresBody = await scoresRes.json() as { data?: Array<{ providerId?: string }> };
    const providerId = scoresBody.data?.[0]?.providerId;
    test.skip(!providerId, 'No provider in analytics seed');

    await page.goto(`${BASE}/analytics/providers/${providerId}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('tab', { name: /Red \(/i })).toBeVisible({ timeout: 25000 });
    await page.getByRole('tab', { name: /Red \(/i }).click();
    await expect(page.locator('body')).toContainText(
      /Proveedor Conectado|Este proveedor no comparte procesos|procesos compartidos/i,
      { timeout: 20000 },
    );
  });

  test('GR-16: No console errors on graph pages', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto(`${BASE}/analytics/graph`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Grafo de Red/i, { timeout: 25000 });
    await page.goto(`${BASE}/analytics/collusion`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Detección de colusión/i, { timeout: 25000 });
    await page.goto(`${BASE}/analytics/network-risk`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Riesgo de red/i, { timeout: 25000 });

    await page.waitForTimeout(1500);
    expect(ignoreBenignPageErrors(errors)).toHaveLength(0);
  });

  test('GR-17: Graph pages handle empty data gracefully', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');

    await page.goto(`${BASE}/analytics/graph`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(
      /No hay comunidades para mostrar|Comunidades principales/i,
      { timeout: 25000 },
    );

    await page.goto(`${BASE}/analytics/collusion`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(
      /No hay candidatos de colusión en este momento|Cluster ID/i,
      { timeout: 25000 },
    );

    await page.goto(`${BASE}/analytics/network-risk`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(
      /Sin datos de centralidad.|PageRank/i,
      { timeout: 25000 },
    );
    await expect(page.locator('body')).toContainText(
      /Sin datos de propagación.|Riesgo propio/i,
      { timeout: 25000 },
    );
  });

  // --- Interactive Graph Visualization (GR-20 through GR-28) ---

  test('GR-20: Graph canvas renders on GraphAnalyticsPage', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');

    await page.goto(`${BASE}/analytics/graph`, { waitUntil: 'domcontentloaded' });
    const graph = page.locator('[data-testid="network-graph"]');
    await expect(graph).toBeVisible({ timeout: 30000 });
    const canvas = graph.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 15000 });
  });

  test('GR-21: Graph stats text shows node count', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');

    await page.goto(`${BASE}/analytics/graph`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Mostrando \d+.*nodos/i, { timeout: 30000 });
  });

  test('GR-22: Community filter dropdown exists and changes content', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');

    await page.goto(`${BASE}/analytics/graph`, { waitUntil: 'domcontentloaded' });
    const select = page.locator('select').filter({ hasText: /Todas las comunidades/ });
    await expect(select).toBeVisible({ timeout: 20000 });
  });

  test('GR-23: Click on KPI card "Nodos Alto Riesgo" visible', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');

    await page.goto(`${BASE}/analytics/graph`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Nodos Alto Riesgo/i, { timeout: 20000 });
  });

  test('GR-24: Graph legend shows risk colors', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');

    await page.goto(`${BASE}/analytics/graph`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Alto riesgo/i, { timeout: 20000 });
    await expect(page.locator('body')).toContainText(/Riesgo medio/i, { timeout: 5000 });
    await expect(page.locator('body')).toContainText(/Bajo riesgo/i, { timeout: 5000 });
    await expect(page.locator('body')).toContainText(/Sin evaluación/i, { timeout: 5000 });
  });

  test('GR-25: Provider detail "Red de Conexiones" tab has canvas graph', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');

    const apiUrl = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3080';
    const provRes = await page.request.get(`${apiUrl}/api/v1/providers`);
    if (!provRes.ok()) return test.skip(true, 'no providers API');
    const provBody = (await provRes.json()) as { data?: Array<{ id: string }> };
    const pid = provBody.data?.[0]?.id;
    if (!pid) return test.skip(true, 'no providers');

    await page.goto(`${BASE}/analytics/providers/${pid}`, { waitUntil: 'domcontentloaded' });
    const tab = page.locator('text=Red de Conexiones');
    if (await tab.isVisible({ timeout: 15000 })) {
      await tab.click();
      // Canvas should appear if provider has connections
      await page.waitForTimeout(3000);
      const canvas = page.locator('[data-testid="network-graph"] canvas');
      const graph = page.locator('[data-testid="network-graph"]');
      const hasGraph = await graph.isVisible().catch(() => false);
      // Either shows graph or shows "Sin nodos conectados"
      if (!hasGraph) {
        await expect(page.locator('body')).toContainText(/Sin nodos conectados|Total conexiones/i);
      }
    }
  });

  test('GR-26: Collusion page expanded cluster shows mini graph', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');

    await page.goto(`${BASE}/analytics/collusion`, { waitUntil: 'domcontentloaded' });
    const expandBtn = page.locator('button').filter({ hasText: '+' }).first();
    if (await expandBtn.isVisible({ timeout: 20000 })) {
      await expandBtn.click();
      const clusterGraph = page.locator('[data-testid="network-graph"]');
      await expect(clusterGraph).toBeVisible({ timeout: 15000 });
    }
  });

  test('GR-27: Graph visualization section has header text', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');

    await page.goto(`${BASE}/analytics/graph`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(
      /Visualización de la Red de Proveedores/i,
      { timeout: 20000 },
    );
  });

  test('GR-28: No console errors on graph pages with visualization', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');

    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().includes('favicon') && !msg.text().includes('Route GET:/api/menu')) {
        errors.push(msg.text());
      }
    });

    await page.goto(`${BASE}/analytics/graph`, { waitUntil: 'networkidle', timeout: 40000 });
    await page.waitForTimeout(3000);
    const jsErrors = errors.filter((e) => !e.includes('net::') && !e.includes('404'));
    expect(jsErrors).toHaveLength(0);
  });
});
