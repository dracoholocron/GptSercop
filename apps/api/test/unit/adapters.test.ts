/**
 * Unit tests – Adaptadores externos (M11): SRI, Supercias, eSIGEF.
 * No requieren DB ni API en marcha. Prueban modo stub (sin env vars configuradas).
 *
 * Nota: los adaptadores leen las env vars al momento de importarse (module-level const),
 * por lo que en este entorno de test las vars SRI_API_URL, SUPERCIAS_API_URL, ESIGEF_API_URL
 * no están definidas → todos los adaptadores operan en modo stub.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

// ─── Importar adaptadores ────────────────────────────────────────────────────
// Los paths usan extensión .js porque el proyecto usa ESM con "type": "module"
import {
  isConfigured as sriIsConfigured,
  verifyTaxCompliance,
} from '../../src/integrations/sri-adapter.js';

import {
  isConfigured as superciasIsConfigured,
  getCompanyStructure,
} from '../../src/integrations/supercias-adapter.js';

import {
  isConfigured as esigefIsConfigured,
  getBudgetAvailability,
} from '../../src/integrations/presupuesto-adapter.js';

// ═══════════════════════════════════════════════════════════════════════════
// SRI Adapter
// ═══════════════════════════════════════════════════════════════════════════

test('M11-01: SRI isConfigured() retorna false cuando SRI_API_URL/SRI_API_KEY no están en env', () => {
  // En este entorno de test, las vars no están definidas
  const result = sriIsConfigured();
  assert.strictEqual(result, false, 'isConfigured debe ser false sin env vars');
});

test('M11-02: SRI verifyTaxCompliance en modo stub retorna source: stub', async () => {
  const result = await verifyTaxCompliance('1234567890001');
  assert.strictEqual(result.source, 'stub', 'source debe ser stub sin env vars');
});

test('M11-03: SRI stub tiene todos los campos requeridos', async () => {
  const result = await verifyTaxCompliance('0987654321001');
  assert.strictEqual(typeof result.ruc, 'string', 'ruc debe ser string');
  assert.strictEqual(typeof result.isCompliantSRI, 'boolean', 'isCompliantSRI debe ser boolean');
  assert.strictEqual(typeof result.lastCheckAt, 'string', 'lastCheckAt debe ser string ISO');
  assert.ok(result.lastCheckAt.includes('T'), 'lastCheckAt debe ser ISO 8601');
});

test('M11-04: SRI stub retorna isCompliantSRI: true por defecto', async () => {
  const result = await verifyTaxCompliance('1111111111111');
  assert.strictEqual(result.isCompliantSRI, true, 'stub debe retornar compliant por defecto');
});

test('M11-05: SRI stub retorna el mismo ruc que se envió', async () => {
  const ruc = '9999999999999';
  const result = await verifyTaxCompliance(ruc);
  assert.strictEqual(result.ruc, ruc, 'ruc en respuesta debe coincidir con input');
});

// ═══════════════════════════════════════════════════════════════════════════
// Supercias Adapter
// ═══════════════════════════════════════════════════════════════════════════

test('M11-06: Supercias isConfigured() retorna false cuando SUPERCIAS_API_URL/KEY no están en env', () => {
  const result = superciasIsConfigured();
  assert.strictEqual(result, false, 'isConfigured debe ser false sin env vars');
});

test('M11-07: Supercias getCompanyStructure en modo stub retorna source: stub y shareholders', async () => {
  const result = await getCompanyStructure('5432109876001');
  assert.strictEqual(result.source, 'stub', 'source debe ser stub');
  assert.ok(Array.isArray(result.shareholders), 'shareholders debe ser array');
  assert.ok(result.shareholders.length > 0, 'debe tener al menos 1 accionista');
});

test('M11-08: Supercias stub tiene campos requeridos en CompanyStructure', async () => {
  const result = await getCompanyStructure('1234567890001');
  assert.strictEqual(typeof result.ruc, 'string', 'ruc debe ser string');
  assert.strictEqual(typeof result.lastCheckAt, 'string', 'lastCheckAt debe ser string');
  assert.ok(result.lastCheckAt.includes('T'), 'lastCheckAt debe ser ISO 8601');
  // Campos opcionales pero presentes en stub
  assert.ok(typeof result.legalName === 'string', 'legalName debe ser string en stub');
  assert.ok(typeof result.capital === 'number', 'capital debe ser number en stub');
});

// ═══════════════════════════════════════════════════════════════════════════
// eSIGEF / Presupuesto Adapter
// ═══════════════════════════════════════════════════════════════════════════

test('M11-09: eSIGEF isConfigured() retorna false cuando ESIGEF_API_URL/KEY no están en env', () => {
  const result = esigefIsConfigured();
  assert.strictEqual(result, false, 'isConfigured debe ser false sin env vars');
});

test('M11-10: eSIGEF getBudgetAvailability en modo stub retorna campos financieros completos', async () => {
  const result = await getBudgetAvailability('entity-test-001', 2024);
  assert.strictEqual(result.source, 'stub', 'source debe ser stub');
  assert.strictEqual(result.entityId, 'entity-test-001', 'entityId debe coincidir');
  assert.strictEqual(result.fiscalYear, 2024, 'fiscalYear debe ser 2024');
  assert.strictEqual(typeof result.totalBudget, 'number', 'totalBudget debe ser number');
  assert.strictEqual(typeof result.committed, 'number', 'committed debe ser number');
  assert.strictEqual(typeof result.available, 'number', 'available debe ser number');
  assert.strictEqual(typeof result.executionRate, 'number', 'executionRate debe ser number');
  assert.ok(result.executionRate >= 0 && result.executionRate <= 100, 'executionRate debe estar en 0-100');
  assert.strictEqual(typeof result.lastCheckAt, 'string', 'lastCheckAt debe ser string');
});
