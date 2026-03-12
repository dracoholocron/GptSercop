import { test, expect } from '@playwright/test';

test('Supplier SIE page loads (smoke)', async ({ page }) => {
  await page.goto('http://localhost:3012/procesos');
  const sieLink = page.getByRole('link', { name: 'SIE (MVP)' }).first();
  if (!(await sieLink.isVisible())) test.skip(true, 'No tenders available');
  await sieLink.click();

  await expect(page.getByText('Subasta Inversa Electrónica (SIE) – MVP')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Refrescar' })).toBeVisible();
});

