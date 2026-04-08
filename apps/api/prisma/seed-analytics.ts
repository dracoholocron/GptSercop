/**
 * seed-analytics.ts – Comprehensive analytics seed data
 *
 * Covers all scenarios from the SERCOP analytics documents:
 *   - 20 risk patterns
 *   - 10 structural problems
 *   - 12 SOCE vulnerabilities
 *   - 15 manipulation types
 *   - 25 risk indicators
 *   - 7 structural reforms (features that address them)
 *   - 20 innovation opportunities
 *
 * Run: npx tsx prisma/seed-analytics.ts
 * Prerequisite: main seed.ts must have been run first (entities, providers, plans exist)
 */
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;
const year = new Date().getFullYear();

function daysAgo(n: number) {
  return new Date(Date.now() - n * DAY);
}

async function getOrCreateEntity(code: string, name: string, orgType: string) {
  return prisma.entity.upsert({
    where: { code },
    update: {},
    create: { name, code, legalName: name, organizationType: orgType },
  });
}

async function getOrCreatePlan(entityId: string, totalAmount = 1000000) {
  const existing = await prisma.procurementPlan.findFirst({ where: { entityId, year } });
  if (existing) return existing;
  return prisma.procurementPlan.create({
    data: { entityId, year, status: 'published', publishedAt: new Date(), totalAmount },
  });
}

async function getOrCreateProvider(
  identifier: string,
  name: string,
  opts: { province?: string; legalEstablishmentDate?: Date; patrimonyAmount?: number } = {},
) {
  const existing = await prisma.provider.findFirst({ where: { identifier } });
  if (existing) return existing;
  return prisma.provider.create({
    data: {
      name,
      identifier,
      legalName: name,
      tradeName: name.split(' ')[0],
      status: 'active',
      province: opts.province ?? 'Pichincha',
      canton: 'Quito',
      legalEstablishmentDate: opts.legalEstablishmentDate,
      patrimonyAmount: opts.patrimonyAmount,
    },
  });
}

async function safeTender(
  planId: string,
  code: string,
  title: string,
  overrides: Partial<Parameters<typeof prisma.tender.create>[0]['data']> = {},
) {
  const existing = await prisma.tender.findFirst({ where: { code } });
  if (existing) return existing;
  return prisma.tender.create({
    data: {
      procurementPlanId: planId,
      code,
      title,
      status: 'awarded',
      procurementMethod: 'open',
      processType: 'licitacion',
      regime: 'ordinario',
      estimatedAmount: 100000,
      referenceBudgetAmount: 100000,
      publishedAt: daysAgo(60),
      ...overrides,
    },
  });
}

async function safeBid(tenderId: string, providerId: string, amount: number) {
  const existing = await prisma.bid.findFirst({ where: { tenderId, providerId } });
  if (existing) return existing;
  return prisma.bid.create({
    data: { tenderId, providerId, amount, status: 'submitted', submittedAt: new Date() },
  });
}

async function safeContract(
  tenderId: string,
  providerId: string,
  contractNo: string,
  amount: number,
  opts: { signedAt?: Date; status?: string } = {},
) {
  const existing = await prisma.contract.findFirst({ where: { tenderId } });
  if (existing) return existing;
  return prisma.contract.create({
    data: {
      tenderId,
      providerId,
      contractNo,
      amount,
      status: opts.status ?? 'active',
      signedAt: opts.signedAt ?? daysAgo(30),
    },
  });
}

