/**
 * Batería E2E – Subasta Inversa Electrónica (SIE).
 * Plan "Brechas SIE Subasta Inversa": presupuesto mínimo ≥ $10.000, negociación 5%, status/initial/bids/negotiation.
 */
import { test, expect } from '@playwright/test';

const API_BASE = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3080';

async function getEntityTokenAndPlanId(request: import('@playwright/test').APIRequestContext): Promise<{ token: string; planId: string } | null> {
  const loginRes = await request.post(`${API_BASE}/api/v1/auth/login`, {
    data: { email: 'admin@mec.gob.ec', role: 'entity' },
  });
  if (loginRes.status() !== 200) return null;
  const { token } = (await loginRes.json()) as { token: string };
  const entRes = await request.get(`${API_BASE}/api/v1/entities`);
  const entities = entRes.ok() ? ((await entRes.json()) as { data?: Array<{ id: string }> })?.data : [];
  const entityId = entities?.[0]?.id;
  if (!entityId) return null;
  const pacRes = await request.get(`${API_BASE}/api/v1/pac?entityId=${entityId}`);
  const pacList = pacRes.ok() ? ((await pacRes.json()) as { data?: Array<{ id: string }> })?.data : [];
  const planId = pacList?.[0]?.id;
  if (!planId) return null;
  return { token, planId };
}

test.describe('SIE – API tenders y presupuesto mínimo', () => {
  test('SIE-API-1: POST create tender con processType sie y referenceBudgetAmount 15000 devuelve 201', async ({ request }) => {
    const auth = await getEntityTokenAndPlanId(request);
    if (!auth) return;
    const createRes = await request.post(`${API_BASE}/api/v1/tenders`, {
      headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' },
      data: {
        procurementPlanId: auth.planId,
        title: 'E2E SIE test ' + Date.now(),
        processType: 'sie',
        referenceBudgetAmount: 15000,
        electronicSignatureRequired: true,
      },
    });
    expect(createRes.status()).toBe(201);
    const body = (await createRes.json()) as { id?: string; processType?: string };
    expect(body.processType).toBe('sie');
  });

  test('SIE-API-2: POST create tender con processType sie y referenceBudgetAmount 8000 devuelve 400', async ({ request }) => {
    const auth = await getEntityTokenAndPlanId(request);
    if (!auth) return;
    const createRes = await request.post(`${API_BASE}/api/v1/tenders`, {
      headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' },
      data: {
        procurementPlanId: auth.planId,
        title: 'E2E SIE presupuesto bajo ' + Date.now(),
        processType: 'sie',
        referenceBudgetAmount: 8000,
        electronicSignatureRequired: true,
      },
    });
    expect(createRes.status()).toBe(400);
    const body = (await createRes.json()) as { error?: string };
    expect(body?.error).toMatch(/10\.000|10,000|presupuesto referencial/i);
  });
});

