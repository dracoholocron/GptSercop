import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

// Cargar .env para que la API (y el global setup) tengan DATABASE_URL al correr E2E (p. ej. con Docker)
function loadEnv(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
}
loadEnv(path.join(__dirname, '.env'));
loadEnv(path.join(__dirname, 'apps', 'api', '.env'));
// Si no hay DATABASE_URL y no es CI, usar valores por defecto para Docker (docker compose up -d)
if (!process.env.DATABASE_URL && !process.env.CI) {
  process.env.DATABASE_URL = 'postgresql://sercop:sercop@localhost:5432/sercop';
}
if (!process.env.REDIS_URL && !process.env.CI) {
  process.env.REDIS_URL = 'redis://localhost:6380'; // Docker: redis 6380:6379
}
// Login E2E: API requiere JWT_SECRET para emitir tokens
if (!process.env.JWT_SECRET && !process.env.CI) {
  process.env.JWT_SECRET = 'e2e-test-secret-min-16-chars';
}

export default defineConfig({
  testDir: './e2e',
  globalSetup: require.resolve('./e2e/global-setup.js'),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }], ['list']],
  outputDir: 'test-results',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3010',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: [
    {
      command: 'npm run build --workspace=api && npm run start --workspace=api',
      url: 'http://localhost:3080/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      env: {
        ...process.env,
        PORT: '3080',
        JWT_SECRET: process.env.JWT_SECRET || 'e2e-test-secret-min-16-chars',
      },
    },
    /*
    {
      command: 'npm run build --workspace=public-portal && cd apps/public-portal && npx next start -p 3010',
      url: 'http://localhost:3010',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      env: { ...process.env, PORT: '3010' },
    },
    {
      command: 'npm run build --workspace=sercop-admin && cd apps/sercop-admin && npx next start -p 3014',
      url: 'http://localhost:3014',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      env: { ...process.env, PORT: '3014', NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3080' },
    },
    {
      command: 'npm run build --workspace=entity-portal && cd apps/entity-portal && npx next start -p 3013',
      url: 'http://localhost:3013',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      env: { ...process.env, PORT: '3013', NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3080' },
    },
    */
    {
      command: 'npm run build --workspace=supplier-portal && cd apps/supplier-portal && npx next start -p 3012',
      url: 'http://localhost:3012',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      env: { ...process.env, PORT: '3012', NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3080' },
    },
  ],
});
