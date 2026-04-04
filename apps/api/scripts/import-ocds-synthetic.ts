/**
 * Importador combinado: OCDS (datos reales Ecuador) + Faker (sintéticos)
 * Objetivo: al menos 100 registros de cada tipo para pruebas del módulo IA
 *
 * Uso: npm run crawler:import (desde raíz) o tsx scripts/import-ocds-synthetic.ts (desde apps/api)
 * Flags:
 *   --incremental  Solo importa ocids no existentes en la DB (evita duplicados en re-ejecuciones)
 */
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/es';

const prisma = new PrismaClient();

const IS_INCREMENTAL = process.argv.includes('--incremental');

const OCDS_BASE = process.env.CRAWLER_OCDS_URL || 'https://datosabiertos.compraspublicas.gob.ec/PLATAFORMA/api';
const TARGET_COUNT = 100;
const DELAY_MS = 500; // Evitar rate limiting

const PROVINCIAS_EC = ['Pichincha', 'Guayas', 'Azuay', 'Manabí', 'Tungurahua', 'Imbabura', 'Loja', 'El Oro', 'Chimborazo', 'Cotopaxi'];
const CANTONES: Record<string, string[]> = {
  Pichincha: ['Quito', 'Cayambe', 'Rumiñahui', 'Mejía'],
  Guayas: ['Guayaquil', 'Daule', 'Samborondón', 'Durán'],
  Azuay: ['Cuenca', 'Girón', 'Paute'],
  Manabí: ['Portoviejo', 'Manta', 'Chone'],
};

