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

const evidenceDir = path.join(process.cwd(), 'docs', 'evidencia');
const adminBase = process.env.ADMIN_URL || 'http://localhost:3004';
const apiBase = process.env.API_URL || 'http://localhost:3080';

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
