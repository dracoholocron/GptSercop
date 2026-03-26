import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/battery',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  timeout: 45_000,
  use: {
    trace: 'off',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Core battery for hybrid/remote environments:
  // - no local DB bootstrap
  // - no automatic web servers
  // - exclude suites tied to unavailable portals or strict WCAG gates
  testIgnore: [
    '**/a11y-battery.spec.ts',
    '**/admin-battery.spec.ts',
    '**/content-validation-battery.spec.ts',
    '**/entity-battery.spec.ts',
    '**/flows-battery.spec.ts',
    '**/extended-battery.spec.ts',
    '**/licitacion-battery.spec.ts',
    '**/obras-battery.spec.ts',
    '**/sie-battery.spec.ts',
  ],
});
