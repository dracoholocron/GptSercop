/**
 * Playwright screenshot capture for stakeholder presentation.
 * Mirrors exact auth pattern from analytics-smoke-e2e.spec.ts
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5177';
const API_URL = 'http://localhost:3080';
const OUT_DIR = path.join(__dirname, 'screenshots');

async function getAdminToken() {
  const res = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@mec.gob.ec', role: 'admin' }),
  });
  const data = await res.json();
  return { token: data.token, roles: data.roles ?? ['ROLE_ADMIN'] };
}

async function capturePage(browser, authData, name, url, opts = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // MUST call addInitScript BEFORE page.goto
  await page.addInitScript(({ t, r }) => {
    localStorage.setItem('globalcmx_token', t);
    localStorage.setItem('globalcmx_user', JSON.stringify({
      email: 'admin@mec.gob.ec',
      roles: r,
      token: t,
    }));
  }, { t: authData.token, r: authData.roles });

  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  if (opts.clickBtn) {
    try {
      const btn = page.locator(`button:has-text("${opts.clickBtn}")`).first();
      if (await btn.isVisible({ timeout: 2000 })) {
        await btn.click();
        await page.waitForTimeout(1200);
      }
    } catch (_) {}
  }

  const file = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  const size = fs.statSync(file).size;
  const currentUrl = page.url();
  const onLogin = currentUrl.includes('/login');
  console.log(`  ${onLogin ? '⚠' : '✓'} ${name}.png (${Math.round(size/1024)}KB)${onLogin ? ' – WARNING: on login page!' : ''}`);
  await context.close();
}

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

  console.log('🔑 Getting admin token...');
  const authData = await getAdminToken();
  if (!authData.token) { console.error('❌ No token'); process.exit(1); }
  console.log(`  ✓ Token (${authData.roles.join(',')})`);

  console.log('\n📸 Capturing...\n');

  await capturePage(browser, authData, '01-dashboard',        `${BASE_URL}/analytics`);
  await capturePage(browser, authData, '02-risk-scores',      `${BASE_URL}/analytics/risk-scores`, { clickBtn: 'Alto' });
  await capturePage(browser, authData, '03-competition',      `${BASE_URL}/analytics/competition`);
  await capturePage(browser, authData, '04-provider-network', `${BASE_URL}/analytics/provider-network`);
  await capturePage(browser, authData, '05-fragmentation',    `${BASE_URL}/analytics/fragmentation`);
  await capturePage(browser, authData, '06-pac',              `${BASE_URL}/analytics/pac`);
  await capturePage(browser, authData, '07-alerts',           `${BASE_URL}/analytics/alerts`, { clickBtn: 'CRITICAL' });
  await capturePage(browser, authData, '08-provider-scores',  `${BASE_URL}/analytics/provider-scores`);
  await capturePage(browser, authData, '09-price-index',      `${BASE_URL}/analytics/price-index`);
  await capturePage(browser, authData, '10-contract-health',  `${BASE_URL}/analytics/contracts`);

  await browser.close();
  console.log('\n✅ Done!', OUT_DIR);
})().catch(e => { console.error('❌', e.message); process.exit(1); });
