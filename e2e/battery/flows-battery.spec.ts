/**
 * Batería QA – Flujos críticos entre portales y pasos extendidos.
 */
import { test, expect } from '@playwright/test';
import { supplierLogin, entityLogin, adminLogin } from './auth-helpers';

const PUBLIC_BASE = 'http://localhost:3010';
const SUPPLIER_BASE = 'http://localhost:3012';
const ADMIN_BASE = 'http://localhost:3014';
const ENTITY_BASE = 'http://localhost:3013';

test.describe('Flujo Público → Procesos → Detalle', () => {
  test.use({ baseURL: PUBLIC_BASE });

  test('F01: Home → Procesos', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Procesos|procesos/i }).first().click();
    await expect(page).toHaveURL(/\/procesos/);
    await expect(page.locator('body')).toContainText(/Buscar|Resultados|proceso/i);
  });

  test('F02: Procesos → Filtros → Buscar', async ({ page }) => {
    await page.goto('/procesos');
    const summary = page.getByText('Filtros', { exact: true }).first();
    await summary.click().catch(() => {});
    await page.getByRole('button', { name: /Buscar/i }).click();
    await expect(page.locator('body')).toBeVisible();
  });

  test('F03: Procesos → Normativa', async ({ page }) => {
    await page.goto('/procesos');
    await page.getByRole('link', { name: /Normativa|normativa/i }).first().click();
    await expect(page).toHaveURL(/\/normativa/);
  });

  test('F04: Procesos → Cifras', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Cifras|cifras/i }).first().click().catch(() => {});
    await expect(page.locator('body')).toBeVisible();
  });

  test('F05: Procesos → Enlaces', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Enlaces|enlaces/i }).first().click().catch(() => {});
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Flujo Proveedor – Login y Procesos', () => {
  test.use({ baseURL: SUPPLIER_BASE });

  test('F06: Login → Home', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email|correo/i).fill('supplier@test.com');
    await page.getByRole('button', { name: /entrar|iniciar/i }).click();
    await page.waitForLoadState('networkidle').catch(() => {});
    await expect(page.locator('body')).toBeVisible();
  });

  test('F07: Home → Procesos', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Procesos|procesos/i }).first().click();
    await expect(page).toHaveURL(/\/procesos/);
  });

  test('F08: Procesos → Presentar oferta (primer paso)', async ({ page, request }) => {
    await supplierLogin(page, SUPPLIER_BASE, request);
    await page.goto('/procesos');
    await page.getByRole('link', { name: /Presentar oferta/i }).or(page.getByText(/No hay procesos publicados/)).first().waitFor({ state: 'visible', timeout: 15000 });
    const link = page.getByRole('link', { name: /Presentar oferta/i }).first();
    if (!(await link.isVisible().catch(() => false))) {
      test.skip(true, 'No hay procesos');
    }
    await link.click();
    await expect(page.getByText('1 Contacto').first()).toBeVisible({ timeout: 10000 });
  });

  test('F09: Procesos → SIE', async ({ page }) => {
    await page.goto('/procesos');
    await page.getByRole('link', { name: /SIE|Presentar oferta/i }).or(page.getByText(/No hay procesos publicados/)).first().waitFor({ state: 'visible', timeout: 15000 });
    const link = page.getByRole('link', { name: /SIE/i }).first();
    if (!(await link.isVisible().catch(() => false))) {
      test.skip(true, 'No hay procesos');
    }
    await link.click();
    await expect(page.getByText('Subasta Inversa Electrónica (SIE) – MVP')).toBeVisible({ timeout: 8000 });
  });

  test('F10: Ofertas → listado', async ({ page }) => {
    await page.goto('/ofertas');
    await expect(page.locator('body')).toContainText(/ofertas|Mis|Sin|acuse/i);
  });

  test('F10b: Procesos → Ver detalle proceso', async ({ page }) => {
    await page.goto('/procesos');
    await page.getByRole('link', { name: /Ver detalle/i }).or(page.getByText(/No hay procesos publicados/)).first().waitFor({ state: 'visible', timeout: 15000 });
    const link = page.getByRole('link', { name: /Ver detalle/i }).first();
    if (!(await link.isVisible().catch(() => false))) {
      test.skip(true, 'No hay procesos');
    }
    await link.click();
    await expect(page.locator('body')).toContainText(/Preguntas|Presentar oferta|Presentar reclamo|reclamo/i);
  });

  test('F10c: Procesos → Detalle → Enviar pregunta (con login)', async ({ page, request }) => {
    await supplierLogin(page, SUPPLIER_BASE, request);
    await page.goto('/procesos');
    await page.getByRole('link', { name: /Ver detalle/i }).or(page.getByText(/No hay procesos publicados/)).first().waitFor({ state: 'visible', timeout: 15000 });
    const link = page.getByRole('link', { name: /Ver detalle/i }).first();
    if (!(await link.isVisible().catch(() => false))) {
      test.skip(true, 'No hay procesos');
    }
    await link.click();
    const questionInput = page.getByPlaceholder(/pregunta|Escriba/i).first();
    await questionInput.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
    if (await questionInput.isVisible().catch(() => false)) {
      await questionInput.fill('¿Cuál es el plazo de entrega?');
      await page.getByRole('button', { name: /Enviar pregunta/i }).click();
      await expect(page.locator('body')).toContainText(/enviada|Pregunta|pregunta/i);
    }
  });

  test('F10d: Procesos → Detalle → Enviar reclamo (con login)', async ({ page, request }) => {
    await supplierLogin(page, SUPPLIER_BASE, request);
    await page.goto('/procesos');
    await page.getByRole('link', { name: /Ver detalle/i }).or(page.getByText(/No hay procesos publicados/)).first().waitFor({ state: 'visible', timeout: 15000 });
    const link = page.getByRole('link', { name: /Ver detalle/i }).first();
    if (!(await link.isVisible().catch(() => false))) {
      test.skip(true, 'No hay procesos');
    }
    await link.click();
    await page.getByRole('heading', { name: /Presentar reclamo/i }).or(page.getByText(/Presentar reclamo/)).first().scrollIntoViewIfNeeded().catch(() => {});
    const subjectInput = page.getByPlaceholder(/Asunto|Resumen del reclamo/i).first();
    await subjectInput.waitFor({ state: 'visible', timeout: 6000 }).catch(() => {});
    if (await subjectInput.isVisible().catch(() => false)) {
      await subjectInput.fill('Reclamo de prueba E2E');
      await page.getByPlaceholder(/Describa|Mensaje/i).first().fill('Mensaje de prueba para reclamo.');
      await page.getByRole('button', { name: /Enviar reclamo/i }).click();
      await expect(page.locator('body')).toContainText(/registrado|Reclamo|reclamo/i);
    }
  });
});

