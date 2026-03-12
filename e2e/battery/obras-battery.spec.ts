import { test, expect, APIRequestContext } from '@playwright/test';

const API_BASE = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3080';

async function getAnyPac(request: APIRequestContext) {
  const res = await request.get(`${API_BASE}/api/v1/pac`);
  expect(res.ok()).toBe(true);
  const body = await res.json();
  const plan = Array.isArray(body?.data) && body.data.length > 0 ? body.data[0] : null;
  expect(plan).toBeTruthy();
  return plan;
}

async function createTenderObras(request: APIRequestContext, overrides: Record<string, unknown> = {}) {
  const plan = await getAnyPac(request);

  const body = {
    procurementPlanId: plan.id,
    title: 'Licitación de obras – prueba E2E',
    description: 'Proceso de obras para pruebas automatizadas',
    procurementMethod: 'open',
    processType: 'licitacion_obras',
    regime: 'ordinario',
    referenceBudgetAmount: 50000,
    questionsDeadlineAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    bidsDeadlineAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  };

  const res = await request.post(`${API_BASE}/api/v1/tenders`, { data: body });
  if (res.status() === 201) {
    const created = await res.json();
    await request.put(`${API_BASE}/api/v1/tenders/${created.id}`, {
      data: { status: 'published' },
    });
  }
  return res;
}

test.describe('Licitación de Obras – API', () => {
  test('OBR-API-1: crear tender licitacion_obras con presupuesto válido', async ({ request }) => {
    const res = await createTenderObras(request);
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.processType).toBe('licitacion_obras');
    expect(Number(body.referenceBudgetAmount)).toBe(50000);
  });

  test('OBR-API-2: rechazar tender licitacion_obras con presupuesto < 10.000', async ({ request }) => {
    const res = await createTenderObras(request, { referenceBudgetAmount: 8000 });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(String(body.error || '')).toContain('Licitación de obras');
  });

  test('OBR-API-3: listar licitacion_obras en GET /tenders', async ({ request }) => {
    await createTenderObras(request);
    const res = await request.get(`${API_BASE}/api/v1/tenders?processType=licitacion_obras&pageSize=10`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    const hasObras = body.data.some((t: any) => t.processType === 'licitacion_obras');
    expect(hasObras).toBe(true);
  });

  test('OBR-API-4: subir documento APU para tender', async ({ request }) => {
    const createdRes = await createTenderObras(request);
    expect(createdRes.status()).toBe(201);
    const created = await createdRes.json();

    const listRes = await request.get(`${API_BASE}/api/v1/tenders?processType=licitacion_obras&pageSize=1`);
    expect(listRes.status()).toBe(200);
    const listBody = await listRes.json();
    const tender = Array.isArray(listBody.data) && listBody.data.length > 0 ? listBody.data[0] : null;
    expect(tender).toBeTruthy();

    const uploadRes = await request.post(`${API_BASE}/api/v1/documents/upload`, {
      multipart: {
        ownerType: 'tender',
        ownerId: tender.id,
        documentType: 'apu',
        isPublic: 'true',
        file: {
          name: 'apu-e2e.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('APU de prueba'),
        },
      },
    });
    if (uploadRes.status() === 503) return;
    expect(uploadRes.status()).toBe(201);
    const doc = await uploadRes.json();
    expect(doc.documentType).toBe('apu');
  });

  test('OBR-API-5: crear evaluación con campos de obras', async ({ request }) => {
    const createdRes = await createTenderObras(request);
    expect(createdRes.status()).toBe(201);
    const tender = await createdRes.json();

    const provRes = await request.post(`${API_BASE}/api/v1/providers`, {
      data: { name: 'Proveedor obras E2E', identifier: '1799999999001' },
    });
    expect(provRes.status()).toBe(201);
    const provider = await provRes.json();

    const bidRes = await request.post(`${API_BASE}/api/v1/tenders/${tender.id}/bids`, {
      data: { providerId: provider.id, amount: 40000 },
    });
    expect(bidRes.status()).toBe(201);
    const bid = await bidRes.json();

    const evalRes = await request.post(`${API_BASE}/api/v1/tenders/${tender.id}/evaluations`, {
      data: {
        bidId: bid.id,
        technicalScore: 30,
        financialScore: 40,
        experienceGeneralScore: 10,
        experienceSpecificScore: 15,
        subcontractingScore: 5,
        otherParamsScore: 1,
        totalScore: 101,
        status: 'completed',
      },
    });
    expect(evalRes.status()).toBe(201);
    const ev = await evalRes.json();
    expect(Number(ev.experienceGeneralScore)).toBe(10);
    expect(Number(ev.experienceSpecificScore)).toBe(15);
    expect(Number(ev.subcontractingScore)).toBe(5);
    expect(Number(ev.otherParamsScore)).toBe(1);
  });
});

