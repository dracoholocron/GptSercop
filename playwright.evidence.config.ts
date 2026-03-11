/**
 * Config para captura de evidencia: levanta el admin en 3004.
 * Uso: npx playwright test e2e/evidence.spec.ts --config=playwright.evidence.config.ts
 * Requiere API en 3080 (npm run dev o .\scripts\start-api.ps1).
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: /evidence\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3004',
    trace: 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev:admin',
    url: 'http://localhost:3004',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
    cwd: process.cwd(),
  },
});
