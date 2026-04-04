/**
 * Batería QA – Plataforma Analítica SERCOP.
 * Cubre admin analytics, risk dashboard, public portal y transparencia.
 * Base URL admin: 3014 | public: 3000
 */
import { test, expect } from '@playwright/test';
import { adminLogin } from './auth-helpers';

const ADMIN_BASE = 'http://localhost:3014';
const PUBLIC_BASE = 'http://localhost:3000';

test.skip(process.env.BATTERY_SKIP_ANALYTICS === '1', 'Analytics battery skipped');

// ---- Rutas del módulo analítico (admin) ----
test.describe('Analytics Admin – Carga de rutas', () => {
  test.use({ baseURL: ADMIN_BASE });

  const routes = [
    { path: '/analytics', name: 'analytics-dashboard', text: /analítica|plataforma analítica/i },
    { path: '/analytics/market', name: 'analytics-market', text: /análisis de mercado/i },
    { path: '/analytics/pac', name: 'analytics-pac', text: /pac vs ejecutado/i },
    { path: '/analytics/risk', name: 'analytics-risk', text: /dashboard de riesgo/i },
  ];

  for (const { path, name, text } of routes) {
    test(`AN-${name}: GET ${path} responde 200`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.locator('body')).toContainText(text);
    });
  }
});

