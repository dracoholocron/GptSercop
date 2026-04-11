/**
 * seed-graph-analytics.ts – Phase 3 Graph Analytics extension seed
 *
 * Run: npx tsx prisma/seed-graph-analytics.ts
 *   or: npm run seed:graph --workspace=api
 *
 * Idempotent: findFirst by code / identifier / tenderId / composite keys.
 * Reproducible: faker.seed(42).
 */
import { PrismaClient, Prisma } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

faker.seed(42);

const DAY_MS = 86_400_000;
const SEED_YEAR = 2024;

const EC_PROVINCES = [
  'Pichincha',
  'Guayas',
  'Azuay',
  'Manabí',
  'Tungurahua',
  'Imbabura',
  'Loja',
  'Esmeraldas',
  'El Oro',
  'Los Ríos',
  'Chimborazo',
  'Cotopaxi',
  'Santo Domingo de los Tsáchilas',
  'Santa Elena',
  'Pastaza',
] as const;

const REF_ENTITY_CODES = ['MEC', 'MSP', 'GAD-Q', 'IESS', 'SERCOP'] as const;
const NEW_ENTITY_SPECS = [
  { code: 'GR-ENT-01', name: 'Gobierno Autónomo Descentralizado Provincial Graph-Test', organizationType: 'gad' },
  { code: 'GR-ENT-02', name: 'Empresa Pública Municipal de Agua Graph-Test', organizationType: 'empresa_publica' },
  { code: 'GR-ENT-03', name: 'Universidad Estatal Experimental Graph-Test', organizationType: 'institucion' },
  { code: 'GR-ENT-04', name: 'Hospital del IESS Graph-Test', organizationType: 'hospital' },
  { code: 'GR-ENT-05', name: 'Registro Civil Graph-Test', organizationType: 'institucion' },
  { code: 'GR-ENT-06', name: 'Bomberos Graph-Test', organizationType: 'gad' },
  { code: 'GR-ENT-07', name: 'EP Petroecuador Regional Graph-Test', organizationType: 'empresa_publica' },
  { code: 'GR-ENT-08', name: 'Ministerio de Obras Graph-Test', organizationType: 'ministerio' },
  { code: 'GR-ENT-09', name: 'Secretaría del Deporte Graph-Test', organizationType: 'secretaria' },
  { code: 'GR-ENT-10', name: 'Corporación Eléctrica Graph-Test', organizationType: 'empresa_publica' },
] as const;

function d(n: number): Prisma.Decimal {
  return new Prisma.Decimal(n.toFixed(2));
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * DAY_MS);
}

/** 13-digit RUC-style id (Ecuador), unique per index, ends with 001 */
function graphProviderRuc(i: number): string {
  return `17${String(9_000_000 + i).padStart(8, '0')}001`;
}

function orderedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

type Summary = Record<string, number>;

function bump(s: Summary, key: string, n = 1) {
  s[key] = (s[key] ?? 0) + n;
}

async function ensureEntity(code: string, name: string, organizationType: string, s: Summary) {
  const existing = await prisma.entity.findFirst({ where: { code } });
  if (existing) {
    bump(s, 'entities_found');
    return existing;
  }
  const created = await prisma.entity.create({
    data: { code, name, legalName: name, organizationType },
  });
  bump(s, 'entities_created');
  return created;
}

async function ensurePlan(entityId: string, year: number, s: Summary) {
  const existing = await prisma.procurementPlan.findFirst({ where: { entityId, year } });
  if (existing) {
    bump(s, 'plans_found');
    return existing;
  }
  const created = await prisma.procurementPlan.create({
    data: {
      entityId,
      year,
      status: 'published',
      publishedAt: daysAgo(400 - year),
      totalAmount: d(5_000_000 + year * 1000),
    },
  });
  bump(s, 'plans_created');
  return created;
}

async function ensureProvider(
  identifier: string,
  data: {
    name: string;
    province: string;
    canton: string;
    address: string;
    legalEstablishmentDate?: Date;
    patrimonyAmount?: Prisma.Decimal;
    activityCodes?: string[];
  },
  s: Summary,
) {
  const existing = await prisma.provider.findFirst({ where: { identifier } });
  if (existing) {
    bump(s, 'providers_found');
    return existing;
  }
  const created = await prisma.provider.create({
    data: {
      identifier,
      name: data.name,
      legalName: data.name,
      tradeName: data.name.split(/\s+/)[0]?.slice(0, 40) ?? data.name,
      status: 'active',
      province: data.province,
      canton: data.canton,
      address: data.address,
      activityCodes: data.activityCodes ?? ['452100', '453100', '464900'],
      legalEstablishmentDate: data.legalEstablishmentDate,
      patrimonyAmount: data.patrimonyAmount,
    },
  });
  bump(s, 'providers_created');
  return created;
}