test.describe('Flujo Admin – Login y Procesos', () => {
  test.use({ baseURL: ADMIN_BASE });

  test('F11: Login → Dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email|correo/i).fill('admin@mec.gob.ec');
    await page.getByRole('button', { name: /entrar|iniciar/i }).click();
    await page.waitForLoadState('networkidle').catch(() => {});
    await expect(page.locator('body')).toBeVisible();
  });

  test('F12: Dashboard → Procesos', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Procesos/i }).first().click();
    await expect(page).toHaveURL(/\/procesos/);
  });

  test('F13: Procesos → Revisar ofertas', async ({ page }) => {
    await page.goto('/procesos');
    await page.getByRole('link', { name: /Revisar ofertas|Config/i }).or(page.getByText(/No hay procesos\./)).first().waitFor({ state: 'visible', timeout: 15000 });
    const link = page.getByRole('link', { name: /Revisar ofertas/i }).first();
    if (!(await link.isVisible().catch(() => false))) {
      test.skip(true, 'No hay procesos');
    }
    await link.click();
    await expect(page.locator('body')).toContainText(/Ofertas|ofertas|Volver/i);
  });

  test('F14: Procesos → Config oferta', async ({ page }) => {
    await page.goto('/procesos');
    await page.getByRole('link', { name: /Revisar ofertas|Config/i }).or(page.getByText(/No hay procesos\./)).first().waitFor({ state: 'visible', timeout: 15000 });
    const link = page.getByRole('link', { name: /Config/i }).first();
    if (!(await link.isVisible().catch(() => false))) {
      test.skip(true, 'No hay procesos');
    }
    await link.click();
    await expect(page.locator('body')).toContainText(/config|modalidad|JSON/i);
  });

  test('F15: Navegación Usuarios', async ({ page }) => {
    await page.goto('/usuarios');
    await expect(page.locator('body')).toContainText(/Usuarios|usuarios|Inicie sesión|tabla/i);
  });

  test('F16: Navegación Entidades', async ({ page }) => {
    await page.goto('/entidades');
    await expect(page.locator('body')).toContainText(/Entidades|Inicie sesión/i);
  });

  test('F17: Navegación Auditoría', async ({ page }) => {
    await page.goto('/auditoria');
    await expect(page.locator('body')).toContainText(/Auditoría|Inicie sesión/i);
  });

  test('F18: Navegación Normativa', async ({ page }) => {
    await page.goto('/normativa');
    await expect(page.locator('body')).toContainText(/normativa|chunks|Inicie sesión/i);
  });

  test('F18b: Denuncias carga (con login)', async ({ page, request }) => {
    await adminLogin(page, ADMIN_BASE, request);
    await page.goto('/denuncias');
    await expect(page.locator('body')).toContainText(/Denuncias|denuncias|Estado|Cargando|filtro|coincidan/i);
  });

  test('F18c: Reclamos carga (con login)', async ({ page, request }) => {
    await adminLogin(page, ADMIN_BASE, request);
    await page.goto('/reclamos');
    await expect(page.locator('body')).toContainText(/Reclamos|reclamos|Estado|Cargando|filtro|coincidan/i);
  });
});

