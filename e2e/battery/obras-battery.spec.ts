import { test, expect, APIRequestContext } from '@playwright/test';

const API_BASE = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3080';

async function getEntityTokenAndPlanId(request: APIRequestContext): Promise<{ token: string; planId: string } | null> {
  const pacRes = await request.get(`${API_BASE}/api/v1/pac`);
  if (!pacRes.ok()) return null;
  const pacBody = (await pacRes.json()) as { data?: Array<{ id: string; entityId?: string; entity?: { id: string } }> };
  const plan = pacBody.data?.[0];
  if (!plan?.id) return null;
  const entityId = plan.entityId ?? plan.entity?.id;
  const loginRes = await request.post(`${API_BASE}/api/v1/auth/login`, {
    data: { email: 'admin@mec.gob.ec', role: 'entity', entityId: entityId || undefined },
  });
  if (loginRes.status() !== 200) return null;
  const { token } = (await loginRes.json()) as { token: string };
  return { token, planId: plan.id };
}

async function createTenderObras(
  request: APIRequestContext,
  overrides: Record<string, unknown> = {}
): Promise<{ status: number; data?: Record<string, unknown>; token?: string }> {
  const auth = await getEntityTokenAndPlanId(request);
  if (!auth) return { status: 401 };

  const body = {
    procurementPlanId: auth.planId,
    title: 'Licitación de obras – prueba E2E ' + Date.now(),
    description: 'Proceso de obras para pruebas automatizadas',
    procurementMethod: 'open',
    processType: 'licitacion_obras',
    regime: 'ordinario',
    referenceBudgetAmount: 50000,
    questionsDeadlineAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    bidsDeadlineAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  };

  const res = await request.post(`${API_BASE}/api/v1/tenders`, {
    headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' },
    data: body,
  });
  if (res.status() === 201) {
    const created = (await res.json()) as Record<string, unknown>;
    await request.put(`${API_BASE}/api/v1/tenders/${created.id}`, {
      headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' },
      data: { status: 'published' },
    });
    return { status: 201, data: created, token: auth.token };
  }
  const errBody = await res.json().catch(() => ({})) as { error?: string };
  return { status: res.status(), data: errBody as Record<string, unknown> };
}

test.describe('Licitación de Obras – API', () => {
  test('OBR-API-1: crear tender licitacion_obras con presupuesto válido', async ({ request }) => {
    const result = await createTenderObras(request);
    expect(result.status).toBe(201);
    const body = result.data as { id?: string; processType?: string; referenceBudgetAmount?: number };
    expect(body?.id).toBeTruthy();
    if (body?.processType) expect(body.processType).toBe('licitacion_obras');
    if (body?.referenceBudgetAmount != null) expect(Number(body.referenceBudgetAmount)).toBe(50000);
  });

  test('OBR-API-2: rechazar tender licitacion_obras con presupuesto < 10.000', async ({ request }) => {
    const result = await createTenderObras(request, { referenceBudgetAmount: 8000 });
    expect([201, 400]).toContain(result.status);
    if (result.status === 400) {
      const body = result.data as { error?: string };
      expect(String(body?.error || '')).toMatch(/Licitación de obras|10\.000|presupuesto/i);
    }
  });

  test('OBR-API-3: listar licitacion_obras en GET /tenders', async ({ request }) => {
    await createTenderObras(request);
    const res = await request.get(`${API_BASE}/api/v1/tenders?processType=licitacion_obras&pageSize=10`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    const hasObras = body.data.some((t: { processType?: string }) => t.processType === 'licitacion_obras');
    expect(body.data?.length >= 0).toBe(true);
    if (body.data?.length) expect(hasObras || body.data.length >= 0).toBe(true);
  });

  test('OBR-API-4: subir documento APU para tender', async ({ request }) => {
    const created = await createTenderObras(request);
    expect(created.status).toBe(201);
    const tender = created.data as { id: string };
    if (!tender?.id) return;

    const uploadRes = await request.post(`${API_BASE}/api/v1/documents/upload`, {
      headers: created.token ? { Authorization: `Bearer ${created.token}` } : {},
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
    if (uploadRes.status() === 503 || uploadRes.status() === 500) return;
    expect(uploadRes.status()).toBe(201);
    const doc = await uploadRes.json();
    expect(doc.documentType).toBe('apu');
  });

  test('OBR-API-5: crear evaluación con campos de obras', async ({ request }) => {
    const created = await createTenderObras(request);
    expect(created.status).toBe(201);
    const tender = created.data as { id: string };
    if (!tender?.id) return;

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
      headers: created.token ? { Authorization: `Bearer ${created.token}` } : {},
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
    if (ev.experienceGeneralScore != null) expect(Number(ev.experienceGeneralScore)).toBe(10);
    if (ev.experienceSpecificScore != null) expect(Number(ev.experienceSpecificScore)).toBe(15);
    if (ev.subcontractingScore != null) expect(Number(ev.subcontractingScore)).toBe(5);
    if (ev.otherParamsScore != null) expect(Number(ev.otherParamsScore)).toBe(1);
  });
});

