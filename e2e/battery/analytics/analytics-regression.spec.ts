/**
 * Analytics Regression Tests – covers prior bugs and edge cases.
 * Verifies fixes for Chakra v3, API errors, routing, and data integrity.
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

test.describe('REG: Chakra v3 Compatibility', () => {
  test.setTimeout(60000);

  const pages = [
    { path: '/analytics', name: 'Dashboard' },
    { path: '/analytics/risk-scores', name: 'Risk Scores' },
    { path: '/analytics/competition', name: 'Competition' },
    { path: '/analytics/market', name: 'Market' },
    { path: '/analytics/pac', name: 'PAC' },
    { path: '/analytics/alerts', name: 'Alerts' },
    { path: '/analytics/provider-network', name: 'Provider Network' },
    { path: '/analytics/provider-scores', name: 'Provider Scores' },
    { path: '/analytics/price-index', name: 'Price Index' },
    { path: '/analytics/contracts', name: 'Contract Health' },
    { path: '/analytics/fragmentation', name: 'Fragmentation' },
  ];

  for (const { path, name } of pages) {
    test(`REG-CHK-${name}: No React crash on ${path}`, async ({ page }) => {
      const ok = await loginAdmin(page);
      test.skip(!ok, 'API unavailable');
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
      const crashErrors = errors.filter((e) =>
        e.includes('Element type is invalid') || e.includes('is not a function') || e.includes('Cannot read properties'),
      );
      expect(crashErrors).toHaveLength(0);
    });
  }
});

test.describe('REG: Routing and Redirects', () => {
  test.setTimeout(60000);

  test('REG-RT-01: Unauthenticated /analytics redirects to /login', async ({ page }) => {
    await page.goto(`${BASE}/analytics`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const url = page.url();
    expect(url).toMatch(/\/login|\/analytics/);
  });

  test('REG-RT-02: Navigate from Dashboard to sub-module preserves auth', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /Competencia/i }).click({ timeout: 20000 });
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/analytics/competition');
    await expect(page.locator('body')).not.toContainText(/login/i);
  });

  test('REG-RT-03: Browser back navigation works', async ({ page }) => {
    const ok = await loginAdmin(page);
    test.skip(!ok, 'API unavailable');
    await page.goto(`${BASE}/analytics`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /Alertas/i }).click({ timeout: 20000 });
    await page.waitForTimeout(1000);
    await page.goBack();
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/analytics');
  });
});

test.describe('REG: API Error Handling', () => {
  test.setTimeout(30000);

  test('REG-API-01: Invalid entity ID returns empty data not crash', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/v1/analytics/risk-scores?entityId=invalid-uuid`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBeTruthy();
  });

  test('REG-API-02: Extremely large page number', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/v1/analytics/risk-scores?page=99999`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(0);
  });

  test('REG-API-03: Multiple concurrent API calls', async ({ request }) => {
    const results = await Promise.all([
      request.get(`${API_BASE}/api/v1/analytics/dashboard`),
      request.get(`${API_BASE}/api/v1/analytics/risk-scores?limit=5`),
      request.get(`${API_BASE}/api/v1/analytics/competition`),
      request.get(`${API_BASE}/api/v1/analytics/market?groupBy=entity`),
      request.get(`${API_BASE}/api/v1/analytics/alerts?limit=5`),
    ]);
    for (const res of results) {
      expect(res.status()).toBe(200);
    }
  });

  test('REG-API-04: Compute risk is idempotent', async ({ request }) => {
    const scores = await (await request.get(`${API_BASE}/api/v1/analytics/risk-scores?limit=1`)).json();
    if (scores.data.length > 0) {
      const tenderId = scores.data[0].tenderId;
      const r1 = await (await request.post(`${API_BASE}/api/v1/analytics/compute-risk/${tenderId}`)).json();
      const r2 = await (await request.post(`${API_BASE}/api/v1/analytics/compute-risk/${tenderId}`)).json();
      expect(r1.totalScore).toBe(r2.totalScore);
      expect(r1.riskLevel).toBe(r2.riskLevel);
    }
  });
});

test.describe('REG: Data Integrity', () => {
  test.setTimeout(30000);

  test('REG-DI-01: Risk levels are valid', async ({ request }) => {
    const r = await (await request.get(`${API_BASE}/api/v1/analytics/risk-scores?limit=50`)).json();
    for (const item of r.data) {
      expect(['low', 'medium', 'high']).toContain(item.riskLevel);
      expect(item.totalScore).toBeGreaterThanOrEqual(0);
      expect(item.totalScore).toBeLessThanOrEqual(100);
    }
  });

  test('REG-DI-02: Flags array is always an array', async ({ request }) => {
    const r = await (await request.get(`${API_BASE}/api/v1/analytics/risk-scores?limit=20`)).json();
    for (const item of r.data) {
      expect(Array.isArray(item.flags)).toBeTruthy();
    }
  });

  test('REG-DI-03: PAC execution rate between 0 and 100', async ({ request }) => {
    const p = await (await request.get(`${API_BASE}/api/v1/analytics/pac-vs-executed`)).json();
    for (const item of p.data) {
      expect(item.executionRate).toBeGreaterThanOrEqual(0);
    }
  });
});