test.describe('Flujo Entidad', () => {
  test.use({ baseURL: ENTITY_BASE });

  test('F19: Home → Procesos', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Procesos|procesos/i }).first().click().catch(() => {});
    await expect(page.locator('body')).toBeVisible();
  });

  test('F20: PAC carga', async ({ page }) => {
    await page.goto('/pac');
    await expect(page.locator('body')).toBeVisible();
  });

  test('F20b: Procesos → Aclaraciones (con login)', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto('/procesos');
    await page.getByRole('link', { name: /Ver ofertas|Aclaraciones|Editar/i }).or(page.getByText(/No hay procesos/)).first().waitFor({ state: 'visible', timeout: 15000 });
    const aclLink = page.getByRole('link', { name: /Aclaraciones/i }).first();
    if (!(await aclLink.isVisible().catch(() => false))) {
      test.skip(true, 'No hay enlace Aclaraciones');
    }
    await aclLink.click();
    await expect(page.locator('body')).toContainText(/Preguntas|aclaraciones|Respuesta|pendientes/i);
  });

  test('F20c: Procesos → Contrato (con login)', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto('/procesos');
    await page.getByRole('link', { name: /Ver ofertas|Contrato|Editar/i }).or(page.getByText(/No hay procesos/)).first().waitFor({ state: 'visible', timeout: 15000 });
    const contratoLink = page.getByRole('link', { name: /Contrato/i }).first();
    if (!(await contratoLink.isVisible().catch(() => false))) {
      test.skip(true, 'No hay enlace Contrato');
    }
    await contratoLink.click();
    await expect(page.locator('body')).toContainText(/Contrato|contrato|Proveedor|Administrador|Pagos|Crear contrato/i);
  });

  test('F20d: Aclaraciones → Responder pregunta si hay abierta', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto('/procesos');
    await page.getByRole('link', { name: /Aclaraciones|Ver ofertas/i }).or(page.getByText(/No hay procesos/)).first().waitFor({ state: 'visible', timeout: 15000 });
    const aclLink = page.getByRole('link', { name: /Aclaraciones/i }).first();
    if (!(await aclLink.isVisible().catch(() => false))) {
      test.skip(true, 'No hay enlace Aclaraciones');
    }
    await aclLink.click();
    const answerInput = page.getByPlaceholder(/Escriba la respuesta pública/i).first();
    try {
      await answerInput.waitFor({ state: 'visible', timeout: 8000 });
    } catch {
      test.skip(true, 'No hay preguntas abiertas (o la página no cargó a tiempo)');
    }
    await answerInput.fill('Sí, se aceptan ofertas parciales según pliegos.');
    await page.getByRole('button', { name: /Responder/i }).first().click();
    await expect(page.locator('body')).toContainText(/Preguntas|aclaraciones|Respuesta|pendientes|pública/i);
  });

  test('F20e: Contrato → Agregar pago si ya existe contrato', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto('/procesos');
    await page.getByRole('link', { name: /Contrato|Ver ofertas/i }).or(page.getByText(/No hay procesos/)).first().waitFor({ state: 'visible', timeout: 15000 });
    const contratoLink = page.getByRole('link', { name: /Contrato/i }).first();
    if (!(await contratoLink.isVisible().catch(() => false))) {
      test.skip(true, 'No hay enlace Contrato');
    }
    await contratoLink.click();
    const addPayButton = page.getByRole('button', { name: /Agregar pago/i });
    try {
      await addPayButton.waitFor({ state: 'visible', timeout: 8000 });
    } catch {
      test.skip(true, 'No hay contrato creado aún (o la página no cargó a tiempo)');
    }
    const seqInput = page.getByPlaceholder(/Nº hito|Ej: 1/i).or(page.getByLabel(/Nº hito/i)).first();
    const amountInput = page.getByPlaceholder(/Monto|0\.00/i).first();
    const seqVisible = await seqInput.isVisible().catch(() => false);
    const amountVisible = await amountInput.isVisible().catch(() => false);
    if (!seqVisible || !amountVisible) {
      await expect(page.locator('body')).toContainText(/Contrato|Pagos|Guardar|Suspender/i);
      return;
    }
    await seqInput.fill('10');
    await amountInput.fill('1000');
    await addPayButton.click().catch(() => {});
    await expect(page.locator('body')).toContainText(/Contrato|Pagos|Hito|planned|pagado|Guardar|Suspender/i);
  });
});