async function ensureTender(
  code: string,
  procurementPlanId: string,
  data: {
    title: string;
    description?: string;
    status: string;
    processType?: string;
    regime?: string;
    estimatedAmount?: Prisma.Decimal;
    referenceBudgetAmount?: Prisma.Decimal;
    publishedAt?: Date;
    bidsDeadlineAt?: Date;
    procurementMethod?: string;
  },
  s: Summary,
) {
  const existing = await prisma.tender.findFirst({ where: { code } });
  if (existing) {
    bump(s, 'tenders_found');
    return existing;
  }
  const created = await prisma.tender.create({
    data: {
      code,
      procurementPlanId,
      title: data.title,
      description: data.description,
      status: data.status,
      procurementMethod: data.procurementMethod ?? 'open',
      processType: data.processType ?? 'licitacion',
      regime: data.regime ?? 'ordinario',
      estimatedAmount: data.estimatedAmount,
      referenceBudgetAmount: data.referenceBudgetAmount ?? data.estimatedAmount,
      publishedAt: data.publishedAt ?? daysAgo(120),
      bidsDeadlineAt: data.bidsDeadlineAt ?? daysAgo(90),
    },
  });
  bump(s, 'tenders_created');
  return created;
}

async function ensureBid(tenderId: string, providerId: string, amount: number | undefined, status: string, s: Summary) {
  const existing = await prisma.bid.findFirst({ where: { tenderId, providerId } });
  if (existing) {
    bump(s, 'bids_found');
    return existing;
  }
  await prisma.bid.create({
    data: {
      tenderId,
      providerId,
      amount: amount !== undefined ? d(amount) : undefined,
      status,
      submittedAt: daysAgo(100),
    },
  });
  bump(s, 'bids_created');
}

async function ensureContract(
  tenderId: string,
  providerId: string,
  contractNo: string,
  amount: number,
  signedAt: Date,
  status: string,
  s: Summary,
) {
  const byTender = await prisma.contract.findFirst({ where: { tenderId } });
  if (byTender) {
    bump(s, 'contracts_found');
    return byTender;
  }
  const byNo = await prisma.contract.findFirst({ where: { contractNo } });
  if (byNo) {
    bump(s, 'contracts_found');
    return byNo;
  }
  const created = await prisma.contract.create({
    data: {
      tenderId,
      providerId,
      contractNo,
      amount: d(amount),
      signedAt,
      status,
    },
  });
  bump(s, 'contracts_created');
  return created;
}

async function ensureAmendment(
  contractId: string,
  amendmentNo: number,
  changeType: string,
  valueBefore: number,
  valueAfter: number,
  reason: string,
  s: Summary,
) {
  const existing = await prisma.contractAmendment.findFirst({
    where: { contractId, amendmentNo },
  });
  if (existing) {
    bump(s, 'amendments_found');
    return existing;
  }
  await prisma.contractAmendment.create({
    data: {
      contractId,
      amendmentNo,
      changeType,
      valueBefore: d(valueBefore),
      valueAfter: d(valueAfter),
      reason,
      approvedAt: daysAgo(20 - amendmentNo),
    },
  });
  bump(s, 'amendments_created');
}

async function ensureRiskScore(
  tenderId: string,
  row: {
    competitionRisk: number;
    priceRisk: number;
    supplierRisk: number;
    processRisk: number;
    executionRisk: number;
    totalScore: number;
    riskLevel: string;
    flags: string[];
  },
  s: Summary,
) {
  const existing = await prisma.riskScore.findFirst({ where: { tenderId } });
  if (existing) {
    bump(s, 'riskScores_found');
    return existing;
  }
  await prisma.riskScore.create({
    data: {
      tenderId,
      ...row,
      calculatedAt: new Date(),
    },
  });
  bump(s, 'riskScores_created');
}

async function ensureProviderRelation(
  aId: string,
  bId: string,
  sharedTenders: number,
  lastSeenAt: Date,
  s: Summary,
) {
  const [pa, pb] = orderedPair(aId, bId);
  const existing = await prisma.providerRelation.findFirst({
    where: { providerAId: pa, providerBId: pb },
  });
  if (existing) {
    bump(s, 'relations_found');
    return existing;
  }
  await prisma.providerRelation.create({
    data: { providerAId: pa, providerBId: pb, sharedTenders, lastSeenAt },
  });
  bump(s, 'relations_created');
}

async function ensureFragmentationAlert(
  entityId: string,
  stablePattern: string,
  data: {
    contractIds: string[];
    totalAmount: number;
    contractCount: number;
    periodDays: number;
    severity: string;
  },
  s: Summary,
) {
  const existing = await prisma.fragmentationAlert.findFirst({
    where: { entityId, pattern: stablePattern },
  });
  if (existing) {
    bump(s, 'fragmentation_found');
    return existing;
  }
  await prisma.fragmentationAlert.create({
    data: {
      entityId,
      pattern: stablePattern,
      contractIds: data.contractIds,
      totalAmount: data.totalAmount,
      contractCount: data.contractCount,
      periodDays: data.periodDays,
      severity: data.severity,
    },
  });
  bump(s, 'fragmentation_created');
}

