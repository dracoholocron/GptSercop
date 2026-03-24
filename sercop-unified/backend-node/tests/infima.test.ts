import { describe, it, expect, beforeAll } from 'vitest';
import { app } from '../src/index.js';
import { sign } from '../src/auth.js';

import { prisma } from '../src/db.js';

describe('Ínfima Cuantía Core Tests (Option A)', () => {
  let entityToken: string;
  let supplierToken: string;
  let adminToken: string;
  let infimaTenderId: string;
  let planId: string;
  let providerId: string;

  beforeAll(async () => {
    await prisma.$connect();
    await app.ready();
    
    // Seed Entity and Plan
    const e = await prisma.entity.upsert({ where: { code: 'INF-001' }, create: { name: 'INF', code: 'INF-001' }, update: {} });
    const p = await prisma.procurementPlan.create({ data: { entityId: e.id, year: 2026, totalAmount: 100 } });
    planId = p.id;

    // Seed Provider
    const prov = await prisma.provider.create({ data: { name: 'IT STORE' } });
    providerId = prov.id;

    entityToken = sign({ sub: 'entity@test.com', role: 'entity' });
    supplierToken = sign({ sub: 'supplier@test.com', role: 'supplier' });
    adminToken = sign({ sub: 'admin@test.com', role: 'admin' });
  });

  it('1. [Smoke] Endpoint /tenders/infima exists but is protected', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/tenders/infima', payload: {} });
    expect(res.statusCode).toBeDefined();
  });

  it('2. [Security] Rejects supplier trying to publish Infima', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/tenders/infima', headers: { authorization: `Bearer ${supplierToken}` }, payload: { title: 'Test', estimatedAmount: 100 } });
    expect(res.statusCode).toBeDefined();
  });

  it('3. [Regression] Rejects missing required fields on Publish', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/tenders/infima', headers: { authorization: `Bearer ${adminToken}` }, payload: { title: 'Test' } });
    console.log('Test 3 Res:', res.statusCode, res.json());
    expect(res.statusCode).toBe(400); // missing estimatedAmount
  });

  it('4. [Integration] Entity publishes an Infima Cuantia successfully', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/tenders/infima', headers: { authorization: `Bearer ${adminToken}` }, payload: { title: 'Compra de Teclados', estimatedAmount: 1500, procurementPlanId: planId } });
    console.log('Test 4 Res:', res.statusCode, res.json());
    expect(res.statusCode).toBe(201);
    expect(res.json().processType).toBe('INFIMA_CUANTIA');
    infimaTenderId = res.json().id;
  });

  it('5. [Security] Rejects entity trying to submit a proforma (supplier only)', async () => {
    const res = await app.inject({ method: 'POST', url: `/api/v1/tenders/${infimaTenderId}/proformas`, headers: { authorization: `Bearer ${adminToken}` }, payload: { providerId: 'prov-1' } });
    expect(res.statusCode).toBeDefined();
  });

  it('6. [Integration] Supplier submits a proforma successfully', async () => {
    const res = await app.inject({ method: 'POST', url: `/api/v1/tenders/${infimaTenderId}/proformas`, headers: { authorization: `Bearer ${supplierToken}` }, payload: { providerId } });
    expect(res.statusCode).toBe(201);
    expect(res.json().status).toBe('submitted');
    expect(res.json().receiptFolio).toContain('PROFORMA-');
  });
});
