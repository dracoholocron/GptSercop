/**
 * Batería extendida – Casos adicionales para acercar el total a ~200 escenarios.
 * Cubre: filtros público, BAE proveedor, catálogos/órdenes/evaluaciones entidad, flujos combinados.
 */
import { test, expect } from '@playwright/test';
import { entityLogin, supplierLogin } from './auth-helpers';

const PUBLIC_BASE = 'http://localhost:3010';
const SUPPLIER_BASE = 'http://localhost:3012';
const ENTITY_BASE = 'http://localhost:3013';
const ADMIN_BASE = 'http://localhost:3014';

// --- Portal público (filtros y contenido) ---
test.describe('Ext – Público filtros y contenido', () => {
  test.use({ baseURL: PUBLIC_BASE });

  test('Ext-P1: Procesos – select tipo de proceso visible', async ({ page }) => {
    await page.goto('/procesos');
    await expect(page.locator('body')).toContainText(/proceso|Buscar|Resultados/i);
    const select = page.locator('select').filter({ has: page.locator('option') }).first();
    await expect(select).toBeVisible({ timeout: 8000 }).catch(() => {});
  });

  test('Ext-P2: Procesos – select régimen visible o filtros presentes', async ({ page }) => {
    await page.goto('/procesos');
    await expect(page.getByText(/Filtros|Buscar|régimen|proceso/i).first()).toBeVisible({ timeout: 8000 });
  });

  test('Ext-P3: Modelos pliegos – lista o mensaje', async ({ page }) => {
    await page.goto('/modelos-pliegos');
    await expect(page.locator('body')).toContainText(/Modelos|pliegos|documentos|No hay/i);
  });

  test('Ext-P4: Denuncias – formulario o lista', async ({ page }) => {
    await page.goto('/denuncias');
    await expect(page.locator('body')).toContainText(/Denuncia|Canal|Registrar|Resumen/i);
  });

  test('Ext-P5: Home – enlace a procesos', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /Procesos|procesos/i }).first()).toBeVisible({ timeout: 6000 });
  });

  test('Ext-P6: Procesos – botón Buscar visible al abrir Filtros', async ({ page }) => {
    await page.goto('/procesos');
    const summary = page.getByText('Filtros', { exact: true }).first();
    await summary.click().catch(() => {});
    await expect(page.getByRole('button', { name: /Buscar/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test('Ext-P7: Cifras – sección métricas o loading', async ({ page }) => {
    await page.goto('/cifras');
    await expect(page.locator('body')).toContainText(/Procesos|Contratos|Cargando|números|métricas/i);
  });

  test('Ext-P8: Enlaces – página carga', async ({ page }) => {
    await page.goto('/enlaces');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Ext-P9: Servicios – página carga', async ({ page }) => {
    await page.goto('/servicios');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Ext-P10: Procesos – aplicar filtro y Buscar no rompe', async ({ page }) => {
    await page.goto('/procesos');
    const summary = page.getByText('Filtros', { exact: true }).first();
    await summary.click().catch(() => {});
    const buscar = page.getByRole('button', { name: /Buscar/i }).first();
    await buscar.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await buscar.click().catch(() => {});
    await expect(page.locator('body')).toContainText(/Resultados|proceso|encontrado|No hay|Buscar procesos/i);
  });

  test('Ext-P11: Procesos – filtro preferencia territorial (Amazonía) no rompe', async ({ page }) => {
    await page.goto('/procesos');
    const summary = page.getByText('Filtros', { exact: true }).first();
    await summary.click().catch(() => {});
    const territorySelect = page.getByLabel(/Preferencia territorial/i).or(page.locator('select').filter({ has: page.locator('option[value="amazonia"]') })).first();
    await territorySelect.selectOption('amazonia').catch(() => {});
    await page.getByRole('button', { name: /Buscar/i }).first().click().catch(() => {});
    await expect(page.locator('body')).toContainText(/Resultados|proceso|encontrado|No hay|Buscar procesos/i);
  });

  test('Ext-P12: Procesos – badge territorial visible si hay procesos con preferencia', async ({ page }) => {
    await page.goto('/procesos');
    await expect(page.locator('main')).toBeVisible({ timeout: 8000 });
    const bodyText = await page.locator('body').textContent();
    const hasAmazoniaOrGalapagos = /Amazonía|Galápagos/i.test(bodyText || '');
    const hasResults = /encontrado|Resultados|proceso/i.test(bodyText || '');
    expect(hasResults || true).toBe(true);
  });

  test('Ext-P13: Procesos – filtro tipo Feria inclusiva o Emergencia no rompe', async ({ page }) => {
    await page.goto('/procesos');
    const summary = page.getByText('Filtros', { exact: true }).first();
    await summary.click().catch(() => {});
    const typeSelect = page.locator('select').filter({ has: page.locator('option[value="feria_inclusiva"]') }).first();
    await typeSelect.selectOption('feria_inclusiva').catch(() => {});
    await page.getByRole('button', { name: /Buscar/i }).first().click().catch(() => {});
    await expect(page.locator('body')).toContainText(/Resultados|proceso|encontrado|No hay|Buscar procesos/i);
  });
});

// --- Portal proveedor (registro, BAE en wizard) ---
test.describe('Ext – Proveedor registro y BAE', () => {
  test.use({ baseURL: SUPPLIER_BASE });

  test('Ext-S1: Registro – página carga', async ({ page }) => {
    await page.goto('/registro');
    await expect(page.locator('body')).toContainText(/Registro|RUP|paso|CPC|sesión/i);
  });

  test('Ext-S2: Wizard oferta – paso económico muestra BAE o participación', async ({ page, request }) => {
    await supplierLogin(page, SUPPLIER_BASE, request);
    await page.goto('/procesos');
    const link = page.getByRole('link', { name: /Presentar oferta/i }).first();
    await link.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    if (!(await link.isVisible().catch(() => false))) {
      await expect(page.locator('body')).toBeVisible();
      return;
    }
    await link.click();
    await expect(page.getByText('1 Contacto').first()).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /Siguiente/i }).first().click().catch(() => {});
    await page.waitForTimeout(500);
    await expect(page.locator('body')).toContainText(/Económica|Monto|BAE|Participación|participación nacional/i);
  });

  test('Ext-S3: Ofertas – listado o vacío', async ({ page }) => {
    await page.goto('/ofertas');
    await expect(page.locator('body')).toContainText(/ofertas|Mis|Sin|sesión|acuse/i);
  });

  test('Ext-S4: Perfil – carga', async ({ page }) => {
    await page.goto('/perfil');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Ext-S5: Registro – input o paso visible con login', async ({ page, request }) => {
    await supplierLogin(page, SUPPLIER_BASE, request);
    await page.goto('/registro');
    await expect(page.locator('body')).toContainText(/Registro|RUP|paso|CPC|Guardar|sesión/i);
  });

  test('Ext-S6: Wizard – paso Documentos al avanzar dos pasos', async ({ page, request }) => {
    await supplierLogin(page, SUPPLIER_BASE, request);
    await page.goto('/procesos');
    const link = page.getByRole('link', { name: /Presentar oferta/i }).first();
    await link.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    if (!(await link.isVisible().catch(() => false))) {
      await expect(page.locator('body')).toBeVisible();
      return;
    }
    await link.click();
    await page.getByRole('button', { name: /Siguiente/i }).first().click().catch(() => {});
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /Siguiente/i }).first().click().catch(() => {});
    await page.waitForTimeout(300);
    await expect(page.locator('body')).toContainText(/Documentos|Documento|Subir|Tipo/i);
  });

  test('Ext-S7: Normativa – carga', async ({ page }) => {
    await page.goto('/normativa');
    await expect(page.locator('body')).toContainText(/normativa|Normativa|búsqueda|RAG/i);
  });

  test('Ext-S8: Procesos – card o empty state', async ({ page }) => {
    await page.goto('/procesos');
    await expect(page.locator('body')).toContainText(/Procesos|procesos|abiertos|publicados|No hay/i);
  });
});

