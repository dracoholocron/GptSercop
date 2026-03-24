import { describe, it, expect, beforeAll } from 'vitest';
import { app } from '../src/index.js';
import { prisma } from '../src/db.js';

describe('Electronic Catalog & Cart Tests (Option C)', () => {
  let entityId: string;
  let catalogItemId: string;

  beforeAll(async () => {
    await prisma.$connect();
    await app.ready();
    
    const e = await prisma.entity.upsert({ where: { code: 'CAT-001' }, create: { name: 'CatEntity', code: 'CAT-001' }, update: {} });
    entityId = e.id;

    const cat = await prisma.catalog.create({ data: { name: 'Catálogo Nacional' } });
    const item = await prisma.catalogItem.create({ data: { catalogId: cat.id, name: 'Software License', referencePrice: 50.00 } });
    catalogItemId = item.id;
  });

  it('1. [Smoke] Cart fetching returns valid structure directly attached to Entity', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/v1/catalogs/cart?entityId=${entityId}` });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().items)).toBe(true);
  });

  it('2. [Security & Regression] API rejects adding items to cart with missing params', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/catalogs/cart/add', payload: { entityId } });
    expect(res.statusCode).toBe(400); // missing fields
  });

  it('3. [Integration] Successfully adds a product to the cart and compiles numeric subtotals', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/catalogs/cart/add', payload: { entityId, catalogItemId, quantity: 2 } });
    expect(res.statusCode).toBe(200);

    const getRes = await app.inject({ method: 'GET', url: `/api/v1/catalogs/cart?entityId=${entityId}` });
    const cart = getRes.json();
    expect(cart.items.length).toBe(1);
    expect(cart.items[0].quantity).toBe(2);
    expect(Number(cart.items[0].subtotal)).toBe(100);
    expect(Number(cart.totalAmount)).toBe(100);
  });

  it('4. [Integration] Executes Checkout cleanly producing a PurchaseOrder and emptying Cart details', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/catalogs/checkout', payload: { entityId } });
    expect(res.statusCode).toBe(201);
    expect(res.json().orderNo).toContain('PO-CAT-');
    expect(Number(res.json().totalAmount)).toBe(100);

    const getRes = await app.inject({ method: 'GET', url: `/api/v1/catalogs/cart?entityId=${entityId}` });
    expect(getRes.json().items.length).toBe(0);
    expect(Number(getRes.json().totalAmount)).toBe(0);
  });

  it('5. [Security] Strict isolation blocks checkout attempt on an empty shopping Cart', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/v1/catalogs/checkout', payload: { entityId } });
    expect(res.statusCode).toBe(400); // Carrito vacío
  });
});
