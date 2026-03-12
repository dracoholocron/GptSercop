/**
 * Captura de evidencia (screenshots) para docs/evidencia.
 * Ejecutar con los servicios en marcha:
 *   Admin (3004): npx playwright test e2e/evidence.spec.ts --project=admin
 *   API (3080):   npx playwright test e2e/evidence.spec.ts --project=api
 * O ambos: npx playwright test e2e/evidence.spec.ts
 */

import { test } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

// Nota: el repo usa carpeta `Docs/` (D mayúscula)
const evidenceDir = path.join(process.cwd(), 'Docs', 'evidencia');
const adminBase = process.env.ADMIN_URL || 'http://localhost:3014';
const apiBase = process.env.API_URL || 'http://localhost:3080';
const supplierBase = process.env.SUPPLIER_URL || 'http://localhost:3012';
const entityBase = process.env.ENTITY_URL || 'http://localhost:3013';

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

test.describe('Evidencia Admin', () => {
  test.use({ baseURL: adminBase });

  test('captura login', async ({ page }) => {
    const out = path.join(evidenceDir, 'fase2', 'admin-login.png');
    ensureDir(path.dirname(out));
    await page.goto('/login');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.screenshot({ path: out, fullPage: true });
  });

  test('captura usuarios', async ({ page }) => {
    const out = path.join(evidenceDir, 'fase2', 'usuarios-listado.png');
    ensureDir(path.dirname(out));
    await page.goto('/login');
    await page.getByLabel(/email|correo/i).fill('admin@mec.gob.ec');
    await page.getByRole('button', { name: /entrar|iniciar|login/i }).click();
    await page.waitForURL(/\/(dashboard|login)?$/, { timeout: 15000 }).catch(() => {});
    await page.goto('/usuarios');
    await page.waitForSelector('table, [role="table"]', { timeout: 10000 }).catch(() => {});
    await page.screenshot({ path: out, fullPage: true });
  });

  test('captura normativa', async ({ page }) => {
    const out = path.join(evidenceDir, 'fase2', 'normativa-listado.png');
    ensureDir(path.dirname(out));
    await page.goto('/normativa');
    await page.waitForSelector('table, [role="table"], button', { timeout: 10000 }).catch(() => {});
    await page.screenshot({ path: out, fullPage: true });
  });
});

test.describe('Evidencia API', () => {
  test('captura documentación OpenAPI', async ({ page }) => {
    const out = path.join(evidenceDir, 'fase4', 'documentation.png');
    ensureDir(path.dirname(out));
    await page.goto(`${apiBase}/documentation`);
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.screenshot({ path: out, fullPage: true });
  });
});

test.describe('Evidencia Supplier (SIE)', () => {
  test.use({ baseURL: supplierBase });

  test('captura procesos (incluye link SIE)', async ({ page }) => {
    const out = path.join(evidenceDir, 'fase6', 'supplier-procesos.png');
    ensureDir(path.dirname(out));
    await page.goto('/procesos');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.screenshot({ path: out, fullPage: true });
  });

  test('captura pantalla SIE (si hay procesos)', async ({ page }) => {
    const out = path.join(evidenceDir, 'fase6', 'supplier-sie.png');
    ensureDir(path.dirname(out));
    await page.goto('/procesos');
    const sieLink = page.getByRole('link', { name: /SIE \(MVP\)/i }).first();
    if (!(await sieLink.isVisible().catch(() => false))) return;
    await sieLink.click();
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.screenshot({ path: out, fullPage: true });
  });
});

test.describe('Evidencia Entity (revisión ofertas)', () => {
  test.use({ baseURL: entityBase });

  test('captura lista de procesos', async ({ page }) => {
    const out = path.join(evidenceDir, 'fase7', 'entity-procesos.png');
    ensureDir(path.dirname(out));
    await page.goto('/procesos');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.screenshot({ path: out, fullPage: true });
  });
});