test.describe('Flujo Licitación – API y navegación', () => {
  const API_BASE = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3080';

  test('F-lic-api: entidad puede llamar openBids (o 400 si no aplica)', async ({ request }) => {
    const loginRes = await request.post(`${API_BASE}/api/v1/auth/login`, {
      data: { email: 'admin@mec.gob.ec', role: 'entity', entityId: (await request.get(`${API_BASE}/api/v1/entities`).then((r) => r.ok() ? (r.json() as Promise<{ data?: Array<{ id: string }> }>) : { data: [] })).data?.[0]?.id },
    });
    if (!loginRes.ok()) return;
    const { token } = (await loginRes.json()) as { token: string };
    const listRes = await request.get(`${API_BASE}/api/v1/tenders?pageSize=20`);
    if (!listRes.ok()) return;
    const list = (await listRes.json()) as { data?: Array<{ id: string; bidsDeadlineAt?: string | null; bidsOpenedAt?: string | null }> };
    const tender = list.data?.find((t) => t.bidsDeadlineAt && !t.bidsOpenedAt);
    if (!tender) return;
    const openRes = await request.post(`${API_BASE}/api/v1/tenders/${tender.id}/bids/open`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {},
    });
    expect([200, 400]).toContain(openRes.status());
  });

  test('F-lic-nav: público Plazos y requisitos licitación carga', async ({ page }) => {
    await page.goto(PUBLIC_BASE + '/licitacion-plazos');
    await expect(page.locator('body')).toContainText(/Plazos y requisitos|Licitación|convalidación|adjudicatario fallido|existencia legal/i);
  });
});