async function ensureProviderScore(
  providerId: string,
  scores: {
    complianceScore: number;
    deliveryScore: number;
    priceScore: number;
    diversityScore: number;
    totalScore: number;
    tier: string;
  },
  s: Summary,
) {
  const existing = await prisma.providerScore.findFirst({ where: { providerId } });
  if (existing) {
    await prisma.providerScore.update({
      where: { providerId },
      data: { ...scores, calculatedAt: new Date() },
    });
    bump(s, 'providerScores_updated');
    return;
  }
  await prisma.providerScore.create({
    data: { providerId, ...scores, calculatedAt: new Date() },
  });
  bump(s, 'providerScores_created');
}

async function ensurePriceReference(
  description: string,
  year: number,
  data: {
    processType?: string;
    cpcCode?: string;
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
    sampleSize: number;
    province?: string;
  },
  s: Summary,
) {
  const existing = await prisma.priceReference.findFirst({
    where: { description, year, processType: data.processType ?? null },
  });
  if (existing) {
    bump(s, 'priceRefs_found');
    return existing;
  }
  await prisma.priceReference.create({
    data: {
      description,
      year,
      processType: data.processType,
      cpcCode: data.cpcCode,
      avgPrice: data.avgPrice,
      minPrice: data.minPrice,
      maxPrice: data.maxPrice,
      sampleSize: data.sampleSize,
      province: data.province,
    },
  });
  bump(s, 'priceRefs_created');
}