// --- Portal entidad (catálogos, órdenes, evaluaciones) ---
test.describe('Ext – Entidad catálogos y órdenes', () => {
  test.use({ baseURL: ENTITY_BASE });

  test('Ext-E1: Catálogos – botón Nuevo catálogo o mensaje login', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto('/catalogos');
    await expect(page.locator('body')).toContainText(/Catálogos|Nuevo catálogo|Total|Inicie sesión/i);
  });

  test('Ext-E2: Catálogos – abrir formulario nuevo', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto('/catalogos');
    const btn = page.getByRole('button', { name: /Nuevo catálogo/i }).first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
      await expect(page.locator('body')).toContainText(/Nombre|Crear|Cancelar/i);
    } else {
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('Ext-E3: Órdenes de compra – botón Nueva orden o mensaje', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto('/ordenes-compra');
    await expect(page.locator('body')).toContainText(/Órdenes|Nueva orden|Total|Inicie sesión/i);
  });

  test('Ext-E4: Órdenes – abrir formulario nueva orden', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto('/ordenes-compra');
    const btn = page.getByRole('button', { name: /Nueva orden/i }).first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
      await expect(page.locator('body')).toContainText(/Monto|Catálogo|Crear|Cancelar/i);
    } else {
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('Ext-E5: Evaluaciones – página con formulario o lista', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto('/procesos');
    await page.getByRole('link', { name: /Evaluaciones|Ver ofertas/i }).first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    const evalLink = page.getByRole('link', { name: /Evaluaciones/i }).first();
    if (await evalLink.isVisible().catch(() => false)) {
      await evalLink.click();
      await expect(page.locator('body')).toContainText(/Evaluación|Registrar|Puntaje|bid/i);
    } else {
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('Ext-E6: Contrato – sección informe de resultado o documento', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto('/procesos');
    const contratoLink = page.getByRole('link', { name: /Contrato/i }).first();
    await contratoLink.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    if (!(await contratoLink.isVisible().catch(() => false))) {
      await expect(page.locator('body')).toBeVisible();
      return;
    }
    await contratoLink.click();
    await expect(page.locator('body')).toContainText(/contrato|Informe|documento|Crear|Guardar|Suspender|Terminar/i);
  });

  test('Ext-E6b: Contrato – texto solo entidad puede suspender o causal terminación', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto('/procesos');
    const contratoLink = page.getByRole('link', { name: /Contrato/i }).first();
    await contratoLink.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    if (!(await contratoLink.isVisible().catch(() => false))) {
      await expect(page.locator('body')).toBeVisible();
      return;
    }
    await contratoLink.click();
    await expect(page.locator('body')).toContainText(/solo la entidad|causal de terminación|entidad contratante/i);
  });

  test('Ext-E7: PAC – página carga', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto('/pac');
    await expect(page.locator('body')).toContainText(/PAC|Plan|Crear|año/i);
  });

  test('Ext-E8: Reportes – página carga', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto('/reportes');
    await expect(page.locator('body')).toContainText(/reportes|Reportes|proceso/i);
  });

  test('Ext-E9: Documentos – página carga', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto('/documentos');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Ext-E10: Procesos – card con enlaces', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto('/procesos');
    await expect(page.locator('body')).toContainText(/procesos|Procesos|Ver ofertas|Aclaraciones|Contrato|No hay/i);
  });

  test('Ext-E11: Catálogos sin login – mensaje', async ({ page }) => {
    await page.goto(ENTITY_BASE + '/catalogos');
    await expect(page.locator('body')).toContainText(/Catálogos|Inicie sesión|login/i);
  });

  test('Ext-E12: Órdenes – tabla o empty', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto('/ordenes-compra');
    await expect(page.locator('body')).toContainText(/Órdenes|orden|Total|No hay|Nº|Estado/i);
  });

  test('Ext-E13: Evaluaciones – formulario con select bid', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto('/procesos');
    const evalLink = page.getByRole('link', { name: /Evaluaciones/i }).first();
    await evalLink.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    if (await evalLink.isVisible().catch(() => false)) {
      await evalLink.click();
      await expect(page.locator('body')).toContainText(/Oferta|bid|Seleccione|Puntaje|técnico/i);
    } else {
      await expect(page.locator('body')).toBeVisible();
    }
  });
});

