/**
 * Config para E2E del portal Admin (sercop-admin en 3004).
 * Uso: npx playwright test e2e/admin.spec.ts --config=playwright.admin.config.ts
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: /admin\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3004',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev:admin',
    url: 'http://localhost:3004',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
    cwd: process.cwd(),
    env: {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3080',
    },
  },
});