async function main() {
  const s: Summary = {};
  console.log('=== Graph Analytics Phase 3 seed ===\n');

  const entities: { id: string; code: string | null }[] = [];
  for (const code of REF_ENTITY_CODES) {
    const name = `Entidad referencia ${code}`;
    entities.push(await ensureEntity(code, name, 'institucion', s));
  }
  for (const e of NEW_ENTITY_SPECS) {
    entities.push(await ensureEntity(e.code, e.name, e.organizationType, s));
  }

  const plans: { id: string; entityIdx: number }[] = [];
  let pi = 0;
  for (const ent of entities) {
    for (const year of [SEED_YEAR, SEED_YEAR + 1]) {
      const plan = await ensurePlan(ent.id, year, s);
      plans.push({ id: plan.id, entityIdx: pi % entities.length });
      pi++;
    }
  }

  const providers: { id: string; identifier: string }[] = [];
  const shellAddress = 'Av. Naciones Unidas N37-95, Quito';
  const shellCanton = 'Quito';

  for (let i = 0; i < 80; i++) {
    const province = faker.helpers.arrayElement([...EC_PROVINCES]);
    const canton = province === 'Pichincha' ? 'Quito' : faker.location.city();
    const identifier = graphProviderRuc(i);
    let address = `${faker.location.streetAddress()}, ${canton}`;
    let legalEstablishmentDate: Date | undefined = daysAgo(faker.number.int({ min: 800, max: 2500 }));
    let patrimony: Prisma.Decimal | undefined = d(faker.number.int({ min: 20_000, max: 800_000 }));

    // Shell cluster: indices 20–21 share address; 20 is "old", 21 is new + large wins later
    if (i === 20 || i === 21) {
      address = shellAddress;
      legalEstablishmentDate = i === 21 ? daysAgo(120) : daysAgo(2000);
      patrimony = i === 21 ? d(8000) : d(400_000);
    }
    // Mono-client shell (22): only bids on entity index 5
    const name = `${faker.company.name()} Graph-${String(i).padStart(2, '0')}`;

    providers.push(
      await ensureProvider(
        identifier,
        {
          name,
          province,
          canton: i === 20 || i === 21 ? shellCanton : canton,
          address,
          legalEstablishmentDate,
          patrimonyAmount: patrimony,
        },
        s,
      ),
    );
  }

  const planByEntityYear = new Map<string, string>();
  for (const ent of entities) {
    for (const year of [SEED_YEAR, SEED_YEAR + 1]) {
      const p = await prisma.procurementPlan.findFirst({ where: { entityId: ent.id, year } });
      if (p) planByEntityYear.set(`${ent.id}:${year}`, p.id);
    }
  }

  const pickPlan = (entityIdx: number, year = SEED_YEAR) => {
    const ent = entities[entityIdx % entities.length]!;
    const id = planByEntityYear.get(`${ent.id}:${year}`);
    if (!id) throw new Error(`Missing plan entityIdx=${entityIdx}`);
    return id;
  };

  const pairTally = new Map<string, number>();

  function notePair(a: string, b: string) {
    const [pa, pb] = orderedPair(a, b);
    const k = `${pa}:${pb}`;
    pairTally.set(k, (pairTally.get(k) ?? 0) + 1);
  }

  function notePairsFromProviderIds(ids: string[]) {
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        notePair(ids[i]!, ids[j]!);
      }
    }
  }

  // ── Group A: Collusion rings (4 rings) ────────────────────────────────────
  const ringDefs = [
    { size: 4, tenderCount: 10, codeStart: 1 },
    { size: 3, tenderCount: 10, codeStart: 11 },
    { size: 4, tenderCount: 10, codeStart: 21 },
    { size: 5, tenderCount: 10, codeStart: 31 },
  ] as const;
  let providerCursor = 0;

  for (const ring of ringDefs) {
    const members = providers.slice(providerCursor, providerCursor + ring.size).map((p) => p.id);
    const loserIdx = providerCursor + ring.size;
    const loser = providers[loserIdx]!;
    providerCursor += ring.size + 1; // + always-loses companion

    for (let t = 0; t < ring.tenderCount; t++) {
      const codeNum = ring.codeStart + t;
      const code = `GR-COL-${String(codeNum).padStart(3, '0')}`;
      const base = 80_000 + t * 1500 + ring.size * 100;
      const planId = pickPlan((codeNum + ring.size) % entities.length);
      const tender = await ensureTender(
        code,
        planId,
        {
          title: `Licitación colusión simulada ${code}`,
          status: 'awarded',
          processType: 'licitacion',
          regime: 'ordinario',
          estimatedAmount: d(base),
          referenceBudgetAmount: d(base),
          publishedAt: daysAgo(200 - t),
        },
        s,
      );

      const winnerOffset = t % ring.size;
      const ref = base * (0.985 + faker.number.float({ min: 0, max: 0.03, fractionDigits: 4 }));
      const bidsFrom = [...members, loser.id];
      notePairsFromProviderIds(bidsFrom);

      for (let m = 0; m < members.length; m++) {
        const jitter = 1 + (m - winnerOffset) * 0.008 + faker.number.float({ min: -0.01, max: 0.01, fractionDigits: 5 });
        const amt = ref * jitter;
        await ensureBid(tender.id, members[m]!, amt, 'submitted', s);
      }
      await ensureBid(tender.id, loser.id, base * 1.12, 'submitted', s);

      const winnerId = members[winnerOffset]!;
      await ensureContract(
        tender.id,
        winnerId,
        `GR-CON-COL-${String(codeNum).padStart(3, '0')}`,
        ref * (0.99 + winnerOffset * 0.002),
        daysAgo(150 - t),
        'active',
        s,
      );

      await ensureRiskScore(
        tender.id,
        {
          competitionRisk: 78 + (t % 5),
          priceRisk: 72,
          supplierRisk: 65,
          processRisk: 40,
          executionRisk: 35,
          totalScore: 68,
          riskLevel: 'high',
          flags: ['NEARLY_EQUAL_BIDS', 'WINNER_ROTATION', 'ALWAYS_LOSES'],
        },
        s,
      );
    }
  }

  // ── Group B: Shell / mono-client ──────────────────────────────────────────
  const shellWinner = providers[21]!;
  const shellTwin = providers[20]!;
  const mono = providers[22]!;
  const monoEntityIdx = 5;

  for (let t = 0; t < 12; t++) {
    const code = `GR-SHELL-${String(t + 1).padStart(3, '0')}`;
    const planId = pickPlan(monoEntityIdx);
    const base = t % 3 === 0 ? 280_000 : 45_000;
    const tender = await ensureTender(
      code,
      planId,
      {
        title: `Compra shell pattern ${code}`,
        status: 'awarded',
        processType: 'contratacion_directa',
        estimatedAmount: d(base),
        referenceBudgetAmount: d(base),
        publishedAt: daysAgo(60 + t),
      },
      s,
    );

    await ensureBid(tender.id, shellWinner.id, base * 0.99, 'submitted', s);
    await ensureBid(tender.id, shellTwin.id, base * 1.04, 'submitted', s);
    notePair(shellWinner.id, shellTwin.id);

    await ensureContract(
      tender.id,
      shellWinner.id,
      `GR-CON-SHELL-${String(t + 1).padStart(3, '0')}`,
      base * 0.99,
      daysAgo(40 + t),
      'active',
      s,
    );

    await ensureRiskScore(
      tender.id,
      {
        competitionRisk: 45,
        priceRisk: 55,
        supplierRisk: 88,
        processRisk: 50,
        executionRisk: 42,
        totalScore: 58,
        riskLevel: 'medium',
        flags: t % 3 === 0 ? ['NEW_COMPANY_LARGE_CONTRACT'] : ['NEW_COMPANY_LARGE_CONTRACT', 'FEW_BIDS'],
      },
      s,
    );
  }

  // Mono-client only: extra tenders only on one entity for provider 22
  for (let t = 0; t < 8; t++) {
    const code = `GR-SHELL-M${String(t + 1).padStart(2, '0')}`;
    const planId = pickPlan(monoEntityIdx);
    const base = 12_000 + t * 800;
    const tender = await ensureTender(
      code,
      planId,
      {
        title: `Suministro mono-cliente ${code}`,
        status: 'awarded',
        processType: 'menor_cuantia',
        estimatedAmount: d(base),
        publishedAt: daysAgo(30 + t),
      },
      s,
    );
    await ensureBid(tender.id, mono.id, base * 0.95, 'submitted', s);
    await ensureBid(tender.id, providers[0]!.id, base * 1.08, 'submitted', s);
    notePair(mono.id, providers[0]!.id);
    await ensureContract(
      tender.id,
      mono.id,
      `GR-CON-MONO-${String(t + 1).padStart(2, '0')}`,
      base * 0.95,
      daysAgo(15 + t),
      'active',
      s,
    );
    await ensureRiskScore(
      tender.id,
      {
        competitionRisk: 50,
        priceRisk: 40,
        supplierRisk: 70,
        processRisk: 35,
        executionRisk: 30,
        totalScore: 48,
        riskLevel: 'medium',
        flags: ['MONO_CLIENT_SUPPLIER', 'FEW_BIDS'],
      },
      s,
    );
  }

  // ── Group C: Price manipulation ───────────────────────────────────────────
  for (let t = 0; t < 30; t++) {
    const code = `GR-PRICE-${String(t + 1).padStart(3, '0')}`;
    const planId = pickPlan((t + 3) % entities.length);
    const refAmt = 150_000 + t * 2000;
    const tender = await ensureTender(
      code,
      planId,
      {
        title: `Proceso precio referencial ${code}`,
        status: 'awarded',
        processType: 'licitacion',
        estimatedAmount: d(refAmt),
        referenceBudgetAmount: d(refAmt),
        publishedAt: daysAgo(100 + t),
      },
      s,
    );

    const lowBidder = providers[30 + (t % 8)]!;
    const highBidder = providers[40 + (t % 10)]!;
    const winner = providers[50 + (t % 6)]!;
    const winAmount = refAmt * (0.97 + (t % 4) * 0.007); // 97–100.9%

    await ensureBid(tender.id, lowBidder.id, refAmt * 0.42, 'submitted', s);
    await ensureBid(tender.id, highBidder.id, refAmt * 1.02, 'submitted', s);
    await ensureBid(tender.id, winner.id, winAmount, 'submitted', s);
    notePairsFromProviderIds([lowBidder.id, highBidder.id, winner.id]);

    const c = await ensureContract(
      tender.id,
      winner.id,
      `GR-CON-PRICE-${String(t + 1).padStart(3, '0')}`,
      winAmount,
      daysAgo(70 + t),
      'active',
      s,
    );

    if (t < 8) {
      const bumpAmt = winAmount * 1.28;
      await ensureAmendment(c.id, 1, 'MONTO', winAmount, bumpAmt, 'Ajuste por incremento de insumos', s);
    }

    await ensureRiskScore(
      tender.id,
      {
        competitionRisk: 55,
        priceRisk: 85,
        supplierRisk: 48,
        processRisk: 60,
        executionRisk: t < 8 ? 72 : 40,
        totalScore: t < 8 ? 62 : 54,
        riskLevel: t < 8 ? 'high' : 'medium',
        flags:
          t < 8
            ? ['ABNORMALLY_LOW_BID', 'OVERPRICE', 'POST_AWARD_PRICE_INCREASE']
            : ['ABNORMALLY_LOW_BID', 'OVERPRICE'],
      },
      s,
    );
  }

  // ── Group D: Process irregularities + fragmentation contracts ───────────────
  const fragContractIds: string[] = [];
  const fragEntityIdx = 2;

  for (let t = 0; t < 45; t++) {
    const code = `GR-PROC-${String(t + 1).padStart(3, '0')}`;
    const planId = pickPlan(fragEntityIdx);
    const isEmergency = t % 4 === 0;
    const refAmt = 48_000 + (t % 7) * 1200;
    const published = daysAgo(25 + t);
    const signed = new Date(published.getTime() + (8 + (t % 5)) * DAY_MS); // < 15 days

    const tender = await ensureTender(
      code,
      planId,
      {
        title: `Proceso rápido / fragmentación ${code}`,
        status: 'awarded',
        processType: isEmergency ? 'contratacion_directa' : 'cotizacion',
        regime: isEmergency ? 'emergencia' : 'ordinario',
        estimatedAmount: d(refAmt),
        referenceBudgetAmount: d(refAmt),
        publishedAt: published,
      },
      s,
    );

    const a = providers[55 + (t % 5)]!;
    const b = providers[60 + (t % 5)]!;
    await ensureBid(tender.id, a.id, refAmt * 0.93, 'submitted', s);
    await ensureBid(tender.id, b.id, refAmt * 0.95, 'submitted', s);
    notePair(a.id, b.id);

    const winnerId = t % 2 === 0 ? a.id : b.id;
    const winAmt = t % 2 === 0 ? refAmt * 0.93 : refAmt * 0.95;
    const c = await ensureContract(
      tender.id,
      winnerId,
      `GR-CON-PROC-${String(t + 1).padStart(3, '0')}`,
      winAmt,
      signed,
      'active',
      s,
    );

    {
      const clusterBase = 49_500;
      const adj = clusterBase + (t % 3) * 80;
      await prisma.contract.update({
        where: { id: c.id },
        data: { amount: d(adj) },
      });
      fragContractIds.push(c.id);
    }

    await ensureRiskScore(
      tender.id,
      {
        competitionRisk: 40,
        priceRisk: 45,
        supplierRisk: 38,
        processRisk: isEmergency ? 82 : 70,
        executionRisk: 35,
        totalScore: isEmergency ? 58 : 52,
        riskLevel: 'medium',
        flags: isEmergency
          ? ['FAST_PROCESS', 'HIGH_EMERGENCY_RATE', 'FRAGMENTATION']
          : ['FAST_PROCESS', 'FRAGMENTATION'],
      },
      s,
    );
  }

  // Fragmentation alerts (15) – triplets of similar contract amounts
  for (let a = 0; a < 15; a++) {
    const slice = fragContractIds.slice(a * 3, a * 3 + 3);
    if (slice.length < 3) break;
    const ent = entities[fragEntityIdx]!;
    await ensureFragmentationAlert(
      ent.id,
      `AMOUNT_CLUSTER:GRAPH:${String(a).padStart(2, '0')}`,
      {
        contractIds: slice,
        totalAmount: 49_500 * 3,
        contractCount: 3,
        periodDays: 30,
        severity: a % 4 === 0 ? 'CRITICAL' : 'WARNING',
      },
      s,
    );
  }

  // ── Group E: Execution / amendments ─────────────────────────────────────────
  for (let t = 0; t < 8; t++) {
    const code = `GR-EXEC-${String(t + 1).padStart(3, '0')}`;
    const planId = pickPlan((t + 7) % entities.length);
    const refAmt = 220_000 + t * 3000;
    const tender = await ensureTender(
      code,
      planId,
      {
        title: `Contrato con modificaciones ${code}`,
        status: 'awarded',
        processType: 'licitacion',
        estimatedAmount: d(refAmt),
        publishedAt: daysAgo(180 + t),
      },
      s,
    );

    const w = providers[10 + (t % 12)]!;
    const o = providers[11 + (t % 12)]!;
    await ensureBid(tender.id, w.id, refAmt * 0.91, 'submitted', s);
    await ensureBid(tender.id, o.id, refAmt * 0.94, 'submitted', s);
    notePair(w.id, o.id);

    const startAmt = refAmt * 0.91;
    const c = await ensureContract(
      tender.id,
      w.id,
      `GR-CON-EXEC-${String(t + 1).padStart(3, '0')}`,
      startAmt,
      daysAgo(140 + t),
      'active',
      s,
    );

    let cur = startAmt;
    const amendCount = 4;
    for (let k = 1; k <= amendCount; k++) {
      if (k % 2 === 1) {
        const nxt = cur * 1.25;
        await ensureAmendment(c.id, k, 'MONTO', cur, nxt, `Incremento monto tramo ${k}`, s);
        cur = nxt;
      } else {
        await ensureAmendment(c.id, k, 'PLAZO', cur, cur, `Prórroga plazo ${k}`, s);
      }
    }

    await ensureRiskScore(
      tender.id,
      {
        competitionRisk: 42,
        priceRisk: 48,
        supplierRisk: 44,
        processRisk: 40,
        executionRisk: 88,
        totalScore: 56,
        riskLevel: 'medium',
        flags: ['FREQUENT_AMENDMENTS', 'POST_AWARD_PRICE_INCREASE', 'TERM_EXTENSION'],
      },
      s,
    );
  }

  // ── Group F: Network hub / bridge / isolated (40 tenders) ─────────────────
  const hub = providers[0]!;
  const bridge = providers[1]!;
  const clusterA = providers.slice(2, 7).map((p) => p.id);
  const clusterB = providers.slice(70, 80).map((p) => p.id);
  const isolated = providers[79]!;

  for (let t = 0; t < 40; t++) {
    const code = `GR-NET-${String(t + 1).padStart(3, '0')}`;
    const planId = pickPlan((t + 1) % entities.length);
    const refAmt = 60_000 + t * 2200;
    const mode: 'iso' | 'bridge' | 'hub' = t < 6 ? 'iso' : t < 14 ? 'bridge' : 'hub';

    const tender = await ensureTender(
      code,
      planId,
      {
        title:
          mode === 'iso'
            ? `Ganador aislado (red) ${code}`
            : mode === 'bridge'
              ? `Puente entre clusters ${code}`
              : `Co-licitación red hub ${code}`,
        status: 'awarded',
        processType: mode === 'iso' ? 'menor_cuantia' : 'cotizacion',
        estimatedAmount: d(refAmt),
        publishedAt: daysAgo(300 + t),
      },
      s,
    );

    let bidders: string[] = [];
    let amounts: number[] = [];
    let winnerId: string;
    let winAmt: number;
    let flags: string[];

    if (mode === 'iso') {
      bidders = [isolated.id, providers[78]!.id];
      amounts = [refAmt * 0.9, refAmt * 0.95];
      winnerId = isolated.id;
      winAmt = amounts[0]!;
      flags = ['ISOLATED_WINNER'];
      for (let i = 0; i < bidders.length; i++) {
        await ensureBid(tender.id, bidders[i]!, amounts[i]!, 'submitted', s);
      }
    } else if (mode === 'bridge') {
      const sideA = clusterA[t % clusterA.length]!;
      const sideB = clusterB[t % clusterB.length]!;
      bidders = [bridge.id, sideA, sideB];
      amounts = bidders.map((_, i) => refAmt * (0.9 + i * 0.015));
      winnerId = bridge.id;
      winAmt = amounts[0]!;
      flags = ['NETWORK_RISK_CONTAGION'];
      for (let i = 0; i < bidders.length; i++) {
        await ensureBid(tender.id, bidders[i]!, amounts[i]!, 'submitted', s);
      }
    } else {
      bidders = [hub.id, bridge.id, ...(t % 2 === 0 ? clusterA.slice(0, 4) : clusterB.slice(0, 4))];
      amounts = bidders.map((_, i) => refAmt * (0.88 + i * 0.02));
      const winnerIdx = t % bidders.length;
      winnerId = bidders[winnerIdx]!;
      winAmt = amounts[winnerIdx]!;
      flags =
        winnerId === hub.id
          ? ['HIGH_CENTRALITY', 'DOMINANT_SUPPLIER']
          : ['NETWORK_RISK_CONTAGION', 'COLLUSION_CLUSTER'];
      for (let i = 0; i < bidders.length; i++) {
        await ensureBid(tender.id, bidders[i]!, amounts[i]!, 'submitted', s);
      }
    }

    notePairsFromProviderIds(bidders);
    await ensureContract(
      tender.id,
      winnerId,
      `GR-CON-NET-${String(t + 1).padStart(3, '0')}`,
      winAmt,
      daysAgo(260 + t),
      'active',
      s,
    );

    await ensureRiskScore(
      tender.id,
      {
        competitionRisk: mode === 'iso' ? 35 : 55,
        priceRisk: mode === 'iso' ? 30 : 45,
        supplierRisk: mode === 'iso' ? 40 : 65,
        processRisk: 38,
        executionRisk: 35,
        totalScore: mode === 'iso' ? 32 : 52,
        riskLevel: mode === 'iso' ? 'low' : 'medium',
        flags,
      },
      s,
    );
  }

  // Hub explicit edges: hub with 10+ distinct partners
  for (let i = 0; i < 12; i++) {
    const p = providers[15 + i]!;
    notePair(hub.id, p.id);
  }

  // ── Group G: Clean / healthy ───────────────────────────────────────────────
  const cleanWinners = [65, 66, 67, 68, 69, 70, 71, 72].map((i) => providers[i]!.id);
  for (let t = 0; t < 17; t++) {
    const code = `GR-CLEAN-${String(t + 1).padStart(3, '0')}`;
    const planId = pickPlan((t + 9) % entities.length);
    const refAmt = 88_000 + t * 4000;
    const tender = await ensureTender(
      code,
      planId,
      {
        title: `Proceso competencia sana ${code}`,
        status: 'awarded',
        processType: 'licitacion',
        regime: 'ordinario',
        estimatedAmount: d(refAmt),
        referenceBudgetAmount: d(refAmt),
        publishedAt: daysAgo(250 + t),
      },
      s,
    );

    const pool = providers.slice(60, 73).map((p) => p.id);
    const shuffled = faker.helpers.shuffle([...pool]).slice(0, 6);
    const spreads = [0.82, 0.86, 0.88, 0.9, 0.92, 0.94];
    const wIdx = t % cleanWinners.length;
    const winnerId = cleanWinners[wIdx]!;

    for (let i = 0; i < shuffled.length; i++) {
      const pid = shuffled[i]!;
      const amt = refAmt * spreads[i]!;
      await ensureBid(tender.id, pid, amt, 'submitted', s);
    }
    notePairsFromProviderIds(shuffled);

    const winI = shuffled.indexOf(winnerId);
    const contractAmt = winI >= 0 ? refAmt * spreads[winI]! : refAmt * spreads[wIdx % spreads.length]!;

    await ensureContract(
      tender.id,
      winnerId,
      `GR-CON-CLEAN-${String(t + 1).padStart(3, '0')}`,
      contractAmt,
      daysAgo(200 + t),
      'active',
      s,
    );

    await ensureRiskScore(
      tender.id,
      {
        competitionRisk: 22,
        priceRisk: 18,
        supplierRisk: 20,
        processRisk: 15,
        executionRisk: 12,
        totalScore: 18,
        riskLevel: 'low',
        flags: [],
      },
      s,
    );
  }

  // ProviderRelation: materialize top co-bid pairs (target ~120)
  const sortedPairs = [...pairTally.entries()].sort((a, b) => b[1] - a[1]);
  let relCreated = 0;
  for (const [k, count] of sortedPairs) {
    if (relCreated >= 120) break;
    const [pa, pb] = k.split(':') as [string, string];
    await ensureProviderRelation(pa!, pb!, Math.min(count, 50), daysAgo(10), s);
    relCreated++;
  }

  // Fill remaining relations with sequential hub spokes if under 120
  for (let i = 0; relCreated < 120 && i < 80; i++) {
    for (let j = i + 1; relCreated < 120 && j < Math.min(i + 4, 80); j++) {
      await ensureProviderRelation(
        providers[i]!.id,
        providers[j]!.id,
        faker.number.int({ min: 1, max: 8 }),
        daysAgo(faker.number.int({ min: 5, max: 200 })),
        s,
      );
      relCreated++;
    }
  }

  // Provider scores (80)
  for (let i = 0; i < 80; i++) {
    const baseC = faker.number.int({ min: 40, max: 95 });
    const baseD = faker.number.int({ min: 35, max: 92 });
    const baseP = faker.number.int({ min: 30, max: 90 });
    const baseDiv = faker.number.int({ min: 25, max: 100 });
    const total = Math.round(baseC * 0.3 + baseD * 0.25 + baseP * 0.25 + baseDiv * 0.2);
    const tier = total >= 80 ? 'premium' : total >= 50 ? 'standard' : total >= 30 ? 'watch' : 'restricted';
    await ensureProviderScore(
      providers[i]!.id,
      {
        complianceScore: baseC,
        deliveryScore: baseD,
        priceScore: baseP,
        diversityScore: baseDiv,
        totalScore: total,
        tier,
      },
      s,
    );
  }

  // Price references (30)
  const procTypes = ['licitacion', 'cotizacion', 'menor_cuantia', 'contratacion_directa', 'catalogo'];
  for (let i = 0; i < 30; i++) {
    const pt = procTypes[i % procTypes.length]!;
    const desc = `Referencia nacional precios ${pt} catálogo Graph-${String(i + 1).padStart(2, '0')}`;
    const avg = 40_000 + i * 3500;
    await ensurePriceReference(
      desc,
      SEED_YEAR,
      {
        processType: pt,
        cpcCode: `452${String(100 + i).padStart(3, '0')}`,
        avgPrice: avg,
        minPrice: avg * 0.7,
        maxPrice: avg * 1.35,
        sampleSize: 40 + i * 3,
        province: EC_PROVINCES[i % EC_PROVINCES.length],
      },
      s,
    );
  }

  const bidTotal =
    (await prisma.bid.count({
      where: { tender: { code: { startsWith: 'GR-' } } } },
    )) ?? 0;

  const [tendersGr, contractsGr, riskGr, relCount, fragCount, priceCount] = await Promise.all([
    prisma.tender.count({ where: { code: { startsWith: 'GR-' } } } }),
    prisma.contract.count({ where: { contractNo: { startsWith: 'GR-CON' } } } }),
    prisma.riskScore.count({
      where: { tender: { code: { startsWith: 'GR-' } } } },
    }),
    prisma.providerRelation.count(),
    prisma.fragmentationAlert.count({ where: { pattern: { startsWith: 'AMOUNT_CLUSTER' } } } }),
    prisma.priceReference.count({ where: { description: { contains: 'Graph-' } } } }),
  ]);

  console.log('\n=== Summary (this run + DB totals for GR-*) ===');
  console.log(
    JSON.stringify(
      {
        ...s,
        entities_total: entities.length,
        plans_total: plans.length,
        providers_seeded_track: providers.length,
        tenders_GR_prefix: tendersGr,
        contracts_GR_CON_prefix: contractsGr,
        bids_on_GR_tenders_approx: bidTotal,
        riskScores_on_GR_tenders: riskGr,
        providerRelations_total: relCount,
        fragmentation_alerts_amount_cluster: fragCount,
        priceReferences_graph_descriptions: priceCount,
      },
      null,
      2,
    ),
  );
  console.log('\nDone.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