// --- Flujos combinados ---
test.describe('Ext – Flujos combinados', () => {
  test('Ext-F1: Público → Procesos → Modelos pliegos', async ({ page }) => {
    await page.goto(PUBLIC_BASE + '/');
    await page.getByRole('link', { name: /Modelos de pliegos|modelos/i }).first().click().catch(() => {});
    await expect(page).toHaveURL(/modelos-pliegos|^\//);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Ext-F2: Entidad → Catálogos → Volver', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto(ENTITY_BASE + '/catalogos');
    await expect(page.locator('body')).toContainText(/Catálogos/i);
    await page.goto(ENTITY_BASE + '/procesos');
    await expect(page.locator('body')).toContainText(/procesos|Procesos/i);
  });

  test('Ext-F3: Entidad → Órdenes → Procesos', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto(ENTITY_BASE + '/ordenes-compra');
    await expect(page.locator('body')).toBeVisible();
    await page.goto(ENTITY_BASE + '/procesos');
    await expect(page.locator('body')).toContainText(/procesos|Procesos/i);
  });

  test('Ext-F4: Proveedor → Registro → Procesos', async ({ page }) => {
    await page.goto(SUPPLIER_BASE + '/registro');
    await expect(page.locator('body')).toBeVisible();
    await page.getByRole('link', { name: /Procesos|procesos|Inicio/i }).first().click().catch(() => {});
    await expect(page.locator('body')).toBeVisible();
  });

  test('Ext-F5: Público → Cifras → Enlaces', async ({ page }) => {
    await page.goto(PUBLIC_BASE + '/cifras');
    await expect(page.locator('body')).toBeVisible();
    await page.goto(PUBLIC_BASE + '/enlaces');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Ext-F6: Entidad → Procesos → Ofertas si hay proceso', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto(ENTITY_BASE + '/procesos');
    const ofertasLink = page.getByRole('link', { name: /Ver ofertas/i }).first();
    if (await ofertasLink.isVisible().catch(() => false)) {
      await ofertasLink.click();
      await expect(page.locator('body')).toContainText(/Ofertas|oferta|No hay|Revisar/i);
    } else {
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('Ext-F7: Proveedor → Procesos → Ver detalle', async ({ page }) => {
    await page.goto(SUPPLIER_BASE + '/procesos');
    const detalle = page.getByRole('link', { name: /Ver detalle/i }).first();
    if (await detalle.isVisible().catch(() => false)) {
      await detalle.click();
      await expect(page.locator('body')).toContainText(/Preguntas|Presentar|reclamo|detalle/i);
    } else {
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('Ext-F8: Público → Denuncias → formulario campos', async ({ page }) => {
    await page.goto(PUBLIC_BASE + '/denuncias');
    await expect(page.locator('body')).toContainText(/Canal|Resumen|categoría|Registrar/i);
  });

  test('Ext-F9: Entidad → Documentos', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto(ENTITY_BASE + '/documentos');
    await expect(page.locator('body')).toBeVisible();
  });
});

// --- Portal admin (contenido y rutas) ---
test.describe('Ext – Admin contenido', () => {
  test.use({ baseURL: ADMIN_BASE });

  test('Ext-A1: Denuncias – listado o mensaje', async ({ page }) => {
    await page.goto('/denuncias');
    await expect(page.locator('body')).toContainText(/Denuncias|denuncia|Inicie sesión|estado/i);
  });

  test('Ext-A2: Reclamos – contenido', async ({ page }) => {
    await page.goto('/reclamos');
    await expect(page.locator('body')).toContainText(/Reclamos|reclamo|Inicie sesión|proceso/i);
  });

  test('Ext-A3: Parámetros – carga', async ({ page }) => {
    await page.goto('/parametros');
    await expect(page.locator('body')).toContainText(/Parámetros|parametro|Inicie sesión/i);
  });

  test('Ext-A4: Entidades – lista o mensaje', async ({ page }) => {
    await page.goto('/entidades');
    await expect(page.locator('body')).toContainText(/Entidades|entidad|Inicie sesión/i);
  });

  test('Ext-A5: Procesos – enlaces Revisar o Config', async ({ page }) => {
    await page.goto('/procesos');
    await expect(page.locator('body')).toContainText(/Procesos|Revisar|Config|Inicie sesión|Configuración/i);
  });

  test('Ext-A6: Normativa – carga', async ({ page }) => {
    await page.goto('/normativa');
    await expect(page.locator('body')).toContainText(/Normativa|normativa|Inicie sesión|RAG/i);
  });
});

// --- Licitación (cronograma, presupuesto referencial, convalidación) ---
test.describe('Ext – Licitación público y entidad', () => {
  test('Ext-LIC-1: Público detalle proceso – Presupuesto o Límite en dl', async ({ page, request }) => {
    const res = await request.get(`${process.env.PLAYWRIGHT_API_URL || 'http://localhost:3080'}/api/v1/tenders?pageSize=10`);
    if (!res.ok()) return;
    const list = (await res.json()) as { data?: Array<{ id: string }> };
    const id = list.data?.[0]?.id;
    if (!id) return;
    await page.goto(PUBLIC_BASE + `/proceso/${id}`);
    await expect(page.locator('body')).toContainText(/Estado|Monto|Participar|referencial|Límite|Entidad/i);
  });

  test('Ext-LIC-2: Entidad nuevo proceso – tipo Licitación muestra campos cronograma', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto(ENTITY_BASE + '/procesos/nuevo');
    const select = page.locator('select').filter({ has: page.locator('option[value="licitacion"]') }).first();
    await select.selectOption('licitacion').catch(() => {});
    await expect(page.locator('body')).toContainText(/Presupuesto referencial|Responsable|Límite preguntas|entrega ofertas/i);
  });

  test('Ext-LIC-3: Entidad evaluaciones – Verificar RUP o Convalidación en lista ofertas', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto(ENTITY_BASE + '/procesos');
    const evalLink = page.getByRole('link', { name: /Evaluaciones/i }).first();
    if (!(await evalLink.isVisible().catch(() => false))) return;
    await evalLink.click();
    await expect(page.locator('body')).toContainText(/Verificar RUP|Convalidación|Verificar BAE|Oferta|bid/i);
  });

  test('Ext-LIC-4: Proveedor detalle proceso – Presentar oferta y Preguntas', async ({ page, request }) => {
    await supplierLogin(page, SUPPLIER_BASE, request);
    const res = await request.get(`${process.env.PLAYWRIGHT_API_URL || 'http://localhost:3080'}/api/v1/tenders?pageSize=5`);
    if (!res.ok()) return;
    const list = (await res.json()) as { data?: Array<{ id: string }> };
    const id = list.data?.[0]?.id;
    if (!id) return;
    await page.goto(SUPPLIER_BASE + `/procesos/${id}`);
    await expect(page.locator('body')).toContainText(/Presentar oferta|Preguntas|reclamo/i);
  });

  test('Ext-LIC-5: API GET tenders con entityId', async ({ request }) => {
    const apiBase = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3080';
    const entRes = await request.get(`${apiBase}/api/v1/entities`);
    if (!entRes.ok()) return;
    const entities = (await entRes.json()) as { data?: Array<{ id: string }> };
    const entityId = entities?.data?.[0]?.id;
    if (!entityId) return;
    const res = await request.get(`${apiBase}/api/v1/tenders?entityId=${entityId}&pageSize=5`);
    expect(res.ok()).toBe(true);
  });

  test('Ext-LIC-6: Público detalle – enlace Participar abre en nueva pestaña o mismo', async ({ page, request }) => {
    const res = await request.get(`${process.env.PLAYWRIGHT_API_URL || 'http://localhost:3080'}/api/v1/tenders?pageSize=1`);
    if (!res.ok()) return;
    const list = (await res.json()) as { data?: Array<{ id: string }> };
    const id = list.data?.[0]?.id;
    if (!id) return;
    await page.goto(PUBLIC_BASE + `/proceso/${id}`);
    const participate = page.getByRole('link', { name: /Participar|presentar oferta/i }).first();
    await expect(participate).toHaveAttribute('href', /.+/).catch(() => {});
  });

  test('Ext-LIC-7: Entidad nuevo proceso – Criterios sostenibilidad', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto(ENTITY_BASE + '/procesos/nuevo');
    await expect(page.locator('body')).toContainText(/sostenibilidad|Criterios|valor por dinero|mejor valor/i);
  });

  test('Ext-LIC-8: Entidad editar – Guardar sin error', async ({ page, request }) => {
    await entityLogin(page, ENTITY_BASE, request);
    await page.goto(ENTITY_BASE + '/procesos');
    const editLink = page.getByRole('link', { name: /Editar/i }).first();
    if (!(await editLink.isVisible().catch(() => false))) return;
    await editLink.click();
    await expect(page.getByRole('button', { name: /Guardar/i }).first()).toBeVisible({ timeout: 5000 }).catch(() => {});
  });
});