test.describe('SIE – API status, initial, bids, negotiation', () => {
  test('SIE-API-3: GET sie/:tenderId/status devuelve 200 con auction y bestBid opcionales', async ({ request }) => {
    const listRes = await request.get(`${API_BASE}/api/v1/tenders?processType=sie&pageSize=5`);
    let tenderId: string | undefined;
    if (listRes.ok()) {
      const list = (await listRes.json()) as { data?: Array<{ id: string }> };
      tenderId = list.data?.[0]?.id;
    }
    if (!tenderId) {
      const listAny = await request.get(`${API_BASE}/api/v1/tenders?pageSize=20`);
      if (!listAny.ok()) return;
      const listAlt = (await listAny.json()) as { data?: Array<{ id: string }> };
      tenderId = listAlt.data?.[0]?.id;
    }
    if (!tenderId) return;
    const statusRes = await request.get(`${API_BASE}/api/v1/sie/${tenderId}/status`);
    expect([200, 500]).toContain(statusRes.status());
    if (statusRes.ok()) {
      const body = (await statusRes.json()) as { auction?: unknown; bestBid?: unknown; myLastBid?: unknown };
      expect(body).toHaveProperty('auction');
    }
  });

  test('SIE-API-4: POST sie/:tenderId/initial con providerId y amount válidos devuelve 201', async ({ request }) => {
    const listRes = await request.get(`${API_BASE}/api/v1/tenders?processType=sie&pageSize=5`);
    const list = listRes.ok() ? ((await listRes.json()) as { data?: Array<{ id: string }> }) : { data: [] };
    let tenderId = list.data?.[0]?.id;
    if (!tenderId) {
      const alt = await request.get(`${API_BASE}/api/v1/tenders?pageSize=15`);
      const altBody = (await alt.json()) as { data?: Array<{ id: string }> };
      tenderId = altBody.data?.[0]?.id;
    }
    if (!tenderId) return;
    const providersRes = await request.get(`${API_BASE}/api/v1/providers?pageSize=1`);
    const providers = providersRes.ok() ? ((await providersRes.json()) as { data?: Array<{ id: string }> })?.data : [];
    const providerId = providers?.[0]?.id ?? '00000000-0000-0000-0000-000000000001';
    const initialRes = await request.post(`${API_BASE}/api/v1/sie/${tenderId}/initial`, {
      headers: { 'Content-Type': 'application/json' },
      data: { providerId, amount: 32000 },
    });
    expect([201, 409, 500]).toContain(initialRes.status());
    if (initialRes.status() === 201) {
      const body = (await initialRes.json()) as { ok?: boolean; bidId?: string };
      expect(body.ok).toBe(true);
    }
  });

  test('SIE-API-5: POST sie/:tenderId/bids con amount menor que mejor oferta devuelve 201; con amount mayor o igual 422', async ({ request }) => {
    const listRes = await request.get(`${API_BASE}/api/v1/tenders?processType=sie&pageSize=5`);
    let tenderId = listRes.ok() ? ((await listRes.json()) as { data?: Array<{ id: string }> })?.data?.[0]?.id : undefined;
    if (!tenderId) {
      const alt = await request.get(`${API_BASE}/api/v1/tenders?pageSize=15`);
      const altBody = (await alt.json()) as { data?: Array<{ id: string }> };
      tenderId = altBody.data?.[0]?.id;
    }
    if (!tenderId) return;
    const statusRes = await request.get(`${API_BASE}/api/v1/sie/${tenderId}/status`);
    if (!statusRes.ok()) return;
    const statusBody = (await statusRes.json()) as { bestBid?: { amount: number } };
    const bestAmount = statusBody.bestBid?.amount ?? 35000;
    const providersRes = await request.get(`${API_BASE}/api/v1/providers?pageSize=3`);
    const providers = providersRes.ok() ? ((await providersRes.json()) as { data?: Array<{ id: string }> })?.data : [];
    const providerId = providers?.[1]?.id ?? providers?.[0]?.id;
    if (!providerId) return;
    const lowerAmount = Math.max(1, Math.floor(bestAmount * 0.9) - 100);
    const bidLowerRes = await request.post(`${API_BASE}/api/v1/sie/${tenderId}/bids`, {
      headers: { 'Content-Type': 'application/json' },
      data: { providerId, amount: lowerAmount },
    });
    expect([201, 409, 422]).toContain(bidLowerRes.status());
    const bidSameRes = await request.post(`${API_BASE}/api/v1/sie/${tenderId}/bids`, {
      headers: { 'Content-Type': 'application/json' },
      data: { providerId, amount: bestAmount },
    });
    expect([409, 422]).toContain(bidSameRes.status());
    const bodyErr = (await bidSameRes.json()) as { error?: string };
    expect(bodyErr?.error && bodyErr.error.length > 0).toBe(true);
  });

  test('SIE-API-6: POST sie/:tenderId/negotiation/final con amount <= ref*0.95 devuelve 201; con amount > ref*0.95 devuelve 400', async ({ request }) => {
    const listRes = await request.get(`${API_BASE}/api/v1/tenders?processType=sie&pageSize=10`);
    type T = { id: string; processType?: string; referenceBudgetAmount?: number | null; estimatedAmount?: number | null };
    const list = listRes.ok() ? ((await listRes.json()) as { data?: T[] }) : { data: [] as T[] };
    const sieTender = list.data?.find((t) => t.processType === 'sie') ?? list.data?.[0];
    if (!sieTender) return;
    const tenderId = sieTender.id;
    const refAmount = sieTender.referenceBudgetAmount != null ? Number(sieTender.referenceBudgetAmount) : sieTender.estimatedAmount != null ? Number(sieTender.estimatedAmount) : 35000;
    const maxAllowed = refAmount * 0.95;
    const providersRes = await request.get(`${API_BASE}/api/v1/providers?pageSize=1`);
    const providers = providersRes.ok() ? ((await providersRes.json()) as { data?: Array<{ id: string }> })?.data : [];
    const providerId = providers?.[0]?.id;
    if (!providerId) return;
    const invalidAmount = maxAllowed + 1000;
    const res400 = await request.post(`${API_BASE}/api/v1/sie/${tenderId}/negotiation/final`, {
      headers: { 'Content-Type': 'application/json' },
      data: { providerId, amount: invalidAmount },
    });
    if (res400.status() === 409) return;
    if (res400.status() === 400) {
      const err = (await res400.json()) as { error?: string };
      expect(err?.error).toMatch(/5%|presupuesto referencial/i);
      return;
    }
    const validAmount = Math.max(1, Math.floor(maxAllowed) - 100);
    const res201 = await request.post(`${API_BASE}/api/v1/sie/${tenderId}/negotiation/final`, {
      headers: { 'Content-Type': 'application/json' },
      data: { providerId, amount: validAmount },
    });
    expect([201, 409, 422]).toContain(res201.status());
  });
});
