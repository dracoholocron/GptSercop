import { test, expect } from '@playwright/test';

test.describe('Flujo de Registro de Proveedores (8 Pasos)', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar y limpiar sesión
    await page.goto('http://localhost:3012/registro');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
  });

  test('Validar que todos los campos requeridos impidan el avance si están vacíos', async ({ page }) => {
    // Paso 1: Intentar avanzar sin aceptar términos
    await page.click('button:has-text("Continuar")');
    // El checkbox tiene "required", el navegador lo bloquea, pero si inspeccionamos el form
    const termsCheckbox = page.locator('input[type="checkbox"]');
    await expect(termsCheckbox).toBeVisible();
    await termsCheckbox.check();
    await page.click('button:has-text("Continuar")');
    
    // Paso 2: Intentar avanzar sin llenar credenciales
    await expect(page.locator('text=Creación de Credenciales')).toBeVisible();
    await page.click('button:has-text("Crear Cuenta y Continuar")');
    await expect(page.locator('text=Todos los campos son obligatorios')).toBeVisible();
  });

  test('Flujo E2E Completo: Completar Registro Exitosamente', async ({ page }) => {
    const testEmail = `proveedor_${Date.now()}@test.com`;
    
    // Paso 1: Términos
    await page.check('input[type="checkbox"]');
    await page.click('button:has-text("Continuar")');
    
    // Paso 2: Identificador (Credenciales)
    await expect(page.locator('h1')).toContainText('Registro de Proveedor');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[placeholder*="Ej: Proveedores Unidos"]', 'Empresa E2E Test S.A.');
    await page.click('button:has-text("Crear Cuenta y Continuar")');
    
    // Paso 3: Info
    await expect(page.locator('text=Información del Proveedor')).toBeVisible();
    await page.fill('input[placeholder*="Ej: 123456789"]', '1799999999001');
    await page.fill('input[placeholder*="Razón social oficial"]', 'Empresa E2E Test S.A.');
    await page.click('button:has-text("Guardar y Continuar")');

    // Paso 4: Dirección
    await expect(page.locator('text=Dirección y Teléfonos')).toBeVisible();
    await page.fill('input[placeholder="Pichincha"]', 'Pichincha');
    await page.fill('input[placeholder="Quito"]', 'Quito');
    await page.fill('input[placeholder*="Av. 10 de Agosto"]', 'Av. Amazonas');
    await page.click('button:has-text("Guardar y Continuar")');

    // Paso 5: Contactos
    await expect(page.locator('text=Contactos')).toBeVisible();
    await page.fill('input[placeholder="Cédula o Pasaporte"]', '1700000000');
    await page.fill('input[placeholder="Juan Pérez"]', 'Juan Contacto');
    await page.fill('input[type="email"]', testEmail);
    await page.click('button:has-text("Guardar y Continuar")');

    // Paso 6: Productos
    await expect(page.locator('text=Productos (Clasificador CPC)')).toBeVisible();
    await page.fill('input[placeholder*="Ej: Computadoras"]', '01');
    // Esperar sugerencias y seleccionar la primera
    await page.waitForSelector('ul.absolute li button', { timeout: 5000 });
    await page.click('ul.absolute li button:first-child');
    // Verificar que se agregó el chip
    await expect(page.locator('text=Productos Seleccionados (1)')).toBeVisible();
    await page.click('button:has-text("Guardar y Continuar")');

    // Paso 7: Indicadores
    await expect(page.locator('text=Indicadores del Proveedor')).toBeVisible();
    await page.fill('input[placeholder*="0.00"]', '10000'); // Ventas
    await page.fill('input[placeholder="0"]', '0'); // % Extranjero
    await page.fill('input[placeholder="Ej: 15"]', '5'); // Empleados
    await page.locator('input[type="number"]').nth(3).fill('50000'); // Activos Totales
    await page.locator('input[placeholder="Activos - Pasivos"]').fill('40000'); // Patrimonio
    await page.click('button:has-text("Guardar y Continuar")');

    // Paso 8: Finalizar
    await expect(page.locator('text=Finalización de Registro')).toBeVisible();
    await expect(page.locator(`dd:has-text("${testEmail}")`)).toBeVisible(); // Verificar resumen
    await page.check('input[type="checkbox"]');
    await page.click('button:has-text("Finalizar Registro")');

    // Assert redirection to login
    await expect(page).toHaveURL(/.*\/login\?registered=1/);
  });
});
