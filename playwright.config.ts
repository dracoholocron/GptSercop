import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3010',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run build --workspace=public-portal && cd apps/public-portal && node .next/standalone/apps/public-portal/server.js',
    url: 'http://localhost:3010',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: { ...process.env, PORT: '3010' },
  },
});
