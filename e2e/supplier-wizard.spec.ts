import { test, expect } from '@playwright/test';

test('Supplier wizard page loads and shows steps', async ({ page }) => {
  await page.goto('http://localhost:3012/procesos');
  await expect(page.getByRole('heading', { name: 'Procesos abiertos' })).toBeVisible();

  // entrar a la primera card si existe
  const firstOfferLink = page.getByRole('link', { name: 'Presentar oferta' }).first();
  if (!(await firstOfferLink.isVisible())) test.skip(true, 'No tenders available');
  await firstOfferLink.click();

  await expect(page.getByRole('link', { name: '← Volver' })).toBeVisible();
  // stepper chips
  await expect(page.getByText('1 Contacto')).toBeVisible();
  await expect(page.getByText('2 Económica')).toBeVisible();
  await expect(page.getByText('3 Documentos')).toBeVisible();
  await expect(page.getByText('4 Envío')).toBeVisible();

  // navegación siguiente/anterior (sin auth obligatoria, solo smoke UI)
  await page.getByRole('button', { name: 'Siguiente →' }).click();
  await expect(page.getByText('Oferta económica')).toBeVisible();
});

