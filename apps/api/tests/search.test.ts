import { describe, it, expect, beforeAll } from 'vitest';
import { app } from '../src/index.js';
import { prisma } from '../src/db.js';

describe('Advanced Public Search Tests (Option B)', () => {
  let planId: string;

  beforeAll(async () => {
    await prisma.$connect();
    await app.ready();
    const e = await prisma.entity.upsert({ where: { code: 'SRCH-001' }, create: { name: 'SearchEntity', code: 'SRCH-001' }, update: {} });
    const p = await prisma.procurementPlan.create({ data: { entityId: e.id, year: 2026, totalAmount: 500000 } });
    planId = p.id;

    // Seed some tenders for search
    await prisma.tender.createMany({
      data: [
        { title: 'Laptops DELL X1', estimatedAmount: 20000, processType: 'LICITACION', status: 'published', procurementPlanId: planId },
        { title: 'Mantenimiento Aires Acondicionados', estimatedAmount: 5000, processType: 'INFIMA_CUANTIA', status: 'awarded', procurementPlanId: planId },
        { title: 'Construccion Unidad Educativa', estimatedAmount: 150000, processType: 'SUBASTA_INVERSA', status: 'published', procurementPlanId: planId }
      ]
    });
  });

  it('1. [Smoke] Endpoint /tenders/advanced-search exists and is public without auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/tenders/advanced-search', payload: {} });
    expect(res.statusCode).toBe(200);
    expect(res.json().data).toBeDefined();
    expect(res.json().pagination.limit).toBe(50);
  });

  it('2. [Security] Search endpoint resists SQL injection queries safely', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/tenders/advanced-search', payload: { q: "'; DROP TABLE tenders;--" } });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().data)).toBe(true);
  });

  it('3. [Integration] Search by exact param match returns items', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/tenders/advanced-search', payload: { q: 'Laptops' } });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.length).toBeGreaterThanOrEqual(1);
    expect(res.json().data.some((t: any) => t.title.includes('Laptops'))).toBe(true);
  });

  it('4. [Integration] Search handles array filters (processTypes) reliably', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/tenders/advanced-search', payload: { processTypes: ['INFIMA_CUANTIA'], statuses: ['awarded'] } });
    expect(res.statusCode).toBe(200);
    const results = res.json().data;
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((t: any) => t.processType === 'INFIMA_CUANTIA')).toBe(true);
  });

  it('5. [Integration] Search handles pagination and semantic RAG mock hook', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/tenders/advanced-search', payload: { ragQuery: 'quiero pc', limit: 1 } });
    expect(res.statusCode).toBe(200);
    expect(res.json().ragSummary).toContain('Insights generados por RAG');
    expect(res.json().data.length).toBeLessThanOrEqual(1);
  });

  it('6. [Regression] Search bounding with empty arrays gracefully defaults', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/tenders/advanced-search', payload: { processTypes: [], minAmount: 0 } });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().data)).toBe(true);
  });
});