// ---- Analytics dashboard con sesión de admin ----
test.describe('Analytics Admin – Dashboard con sesión', () => {
  test.use({ baseURL: ADMIN_BASE });

  test('AN-login-dashboard: login admin y navegar a /analytics', async ({ page }) => {
    await adminLogin(page, ADMIN_BASE);
    await page.goto('/analytics');
    await expect(page.getByRole('heading', { name: /analítica|plataforma analítica/i })).toBeVisible({ timeout: 10000 });
    // Verify stat cards load (look for any number-like content or links)
    await expect(page.locator('body')).toContainText(/mercado|pac|riesgo/i);
  });

  test('AN-nav-links: links de navegación analítica presentes', async ({ page }) => {
    await page.goto('/analytics');
    await expect(page.getByRole('link', { name: /mercado/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('link', { name: /pac/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /riesgo/i })).toBeVisible();
  });

  test('AN-sidebar: Analítica aparece en sidebar de navegación', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[class*="sidebar"], nav')).toContainText(/analítica/i, { timeout: 8000 });
  });
});

// ---- Risk dashboard ----
test.describe('Analytics Admin – Risk Dashboard', () => {
  test.use({ baseURL: ADMIN_BASE });

  test('AN-risk-page: /analytics/risk muestra heading y filtro', async ({ page }) => {
    await page.goto('/analytics/risk');
    await expect(page.getByRole('heading', { name: /dashboard de riesgo/i })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('select').first()).toBeVisible();
  });

  test('AN-risk-filter-high: filtrar por level=high actualiza select', async ({ page }) => {
    await page.goto('/analytics/risk');
    const select = page.locator('select').first();
    await select.selectOption({ label: /alto riesgo/i });
    await page.waitForTimeout(500);
    await expect(select).toHaveValue('high');
  });

  test('AN-risk-badge-colors: badges de nivel con estilos correctos', async ({ page }) => {
    await page.goto('/analytics/risk');
    // If there are any rows, verify badge color classes
    const highBadge = page.locator('span:has-text("Alto")').first();
    const medBadge = page.locator('span:has-text("Medio")').first();
    const lowBadge = page.locator('span:has-text("Bajo")').first();
    const anyBadge = highBadge.or(medBadge).or(lowBadge);
    const noRows = page.getByText(/sin evaluaciones/i);
    await expect(anyBadge.or(noRows)).toBeVisible({ timeout: 12000 });
    if (await highBadge.isVisible()) {
      await expect(highBadge).toHaveClass(/red/);
    }
    if (await medBadge.isVisible()) {
      await expect(medBadge).toHaveClass(/yellow/);
    }
  });
});

// ---- Market page ----
test.describe('Analytics Admin – Mercado', () => {
  test.use({ baseURL: ADMIN_BASE });

  test('AN-market-chart: /analytics/market renderiza selector y contenido', async ({ page }) => {
    await page.goto('/analytics/market');
    await expect(page.getByRole('heading', { name: /análisis de mercado/i })).toBeVisible({ timeout: 10000 });
    // Selectors should be present
    const selects = page.locator('select');
    await expect(selects.first()).toBeVisible();
  });

  test('AN-market-groupprovince: cambiar groupBy a provincia actualiza título', async ({ page }) => {
    await page.goto('/analytics/market');
    const groupSelect = page.locator('select').nth(1);
    await groupSelect.selectOption({ label: /provincia/i });
    await page.waitForTimeout(500);
    await expect(page.locator('body')).toContainText(/provincia/i);
  });
});

// ---- PAC page ----
test.describe('Analytics Admin – PAC', () => {
  test.use({ baseURL: ADMIN_BASE });

  test('AN-pac-selector: /analytics/pac tiene selector de año', async ({ page }) => {
    await page.goto('/analytics/pac');
    await expect(page.getByRole('heading', { name: /pac vs ejecutado/i })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('select').first()).toBeVisible();
  });
});

// ---- Public portal analytics sections ----
test.describe('Analytics Portal Público', () => {
  test.use({ baseURL: PUBLIC_BASE });

  test('AN-cifras-page: /cifras carga correctamente', async ({ page }) => {
    const res = await page.goto('/cifras');
    expect(res?.status()).toBe(200);
    await expect(page.locator('body')).toContainText(/cifras|estadísticas|datos/i);
  });

  test('AN-cifras-competition: sección competencia de mercado visible si hay datos', async ({ page }) => {
    await page.goto('/cifras');
    await page.waitForTimeout(2000);
    const section = page.getByText(/competencia de mercado/i);
    const noData = page.getByText(/no se pudieron cargar/i);
    // Either section or no-data message is acceptable
    await expect(section.or(noData).first()).toBeVisible({ timeout: 15000 });
  });

  test('AN-transparencia: /transparencia tiene KPIs y tabla', async ({ page }) => {
    await page.goto('/transparencia');
    await expect(page.getByRole('heading', { name: /transparencia/i })).toBeVisible({ timeout: 10000 });
    const kpiOrLoading = page.locator('[class*="rounded-xl"]').first();
    await expect(kpiOrLoading).toBeVisible({ timeout: 12000 });
  });

  test('AN-transparencia-csv: botón Descargar CSV presente', async ({ page }) => {
    await page.goto('/transparencia');
    await expect(page.getByRole('button', { name: /descargar csv/i })).toBeVisible({ timeout: 12000 });
  });

  test('AN-transparencia-search: buscador filtra tabla de proveedores', async ({ page }) => {
    await page.goto('/transparencia');
    const searchInput = page.getByPlaceholder(/buscar proveedor/i);
    await expect(searchInput).toBeVisible({ timeout: 12000 });
    await searchInput.fill('xyz_no_existe');
    await page.waitForTimeout(300);
    // Should show "sin resultados" or empty table
    const noResults = page.getByText(/sin resultados/i);
    const emptyRow = page.getByText(/sin datos/i);
    await expect(noResults.or(emptyRow)).toBeVisible({ timeout: 5000 });
  });

  test('AN-redes-proveedores: página de red carga', async ({ page }) => {
    await page.goto('/redes-proveedores');
    await expect(page.getByRole('heading', { name: /red de proveedores/i })).toBeVisible({ timeout: 10000 });
  });

  test('AN-redes-proveedores-filter: selector de mínimo procesos compartidos', async ({ page }) => {
    await page.goto('/redes-proveedores');
    await expect(page.locator('select').first()).toBeVisible({ timeout: 8000 });
  });
});