type OcdsSearchItem = {
  ocid?: string;
  id?: string;
  buyerId?: string;
  buyerName?: string;
  buyer?: { name?: string; id?: string };
  title?: string;
  description?: string;
  internal_type?: string;
  supplierName?: string;
  supplierId?: string;
  amount?: number;
  value?: number | { amount?: number };
  monto?: number;
  tender?: {
    title?: string;
    description?: string;
    procurementMethod?: string;
    value?: { amount?: number };
    status?: string;
  };
  awards?: Array<{
    status?: string;
    value?: { amount?: number };
    date?: string;
    suppliers?: Array<{ id?: string; name?: string; identifier?: { id?: string; legalName?: string } }>;
  }>;
  contracts?: Array<{
    value?: { amount?: number };
    status?: string;
    dateSigned?: string;
    period?: { startDate?: string; endDate?: string };
  }>;
  planning?: {
    budget?: { amount?: { amount?: number } };
  };
  [key: string]: unknown;
};

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchOcdsSearch(year: number, search: string, page: number): Promise<{ data?: OcdsSearchItem[]; total?: number; pages?: number }> {
  const url = `${OCDS_BASE}/search_ocds?year=${year}&search=${encodeURIComponent(search)}&page=${page}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return {};
    const json = await res.json();
    return {
      data: json.data || json.results || json.releases || [],
      total: json.total ?? json.count,
      pages: json.pages ?? 1,
    };
  } catch (e) {
    console.warn(`  OCDS fetch error (${search} p${page}):`, (e as Error).message);
    return {};
  }
}

async function importFromOcds(): Promise<{
  entities: Map<string, string>;
  providers: Map<string, string>;
  tendersCreated: number;
  bidsCreated: number;
  contractsCreated: number;
}> {
  const entityByKey = new Map<string, string>();
  const providerByKey = new Map<string, string>();
  const ocidsSeen = new Set<string>();
  let entityCounter = 0;
  let providerCounter = 0;
  let tendersCreated = 0;
  let bidsCreated = 0;
  let contractsCreated = 0;

  // --incremental: load existing ocids from DB to skip already-imported records
  if (IS_INCREMENTAL) {
    console.log('  [incremental] Cargando ocids existentes...');
    const existingCodes = await prisma.tender.findMany({ select: { code: true }, where: { code: { startsWith: 'OCDS-' } } });
    for (const t of existingCodes) ocidsSeen.add(t.code);
    console.log(`  [incremental] ${ocidsSeen.size} ocids ya en DB, se omitirán`);
  }

  const searches = ['compras', 'servicios', 'equipos', 'suministros', 'obras', 'construcción', 'mantenimiento', 'consultoría'];
  const years = [2024, 2023, 2022];

  for (const search of searches) {
    for (const year of years) {
      for (let page = 1; page <= 5; page++) {
        const { data } = await fetchOcdsSearch(year, search, page);
        if (!data?.length) break;

        for (const item of data as OcdsSearchItem[]) {
          const ocid = item.ocid || item.id || JSON.stringify(item).slice(0, 50);
          const tenderCode = `OCDS-${ocid.toString().replace(/[^a-zA-Z0-9-]/g, '_').slice(0, 60)}`;

          if (ocidsSeen.has(tenderCode)) continue;
          ocidsSeen.add(tenderCode);

          // --incremental: skip if code already in DB
          if (IS_INCREMENTAL) {
            const existing = await prisma.tender.findFirst({ where: { code: tenderCode } });
            if (existing) continue;
          }

          // Extract buyer from OCDS structure
          const buyerName = (
            item.buyerName ||
            (item.buyer as { name?: string } | undefined)?.name ||
            (item as { comprador?: string }).comprador ||
            ''
          )?.toString().trim();

          // OCDS full field mapping: tender.title > title > tender.description
          const ocdsTitle = item.tender?.title || item.title || item.tender?.description || 'Proceso de contratación';
          const title = ocdsTitle.toString().trim().slice(0, 500);
          const description = (item.tender?.description || item.description || '')?.toString().slice(0, 2000) || null;
          const procurementMethod = item.tender?.procurementMethod || 'open';

          // Amount: planning.budget > tender.value > top-level amount
          const rawAmount =
            item.planning?.budget?.amount?.amount ??
            item.tender?.value?.amount ??
            (typeof item.value === 'number' ? item.value : (item.value as { amount?: number } | undefined)?.amount) ??
            item.amount ??
            item.monto ??
            10000;
          const amount = parseFloat(String(rawAmount)) || 10000;

          if (!title) continue;

          let entityId: string | undefined;
          if (buyerName) {
            const key = buyerName.toLowerCase().slice(0, 100);
            if (!entityByKey.has(key)) {
              entityCounter++;
              const code = `OCDS-B-${entityCounter}`;
              const existing = await prisma.entity.findFirst({ where: { code } });
              const entity = existing ?? await prisma.entity.create({
                data: {
                  name: buyerName.slice(0, 255),
                  code,
                  legalName: buyerName,
                  organizationType: 'entidad',
                },
              });
              entityByKey.set(key, entity.id);
            }
            entityId = entityByKey.get(key);
          }

          if (!entityId) {
            const code = `OCDS-GEN-${year}-${ocidsSeen.size}`;
            const existing = await prisma.entity.findFirst({ where: { code } });
            const entity = existing ?? await prisma.entity.create({
              data: {
                name: `Entidad ${year}-${ocidsSeen.size}`,
                code,
                organizationType: 'entidad',
              },
            });
            entityId = entity.id;
          }

          let plan = await prisma.procurementPlan.findFirst({ where: { entityId, year } });
          if (!plan) {
            plan = await prisma.procurementPlan.create({
              data: {
                entityId,
                year,
                status: 'published',
                publishedAt: new Date(),
                totalAmount: amount * 10,
              },
            });
          }

          const existingTender = await prisma.tender.findFirst({ where: { code: tenderCode } });
          if (existingTender) continue;

          const tenderStatus = item.tender?.status === 'complete' ? 'awarded' : 'published';
          const tender = await prisma.tender.create({
            data: {
              procurementPlanId: plan.id,
              code: tenderCode,
              title: title || `Proceso ${ocid}`,
              description,
              status: tenderStatus,
              procurementMethod: procurementMethod.slice(0, 50),
              estimatedAmount: amount,
              publishedAt: new Date(year, 0, 1),
            },
          });
          tendersCreated++;

          // Map awards[0].suppliers[0] → Provider + Bid (winner)
          const awardedSuppliers: Array<{ id?: string; name?: string; identifier?: { id?: string; legalName?: string } }> = [];
          if (item.awards?.length) {
            for (const award of item.awards) {
              if (award.status === 'active' || award.status === 'pending') {
                if (award.suppliers?.length) awardedSuppliers.push(...award.suppliers);
              }
            }
          }

          // Fallback to legacy top-level supplier fields
          const legacySupplierName = (
            item.supplierName ||
            (item as { supplier?: { name?: string } }).supplier?.name ||
            (item as { proveedor?: string }).proveedor ||
            (item as { adjudicatario?: string }).adjudicatario ||
            ''
          )?.toString().trim();

          const suppliersToProcess = awardedSuppliers.length
            ? awardedSuppliers
            : legacySupplierName
              ? [{ name: legacySupplierName, id: item.supplierId?.toString() }]
              : [];

          let firstProviderId: string | undefined;
          for (const supplier of suppliersToProcess) {
            const sName = (supplier.identifier?.legalName || supplier.name || '').trim();
            if (!sName) continue;
            const pKey = sName.toLowerCase().slice(0, 100);
            if (!providerByKey.has(pKey)) {
              providerCounter++;
              const sId = (supplier.identifier?.id || supplier.id || `OCDS-P-${providerCounter}`)?.toString().slice(0, 20);
              const prov = await prisma.provider.upsert({
                where: { identifier: sId },
                update: {},
                create: {
                  name: sName.slice(0, 255),
                  identifier: sId,
                  legalName: sName,
                  province: PROVINCIAS_EC[providerCounter % PROVINCIAS_EC.length],
                  canton: 'N/A',
                },
              });
              providerByKey.set(pKey, prov.id);
            }
            const providerId = providerByKey.get(pKey)!;
            if (!firstProviderId) firstProviderId = providerId;

            const bidAmount = item.awards?.[0]?.value?.amount ?? amount * (0.9 + Math.random() * 0.2);
            const existingBid = await prisma.bid.findFirst({ where: { tenderId: tender.id, providerId } });
            if (!existingBid) {
              await prisma.bid.create({
                data: {
                  tenderId: tender.id,
                  providerId,
                  amount: bidAmount,
                  status: 'submitted',
                  submittedAt: new Date(year, 1, 1),
                },
              });
              bidsCreated++;
            }
          }

          // Map contracts[0].value.amount → Contract.amount
          if (firstProviderId && item.contracts?.length) {
            const firstContract = item.contracts[0];
            const contractAmount = firstContract.value?.amount ?? amount;
            const signedAt = firstContract.dateSigned ? new Date(firstContract.dateSigned) : new Date(year, 2, 1);
            const existingContract = await prisma.contract.findFirst({ where: { tenderId: tender.id } });
            if (!existingContract) {
              await prisma.contract.create({
                data: {
                  tenderId: tender.id,
                  providerId: firstProviderId,
                  contractNo: `CON-${tenderCode.slice(0, 30)}`,
                  status: firstContract.status === 'terminated' ? 'terminated' : 'signed',
                  amount: contractAmount,
                  signedAt,
                },
              }).catch(() => {});
              contractsCreated++;
            }
          } else if (firstProviderId && Math.random() > 0.5) {
            const existingContract = await prisma.contract.findFirst({ where: { tenderId: tender.id } });
            if (!existingContract) {
              await prisma.contract.create({
                data: {
                  tenderId: tender.id,
                  providerId: firstProviderId,
                  contractNo: `CON-${year}-${contractsCreated.toString().padStart(4, '0')}`,
                  status: 'signed',
                  amount: amount,
                  signedAt: new Date(year, 2, 1),
                },
              }).catch(() => {});
              contractsCreated++;
            }
          }
        }
        await sleep(DELAY_MS);
      }
    }
  }

  console.log(`  ${tendersCreated} items`);
  return { entities: entityByKey, providers: providerByKey, tendersCreated, bidsCreated, contractsCreated };
}

async function generateSynthetic(
  currentCounts: { entities: number; providers: number; tenders: number; bids: number; contracts: number }
) {
  faker.seed(42);

  const entityIds: string[] = [];
  const providerIds: string[] = [];
  const tenderIds: string[] = [];

  const toCreate = {
    entities: Math.max(0, TARGET_COUNT - currentCounts.entities),
    providers: Math.max(0, TARGET_COUNT - currentCounts.providers),
    tenders: Math.max(0, TARGET_COUNT - currentCounts.tenders),
    bids: Math.max(0, TARGET_COUNT - currentCounts.bids),
    contracts: Math.max(0, TARGET_COUNT - currentCounts.contracts),
  };

  const orgTypes = ['ministerio', 'gad', 'institucion', 'empresa_publica', 'otro'];

  for (let i = 0; i < toCreate.entities; i++) {
    const name = faker.helpers.arrayElement([
      `Ministerio de ${faker.commerce.department()}`,
      `GAD ${faker.location.city()}`,
      `Instituto de ${faker.commerce.productAdjective()}`,
      faker.company.name() + ' Pública',
    ]);
    const entity = await prisma.entity.create({
      data: {
        name,
        code: `SYN-ENT-${Date.now()}-${i}`,
        legalName: name,
        organizationType: orgTypes[i % orgTypes.length],
      },
    });
    entityIds.push(entity.id);
  }

  for (let i = 0; i < toCreate.providers; i++) {
    const province = PROVINCIAS_EC[i % PROVINCIAS_EC.length];
    const cantones = CANTONES[province] || ['Principal'];
    const provider = await prisma.provider.create({
      data: {
        name: faker.company.name(),
        identifier: `17${String(9123456700 + i + Math.floor(Date.now() / 1000) % 100000).padStart(9, '0')}001`,
        legalName: faker.company.name() + ' S.A.',
        tradeName: faker.company.buzzNoun(),
        province,
        canton: cantones[i % cantones.length],
        address: faker.location.streetAddress(),
      },
    });
    providerIds.push(provider.id);
  }

  const allEntities = entityIds.length
    ? entityIds
    : (await prisma.entity.findMany({ take: 200 })).map((e) => e.id);
  const allProviders = providerIds.length
    ? providerIds
    : (await prisma.provider.findMany({ take: 200 })).map((p) => p.id);

  const year = new Date().getFullYear();
  for (let i = 0; i < toCreate.tenders; i++) {
    const entityId = allEntities[i % allEntities.length];
    let plan = await prisma.procurementPlan.findFirst({
      where: { entityId, year },
    });
    if (!plan) {
      plan = await prisma.procurementPlan.create({
        data: {
          entityId,
          year,
          status: 'published',
          publishedAt: new Date(),
          totalAmount: faker.number.float({ min: 50000, max: 500000, fractionDigits: 2 }),
        },
      });
    }

    const titles = [
      'Adquisición de equipos de cómputo',
      'Servicios de limpieza y aseo',
      'Suministro de material de oficina',
      'Mantenimiento de infraestructura',
      'Obra de construcción menor',
      'Consultoría especializada',
      'Compra de insumos médicos',
      'Servicios de seguridad',
    ];
    const tender = await prisma.tender.create({
      data: {
        procurementPlanId: plan.id,
        title: faker.helpers.arrayElement(titles) + ` - ${faker.lorem.words(3)}`,
        description: faker.lorem.paragraph(),
        status: 'published',
        procurementMethod: faker.helpers.arrayElement(['open', 'direct', 'catalog']),
        estimatedAmount: faker.number.float({ min: 5000, max: 150000, fractionDigits: 2 }),
        publishedAt: faker.date.past({ years: 1 }),
      },
    });
    tenderIds.push(tender.id);
  }

  const tendersForBids = tenderIds.length
    ? tenderIds
    : (await prisma.tender.findMany({ where: { status: 'published' }, take: 300 })).map((t) => t.id);

  for (let i = 0; i < toCreate.bids; i++) {
    const tenderId = tendersForBids[i % tendersForBids.length];
    const providerId = allProviders[i % allProviders.length];
    const existing = await prisma.bid.findFirst({
      where: { tenderId, providerId },
    });
    if (!existing) {
      await prisma.bid.create({
        data: {
          tenderId,
          providerId,
          amount: faker.number.float({ min: 1000, max: 100000, fractionDigits: 2 }),
          status: 'submitted',
          submittedAt: faker.date.past({ years: 1 }),
        },
      });
    }
  }

  const tendersForContracts = await prisma.tender.findMany({
    where: { status: 'published' },
    include: { bids: true, contract: true },
    take: 500,
  });
  let contractsAdded = 0;
  for (const tender of tendersForContracts) {
    if (contractsAdded >= toCreate.contracts) break;
    if (tender.contract) continue;
    let bid = tender.bids[0];
    if (!bid) {
      const providerId = allProviders[contractsAdded % allProviders.length];
      bid = await prisma.bid.create({
        data: {
          tenderId: tender.id,
          providerId,
          amount: faker.number.float({ min: 1000, max: 50000, fractionDigits: 2 }),
          status: 'submitted',
          submittedAt: faker.date.past({ years: 1 }),
        },
      });
    }
    await prisma.contract.create({
      data: {
        tenderId: tender.id,
        providerId: bid.providerId,
        contractNo: `CON-SYN-${Date.now()}-${String(contractsAdded).padStart(4, '0')}`,
        status: 'signed',
        amount: bid.amount,
        signedAt: faker.date.past({ years: 1 }),
      },
    });
    contractsAdded++;
  }
}

async function main() {
  console.log('Importador OCDS + Sintéticos – objetivo: 100 registros por tipo\n');

  const before = {
    entities: await prisma.entity.count(),
    providers: await prisma.provider.count(),
    tenders: await prisma.tender.count(),
    bids: await prisma.bid.count(),
    contracts: await prisma.contract.count(),
  };
  console.log('Estado actual:', before);

  console.log('\n1. Importando desde OCDS Ecuador...');
  let ocdsResult;
  try {
    ocdsResult = await importFromOcds();
    console.log(`   OCDS: ${ocdsResult.tendersCreated} tenders, ${ocdsResult.bidsCreated} bids, ${ocdsResult.contractsCreated} contracts`);
  } catch (e) {
    console.warn('   OCDS no disponible:', (e as Error).message);
    ocdsResult = { entities: new Map(), providers: new Map(), tendersCreated: 0, bidsCreated: 0, contractsCreated: 0 };
  }

  const afterOcds = {
    entities: await prisma.entity.count(),
    providers: await prisma.provider.count(),
    tenders: await prisma.tender.count(),
    bids: await prisma.bid.count(),
    contracts: await prisma.contract.count(),
  };
  console.log('   Después de OCDS:', afterOcds);

  console.log('\n2. Completando con datos sintéticos (Faker)...');
  await generateSynthetic(afterOcds);

  const after = {
    entities: await prisma.entity.count(),
    providers: await prisma.provider.count(),
    tenders: await prisma.tender.count(),
    bids: await prisma.bid.count(),
    contracts: await prisma.contract.count(),
  };
  console.log('\nEstado final:', after);
  console.log('\nImportación OK. Datos listos para pruebas del módulo IA.');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