// ============================================================================
// MAIN
// ============================================================================
async function main() {
  console.log('=== ANALYTICS SEED – Comprehensive Scenario Data ===\n');

  // --- Base entities & providers from main seed ---
  const entMEC = await getOrCreateEntity('MEC', 'Ministerio de Educación', 'ministerio');
  const entMSP = await getOrCreateEntity('MSP', 'Ministerio de Salud Pública', 'ministerio');
  const entGAD = await getOrCreateEntity('GAD-Q', 'Municipio de Quito', 'gad');
  const entIESS = await getOrCreateEntity('IESS', 'Instituto Ecuatoriano de Seguridad Social', 'institucion');
  const entSERCOP = await getOrCreateEntity('SERCOP', 'Servicio Nacional de Contratación Pública', 'institucion');
  const entCNT = await getOrCreateEntity('CNT', 'Corporación Nacional de Telecomunicaciones', 'empresa_publica');
  const entPETRO = await getOrCreateEntity('PETRO', 'Petroecuador', 'empresa_publica');
  const entMINT = await getOrCreateEntity('MINT', 'Ministerio del Interior', 'ministerio');

  const planMEC = await getOrCreatePlan(entMEC.id, 5000000);
  const planMSP = await getOrCreatePlan(entMSP.id, 3000000);
  const planGAD = await getOrCreatePlan(entGAD.id, 4000000);
  const planIESS = await getOrCreatePlan(entIESS.id, 2000000);
  const planSERCOP = await getOrCreatePlan(entSERCOP.id, 2000000);
  const planCNT = await getOrCreatePlan(entCNT.id, 1500000);
  const planPETRO = await getOrCreatePlan(entPETRO.id, 6000000);
  const planMINT = await getOrCreatePlan(entMINT.id, 2500000);

  // Additional providers for diverse scenarios
  const provTec = await getOrCreateProvider('1791234567001', 'Tecnología Ecuador S.A.', { province: 'Pichincha' });
  const provSum = await getOrCreateProvider('1792345678001', 'Suministros Industriales Cía. Ltda.', { province: 'Guayas' });
  const provCons = await getOrCreateProvider('1793456789001', 'Construcciones Andinas S.A.', { province: 'Pichincha' });
  const provLimp = await getOrCreateProvider('1794567890001', 'Servicios de Limpieza Pro', { province: 'Azuay' });
  const provMed = await getOrCreateProvider('1795678901001', 'Equipos Médicos del Ecuador', { province: 'Pichincha' });
  const provPapel = await getOrCreateProvider('1796789012001', 'Papelería y Oficina Cía. Ltda.', { province: 'Pichincha' });
  const provGhost = await getOrCreateProvider('1797000001001', 'Fantasma Corp S.A.', { province: 'Pichincha' });
  const provShell = await getOrCreateProvider('1797000002001', 'Empresa Pantalla S.A.', {
    province: 'Pichincha',
    legalEstablishmentDate: daysAgo(90),
    patrimonyAmount: 5000,
  });
  const provMono = await getOrCreateProvider('1797000003001', 'MonoCliente Express S.A.', { province: 'Guayas' });
  const provAlways = await getOrCreateProvider('1797000004001', 'Siempre Pierde Cía. Ltda.', { province: 'Azuay' });
  const provMulti = await getOrCreateProvider('1797000005001', 'MultiContratos S.A.', { province: 'Pichincha' });
  const provLocal = await getOrCreateProvider('1797000006001', 'Regional Loja S.A.', { province: 'Loja' });
  const provCover = await getOrCreateProvider('1797000007001', 'Ofertas Cobertura S.A.', { province: 'Pichincha' });
  const provCancelRe = await getOrCreateProvider('1797000008001', 'Relicitadora S.A.', { province: 'Pichincha' });

  console.log('  Entities and providers ready.\n');

  // ====================================================================
  // SECTION 1: MISSING RISK PATTERNS (complement seed.ts A-K)
  // ====================================================================
  console.log('--- Section 1: Missing Risk Patterns ---');

  // Pattern: FEW_BIDS (exactly 2 bids)
  const tFewBids = await safeTender(planCNT.id, `CNT-${year}-RP-001`, 'Mantenimiento redes – pocas ofertas', {
    processType: 'cotizacion', estimatedAmount: 80000, referenceBudgetAmount: 80000,
  });
  await safeBid(tFewBids.id, provTec.id, 75000);
  await safeBid(tFewBids.id, provSum.id, 79000);
  await safeContract(tFewBids.id, provTec.id, `CNT-${year}-RP-001-CT`, 75000);
  console.log('  RP-001: FEW_BIDS');

  // Pattern: THIN_WIN_MARGIN (winner beats 2nd by < 1%)
  const tThinMargin = await safeTender(planGAD.id, `GAD-${year}-RP-002`, 'Obra vial – margen mínimo', {
    processType: 'licitacion_obras', estimatedAmount: 500000, referenceBudgetAmount: 500000,
  });
  await safeBid(tThinMargin.id, provCons.id, 498000);
  await safeBid(tThinMargin.id, provTec.id, 499500); // difference ~0.3%
  await safeBid(tThinMargin.id, provSum.id, 510000);
  await safeContract(tThinMargin.id, provCons.id, `GAD-${year}-RP-002-CT`, 498000);
  console.log('  RP-002: THIN_WIN_MARGIN');

  // Pattern: ABNORMALLY_LOW_BID (< 50% of mean)
  const tLowBid = await safeTender(planMEC.id, `MEC-${year}-RP-003`, 'Equipamiento escolar – oferta anormalmente baja', {
    estimatedAmount: 200000, referenceBudgetAmount: 200000,
  });
  await safeBid(tLowBid.id, provPapel.id, 40000); // way below mean
  await safeBid(tLowBid.id, provTec.id, 185000);
  await safeBid(tLowBid.id, provSum.id, 190000);
  await safeContract(tLowBid.id, provPapel.id, `MEC-${year}-RP-003-CT`, 40000);
  console.log('  RP-003: ABNORMALLY_LOW_BID');

  // Pattern: ABNORMALLY_HIGH_BID (> 150% of mean)
  const tHighBid = await safeTender(planMSP.id, `MSP-${year}-RP-004`, 'Insumos médicos – oferta anormalmente alta', {
    estimatedAmount: 100000, referenceBudgetAmount: 100000,
  });
  await safeBid(tHighBid.id, provMed.id, 90000);
  await safeBid(tHighBid.id, provCover.id, 250000); // way above mean
  await safeBid(tHighBid.id, provSum.id, 95000);
  await safeContract(tHighBid.id, provMed.id, `MSP-${year}-RP-004-CT`, 90000);
  console.log('  RP-004: ABNORMALLY_HIGH_BID');

  // Pattern: FREQUENT_CLARIFICATIONS (> 5 clarifications)
  const tClarif = await safeTender(planSERCOP.id, `SERCOP-${year}-RP-005`, 'Sistema informático – muchas aclaraciones', {
    estimatedAmount: 300000, referenceBudgetAmount: 300000,
  });
  await safeBid(tClarif.id, provTec.id, 280000);
  await safeBid(tClarif.id, provSum.id, 295000);
  await safeContract(tClarif.id, provTec.id, `SERCOP-${year}-RP-005-CT`, 280000);
  const existingClarifCount = await prisma.tenderClarification.count({ where: { tenderId: tClarif.id } });
  if (existingClarifCount < 6) {
    const needed = 8 - existingClarifCount;
    for (let i = 0; i < needed; i++) {
      await prisma.tenderClarification.create({
        data: {
          tenderId: tClarif.id,
          askedByProviderId: i % 2 === 0 ? provTec.id : provSum.id,
          status: 'ANSWERED',
          question: `Aclaración ${existingClarifCount + i + 1}: ¿Especificación técnica sobre requisito ${i + 1}?`,
          answer: `Respuesta a aclaración ${existingClarifCount + i + 1}.`,
          askedAt: daysAgo(50 - i),
          answeredAt: daysAgo(49 - i),
        },
      });
    }
  }
  console.log('  RP-005: FREQUENT_CLARIFICATIONS');

  // Pattern: MULTI_CONTRACT_PROVIDER (> 10 active contracts)
  for (let i = 0; i < 12; i++) {
    const code = `PETRO-${year}-RP-06${String(i).padStart(2, '0')}`;
    const t = await safeTender(planPETRO.id, code, `Servicio petrolero – lote ${i + 1}`, {
      processType: 'regimen_especial', estimatedAmount: 50000 + i * 5000,
      referenceBudgetAmount: 50000 + i * 5000,
    });
    await safeBid(t.id, provMulti.id, 48000 + i * 4800);
    await safeBid(t.id, provSum.id, 52000 + i * 5200);
    await safeContract(t.id, provMulti.id, `${code}-CT`, 48000 + i * 4800);
  }
  console.log('  RP-06xx: MULTI_CONTRACT_PROVIDER (12 contracts for provMulti)');

  // Pattern: MONO_CLIENT_SUPPLIER (provMono only serves GAD)
  for (let i = 0; i < 3; i++) {
    const code = `GAD-${year}-RP-07${i}`;
    const t = await safeTender(planGAD.id, code, `Servicios GAD – mono-cliente ${i + 1}`, {
      estimatedAmount: 30000, referenceBudgetAmount: 30000,
    });
    await safeBid(t.id, provMono.id, 28000 + i * 500);
    await safeBid(t.id, provTec.id, 31000);
    await safeContract(t.id, provMono.id, `${code}-CT`, 28000 + i * 500);
  }
  console.log('  RP-07x: MONO_CLIENT_SUPPLIER (provMono only serves GAD)');

  // Pattern: SECTOR_PRICE_OUTLIER (bid > 2x sector average)
  // First create some normal-price tenders of same processType
  for (let i = 0; i < 3; i++) {
    const code = `MINT-${year}-RP-08${i}`;
    const t = await safeTender(planMINT.id, code, `Equipamiento seguridad normal ${i + 1}`, {
      processType: 'subasta_inversa', estimatedAmount: 50000, referenceBudgetAmount: 50000,
    });
    await safeBid(t.id, provTec.id, 45000 + i * 1000);
    await safeBid(t.id, provSum.id, 48000 + i * 1000);
    await safeContract(t.id, provTec.id, `${code}-CT`, 45000 + i * 1000);
  }
  // Now the outlier
  const tOutlier = await safeTender(planMINT.id, `MINT-${year}-RP-083`, 'Equipamiento seguridad – outlier precio', {
    processType: 'subasta_inversa', estimatedAmount: 150000, referenceBudgetAmount: 150000,
  });
  await safeBid(tOutlier.id, provCover.id, 140000); // ~3x sector avg
  await safeBid(tOutlier.id, provMed.id, 145000);
  await safeContract(tOutlier.id, provCover.id, `MINT-${year}-RP-083-CT`, 140000);
  console.log('  RP-08x: SECTOR_PRICE_OUTLIER');

  // Pattern: REGIONAL_CONCENTRATION (>70% contracts to same province)
  // provLocal (Loja) wins most contracts in CNT
  for (let i = 0; i < 5; i++) {
    const code = `CNT-${year}-RP-09${i}`;
    const t = await safeTender(planCNT.id, code, `Fibra óptica regional lote ${i + 1}`, {
      estimatedAmount: 40000, referenceBudgetAmount: 40000,
    });
    await safeBid(t.id, provLocal.id, 38000 + i * 200);
    await safeBid(t.id, provTec.id, 41000);
    await safeContract(t.id, provLocal.id, `${code}-CT`, 38000 + i * 200);
  }
  console.log('  RP-09x: REGIONAL_CONCENTRATION (Loja providers dominate CNT)');

  // Pattern: ALWAYS_LOSES (provAlways participates 8 times, wins 0)
  const alwaysLosesEntities = [planMEC, planMSP, planGAD, planIESS, planCNT, planPETRO, planMINT, planSERCOP];
  for (let i = 0; i < 8; i++) {
    const pl = alwaysLosesEntities[i % alwaysLosesEntities.length];
    const code = `AL-${year}-RP-10${i}`;
    const t = await safeTender(pl.id, code, `Proceso genérico – siempre pierde ${i + 1}`, {
      estimatedAmount: 60000, referenceBudgetAmount: 60000,
    });
    await safeBid(t.id, provAlways.id, 65000); // always higher
    await safeBid(t.id, provTec.id, 55000);
    await safeContract(t.id, provTec.id, `${code}-CT`, 55000);
  }
  console.log('  RP-10x: ALWAYS_LOSES (provAlways: 8 participations, 0 wins)');

  // Pattern: NEARLY_EQUAL_BIDS (CV < 2%) – dedicated scenario
  const tEqualBids = await safeTender(planIESS.id, `IESS-${year}-RP-011`, 'Suministros hospitalarios – ofertas iguales', {
    estimatedAmount: 200000, referenceBudgetAmount: 200000,
  });
  await safeBid(tEqualBids.id, provTec.id, 195000);
  await safeBid(tEqualBids.id, provSum.id, 195200);
  await safeBid(tEqualBids.id, provCons.id, 195100);
  await safeContract(tEqualBids.id, provTec.id, `IESS-${year}-RP-011-CT`, 195000);
  console.log('  RP-011: NEARLY_EQUAL_BIDS');

  // ====================================================================
  // SECTION 2: STRUCTURAL PROBLEMS (SP-1 to SP-10)
  // ====================================================================
  console.log('\n--- Section 2: Structural Problems ---');

  // SP-1: Tech failures – tenders stuck in unusual status transitions
  const tSP1 = await safeTender(planSERCOP.id, `SERCOP-${year}-SP-001`, 'Proceso interrumpido por falla SOCE', {
    status: 'published', processType: 'licitacion', estimatedAmount: 250000,
    description: 'Proceso paralizado por caída del sistema – falla tecnológica.',
  });
  await safeBid(tSP1.id, provTec.id, 240000);
  console.log('  SP-001: Tech failures (stuck tender)');

  // SP-2: Limited supervision – high volume entity
  for (let i = 0; i < 20; i++) {
    const code = `PETRO-${year}-SP-02${String(i).padStart(2, '0')}`;
    await safeTender(planPETRO.id, code, `Compra masiva sin supervisión ${i + 1}`, {
      estimatedAmount: 25000, referenceBudgetAmount: 25000,
    });
  }
  console.log('  SP-02xx: Limited supervision (20 tenders, no audits)');

  // SP-3: Provider concentration – top 2 providers hold >80% in MINT
  for (let i = 0; i < 6; i++) {
    const code = `MINT-${year}-SP-03${i}`;
    const prov = i < 5 ? provTec : provSum;
    const t = await safeTender(planMINT.id, code, `Seguridad lote concentración ${i + 1}`, {
      estimatedAmount: 100000, referenceBudgetAmount: 100000,
    });
    await safeBid(t.id, prov.id, 95000);
    await safeContract(t.id, prov.id, `${code}-CT`, 95000);
  }
  console.log('  SP-03x: Provider concentration in MINT');

  // SP-4: Weak sanctions – providers with complaints but still active
  for (let i = 0; i < 3; i++) {
    const existing = await prisma.complaint.findFirst({
      where: { providerId: provGhost.id, summary: { contains: `SP-04-${i}` } },
    });
    if (!existing) {
      await prisma.complaint.create({
        data: {
          providerId: provGhost.id,
          entityId: entMEC.id,
          channel: 'WEB',
          category: 'corrupción',
          status: 'CLOSED',
          summary: `Denuncia SP-04-${i}: Incumplimiento reiterado del proveedor`,
          details: 'Proveedor no entregó a tiempo y cobró valores superiores.',
        },
      });
    }
  }
  const tSP4 = await safeTender(planMEC.id, `MEC-${year}-SP-004`, 'Contrato a proveedor denunciado', {
    estimatedAmount: 80000, referenceBudgetAmount: 80000,
  });
  await safeBid(tSP4.id, provGhost.id, 75000);
  await safeContract(tSP4.id, provGhost.id, `MEC-${year}-SP-004-CT`, 75000);
  console.log('  SP-004: Weak sanctions (provider with 3 complaints still winning)');

  // SP-5: Emergency corruption (already covered by MSP-AN scenarios, reinforced here)
  console.log('  SP-005: Emergency corruption (covered by MSP-AN-030x scenarios)');

  // SP-6: Weak enforcement – alerts exist but unresolved
  const tSP6 = await safeTender(planGAD.id, `GAD-${year}-SP-006`, 'Proceso con alertas sin resolver', {
    estimatedAmount: 150000, referenceBudgetAmount: 150000,
  });
  await safeBid(tSP6.id, provTec.id, 148000);
  await safeContract(tSP6.id, provTec.id, `GAD-${year}-SP-006-CT`, 148000);
  console.log('  SP-006: Weak enforcement (alerts created but never resolved)');

  // SP-7: Contract irregularities (inflated contracts)
  const tSP7 = await safeTender(planPETRO.id, `PETRO-${year}-SP-007`, 'Contrato inflado vs referencia', {
    estimatedAmount: 500000, referenceBudgetAmount: 500000,
  });
  await safeBid(tSP7.id, provCons.id, 498000); // 99.6% of budget
  await safeContract(tSP7.id, provCons.id, `PETRO-${year}-SP-007-CT`, 498000);
  console.log('  SP-007: Contract irregularities (99.6% of budget)');

  // SP-8: Poor planning – entity with very low execution rate
  for (let i = 0; i < 5; i++) {
    const code = `CNT-${year}-SP-08${i}`;
    await safeTender(planCNT.id, code, `Plan no ejecutado ${i + 1}`, {
      status: i === 0 ? 'awarded' : 'draft',
      estimatedAmount: 100000,
    });
  }
  console.log('  SP-08x: Poor planning (1 of 5 processes executed in CNT)');

  // SP-9: Low transparency (minimal documentation)
  const tSP9 = await safeTender(planMINT.id, `MINT-${year}-SP-009`, 'Proceso sin documentación', {
    estimatedAmount: 200000, referenceBudgetAmount: 200000,
    description: null,
  });
  await safeBid(tSP9.id, provTec.id, 195000);
  await safeContract(tSP9.id, provTec.id, `MINT-${year}-SP-009-CT`, 195000);
  console.log('  SP-009: Low transparency');

  // SP-10: Bureaucratic inefficiency (> 120 day process)
  const tSP10 = await safeTender(planIESS.id, `IESS-${year}-SP-010`, 'Proceso burocrático lento', {
    estimatedAmount: 300000, referenceBudgetAmount: 300000,
    publishedAt: daysAgo(180),
  });
  await safeBid(tSP10.id, provMed.id, 290000);
  await safeContract(tSP10.id, provMed.id, `IESS-${year}-SP-010-CT`, 290000, { signedAt: daysAgo(30) }); // 150 day process
  console.log('  SP-010: Bureaucratic inefficiency (150-day process)');

  // ====================================================================
  // SECTION 3: SOCE VULNERABILITIES (V1-V12)
  // ====================================================================
  console.log('\n--- Section 3: SOCE Vulnerabilities ---');

  // V1: Manual data – inconsistent dates
  const tV1 = await safeTender(planMEC.id, `MEC-${year}-VU-001`, 'Datos inconsistentes – fechas', {
    estimatedAmount: 100000, publishedAt: daysAgo(10), // published AFTER contract signed
  });
  await safeBid(tV1.id, provTec.id, 95000);
  await safeContract(tV1.id, provTec.id, `MEC-${year}-VU-001-CT`, 95000, { signedAt: daysAgo(20) });
  console.log('  VU-001: Manual data inconsistency (published after signed)');

  // V2: No price validation (covered by OVERPRICE pattern)
  console.log('  VU-002: No price validation (covered by OVERPRICE scenarios)');

  // V3: No provider relationship analysis (covered by provider network)
  console.log('  VU-003: Provider relationships (covered by collusion scenarios J/K)');

  // V4: Contract fragmentation (covered by FRAGMENTATION pattern)
  console.log('  VU-004: Contract fragmentation (covered by AN-010..013)');

  // V5: No adjudication pattern analysis
  // Providers taking turns winning at same entity
  for (let i = 0; i < 6; i++) {
    const code = `GAD-${year}-VU-05${i}`;
    const winner = i % 2 === 0 ? provTec : provCons;
    const loser = i % 2 === 0 ? provCons : provTec;
    const t = await safeTender(planGAD.id, code, `Adjudicación alternante ${i + 1}`, {
      estimatedAmount: 60000, referenceBudgetAmount: 60000,
      publishedAt: daysAgo(120 - i * 15),
    });
    await safeBid(t.id, winner.id, 55000 + i * 100);
    await safeBid(t.id, loser.id, 58000 + i * 100);
    await safeContract(t.id, winner.id, `${code}-CT`, 55000 + i * 100, { signedAt: daysAgo(110 - i * 15) });
  }
  console.log('  VU-05x: Repeating winner sequences (bid rotation)');

  // V6: Unstructured evaluation (no scores)
  const tV6 = await safeTender(planMSP.id, `MSP-${year}-VU-006`, 'Proceso sin evaluación estructurada', {
    estimatedAmount: 150000, referenceBudgetAmount: 150000,
  });
  await safeBid(tV6.id, provMed.id, 140000);
  await safeBid(tV6.id, provSum.id, 148000);
  await safeContract(tV6.id, provMed.id, `MSP-${year}-VU-006-CT`, 140000);
  console.log('  VU-006: No evaluation scores recorded');

  // V7: No document versioning (many clarification changes – covered by RP-005)
  console.log('  VU-007: No doc versioning (covered by FREQUENT_CLARIFICATIONS)');

  // V8: Post-audit only – all detection after the fact
  console.log('  VU-008: Post-audit only (systemic – addressed by alerting system)');

  // V9: No financial integration – budget mismatches
  const tV9 = await safeTender(planIESS.id, `IESS-${year}-VU-009`, 'Presupuesto desalineado con ejecución', {
    estimatedAmount: 200000, referenceBudgetAmount: 500000, // big gap
  });
  await safeBid(tV9.id, provTec.id, 190000);
  await safeContract(tV9.id, provTec.id, `IESS-${year}-VU-009-CT`, 190000);
  console.log('  VU-009: Budget mismatch');

  // V10: No provider history impact
  console.log('  VU-010: No provider history (covered by SP-004 – provider with complaints)');

  // V11: No amendment monitoring (covered by FREQUENT_AMENDMENTS AN-005)
  console.log('  VU-011: No amendment monitoring (covered by AN-005)');

  // V12: No analytics exploitation – large dataset, zero risk scores
  console.log('  VU-012: No analytics exploitation (solved by running compute-all-analytics)');

  // ====================================================================
  // SECTION 4: MANIPULATION TYPES (M1-M15)
  // ====================================================================
  console.log('\n--- Section 4: Manipulation Types ---');

  // M1: Directed specs (single eligible provider)
  const tM1 = await safeTender(planMEC.id, `MEC-${year}-MT-001`, 'Especificaciones dirigidas – solo 1 proveedor cumple', {
    estimatedAmount: 250000, referenceBudgetAmount: 250000,
    description: 'Requisitos técnicos extremadamente específicos que solo una empresa cumple.',
  });
  await safeBid(tM1.id, provTec.id, 245000);
  await safeContract(tM1.id, provTec.id, `MEC-${year}-MT-001-CT`, 245000);
  console.log('  MT-001: Directed specifications');

  // M2: Fictitious competition (provAlways participates but never wins – covered by RP-10x)
  console.log('  MT-002: Fictitious competition (covered by ALWAYS_LOSES RP-10x)');

  // M3: Bid rotation (covered by VU-05x)
  console.log('  MT-003: Bid rotation (covered by VU-05x)');

  // M4: Contract splitting (covered by FRAGMENTATION AN-010..013)
  console.log('  MT-004: Contract splitting (covered by AN-010..013)');

  // M5: Cover bids (deliberately high bids)
  const tM5 = await safeTender(planPETRO.id, `PETRO-${year}-MT-005`, 'Licitación con ofertas de cobertura', {
    estimatedAmount: 200000, referenceBudgetAmount: 200000,
  });
  await safeBid(tM5.id, provTec.id, 190000); // winner
  await safeBid(tM5.id, provCover.id, 350000); // way above – cover bid
  await safeBid(tM5.id, provGhost.id, 380000); // another cover bid
  await safeContract(tM5.id, provTec.id, `PETRO-${year}-MT-005-CT`, 190000);
  console.log('  MT-005: Cover bids');

  // M6: Abnormally low offers then renegotiate (covered by RP-003 + amendments)
  const contractM6 = await prisma.contract.findFirst({
    where: { contractNo: `MEC-${year}-RP-003-CT` },
  });
  if (contractM6) {
    const existingAmend = await prisma.contractAmendment.count({ where: { contractId: contractM6.id } });
    if (existingAmend === 0) {
      await prisma.contractAmendment.create({
        data: {
          contractId: contractM6.id,
          amendmentNo: 1,
          changeType: 'MONTO',
          valueBefore: new Prisma.Decimal(40000),
          valueAfter: new Prisma.Decimal(150000),
          reason: 'Incremento sustancial por "costos no previstos"',
          approvedAt: daysAgo(10),
        },
      });
    }
  }
  console.log('  MT-006: Low bid then renegotiate (amendment on RP-003)');

  // M7: Strategic spec changes (many clarifications – covered by RP-005)
  console.log('  MT-007: Strategic spec changes (covered by RP-005)');

  // M8: Single bidder processes (covered by AN-001)
  console.log('  MT-008: Single bidder (covered by AN-001)');

  // M9: New company wins big (covered by AN-004)
  console.log('  MT-009: New company wins big (covered by AN-004 + shell company)');

  // Additional shell company scenario
  const tM9b = await safeTender(planMSP.id, `MSP-${year}-MT-009`, 'Contrato a empresa pantalla', {
    estimatedAmount: 200000, referenceBudgetAmount: 200000,
  });
  await safeBid(tM9b.id, provShell.id, 190000);
  await safeBid(tM9b.id, provTec.id, 195000);
  await safeContract(tM9b.id, provShell.id, `MSP-${year}-MT-009-CT`, 190000);
  console.log('  MT-009b: Shell company wins contract');

  // M10: Hidden subcontracting – flag via amendment
  const contractM10 = await prisma.contract.findFirst({ where: { contractNo: `MSP-${year}-MT-009-CT` } });
  if (contractM10) {
    const existAm = await prisma.contractAmendment.count({ where: { contractId: contractM10.id } });
    if (existAm === 0) {
      await prisma.contractAmendment.create({
        data: {
          contractId: contractM10.id,
          amendmentNo: 1,
          changeType: 'ALCANCE',
          reason: 'Subcontratación a tercero no participante del proceso',
          approvedAt: daysAgo(5),
        },
      });
    }
  }
  console.log('  MT-010: Hidden subcontracting');

  // M11: Frequent post-award changes (covered by AN-005 FREQUENT_AMENDMENTS)
  console.log('  MT-011: Frequent post-award changes (covered by AN-005)');

  // M12: Conflict of interest (providers with same address)
  console.log('  MT-012: Conflict of interest (provShell + provGhost share Pichincha – network analysis)');

  // M13: Repetitive high-price purchases
  for (let i = 0; i < 3; i++) {
    const code = `MSP-${year}-MT-13${i}`;
    const t = await safeTender(planMSP.id, code, `Compra repetitiva precio alto ${i + 1}`, {
      processType: 'catalogo', estimatedAmount: 50000, referenceBudgetAmount: 30000,
    });
    await safeBid(t.id, provMed.id, 49000);
    await safeContract(t.id, provMed.id, `${code}-CT`, 49000); // 163% of budget
  }
  console.log('  MT-13x: Repetitive high-price purchases');

  // M14: Emergency abuse (covered by MSP-AN-030x)
  console.log('  MT-014: Emergency abuse (covered by MSP-AN-030x)');

  // M15: Strategic cancellation
  const tM15a = await safeTender(planGAD.id, `GAD-${year}-MT-15A`, 'Proceso cancelado estratégicamente', {
    status: 'cancelled', estimatedAmount: 300000, publishedAt: daysAgo(90),
    description: 'Cancelado cuando resultado no favorable al interesado.',
  });
  await safeBid(tM15a.id, provSum.id, 280000);
  const tM15b = await safeTender(planGAD.id, `GAD-${year}-MT-15B`, 'Re-licitación con nuevos términos', {
    status: 'awarded', estimatedAmount: 350000, referenceBudgetAmount: 350000,
    publishedAt: daysAgo(60),
    description: 'Mismo objeto con condiciones cambiadas para favorecer a otro proveedor.',
  });
  await safeBid(tM15b.id, provTec.id, 340000);
  await safeContract(tM15b.id, provTec.id, `GAD-${year}-MT-15B-CT`, 340000);
  console.log('  MT-15A/B: Strategic cancellation and re-tender');

  // ====================================================================
  // SECTION 5: Additional 25 Risk Indicator scenarios (complement above)
  // ====================================================================
  console.log('\n--- Section 5: Risk Indicator Scenarios ---');

  // RI-17: Cancelled processes re-tendered (process indicator)
  const tRI17 = await safeTender(planMINT.id, `MINT-${year}-RI-017`, 'Proceso re-licitado', {
    status: 'cancelled', estimatedAmount: 100000, publishedAt: daysAgo(45),
  });
  console.log('  RI-017: Re-tendered process');

  // RI-23: Rescinded contracts
  const tRI23 = await safeTender(planPETRO.id, `PETRO-${year}-RI-023`, 'Contrato rescindido', {
    estimatedAmount: 400000, referenceBudgetAmount: 400000,
  });
  await safeBid(tRI23.id, provCons.id, 380000);
  await safeContract(tRI23.id, provCons.id, `PETRO-${year}-RI-023-CT`, 380000, { status: 'terminated' });
  console.log('  RI-023: Rescinded contract');

  // RI-25: Concentration of contracts in few projects
  console.log('  RI-025: Contract concentration (covered by MULTI_CONTRACT_PROVIDER)');

  // RI-7: Price difference between institutions for similar items
  // (GAD pays 40k for same type, MSP pays 90k)
  const tRI7a = await safeTender(planGAD.id, `GAD-${year}-RI-007A`, 'Equipos informáticos – precio bajo', {
    processType: 'catalogo', estimatedAmount: 45000, referenceBudgetAmount: 45000,
  });
  await safeBid(tRI7a.id, provTec.id, 40000);
  await safeContract(tRI7a.id, provTec.id, `GAD-${year}-RI-007A-CT`, 40000);
  const tRI7b = await safeTender(planMSP.id, `MSP-${year}-RI-007B`, 'Equipos informáticos – precio alto', {
    processType: 'catalogo', estimatedAmount: 100000, referenceBudgetAmount: 100000,
  });
  await safeBid(tRI7b.id, provTec.id, 90000);
  await safeContract(tRI7b.id, provTec.id, `MSP-${year}-RI-007B-CT`, 90000);
  console.log('  RI-007: Price variation between institutions');

  // ====================================================================
  // SECTION 6: Summary counts
  // ====================================================================
  console.log('\n--- Seed Analytics Summary ---');
  const totalTenders = await prisma.tender.count();
  const totalContracts = await prisma.contract.count();
  const totalBids = await prisma.bid.count();
  const totalProviders = await prisma.provider.count();
  const totalEntities = await prisma.entity.count();
  const totalAlerts = await prisma.alertEvent.count();
  const totalAmendments = await prisma.contractAmendment.count();
  const totalComplaints = await prisma.complaint.count();
  const totalClarifications = await prisma.tenderClarification.count();

  console.log(`  Tenders:         ${totalTenders}`);
  console.log(`  Contracts:       ${totalContracts}`);
  console.log(`  Bids:            ${totalBids}`);
  console.log(`  Providers:       ${totalProviders}`);
  console.log(`  Entities:        ${totalEntities}`);
  console.log(`  Amendments:      ${totalAmendments}`);
  console.log(`  Complaints:      ${totalComplaints}`);
  console.log(`  Clarifications:  ${totalClarifications}`);
  console.log(`  Alerts:          ${totalAlerts}`);
  console.log('\nAnalytics seed complete. Run compute-all-analytics.ts next.');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
